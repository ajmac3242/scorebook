import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  stripLocalFields,
  normalizePath,
  maskEvent,
  logError,
  logInfo,
  safeCompare,
  getHeader,
  extractRequestMetadata,
  extractIdFromPath,
} from "../utils.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";

describe("backend utils", () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      info: jest.spyOn(console, "info").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe("stripLocalFields", () => {
    it("removes internal DynamoDB keys and UI-only fields", () => {
      const input = {
        id: "123",
        name: "Test",
        PK: "TEAM#123",
        SK: "METADATA#123",
        GSI1PK: "TEAM",
        synced: 1,
        deletedAt: "2023-01-01",
        isArchived: true,
      };
      const result = stripLocalFields(input) as any;
      expect(result.id).toBe("123");
      expect(result.name).toBe("Test");
      expect(result.PK).toBeUndefined();
      expect(result.SK).toBeUndefined();
      expect(result.GSI1PK).toBeUndefined();
      expect(result.synced).toBeUndefined();
      expect(result.deletedAt).toBeUndefined();
      expect(result.isArchived).toBeUndefined();
    });

    it("recursively strips fields in nested objects and arrays", () => {
      const input = {
        id: "t1",
        PK: "T1",
        players: [
          { id: "p1", PK: "P1", SK: "S1" },
          { id: "p2", PK: "P2" },
        ],
        metadata: {
          PK: "M1",
          foo: "bar",
        },
      };
      const result = stripLocalFields(input) as any;
      expect(result.PK).toBeUndefined();
      expect(result.players[0].PK).toBeUndefined();
      expect(result.players[0].SK).toBeUndefined();
      expect(result.players[1].PK).toBeUndefined();
      expect(result.metadata.PK).toBeUndefined();
      expect(result.metadata.foo).toBe("bar");
    });

    it("protects against prototype pollution", () => {
      const input = JSON.parse(
        '{"id": "123", "__proto__": {"polluted": true}}',
      );
      const result = stripLocalFields(input) as any;
      expect(result.__proto__.polluted).toBeUndefined();
      expect(({} as any).polluted).toBeUndefined();
    });
  });

  describe("normalizePath", () => {
    const createEvent = (path: string): APIGatewayProxyEventV2 =>
      ({
        rawPath: path,
        requestContext: { http: { path } },
      }) as any;

    it("removes /api and /$default prefixes", () => {
      expect(normalizePath(createEvent("/api/teams"))).toBe("/teams");
      expect(normalizePath(createEvent("/$default/teams"))).toBe("/teams");
    });

    it("removes trailing slashes", () => {
      expect(normalizePath(createEvent("/teams/"))).toBe("/teams");
    });

    it("handles root path", () => {
      expect(normalizePath(createEvent("/"))).toBe("/");
      expect(normalizePath(createEvent("/api"))).toBe("/");
    });
  });

  describe("maskEvent", () => {
    it("redacts sensitive headers", () => {
      const event: APIGatewayProxyEventV2 = {
        headers: {
          authorization: "Bearer secret",
          "x-api-key": "secret-key",
          "content-type": "application/json",
        },
        requestContext: { authorizer: { claims: { sub: "123" } } },
      } as any;

      const result = maskEvent(event) as any;
      expect(result.headers["authorization"]).toBe("[REDACTED]");
      expect(result.headers["x-api-key"]).toBe("[REDACTED]");
      expect(result.headers["content-type"]).toBe("application/json");
      expect(result.requestContext.authorizer).toBe("[REDACTED]");
    });

    it("redacts body and query parameters", () => {
      const event: APIGatewayProxyEventV2 = {
        queryStringParameters: {
          token: "secret-token",
          id: "123",
        },
        body: '{"password": "secret"}',
      } as any;

      const result = maskEvent(event) as any;
      expect(result.queryStringParameters.token).toBe("[REDACTED]");
      expect(result.queryStringParameters.id).toBe("[REDACTED]");
      expect(result.body).toBe("[REDACTED]");
    });

    it("redacts multi-value headers and query parameters", () => {
      const event = {
        multiValueHeaders: {
          cookie: ["a=b", "c=d"],
          "content-type": ["application/json"],
        },
        multiValueQueryStringParameters: {
          token: ["s1", "s2"],
          page: ["1"],
        },
      } as any;

      const result = maskEvent(event) as any;
      expect(result.multiValueHeaders.cookie[0]).toBe("[REDACTED]");
      expect(result.multiValueHeaders["content-type"][0]).toBe(
        "application/json",
      );
      expect(result.multiValueQueryStringParameters.token[0]).toBe(
        "[REDACTED]",
      );
      expect(result.multiValueQueryStringParameters.page[0]).toBe("[REDACTED]");
    });
  });

  describe("logError", () => {
    it("logs and redacts Error objects", () => {
      const error = new Error("failed with secret=123");
      logError("Test", error);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Test: failed with secret=[REDACTED]"),
        expect.any(String),
      );
    });

    it("logs and sanitizes plain objects", () => {
      const data = { foo: "bar", secret: "123" };
      logError("Test", data);
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR] Test:",
        expect.stringContaining("[REDACTED]"),
      );
    });

    it("handles deeply nested objects with recursion limit", () => {
      const deep: any = {
        a: {
          a: { a: { a: { a: { a: { a: { a: { a: { a: { a: {} } } } } } } } } },
        },
      };
      logError("Test", deep);
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR] Test:",
        expect.stringContaining("[DEPTH_LIMIT_REACHED]"),
      );
    });
  });

  describe("logInfo", () => {
    it("logs string messages", () => {
      logInfo("Test");
      expect(console.info).toHaveBeenCalledWith("[INFO] Test");
    });

    it("logs messages with data", () => {
      logInfo("Test", { foo: "bar" });
      expect(console.info).toHaveBeenCalledWith(
        "[INFO] Test:",
        '{"foo":"bar"}',
      );
    });
  });

  describe("safeCompare", () => {
    it("returns true for identical strings", () => {
      expect(safeCompare("abc", "abc")).toBe(true);
    });

    it("returns false for different strings", () => {
      expect(safeCompare("abc", "def")).toBe(false);
    });
  });

  describe("getHeader", () => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    };

    it("finds headers case-insensitively", () => {
      expect(getHeader(headers, "content-type")).toBe("application/json");
      expect(getHeader(headers, "AUTHORIZATION")).toBe("Bearer token");
    });

    it("returns undefined if not found", () => {
      expect(getHeader(headers, "x-api-key")).toBeUndefined();
      expect(getHeader(undefined, "any")).toBeUndefined();
    });
  });

  describe("extractRequestMetadata", () => {
    it("extracts method and normalized path", () => {
      const event = {
        requestContext: { http: { method: "POST", path: "/api/teams/" } },
      } as any;
      const meta = extractRequestMetadata(event);
      expect(meta.method).toBe("POST");
      expect(meta.path).toBe("/teams");
    });

    it("falls back to GET if method missing", () => {
      const event = { rawPath: "/teams" } as any;
      const meta = extractRequestMetadata(event);
      expect(meta.method).toBe("GET");
      expect(meta.path).toBe("/teams");
    });
  });

  describe("extractIdFromPath", () => {
    it("extracts ID from valid path", () => {
      expect(extractIdFromPath("/players/123", "/players/")).toBe("123");
    });

    it("returns null if path doesn't start with prefix", () => {
      expect(extractIdFromPath("/teams/123", "/players/")).toBeNull();
    });

    it("returns null if extra segments present", () => {
      expect(extractIdFromPath("/players/123/stats", "/players/")).toBeNull();
    });
  });
});
