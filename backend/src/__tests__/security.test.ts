import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";

// Mock uuid BEFORE any other imports to prevent ESM loading issues in Jest
jest.mock("uuid", () => ({
  v4: jest.fn(() => "277e909a-6536-4d2d-937e-f608759556f8"),
}));

import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { maskEvent, logError } from "../utils.js";
import { response } from "../responses.js";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

describe("Security Tests", () => {
  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    process.env.TABLE_NAME = "TestTable";
    process.env.DATA_BUCKET = "TestDataBucket";
    process.env.ADMIN_API_KEY = "a-very-long-and-secure-admin-api-key-123";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
    queryStringParameters: any = null,
  ): any => ({
    version: "2.0",
    rawPath: path,
    headers: ["POST", "PUT", "PATCH"].includes(method)
      ? { "content-type": "application/json" }
      : {},
    requestContext: {
      http: {
        method,
        path,
      },
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
  });

  it("prevents mass assignment of internal DynamoDB keys (PK/SK)", async () => {
    ddbMock.on(PutCommand).resolves({});
    const malformedBody = {
      id: "277e909a-6536-4d2d-937e-f608759556fb",
      name: "Hack Team",
      PK: "HACKED#PK",
      SK: "HACKED#SK",
      GSI1PK: "HACKED#GSI",
    };
    const event = createEvent("POST", "/teams", malformedBody);
    await handler(event);
    const putCalls = ddbMock.commandCalls(PutCommand);
    const item = putCalls[0].args[0].input.Item;
    expect(item?.PK).not.toBe("HACKED#PK");
    expect(item?.SK).not.toBe("HACKED#SK");
    expect(item?.GSI1PK).not.toBe("HACKED#GSI");
    expect(item?.PK).toContain("TEAM#");
  });

  it("does not leak error details in 500 responses", async () => {
    ddbMock.on(QueryCommand).rejects(new Error("Sensitive details..."));
    const event = createEvent("GET", "/players");
    const resp: any = await handler(event);
    expect(resp.statusCode).toBe(500);
    expect(JSON.parse(resp.body).message).toBe("Internal Server Error");
  });

  it("removes internal DynamoDB keys from API responses", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [{ id: "t1", name: "T1", PK: "T#1", synced: 1 }],
    });
    const event = createEvent("GET", "/teams");
    const resp: any = await handler(event);
    const body = JSON.parse(resp.body);
    expect(body[0].PK).toBeUndefined();
    expect(body[0].synced).toBeUndefined();
    expect(body[0].id).toBe("t1");
  });

  it("includes all required security headers", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const resp: any = await handler(createEvent("GET", "/teams"));
    expect(resp.headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security": expect.any(String),
      "Cross-Origin-Opener-Policy": "same-origin",
      "X-DNS-Prefetch-Control": "off",
      "Surrogate-Control": "no-store",
    });
  });

  describe("Log Sanitization", () => {
    it("redacts sensitive headers in maskEvent", () => {
      const event: any = {
        headers: { authorization: "secret", "x-api-key": "key" },
      };
      const masked: any = maskEvent(event);
      expect(masked.headers.authorization).toBe("[REDACTED]");
      expect(masked.headers["x-api-key"]).toBe("[REDACTED]");
    });

    it("redacts query parameters in maskEvent", () => {
      const event: any = { queryStringParameters: { token: "123" } };
      const masked: any = maskEvent(event);
      expect(masked.queryStringParameters.token).toBe("[REDACTED]");
    });

    it("sanitizes Error objects in logError", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      logError("Test", new Error("secret: password123"));
      const log = consoleSpy.mock.calls[0].join(" ");
      expect(log).not.toContain("password123");
      expect(log).toContain("[REDACTED]");
      consoleSpy.mockRestore();
    });

    it("stops recursion at depth 10 in sanitizeForLog", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const deep: any = {};
      let cur = deep;
      for (let i = 0; i < 15; i++) { cur.n = { id: i }; cur = cur.n; }
      logError("Deep", deep);
      expect(JSON.stringify(consoleSpy.mock.calls)).toContain("[DEPTH_LIMIT_REACHED]");
      consoleSpy.mockRestore();
    });
  });

  describe("Validation Logic", () => {
    it("rejects non-UUID path parameters", async () => {
      const resp: any = await handler(createEvent("DELETE", "/players/bad"));
      expect(resp.statusCode).toBe(400);
      expect(resp.body).toContain("UUID required");
    });

    it("accepts special player IDs", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(GetCommand).resolves({ Item: { id: "g1" } });
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      const resp: any = await handler(createEvent("POST", "/games/277e909a-6536-4d2d-937e-f608759556fa/stats", {
        type: "MAKE", playerId: "OPPONENT:12", points: 2
      }));
      expect(resp.statusCode).toBe(201);
    });

    it("rejects invalid stat points", async () => {
      const resp: any = await handler(createEvent("POST", "/games/277e909a-6536-4d2d-937e-f608759556fa/stats", {
        type: "MAKE", points: 5, playerId: "OPPONENT"
      }));
      expect(resp.statusCode).toBe(400);
    });
  });

  describe("Handler Protections", () => {
    it("rejects TRACE method", async () => {
      const resp: any = await handler(createEvent("TRACE", "/teams"));
      expect(resp.statusCode).toBe(405);
    });

    it("rejects large bodies", async () => {
      const event = createEvent("POST", "/teams", { name: "T" });
      event.body = "a".repeat(512 * 1024 + 1);
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(413);
    });

    it("enforces ADMIN_API_KEY length for cleanup", async () => {
      process.env.ADMIN_API_KEY = "short";
      const event = createEvent("POST", "/cleanup");
      event.headers["x-api-key"] = "short";
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(403);
    });
  });

  describe("Immutability", () => {
    it("freezes security constants", () => {
      const { REDACTED_HEADERS } = require("../utils.js");
      const { INTERNAL_KEYS } = require("../responses.js");
      expect(Object.isFrozen(REDACTED_HEADERS)).toBe(true);
      expect(Object.isFrozen(INTERNAL_KEYS)).toBe(true);
    });
  });
});
