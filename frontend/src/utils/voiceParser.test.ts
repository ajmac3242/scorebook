import { describe, it, expect } from "vitest";
import { parseVoiceCommand } from "./voiceParser";
import { ACTION_TYPES } from "../constants/stats";

describe("voiceParser", () => {
  it("should parse simple team commands", () => {
    const cmd = parseVoiceCommand("five make three");
    expect(cmd).toEqual({
      jerseyNumber: "5",
      action: ACTION_TYPES.MAKE,
      points: 3,
      isOpponent: false,
      raw: "five make three",
    });
  });

  it("should parse opponent commands", () => {
    const cmd = parseVoiceCommand("opponent twelve miss");
    expect(cmd).toEqual({
      jerseyNumber: "12",
      action: ACTION_TYPES.MISS,
      points: 2,
      isOpponent: true,
      raw: "opponent twelve miss",
    });
  });

  it("should handle multi-word numbers", () => {
    const cmd = parseVoiceCommand("twenty three make two");
    expect(cmd).toEqual({
      jerseyNumber: "23",
      action: ACTION_TYPES.MAKE,
      points: 2,
      isOpponent: false,
      raw: "twenty three make two",
    });
  });

  it("should handle digits", () => {
    const cmd = parseVoiceCommand("24 steal");
    expect(cmd).toEqual({
      jerseyNumber: "24",
      action: ACTION_TYPES.STEAL,
      points: 2,
      isOpponent: false,
      raw: "24 steal",
    });
  });

  it("should return null for unknown actions", () => {
    const cmd = parseVoiceCommand("ten dance");
    expect(cmd).toBeNull();
  });
});
