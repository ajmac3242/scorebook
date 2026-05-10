import { describe, it, expect } from "vitest";
import { parseVoiceCommand } from "./voiceParser";
import { ACTION_TYPES } from "../constants/stats";

describe("voiceParser", () => {
  it("parses simple make command", () => {
    const result = parseVoiceCommand("twenty three make three");
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions[0]).toEqual({
      jerseyNumber: "23",
      action: ACTION_TYPES.MAKE,
      points: 3,
      isOpponent: false,
    });
  });

  it("parses opponent action", () => {
    const result = parseVoiceCommand("opponent five make");
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions[0]).toEqual({
      jerseyNumber: "5",
      action: ACTION_TYPES.MAKE,
      points: 2,
      isOpponent: true,
    });
  });

  it("parses chained make and assist", () => {
    const result = parseVoiceCommand("twenty three make three assist five");
    expect(result?.actions).toHaveLength(2);
    expect(result?.actions[0]).toEqual({
      jerseyNumber: "23",
      action: ACTION_TYPES.MAKE,
      points: 3,
      isOpponent: false,
    });
    expect(result?.actions[1]).toEqual({
      jerseyNumber: "5",
      action: ACTION_TYPES.ASSIST,
      points: undefined,
      isOpponent: false,
    });
  });

  it("parses chained miss and rebound", () => {
    const result = parseVoiceCommand("ten miss rebound zero");
    expect(result?.actions).toHaveLength(2);
    expect(result?.actions[0].action).toBe(ACTION_TYPES.MISS);
    expect(result?.actions[1]).toEqual({
      jerseyNumber: "0",
      action: ACTION_TYPES.REBOUND,
      points: undefined,
      isOpponent: false,
    });
  });
});
