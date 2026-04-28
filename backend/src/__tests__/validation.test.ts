import { describe, it, expect } from "@jest/globals";
import {
  isValidUuid,
  isValidPlayerId,
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
      expect(isValidPlayerId("OPPONENT:123")).toBe(true);
    });

    it("returns false for invalid jersey prefixes", () => {
      expect(isValidPlayerId("OPPONENT:")).toBe(false);
      expect(isValidPlayerId("OPPONENT:abc")).toBe(false);
      expect(isValidPlayerId("OPPONENT:1000")).toBe(false); // more than 3 digits
      expect(isValidPlayerId("PLAYER:12")).toBe(false);
    });

    it("enforces strict length and digit constraints for jersey prefixes", () => {
      // Valid lengths (prefix 'OPPONENT:' is length 9)
      // 9 + 1 = 10 chars (min)
      expect(isValidPlayerId("OPPONENT:1")).toBe(true);
      // 9 + 3 = 12 chars (max)
      expect(isValidPlayerId("OPPONENT:999")).toBe(true);

      // Invalid lengths
      expect(isValidPlayerId("OPPONENT:1234")).toBe(false); // 13 chars
      expect(isValidPlayerId("OPPONENT:")).toBe(false); // 9 chars
    });

    it("returns false for invalid inputs", () => {
      expect(isValidPlayerId(null)).toBe(false);
      expect(isValidPlayerId(123)).toBe(false);
      expect(isValidPlayerId("")).toBe(false);
    });
  });
});
