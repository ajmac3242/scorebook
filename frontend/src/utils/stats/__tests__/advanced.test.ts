import { describe, it, expect } from "vitest";
import {
  calculateSparkPlugIndex,
  calculateScoreFlow,
  calculateXPts,
  calculateShotROI,
  calculatePaintTouchStats,
  calculateAssistNetwork,
} from "../analytics/advanced";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("advanced analytics", () => {
  describe("calculateSparkPlugIndex", () => {
    it("should calculate composite index based on hustle and momentum", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.FLOOR_DIVE, period: 1, clockTime: 500, timestamp: "1" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, clockTime: 400, timestamp: "2" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.MAKE, points: 3, period: 1, clockTime: 450, timestamp: "3" },
      ];
      const result = calculateSparkPlugIndex(stats);
      const p1 = result.find(r => r.playerId === "p1")!;
      expect(p1.hustleStats).toBe(1);
      // P2 scored 3pts within 120s of P1's hustle. P1 also scored 2pts. Total momentum = 5.
      expect(p1.momentumScore).toBe(5);
      // Math.round(1 * 2 + 5 / 2) = Math.round(2 + 2.5) = 5
      expect(p1.compositeIndex).toBe(5);
    });
  });

  describe("calculateScoreFlow", () => {
    it("should generate timeline of scores and spread", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, clockTime: 550, timestamp: "1" },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MAKE, points: 3, period: 1, clockTime: 500, timestamp: "2" },
      ];
      const result = calculateScoreFlow(stats);
      expect(result).toHaveLength(3); // Start + 2 makes
      expect(result[1].Team).toBe(2);
      expect(result[1].Spread).toBe(2);
      expect(result[2].Opponent).toBe(3);
      expect(result[2].Spread).toBe(-1);
    });
  });

  describe("calculateXPts", () => {
    it("returns expected points based on zone and quality", () => {
      const stat: StatEvent = { gameId: "g1", playerId: "p1", period: 1,
        type: ACTION_TYPES.MAKE,
        locationX: 50, // RA
        locationY: 10,
        shotQuality: "OPEN",
        timestamp: "1",
      };
      // RA OPEN = 1.65
      expect(calculateXPts(stat)).toBe(1.65);
    });

    it("returns 0.75 for free throws", () => {
      const stat: StatEvent = { gameId: "g1", playerId: "p1", period: 1,  type: ACTION_TYPES.MAKE, points: 1, timestamp: "1" };
      expect(calculateXPts(stat)).toBe(0.75);
    });
  });

  describe("calculateShotROI", () => {
    it("calculates ROI comparing actual points to expected", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", period: 1, type: ACTION_TYPES.MAKE, points: 2, locationX: 50, locationY: 10, shotQuality: "OPEN", timestamp: "1" }, // xPts = 1.65
      ];
      const result = calculateShotROI(stats);
      // roi = 2 / 1.65 - 1 = 1.212 - 1 = 0.21
      expect(result.roi).toBe("0.21");
      expect(result.totalPoints).toBe(2);
      expect(result.totalXPts).toBe("1.6"); // 1.65 .toFixed(1) is 1.6 (even rounding)
    });
  });

  describe("calculatePaintTouchStats", () => {
    it("tracks points scored after a paint touch", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.PAINT_TOUCH, period: 1, clockTime: 600, timestamp: "1" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, clockTime: 590, timestamp: "2" },
      ];
      const result = calculatePaintTouchStats(stats);
      expect(result.total).toBe(1);
      expect(result.pppt).toBe("2.00");
    });
  });

  describe("calculateAssistNetwork", () => {
    it("builds network of passers and finishers", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", period: 1, type: ACTION_TYPES.ASSIST, timestamp: "1" },
        { gameId: "g1", playerId: "p2", period: 1, type: ACTION_TYPES.MAKE, points: 2, timestamp: "1" },
      ];
      const result = calculateAssistNetwork(stats);
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.primaryPlaymakerId).toBe("p1");
      expect(result.primaryFinisherId).toBe("p2");
    });
  });
});
