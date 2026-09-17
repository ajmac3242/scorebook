import { describe, it, expect } from "vitest";
import {
  STAT_ACRONYMS,
  SHOT_QUALITY,
  BREAKDOWN_REASONS,
  SITUATIONS,
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
  WHISTLE_ACTION_TYPES,
} from "./stats";

describe("stats constants", () => {
  it("defines correct stat acronyms", () => {
    expect(STAT_ACRONYMS.POINTS).toBe("PTS");
    expect(STAT_ACRONYMS.REBOUNDS).toBe("REB");
    expect(STAT_ACRONYMS.ASSISTS).toBe("AST");
    expect(STAT_ACRONYMS.STEALS).toBe("STL");
    expect(STAT_ACRONYMS.BLOCKS).toBe("BLK");
    expect(STAT_ACRONYMS.TURNOVERS).toBe("TO");
    expect(STAT_ACRONYMS.PERSONAL_FOULS).toBe("PF");
  });

  it("defines shot quality tags", () => {
    expect(SHOT_QUALITY.OPEN).toBe("OPEN");
    expect(SHOT_QUALITY.CONTESTED).toBe("CONTESTED");
  });

  it("defines breakdown reasons and situations", () => {
    expect(BREAKDOWN_REASONS.MISSED_ROTATION).toBe("Missed Rotation");
    expect(SITUATIONS.ATO).toBe("ATO");
    expect(SITUATIONS.BLOB).toBe("BLOB");
  });

  it("defines action types and special player IDs", () => {
    expect(ACTION_TYPES.MAKE).toBe("MAKE");
    expect(ACTION_TYPES.MISS).toBe("MISS");
    expect(ACTION_TYPES.TECHNICAL_FOUL_CLASS_A).toBe("TECHNICAL_FOUL_CLASS_A");
    expect(SPECIAL_PLAYER_IDS.OPPONENT).toBe("OPPONENT");
  });

  it("defines bonus configuration thresholds", () => {
    expect(BONUS_CONFIG.QUARTERS).toEqual({ double: 5, single: 5, warning: 4 });
    expect(BONUS_CONFIG.HALVES).toEqual({ double: 10, single: 7, warning: 6 });
  });

  it("identifies whistle action types correctly", () => {
    expect(WHISTLE_ACTION_TYPES.has(ACTION_TYPES.FOUL)).toBe(true);
    expect(WHISTLE_ACTION_TYPES.has(ACTION_TYPES.TIMEOUT)).toBe(true);
    expect(WHISTLE_ACTION_TYPES.has(ACTION_TYPES.HELD_BALL)).toBe(true);
    expect(WHISTLE_ACTION_TYPES.has(ACTION_TYPES.MAKE)).toBe(false);
  });
});
