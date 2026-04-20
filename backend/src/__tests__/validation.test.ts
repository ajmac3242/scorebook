import { describe, it, expect } from "@jest/globals";
import {
  isValidUuid,
  isValidPlayerId,
  validateStatEvent,
  SPECIAL_PLAYER_IDS,
} from "../validation.js";

describe("validation.ts", () => {
  describe("isValidUuid", () => {
    it("returns true for valid UUID v4", () => {
      expect(isValidUuid("277e909a-6536-4d2d-937e-f608759556fb")).toBe(true);
      expect(isValidUuid("00000000-0000-0000-0000-000000000000")).toBe(true);
    });

    it("returns false for invalid UUIDs", () => {
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("277e909a-6536-4d2d-937e-f608759556f")).toBe(false); // too short
      expect(isValidUuid("")).toBe(false);
    });

    it("returns false for non-string inputs", () => {
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
      expect(isValidUuid(123)).toBe(false);
    });
  });

  describe("isValidPlayerId", () => {
    it("returns true for valid UUIDs", () => {
      expect(isValidPlayerId("277e909a-6536-4d2d-937e-f608759556fb")).toBe(
        true,
      );
    });

    it("returns true for special constants", () => {
      expect(isValidPlayerId(SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
      expect(isValidPlayerId(SPECIAL_PLAYER_IDS.OUR_TEAM)).toBe(true);
      expect(isValidPlayerId(SPECIAL_PLAYER_IDS.TEAM_TIMEOUT)).toBe(true);
    });

    it("returns true for valid jersey prefixes", () => {
      expect(isValidPlayerId("OPPONENT:5")).toBe(true);
      expect(isValidPlayerId("OPPONENT:0")).toBe(true);
      expect(isValidPlayerId("OPPONENT:99")).toBe(true);
    });

    it("handles jersey boundary cases (1 and 2 digits)", () => {
      // 🛡️ Guard: Verifies the length check optimization (10-11 chars)
      expect(isValidPlayerId("OPPONENT:1")).toBe(true);
      expect(isValidPlayerId("OPPONENT:9")).toBe(true);
      expect(isValidPlayerId("OPPONENT:10")).toBe(true);
      expect(isValidPlayerId("OPPONENT:99")).toBe(true);
    });

    it("returns false for invalid jersey prefixes", () => {
      expect(isValidPlayerId("OPPONENT:")).toBe(false);
      expect(isValidPlayerId("OPPONENT:abc")).toBe(false);
      expect(isValidPlayerId("OPPONENT:100")).toBe(false); // more than 2 digits
      expect(isValidPlayerId("PLAYER:12")).toBe(false);
    });

    it("returns false for invalid inputs", () => {
      expect(isValidPlayerId(null)).toBe(false);
      expect(isValidPlayerId(123)).toBe(false);
      expect(isValidPlayerId("")).toBe(false);
    });
  });

  describe("validateStatEvent", () => {
    const validBaseEvent = {
      type: "MAKE",
      playerId: "OPPONENT:12",
      points: 2,
      period: 1,
      clockTime: 600,
    };

    it("returns null for valid base events", () => {
      expect(validateStatEvent(validBaseEvent)).toBeNull();
    });

    it("validates coordinate boundaries (0 and 100)", () => {
      // 🛡️ Guard: Ensures coordinates are inclusive [0, 100]
      expect(validateStatEvent({ ...validBaseEvent, locationX: 0, locationY: 0 })).toBeNull();
      expect(validateStatEvent({ ...validBaseEvent, locationX: 100, locationY: 100 })).toBeNull();
      expect(validateStatEvent({ ...validBaseEvent, locationX: -0.1 })).toBe("Location coordinates must be finite numbers between 0 and 100");
      expect(validateStatEvent({ ...validBaseEvent, locationX: 100.1 })).toBe("Location coordinates must be finite numbers between 0 and 100");
    });

    it("rejects invalid points", () => {
      expect(validateStatEvent({ ...validBaseEvent, points: 4 })).toBe("Points must be an integer between 0 and 3");
      expect(validateStatEvent({ ...validBaseEvent, points: -1 })).toBe("Points must be an integer between 0 and 3");
    });
  });
});
