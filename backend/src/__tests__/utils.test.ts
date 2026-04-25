import { describe, it, expect } from "@jest/globals";
import { stripLocalFields, normalizePath, maskEvent, getHeader, extractIdFromPath } from "../utils.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";

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
});
