import { describe, it, expect } from "vitest";
import {
  calculateSparkPlugIndex,
  calculateScoreFlow,
  calculateXPts,
  calculateShotROI,
  calculatePaintTouchStats,
  calculateAssistNetwork,
} from "./advanced";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("advanced analytics", () => {
  describe("calculateSparkPlugIndex", () => {
    it("calculates composite spark plug index for hustle events followed by scoring momentum", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          clockTime: 500, // 100 elapsed sec
          playerId: "p1",
          type: ACTION_TYPES.CHARGE_TAKEN,
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 450, // 150 elapsed sec (+50s)
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2",
        },
        // Inactive event
        {
          gameId: "g1",
          period: 1,
          clockTime: 400,
          playerId: "p1",
          type: ACTION_TYPES.FLOOR_DIVE,
          deletedAt: "2026-09-01T00:00:00Z",
          timestamp: "3",
        },
      ];

      const result = calculateSparkPlugIndex(stats, 10);
      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe("p1");
      expect(result[0].hustleStats).toBe(1);
      expect(result[0].momentumScore).toBe(3);
      expect(result[0].compositeIndex).toBe(4); // Math.round(1*2 + 3/2) = 4
    });

    it("returns empty array when no hustle events exist", () => {
      expect(calculateSparkPlugIndex([], 10)).toEqual([]);
    });
  });

  describe("calculateScoreFlow", () => {
    it("tracks score flow, lineups, and estimated PPP over time with opponent and team aggregations", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          clockTime: 600,
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 550,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 540,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 1, // FT miss for opponent
          timestamp: "3",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 530,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "4",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 520,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "5",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 500,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "6",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 450,
          playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
          type: ACTION_TYPES.TIMEOUT,
          timestamp: "7",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 400,
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          timestamp: "8",
        },
      ];

      const result = calculateScoreFlow(stats, 10);
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].time).toBe("00:00");
      expect(result[1].Team).toBe(2);
      expect(result[1].Opponent).toBe(0);
      expect(result[2].Opponent).toBe(3);
      expect(result[2].Spread).toBe(-1);
    });
  });

  describe("calculateXPts", () => {
    it("returns expected points for field goals and free throws based on location/quality", () => {
      const ftMake: StatEvent = {
        gameId: "g1",
        period: 1,
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 1,
        timestamp: "1",
      };
      expect(calculateXPts(ftMake)).toBe(0.75);

      const fgMake: StatEvent = {
        gameId: "g1",
        period: 1,
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        locationX: 50,
        locationY: 50, // Paint / Rim area
        shotQuality: "OPEN",
        timestamp: "2",
      };
      expect(calculateXPts(fgMake)).toBeGreaterThan(0);

      const nonShot: StatEvent = {
        gameId: "g1",
        period: 1,
        playerId: "p1",
        type: ACTION_TYPES.REBOUND,
        timestamp: "3",
      };
      expect(calculateXPts(nonShot)).toBe(0);
    });
  });

  describe("calculateShotROI", () => {
    it("calculates shot ROI and expected points per shot", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          locationX: 50,
          locationY: 250,
          shotQuality: "OPEN",
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 3,
          locationX: 50,
          locationY: 250,
          shotQuality: "CONTESTED",
          timestamp: "2",
        },
        // Opponent shot should be ignored
        {
          gameId: "g1",
          period: 1,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
        },
      ];

      const result = calculateShotROI(stats);
      expect(result.totalPoints).toBe(3);
      expect(parseFloat(result.totalXPts)).toBeGreaterThan(0);
    });

    it("handles empty stats gracefully", () => {
      const result = calculateShotROI([]);
      expect(result.roi).toBe("0.00");
      expect(result.totalPoints).toBe(0);
    });
  });

  describe("calculatePaintTouchStats", () => {
    it("calculates paint touch count and subsequent points per touch", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          clockTime: 500,
          playerId: "p1",
          type: ACTION_TYPES.PAINT_TOUCH,
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 495, // 5s later
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
        },
        // Second paint touch with timeDiff > 15s
        {
          gameId: "g1",
          period: 1,
          clockTime: 400,
          playerId: "p1",
          type: ACTION_TYPES.PAINT_TOUCH,
          timestamp: "3",
        },
        {
          gameId: "g1",
          period: 1,
          clockTime: 380, // 20s later
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "4",
        },
      ];

      const result = calculatePaintTouchStats(stats);
      expect(result.total).toBe(2);
      expect(result.pppt).toBe("1.00");
    });

    it("returns zero when no paint touches occur", () => {
      const result = calculatePaintTouchStats([]);
      expect(result.total).toBe(0);
      expect(result.pppt).toBe("0.00");
    });
  });

  describe("calculateAssistNetwork", () => {
    it("builds node and edge networks for assists and identifies primary playmaker/finisher", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          playerId: "passer1",
          type: ACTION_TYPES.ASSIST,
          timestamp: "100",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "finisher1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "100",
        },
        // Duplicate edge with 2pt make
        {
          gameId: "g1",
          period: 1,
          playerId: "passer1",
          type: ACTION_TYPES.ASSIST,
          timestamp: "200",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "finisher1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "200",
        },
      ];

      const result = calculateAssistNetwork(stats);
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].count).toBe(2);
      expect(result.edges[0].points).toBe(5);
      expect(result.edges[0].passerId).toBe("passer1");
      expect(result.edges[0].finisherId).toBe("finisher1");
      expect(result.primaryPlaymakerId).toBe("passer1");
      expect(result.primaryFinisherId).toBe("finisher1");
    });

    it("handles empty or unassisted stats cleanly", () => {
      const result = calculateAssistNetwork([]);
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.primaryPlaymakerId).toBeNull();
      expect(result.primaryFinisherId).toBeNull();
    });
  });
});
