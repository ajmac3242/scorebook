import { describe, it, expect } from "@jest/globals";
import {
  sanitizeOutput,
  filterActive,
  response,
  ok,
  created,
  badRequest,
  notFound,
  serverError,
} from "../responses.js";

describe("responses.ts", () => {
  describe("sanitizeOutput", () => {
    it("redacts keys in INTERNAL_KEYS", () => {
      const input = {
        id: "123",
        PK: "TEAM#123",
        SK: "METADATA#123",
        name: "Test Team",
        deletedAt: "2023-01-01",
        isArchived: true,
      };
      const result: any = sanitizeOutput(input);
      expect(result.id).toBe("123");
      expect(result.name).toBe("Test Team");
      expect(result.PK).toBeUndefined();
      expect(result.SK).toBeUndefined();
      expect(result.deletedAt).toBeUndefined();
      expect(result.isArchived).toBeUndefined();
    });

    it("redacts recursively in objects and arrays", () => {
      const input = {
        id: "123",
        PK: "TEAM#123",
        players: [
          { id: "p1", PK: "PLAYER#p1", name: "Player 1" },
          { id: "p2", PK: "PLAYER#p2", name: "Player 2" },
        ],
        metadata: {
          SK: "META",
          foo: "bar",
        },
      };
      const result: any = sanitizeOutput(input);
      expect(result.id).toBe("123");
      expect(result.PK).toBeUndefined();
      expect(result.players[0].id).toBe("p1");
      expect(result.players[0].PK).toBeUndefined();
      expect(result.metadata.SK).toBeUndefined();
      expect(result.metadata.foo).toBe("bar");
    });

    it("preserves non-object values", () => {
      expect(sanitizeOutput("string")).toBe("string");
      expect(sanitizeOutput(123)).toBe(123);
      expect(sanitizeOutput(true)).toBe(true);
      expect(sanitizeOutput(null)).toBe(null);
    });

    it("handles empty objects and arrays", () => {
      expect(sanitizeOutput({})).toEqual({});
      expect(sanitizeOutput([])).toEqual([]);
    });

    it("always preserves 'id' even if it were in INTERNAL_KEYS (sanity check)", () => {
      // Just in case 'id' was ever added to INTERNAL_KEYS, sanitizeOutput is coded to preserve it.
      const input = { id: "keep-me", PK: "drop-me" };
      const result: any = sanitizeOutput(input);
      expect(result.id).toBe("keep-me");
    });

    it("handles deep recursion and returns empty object", () => {
      const deep: any = {};
      let current = deep;
      for (let i = 0; i < 15; i++) {
        current.inner = {};
        current = current.inner;
      }
      const result: any = sanitizeOutput(deep);
      // It should bottom out at depth 10
      let depth = 0;
      let check = result;
      while (check && check.inner && Object.keys(check.inner).length > 0) {
        check = check.inner;
        depth++;
      }
      expect(depth).toBeLessThanOrEqual(11);
    });
  });

  describe("filterActive", () => {
    it("filters out deleted items", () => {
      const items = [
        { id: "1" },
        { id: "2", deletedAt: "2023-01-01" },
        { id: "3", deletedAt: null },
      ];
      const result = filterActive(items);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("3");
    });

    it("returns empty array for null/undefined input", () => {
      expect(filterActive(null)).toEqual([]);
      expect(filterActive(undefined)).toEqual([]);
    });
  });

  describe("response and semantic helpers", () => {
    it("adds security headers in response()", () => {
      const res = response(200, { foo: "bar" });
      expect(res.statusCode).toBe(200);
      expect(res.headers!["Content-Type"]).toBe("application/json");
      expect(res.headers!["X-Content-Type-Options"]).toBe("nosniff");
      expect(res.headers!["X-Frame-Options"]).toBe("DENY");
      expect(JSON.parse(res.body!)).toEqual({ foo: "bar" });
    });

    it("sanitizes body in response()", () => {
      const res = response(200, { id: "1", PK: "SECRET" });
      const body = JSON.parse(res.body!);
      expect(body.id).toBe("1");
      expect(body.PK).toBeUndefined();
    });

    it("semantic helpers return correct status codes", () => {
      expect(ok({}).statusCode).toBe(200);
      expect(created({}).statusCode).toBe(201);
      expect(badRequest("error").statusCode).toBe(400);
      expect(notFound("error").statusCode).toBe(404);
      expect(serverError().statusCode).toBe(500);
    });

    it("serverError returns standard message", () => {
      const res = serverError();
      expect(JSON.parse(res.body!).message).toBe("Internal Server Error");
    });
  });
});
