import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";

// Mock uuid BEFORE any other imports to prevent ESM loading issues in Jest
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

import { handler } from "../index.js";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { maskEvent, logError } from "../utils.js";
import { response } from "../responses.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Sentinel New Security Enhancements", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe("Log Masking (Enhancements 1, 2, 3)", () => {
    it("redacts queryStringParameters in maskEvent", () => {
      const event: any = {
        queryStringParameters: { token: "secret", name: "jules" },
      };
      const masked: any = maskEvent(event);
      expect(masked.queryStringParameters.token).toBe("[REDACTED]");
      expect(masked.queryStringParameters.name).toBe("[REDACTED]");
    });

    it("redacts multiValueHeaders in maskEvent", () => {
      const event: any = {
        multiValueHeaders: { "X-Api-Key": ["secret"] },
      };
      const masked: any = maskEvent(event);
      expect(masked.multiValueHeaders["X-Api-Key"]).toEqual(["[REDACTED]"]);
    });

    it("redacts requestContext.authorizer in maskEvent", () => {
      const event: any = {
        requestContext: { authorizer: { jwt: "secret-token" } },
      };
      const masked: any = maskEvent(event);
      expect(masked.requestContext.authorizer).toBe("[REDACTED]");
    });
  });

  describe("Security Headers (Enhancements 4, 5, 6, 7)", () => {
    it("includes new security headers in response", () => {
      const resp = response(200, { ok: true });
      expect(resp.headers!["X-DNS-Prefetch-Control"]).toBe("off");
      expect(resp.headers!["X-Download-Options"]).toBe("noopen");
      expect(resp.headers!["Surrogate-Control"]).toBe("no-store");
      expect(resp.headers!["Content-Security-Policy"]).toContain("base-uri 'none'");
      expect(resp.headers!["Content-Security-Policy"]).toContain("form-action 'none'");
    });
  });

  describe("Handler Protections (Enhancements 8, 9)", () => {
    it("rejects non-whitelisted HTTP methods", async () => {
      const event: any = {
        version: "2.0",
        rawPath: "/teams",
        requestContext: { http: { method: "TRACE", path: "/teams" } },
      };
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(405);
    });

    it("rejects bodies exceeding 512KB", async () => {
      const largeBody = "a".repeat(512 * 1024 + 1);
      const event: any = {
        version: "2.0",
        rawPath: "/teams",
        requestContext: { http: { method: "POST", path: "/teams" } },
        body: largeBody,
        headers: { "content-type": "application/json" },
      };
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(413);
    });
  });

  describe("Error Logging (Enhancement 10)", () => {
    it("sanitizes non-Error objects in logError", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const sensitiveObj = { secret: "password", message: "fail" };
      logError("Test", sensitiveObj);
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const logString = JSON.stringify(lastCall);
      expect(logString).not.toContain("password");
      expect(logString).toContain("[REDACTED]");
      consoleSpy.mockRestore();
    });

    it("sanitizes Error objects in logError", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Failed with secret: my-password");
      logError("TestError", error);
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const logString = lastCall.join(" ");
      expect(logString).not.toContain("password");
      expect(logString).toContain("[REDACTED]");
      consoleSpy.mockRestore();
    });
  });
});
