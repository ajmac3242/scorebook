import { describe, it, expect } from "@jest/globals";
import { stripLocalFields, normalizePath, maskEvent, getHeader, extractIdFromPath, logError, safeCompare } from "../utils.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { jest } from "@jest/globals";

describe("backend utils", () => {
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

    it("enforces a maximum recursion depth of 10 to prevent DoS", () => {
      // Create a deeply nested object (12 levels)
      const deepInput: any = { id: "0" };
      let current = deepInput;
      for (let i = 1; i <= 12; i++) {
        current.child = { id: i.toString() };
        current = current.child;
      }

      const result = stripLocalFields(deepInput) as any;

      // Verify that level 10 is reached but level 11 returns an empty object {}
      // (The code returns {} when depth > 10)
      let check = result;
      for (let i = 0; i < 11; i++) {
        expect(check.id).toBe(i.toString());
        check = check.child;
      }
      expect(check).toEqual({});
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
  });

  describe("getHeader", () => {
    it("retrieves header values case-insensitively", () => {
      const headers = {
        Authorization: "Bearer token",
        "X-Custom": "value",
      };
      expect(getHeader(headers, "authorization")).toBe("Bearer token");
      expect(getHeader(headers, "AUTHORIZATION")).toBe("Bearer token");
      expect(getHeader(headers, "x-custom")).toBe("value");
    });

    it("returns undefined for missing headers", () => {
      expect(getHeader({}, "missing")).toBeUndefined();
      expect(getHeader(undefined, "any")).toBeUndefined();
    });
  });

  describe("extractIdFromPath", () => {
    it("extracts ID from a valid path", () => {
      expect(extractIdFromPath("/teams/123", "/teams/")).toBe("123");
      expect(extractIdFromPath("/players/abc", "/players/")).toBe("abc");
    });

    it("returns null for malformed or non-matching paths", () => {
      expect(extractIdFromPath("/teams/123/extra", "/teams/")).toBeNull();
      expect(extractIdFromPath("/other/123", "/teams/")).toBeNull();
    });
  });

  describe("logError", () => {
    it("redacts sensitive terms from Error message and stack", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Failed with password=123 and token:abc");
      error.stack = "Error: at line 1 (password=123)\nat line 2 (token:abc)";

      logError("TestLabel", error);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] TestLabel: Failed with [REDACTED]=123 and [REDACTED]:abc"),
        expect.stringContaining("Error: at line 1 ([REDACTED]=123)\nat line 2 ([REDACTED]:abc)"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("safeCompare", () => {
    it("returns true for identical strings", () => {
      expect(safeCompare("secret123", "secret123")).toBe(true);
      expect(safeCompare("", "")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(safeCompare("secret123", "secret456")).toBe(false);
    });

    it("returns false for different strings of different length", () => {
      expect(safeCompare("secret123", "secret")).toBe(false);
      expect(safeCompare("abc", "abcdef")).toBe(false);
    });

    it("handles special characters", () => {
      expect(safeCompare("!@#$%^", "!@#$%^")).toBe(true);
      expect(safeCompare("!@#$%^", "^%$#@!")).toBe(false);
    });
  });
});
