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

    it("handles partial substitution commands gracefully", () => {
      // "sub 12" without outgoing player
      const res1 = parseVoiceCommand("sub twelve");
      expect(res1?.actions[0].action).toBe(ACTION_TYPES.SUB_IN);

      // "sub 12 for" without second player
      const res2 = parseVoiceCommand("sub twelve for");
      expect(res2?.actions[0].action).toBe(ACTION_TYPES.SUB_IN);
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

  it("skips unrecognized filler words in transcript", () => {
    const result = parseVoiceCommand("twenty three um make three please");
    expect(result?.actions).toHaveLength(1);
    expect(result?.actions[0]).toEqual({
      jerseyNumber: "23",
      action: ACTION_TYPES.MAKE,
      points: 3,
      isOpponent: false,
    });
  });

  it("handles malformed input gracefully", () => {
    expect(parseVoiceCommand("")).toBeNull();
    expect(parseVoiceCommand("hello")).toBeNull();
    expect(parseVoiceCommand("23")).toBeNull();
    expect(parseVoiceCommand("unknown words here")).toBeNull();
  });

  it("handles compound tens edge cases and non-make actions", () => {
    // Compound tens where second word is >= 10: "twenty" sets jersey to 20, then "ten" sets jersey to 10
    const res1 = parseVoiceCommand("twenty ten steal");
    expect(res1?.actions[0]).toEqual({
      jerseyNumber: "10",
      action: ACTION_TYPES.STEAL,
      points: undefined,
      isOpponent: false,
    });

    // Compound tens valid number (e.g. "twenty five")
    const res2 = parseVoiceCommand("twenty five steal");
    expect(res2?.actions[0]).toEqual({
      jerseyNumber: "25",
      action: ACTION_TYPES.STEAL,
      points: undefined,
      isOpponent: false,
    });

    // Non-make actions
    const res3 = parseVoiceCommand("twenty three timeout");
    expect(res3?.actions[0].action).toBe(ACTION_TYPES.TIMEOUT);
  });
});
