import { describe, it, expect } from "@jest/globals";
import {
  isValidUuid,
  isValidPlayerId,
  SPECIAL_PLAYER_IDS,
  validateStatEvent,
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
    const validEvent = {
      type: "MAKE",
      playerId: "277e909a-6536-4d2d-937e-f608759556fb",
      points: 2,
      period: 1,
      clockTime: 600,
      locationX: 50,
      locationY: 50,
    };

    it("returns null for valid events", () => {
      expect(validateStatEvent(validEvent)).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "MISS", points: 0 }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "FOUL", points: undefined }),
      ).toBeNull();
    });

    it("returns error for invalid body", () => {
      expect(validateStatEvent(null)).toBe("Invalid request body");
      expect(validateStatEvent("not-an-object")).toBe("Invalid request body");
    });

    it("returns error for invalid type", () => {
      expect(validateStatEvent({ ...validEvent, type: undefined })).toBe(
        "Valid stat type is required",
      );
      expect(validateStatEvent({ ...validEvent, type: "INVALID" })).toBe(
        "Valid stat type is required",
      );
    });

    it("returns error for invalid points", () => {
      expect(validateStatEvent({ ...validEvent, points: -1 })).toBe(
        "Points must be an integer between 0 and 3",
      );
      expect(validateStatEvent({ ...validEvent, points: 4 })).toBe(
        "Points must be an integer between 0 and 3",
      );
      expect(validateStatEvent({ ...validEvent, points: 2.5 })).toBe(
        "Points must be an integer between 0 and 3",
      );
    });

    it("returns error for invalid playerId", () => {
      expect(validateStatEvent({ ...validEvent, playerId: "invalid" })).toBe(
        "Valid playerId is required",
      );
    });

    it("returns error for invalid period", () => {
      expect(validateStatEvent({ ...validEvent, period: 0 })).toBe(
        "Period must be an integer at least 1",
      );
      expect(validateStatEvent({ ...validEvent, period: -1 })).toBe(
        "Period must be an integer at least 1",
      );
      expect(validateStatEvent({ ...validEvent, period: 1.5 })).toBe(
        "Period must be an integer at least 1",
      );
    });

    it("returns error for invalid clockTime", () => {
      expect(validateStatEvent({ ...validEvent, clockTime: -1 })).toBe(
        "Clock time must be a finite number at least 0",
      );
      expect(validateStatEvent({ ...validEvent, clockTime: Infinity })).toBe(
        "Clock time must be a finite number at least 0",
      );
    });

    it("returns error for invalid locationX", () => {
      expect(validateStatEvent({ ...validEvent, locationX: -1 })).toBe(
        "Location coordinates must be finite numbers between 0 and 100",
      );
      expect(validateStatEvent({ ...validEvent, locationX: 101 })).toBe(
        "Location coordinates must be finite numbers between 0 and 100",
      );
    });

    it("returns error for invalid locationY", () => {
      expect(validateStatEvent({ ...validEvent, locationY: -1 })).toBe(
        "Location coordinates must be finite numbers between 0 and 100",
      );
      expect(validateStatEvent({ ...validEvent, locationY: 101 })).toBe(
        "Location coordinates must be finite numbers between 0 and 100",
      );
    });
  });
});
