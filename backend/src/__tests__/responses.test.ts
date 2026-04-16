import { describe, it, expect } from "@jest/globals";
import { sanitizeOutput, response } from "../responses.js";

describe("Response Helpers", () => {
  describe("sanitizeOutput", () => {
    it("removes internal keys from a flat object", () => {
      const input = {
        id: "test-id",
        name: "Test",
        PK: "TEAM#test-id",
        SK: "METADATA#test-id",
        GSI1PK: "TEAM",
        synced: 1
      };
      const expected = {
        id: "test-id",
        name: "Test"
      };
      expect(sanitizeOutput(input)).toEqual(expected);
    });

    it("removes internal keys recursively from nested objects and arrays", () => {
      const input = {
        id: "team-1",
        PK: "TEAM#team-1",
        players: [
          { id: "p1", PK: "PLAYER#p1", name: "Player 1" },
          { id: "p2", PK: "PLAYER#p2" }
        ],
        metadata: {
          created: "2023-01-01",
          SK: "INTERNAL_SK"
        }
      };
      const output: any = sanitizeOutput(input);
      expect(output.PK).toBeUndefined();
      expect(output.players[0].PK).toBeUndefined();
      expect(output.players[1].PK).toBeUndefined();
      expect(output.metadata.SK).toBeUndefined();
      expect(output.id).toBe("team-1");
      expect(output.players[0].id).toBe("p1");
    });

    it("preserves 'id' even if it is in INTERNAL_KEYS (as per sanitizeOutput implementation)", () => {
      // Actually 'id' is NOT in INTERNAL_KEYS, but the code explicitly checks for it.
      const input = { id: "keep-me" };
      expect(sanitizeOutput(input)).toEqual({ id: "keep-me" });
    });

    it("handles null and non-object values", () => {
      expect(sanitizeOutput(null)).toBe(null);
      expect(sanitizeOutput(undefined)).toBe(undefined);
      expect(sanitizeOutput("string")).toBe("string");
      expect(sanitizeOutput(123)).toBe(123);
    });
  });

  describe("response", () => {
    it("returns a correctly formatted APIGatewayProxyResultV2", () => {
      const body = { id: "test", PK: "HIDDEN" };
      const res = response(200, body);

      expect(res.statusCode).toBe(200);
      expect(res.headers!["Content-Type"]).toBe("application/json");
      expect(res.headers!["X-Frame-Options"]).toBe("DENY");

      const parsedBody = JSON.parse(res.body!);
      expect(parsedBody.id).toBe("test");
      expect(parsedBody.PK).toBeUndefined();
    });

    it("includes custom headers", () => {
      const res = response(200, {}, { "X-Custom": "Value" });
      expect(res.headers!["X-Custom"]).toBe("Value");
      expect(res.headers!["X-Frame-Options"]).toBe("DENY"); // Still has default headers
    });
  });
});
