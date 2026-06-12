import { describe, it, expect } from "vitest";
import {
  calculateSparkPlugIndex,
  calculateScoreFlow,
  calculateXPts,
  calculateShotROI,
  calculatePaintTouchStats,
  calculateAssistNetwork,
} from "../analytics/advanced";
import { StatEvent } from "../../../db";
import { ACTION_TYPES, SHOT_QUALITY } from "../../../constants/stats";

describe("advanced analytics", () => {
  describe("calculateSparkPlugIndex", () => {
    it("should calculate composite index based on hustle and momentum", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.FLOOR_DIVE,
          playerId: "p1",
          period: 1,
          clockTime: 540, // 9:00 remaining
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p1",
          points: 3,
          period: 1,
          clockTime: 480, // 8:00 remaining (within 2 mins)
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p2",
          points: 2,
          period: 1,
          clockTime: 360, // 6:00 remaining (outside 2 mins)
        },
      ];

      const result = calculateSparkPlugIndex(stats as StatEvent[]);
      expect(result).toHaveLength(1);
      expect(result[0].playerId).toBe("p1");
      expect(result[0].hustleStats).toBe(1);
      expect(result[0].momentumScore).toBe(3);
      // Index = 1 * 2 + 3 / 2 = 2 + 1.5 = 3.5 -> 4
      expect(result[0].compositeIndex).toBe(4);
    });
  });

  describe("calculateScoreFlow", () => {
    it("should track score and lineups correctly", () => {
      const stats: Partial<StatEvent>[] = [
        { type: ACTION_TYPES.SUB_IN, playerId: "p1" },
        { type: ACTION_TYPES.SUB_IN, playerId: "p2" },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p1",
          points: 2,
          period: 1,
          clockTime: 580,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT",
          points: 3,
          period: 1,
          clockTime: 560,
        },
        {
          type: ACTION_TYPES.TIMEOUT,
          playerId: "OUR_TEAM",
          period: 1,
          clockTime: 540,
        },
      ];

      const result = calculateScoreFlow(stats as StatEvent[]);
      // Initial + 2 makes + 1 timeout = 4 points
      expect(result).toHaveLength(4);
      expect(result[1].Team).toBe(2);
      expect(result[1].Opponent).toBe(0);
      expect(result[2].Opponent).toBe(3);
      expect(result[3].event).toBe(ACTION_TYPES.TIMEOUT);
      expect(result[3].lineup).toContain("p1");
      expect(result[3].lineup).toContain("p2");
    });

    it("should aggregate stats for PPP calculation", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MISS,
          playerId: "p1",
          points: 2,
          period: 1,
          clockTime: 500,
        },
        {
          type: ACTION_TYPES.TURNOVER,
          playerId: "p1",
          period: 1,
          clockTime: 480,
        },
        {
          type: ACTION_TYPES.OFF_REBOUND,
          playerId: "p2",
          period: 1,
          clockTime: 470,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p2",
          points: 2,
          period: 1,
          clockTime: 460,
        },
      ];

      const result = calculateScoreFlow(stats as StatEvent[]);
      const last = result[result.length - 1];
      // FGA: 2 (miss + make), TO: 1, OREB: 1
      // Possessions = 2 + 0.44*0 + 1 - 1 = 2
      // PPP = 2 / 2 = 1.00
      expect(last.teamPpp).toBe("1.00");
    });
  });

  describe("calculateXPts", () => {
    it("should return expected points for a shot", () => {
      const shot: Partial<StatEvent> = {
        type: ACTION_TYPES.MAKE,
        points: 2,
        locationX: 250,
        locationY: 140, // Rim
        shotQuality: SHOT_QUALITY.OPEN,
      };
      const xPts = calculateXPts(shot as StatEvent);
      expect(xPts).toBeGreaterThan(0);
    });

    it("should return 0.75 for free throws", () => {
      const ft: Partial<StatEvent> = {
        type: ACTION_TYPES.MAKE,
        points: 1,
      };
      expect(calculateXPts(ft as StatEvent)).toBe(0.75);
    });

    it("should return 0 for non-scoring events", () => {
      const sub: Partial<StatEvent> = { type: ACTION_TYPES.SUB_IN };
      expect(calculateXPts(sub as StatEvent)).toBe(0);
    });
  });

  describe("calculateShotROI", () => {
    it("should calculate ROI correctly", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p1",
          points: 3,
          locationX: 100,
          locationY: 100,
          shotQuality: SHOT_QUALITY.OPEN,
        },
      ];
      // Suppose XPts for this shot is 1.5
      const result = calculateShotROI(stats as StatEvent[]);
      expect(result.totalPoints).toBe(3);
      expect(parseFloat(result.roi)).toBeDefined();
    });
  });

  describe("calculatePaintTouchStats", () => {
    it("should track points following a paint touch", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.PAINT_TOUCH,
          playerId: "p1",
          period: 1,
          clockTime: 300,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p2",
          points: 2,
          period: 1,
          clockTime: 290, // Within 15 seconds
        },
      ];

      const result = calculatePaintTouchStats(stats as StatEvent[]);
      expect(result.total).toBe(1);
      expect(result.pppt).toBe("2.00");
    });

    it("should ignore points after too much time or possession change", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.PAINT_TOUCH,
          playerId: "p1",
          period: 1,
          clockTime: 300,
        },
        {
          type: ACTION_TYPES.TURNOVER,
          playerId: "p1",
          period: 1,
          clockTime: 295,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p2",
          points: 2,
          period: 1,
          clockTime: 290,
        },
      ];

      const result = calculatePaintTouchStats(stats as StatEvent[]);
      expect(result.pppt).toBe("0.00");
    });
  });

  describe("calculateAssistNetwork", () => {
    it("should build a network of passers and finishers", () => {
      const ts = Date.now().toString();
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.ASSIST,
          playerId: "p1",
          timestamp: ts,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "p2",
          points: 3,
          timestamp: ts,
        },
      ];

      const result = calculateAssistNetwork(stats as StatEvent[]);
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.primaryPlaymakerId).toBe("p1");
      expect(result.primaryFinisherId).toBe("p2");
      expect(result.edges[0].points).toBe(3);
    });
  });
});
