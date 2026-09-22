import { describe, it, expect } from "@jest/globals";
import {
  isValidUuid,
  isValidPlayerId,
  SPECIAL_PLAYER_IDS,
  validateStatEvent,
  validateGameMetadata,
  validatePlayerMetadata,
  validateTeamMetadata,
  validateObjectDepthAndSize,
  validateStringLengths,
} from "../validation.js";

describe("validation.ts", () => {
  describe("isValidUuid", () => {
    it("returns true for valid UUID v4", () => {
      expect(isValidUuid("277e909a-6536-4d2d-937e-f608759556fb")).toBe(true);
    });

    it("returns false for invalid UUIDs", () => {
      expect(isValidUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
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
      expect(isValidPlayerId("a".repeat(51))).toBe(false);
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
      expect(
        validateStatEvent({ ...validEvent, type: "HOCKEY_ASSIST" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "FLOOR_DIVE" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "CHARGE_TAKEN" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "GREAT_CONTEST" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "PAINT_TOUCH" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "TECHNICAL_FOUL_CLASS_A" }),
      ).toBeNull();
      expect(
        validateStatEvent({ ...validEvent, type: "TECHNICAL_FOUL_CLASS_B" }),
      ).toBeNull();
    });

    it("returns error for invalid body", () => {
      expect(validateStatEvent(null)).toBe("Invalid request body");
      expect(validateStatEvent("not-an-object")).toBe("Invalid request body");
      expect(validateStatEvent([])).toBe("Invalid request body");
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
      expect(validateStatEvent({ ...validEvent, period: 21 })).toBe(
        "Period must be under 20",
      );
    });

    it("returns error for invalid clockTime", () => {
      expect(validateStatEvent({ ...validEvent, clockTime: -1 })).toBe(
        "Clock time must be a finite number at least 0",
      );
      expect(validateStatEvent({ ...validEvent, clockTime: Infinity })).toBe(
        "Clock time must be a finite number at least 0",
      );
      expect(validateStatEvent({ ...validEvent, clockTime: 3601 })).toBe(
        "Clock time exceeds maximum allowed value of 3600",
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

    it("returns error for invalid situational context", () => {
      expect(validateStatEvent({ ...validEvent, situation: "INVALID" })).toBe(
        "Invalid situational context",
      );
    });

    it("returns error for invalid shot clock phase", () => {
      expect(
        validateStatEvent({ ...validEvent, shotClockPhase: "INVALID" }),
      ).toBe("Invalid shot clock phase");
    });

    it("returns error for invalid primary defender ID", () => {
      expect(
        validateStatEvent({ ...validEvent, primaryDefenderId: "invalid" }),
      ).toBe("Invalid primary defender ID");
    });

    it("returns error for invalid defensive scheme", () => {
      expect(
        validateStatEvent({ ...validEvent, defensiveScheme: "INVALID" }),
      ).toBe("Invalid defensive scheme");
    });

    it("returns error for invalid opponent play type", () => {
      expect(
        validateStatEvent({ ...validEvent, opponentPlayType: "INVALID" }),
      ).toBe("Invalid opponent play type");
    });

    it("returns error for invalid defensive breakdown reason", () => {
      expect(
        validateStatEvent({ ...validEvent, breakdownReason: "INVALID" }),
      ).toBe("Invalid defensive breakdown reason");
    });

    it("returns error when string fields exceed maximum length", () => {
      const longString = "a".repeat(129);
      expect(
        validateStatEvent({
          ...validEvent,
          situation: "ATO",
          notes: longString,
        }),
      ).toContain("exceeds maximum length");
    });
  });

  describe("validateGameMetadata", () => {
    const validMeta = {
      teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      opponent: "Rivals",
    };

    it("returns error for missing or non-object body", () => {
      expect(validateGameMetadata(null as any)).toBe("Invalid request body");
      expect(validateGameMetadata(undefined as any)).toBe(
        "Invalid request body",
      );
      expect(validateGameMetadata("not-an-object" as any)).toBe(
        "Invalid request body",
      );
      expect(validateGameMetadata([] as any)).toBe("Invalid request body");
    });

    it("returns error for invalid teamId", () => {
      expect(validateGameMetadata({ ...validMeta, teamId: "invalid" })).toBe(
        "Valid teamId (UUID) is required",
      );
    });

    it("returns error for invalid opponent name", () => {
      expect(validateGameMetadata({ ...validMeta, opponent: "" })).toBe(
        "Opponent name is required and must be under 100 characters",
      );
      expect(
        validateGameMetadata({ ...validMeta, opponent: "a".repeat(101) }),
      ).toBe("Opponent name is required and must be under 100 characters");
    });

    it("returns error for invalid location", () => {
      expect(
        validateGameMetadata({ ...validMeta, location: "a".repeat(101) }),
      ).toBe("Location must be a string under 100 characters");
    });

    it("returns error for invalid date", () => {
      expect(validateGameMetadata({ ...validMeta, date: "a".repeat(51) })).toBe(
        "Date must be a string under 50 characters",
      );
    });

    it("returns error for invalid completed property type", () => {
      expect(validateGameMetadata({ ...validMeta, completed: "yes" as any })).toBe(
        "Completed must be a boolean or 0 or 1",
      );
    });
  });

  describe("validateTeamMetadata", () => {
    it("returns null for valid team metadata", () => {
      expect(validateTeamMetadata({ name: "Wildcats" })).toBeNull();
    });

    it("returns error for missing or invalid team name", () => {
      expect(validateTeamMetadata(null as any)).toBe("Invalid request body");
      expect(validateTeamMetadata({})).toBe(
        "Team name is required and must be under 100 characters",
      );
      expect(validateTeamMetadata({ name: "" })).toBe(
        "Team name is required and must be under 100 characters",
      );
      expect(validateTeamMetadata({ name: "a".repeat(101) })).toBe(
        "Team name is required and must be under 100 characters",
      );
      expect(validateTeamMetadata({ name: 123 })).toBe(
        "Team name is required and must be under 100 characters",
      );
    });

    it("returns error when string fields exceed maximum length", () => {
      expect(
        validateTeamMetadata({ name: "Wildcats", notes: "a".repeat(129) }),
      ).toContain("exceeds maximum length");
    });

    it("returns error for XSS or control characters in team name", () => {
      expect(validateTeamMetadata({ name: "<script>alert(1)</script>" })).toBe(
        "Field name contains potentially malicious content",
      );
      expect(
        validateTeamMetadata({ name: "Wildcats<iframe srcdoc='x'>" }),
      ).toBe("Field name contains potentially malicious content");
      expect(
        validateTeamMetadata({ name: "Wildcats;vbscript:msgbox(1)" }),
      ).toBe("Field name contains potentially malicious content");
      expect(validateTeamMetadata({ name: "Wildcats\n" })).toBe(
        "Field name contains invalid characters",
      );
    });
  });

  describe("validatePlayerMetadata", () => {
    it("returns error for missing or non-object body", () => {
      expect(validatePlayerMetadata(null as any)).toBe("Invalid request body");
      expect(validatePlayerMetadata(undefined as any)).toBe(
        "Invalid request body",
      );
      expect(validatePlayerMetadata(123 as any)).toBe("Invalid request body");
      expect(validatePlayerMetadata([] as any)).toBe("Invalid request body");
    });

    it("returns error for invalid player name", () => {
      expect(validatePlayerMetadata({})).toBe(
        "Player name is required and must be under 100 characters",
      );
      expect(validatePlayerMetadata({ name: "a".repeat(101) })).toBe(
        "Player name is required and must be under 100 characters",
      );
    });

    it("returns error for long metadata strings", () => {
      expect(
        validatePlayerMetadata({ name: "John", notes: "a".repeat(129) }),
      ).toContain("exceeds maximum length");
    });
  });

  describe("structure limits and string validation", () => {
    it("enforces depth, property count, and array length limits", () => {
      // Depth limit exceed
      let deepObj: any = { val: "end" };
      for (let i = 0; i < 11; i++) {
        deepObj = { child: deepObj };
      }
      expect(validateObjectDepthAndSize(deepObj)).toBe(
        "Object depth limit exceeded",
      );

      // Property count limit exceed
      const manyProps: Record<string, number> = {};
      for (let i = 0; i < 51; i++) {
        manyProps[`key_${i}`] = i;
      }
      expect(validateObjectDepthAndSize(manyProps)).toBe(
        "Object property limit exceeded",
      );

      // Array length limit exceed
      const longArr = new Array(101).fill("item");
      expect(validateObjectDepthAndSize(longArr)).toBe(
        "Array length limit exceeded",
      );
    });

    it("validates string array items and depth limits in validateStringLengths", () => {
      expect(validateStringLengths(["a".repeat(10)], 5)).toBe(
        "String exceeds maximum length of 5 characters",
      );
      expect(validateStringLengths("normal string", 50)).toBeNull();

      // Excessive string recursion depth check
      let deepStrObj: any = "deep string";
      for (let i = 0; i < 12; i++) {
        deepStrObj = [deepStrObj];
      }
      expect(validateStringLengths(deepStrObj, 50)).toBe(
        "Maximum validation depth exceeded",
      );
    });
  });

  describe("prototype pollution protection", () => {
    it("rejects objects containing __proto__ key in validateObjectDepthAndSize", () => {
      const malicious = JSON.parse(
        '{"name":"Test","__proto__":{"polluted":true}}',
      );
      expect(validateObjectDepthAndSize(malicious)).toBe(
        "Forbidden property detected",
      );
    });

    it("rejects team metadata containing constructor key", () => {
      const malicious = JSON.parse(
        '{"name":"Wildcats","constructor":{"polluted":true}}',
      );
      expect(validateTeamMetadata(malicious)).toBe(
        "Forbidden property detected",
      );
    });

    it("rejects stat event containing prototype key", () => {
      const malicious = JSON.parse(
        '{"type":"MAKE","playerId":"277e909a-6536-4d2d-937e-f608759556fb","prototype":{"polluted":true}}',
      );
      expect(validateStatEvent(malicious)).toBe("Forbidden property detected");
    });
  });
});
