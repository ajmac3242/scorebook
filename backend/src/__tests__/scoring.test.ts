import { describe, it, expect } from "@jest/globals";
import {
  accumulateScores,
  determineResult,
  calculateGameResultFromStats,
} from "../scoring.js";
import { SPECIAL_PLAYER_IDS } from "../validation.js";

describe("scoring.ts", () => {
  describe("accumulateScores", () => {
    it("sums points for MAKE events", () => {
      const stats = [
        { type: "MAKE", points: 2, playerId: "p1" },
        { type: "MAKE", points: 3, playerId: "p1" },
        { type: "MISS", points: 2, playerId: "p1" },
      ];
      const result = accumulateScores(stats);
      expect(result.teamScore).toBe(5);
      expect(result.oppScore).toBe(0);
    });

    it("attributes points to opponent if playerId starts with OPPONENT", () => {
      const stats = [
        { type: "MAKE", points: 2, playerId: "p1" },
        { type: "MAKE", points: 2, playerId: SPECIAL_PLAYER_IDS.OPPONENT },
        { type: "MAKE", points: 3, playerId: "OPPONENT:12" },
      ];
      const result = accumulateScores(stats);
      expect(result.teamScore).toBe(2);
      expect(result.oppScore).toBe(5);
    });

    it("ignores deleted events", () => {
      const stats = [
        { type: "MAKE", points: 2, playerId: "p1" },
        { type: "MAKE", points: 2, playerId: "p1", deletedAt: "2023-01-01" },
      ];
      const result = accumulateScores(stats);
      expect(result.teamScore).toBe(2);
    });

    it("handles non-numeric points (JS coercion documentation)", () => {
      const stats = [
        { type: "MAKE", points: NaN, playerId: "p1" },
        { type: "MAKE", playerId: "p1" }, // missing points
      ];
      const result = (accumulateScores as any)(stats);
      expect(result.teamScore).toBe(0);
    });
  });

  describe("determineResult", () => {
    it("returns W when team leads", () => {
      expect(determineResult(10, 5)).toBe("W");
    });
    it("returns L when opponent leads", () => {
      expect(determineResult(5, 10)).toBe("L");
    });
    it("returns D when scores are tied", () => {
      expect(determineResult(10, 10)).toBe("D");
    });
  });

  describe("calculateGameResultFromStats", () => {
    it("calculates both scores and result", () => {
      const stats = [
        { type: "MAKE", points: 2, playerId: "p1" },
        { type: "MAKE", points: 3, playerId: "OPPONENT" },
      ];
      const result = calculateGameResultFromStats(stats);
      expect(result).toEqual({
        teamScore: 2,
        oppScore: 3,
        result: "L",
      });
    });
  });
});
