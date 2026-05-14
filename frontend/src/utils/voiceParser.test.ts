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

  it("parses multi-word jersey numbers", () => {
    const result = parseVoiceCommand("forty five make two");
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions[0].jerseyNumber).toBe("45");
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

  describe("substitutions", () => {
    it("parses '[Jersey] in for [Jersey]'", () => {
      const result = parseVoiceCommand("twelve in for five");
      expect(result?.actions).toHaveLength(2);
      expect(result?.actions[0]).toEqual({
        jerseyNumber: "12",
        action: ACTION_TYPES.SUB_IN,
        isOpponent: false,
      });
      expect(result?.actions[1]).toEqual({
        jerseyNumber: "5",
        action: ACTION_TYPES.SUB_OUT,
        isOpponent: false,
      });
    });

    it("parses '[Jersey] sub [Jersey]'", () => {
      const result = parseVoiceCommand("12 sub 5");
      expect(result?.actions).toHaveLength(2);
      expect(result?.actions[0]).toEqual({
        jerseyNumber: "12",
        action: ACTION_TYPES.SUB_IN,
        isOpponent: false,
      });
      expect(result?.actions[1]).toEqual({
        jerseyNumber: "5",
        action: ACTION_TYPES.SUB_OUT,
        isOpponent: false,
      });
    });

    it("parses 'sub [Jersey] for [Jersey]'", () => {
      const result = parseVoiceCommand("sub twelve for five");
      expect(result?.actions).toHaveLength(2);
      expect(result?.actions[0]).toEqual({
        jerseyNumber: "12",
        action: ACTION_TYPES.SUB_IN,
        isOpponent: false,
      });
      expect(result?.actions[1]).toEqual({
        jerseyNumber: "5",
        action: ACTION_TYPES.SUB_OUT,
        isOpponent: false,
      });
    });

    it("parses opponent substitution", () => {
      const result = parseVoiceCommand("opponent ten in for zero");
      expect(result?.actions).toHaveLength(2);
      expect(result?.actions[0]).toEqual({
        jerseyNumber: "10",
        action: ACTION_TYPES.SUB_IN,
        isOpponent: true,
      });
      expect(result?.actions[1]).toEqual({
        jerseyNumber: "0",
        action: ACTION_TYPES.SUB_OUT,
        isOpponent: true,
      });
    });
  });

  it("handles malformed input gracefully", () => {
    expect(parseVoiceCommand("")).toBeNull();
    expect(parseVoiceCommand("hello")).toBeNull();
    expect(parseVoiceCommand("23")).toBeNull();
  });
});
