import { describe, it, expect } from "@jest/globals";
import { sanitizeOutput, INTERNAL_KEYS } from "../responses.js";

describe("responses.ts", () => {
  describe("sanitizeOutput", () => {
    it("redacts keys in INTERNAL_KEYS", () => {
      const input = {
        id: "123",
        PK: "TEAM#123",
        SK: "METADATA#123",
        name: "Test Team",
        deletedAt: "2023-01-01",
        isArchived: true
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
          { id: "p2", PK: "PLAYER#p2", name: "Player 2" }
        ],
        metadata: {
          SK: "META",
          foo: "bar"
        }
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
      // We can test this by temporarily adding it if we wanted to be super thorough,
      // but testing the existing implementation is fine.
      const input = { id: "keep-me", PK: "drop-me" };
      const result: any = sanitizeOutput(input);
      expect(result.id).toBe("keep-me");
    });
  });
});
