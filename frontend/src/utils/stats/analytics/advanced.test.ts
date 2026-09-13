import { describe, expect, it } from "vitest";
import {
  ACTION_TYPES,
  SHOT_QUALITY,
  SPECIAL_PLAYER_IDS,
} from "../../../constants/stats";
import { StatEvent } from "../../../db";
import {
  calculateSparkPlugIndex,
  calculateScoreFlow,
  calculateXPts,
  calculateShotROI,
  calculatePaintTouchStats,
  calculateAssistNetwork,
} from "./advanced";

describe("advanced analytics calculations", () => {
  describe("calculateSparkPlugIndex", () => {
    it("computes hustle stats and momentum scores correctly", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.FLOOR_DIVE,
          period: 1,
          clockTime: 500, // elapsed = 100s
        },
        {
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.CHARGE_TAKEN,
          period: 1,
          clockTime: 450, // elapsed = 150s
        },
        // Scoring event within 120s of floor dive (at elapsed 180s)
        {
          id: "3",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 420, // elapsed = 180s
        },
        // Scoring event outside 120s of floor dive (at elapsed 300s)
        {
          id: "4",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 300, // elapsed = 300s
        },
        // Deleted hustle event should be ignored
        {
          id: "5",
          playerId: "p1",
          type: ACTION_TYPES.GREAT_CONTEST,
          period: 1,
          clockTime: 400,
          deletedAt: "2026-01-01",
        },
        // Opponent make should not add to team momentum
        {
          id: "6",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 480,
        },
      ];

      const sparkPlugs = calculateSparkPlugIndex(stats as StatEvent[], 10);
      expect(sparkPlugs).toHaveLength(1);
      expect(sparkPlugs[0].playerId).toBe("p1");
      expect(sparkPlugs[0].hustleStats).toBe(2);
      // For p1: floor dive (hTime=100, window 100..220) captures make at 180 (3 pts).
      // Charge taken (hTime=150, window 150..270) captures make at 180 (3 pts).
      // Total momentum = 3 + 3 = 6.
      // Composite = round(2 * 2 + 6 / 2) = round(4 + 3) = 7.
      expect(sparkPlugs[0].momentumScore).toBe(6);
      expect(sparkPlugs[0].compositeIndex).toBe(7);
    });

    it("returns an empty array when no hustle events occur", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 500,
        },
      ];
      expect(calculateSparkPlugIndex(stats as StatEvent[])).toEqual([]);
    });
  });

  describe("calculateScoreFlow", () => {
    it("tracks score progression, possession stats, and lineup changes", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "s1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
        },
        {
          id: "s2",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
        },
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 550,
        },
        {
          id: "2",
          playerId: `${SPECIAL_PLAYER_IDS.OPPONENT}:10`,
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 500,
        },
        {
          id: "s3",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          period: 1,
          clockTime: 450,
        },
        {
          id: "3",
          playerId: "p2",
          type: ACTION_TYPES.TIMEOUT,
          period: 1,
          clockTime: 400,
        },
        {
          id: "4",
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          points: 1,
          period: 1,
          clockTime: 350,
        },
        {
          id: "5",
          playerId: `${SPECIAL_PLAYER_IDS.OPPONENT}:10`,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          clockTime: 300,
        },
        {
          id: "6",
          playerId: "p2",
          type: ACTION_TYPES.OFF_REBOUND,
          period: 1,
          clockTime: 290,
        },
      ];

      const flow = calculateScoreFlow(stats as StatEvent[], 10);
      expect(flow.length).toBeGreaterThanOrEqual(4);
      expect(flow[0]).toEqual({
        time: "00:00",
        Team: 0,
        Opponent: 0,
        Spread: 0,
      });

      const p1MakePoint = flow.find((p) => p.event === "2PT MAKE");
      expect(p1MakePoint).toBeDefined();
      expect(p1MakePoint?.Team).toBe(2);
      expect(p1MakePoint?.lineup).toContain("p1");
      expect(p1MakePoint?.lineup).toContain("p2");

      const timeoutPoint = flow.find((p) => p.event === ACTION_TYPES.TIMEOUT);
      expect(timeoutPoint).toBeDefined();
      expect(timeoutPoint?.lineup).not.toContain("p1");
      expect(timeoutPoint?.lineup).toContain("p2");
    });
  });

  describe("calculateXPts", () => {
    it("returns 0 for inactive stats or non-field-goal/FT events", () => {
      const inactiveStat: Partial<StatEvent> = {
        deletedAt: "2026-01-01",
        type: ACTION_TYPES.MAKE,
        points: 2,
      };
      const turnoverStat: Partial<StatEvent> = {
        type: ACTION_TYPES.TURNOVER,
      };
      expect(calculateXPts(inactiveStat as StatEvent)).toBe(0);
      expect(calculateXPts(turnoverStat as StatEvent)).toBe(0);
    });

    it("returns 0.75 for free throw attempts", () => {
      const ftStat: Partial<StatEvent> = {
        type: ACTION_TYPES.MAKE,
        points: 1,
      };
      expect(calculateXPts(ftStat as StatEvent)).toBe(0.75);
    });

    it("calculates expected points based on shot zone and shot quality", () => {
      const paintOpen: Partial<StatEvent> = {
        type: ACTION_TYPES.MAKE,
        points: 2,
        locationX: 50,
        locationY: 10,
        shotQuality: SHOT_QUALITY.OPEN,
      };
      const corner3Contested: Partial<StatEvent> = {
        type: ACTION_TYPES.MISS,
        points: 3,
        locationX: 5,
        locationY: 5,
        shotQuality: SHOT_QUALITY.CONTESTED,
      };

      expect(calculateXPts(paintOpen as StatEvent)).toBeGreaterThan(0);
      expect(calculateXPts(corner3Contested as StatEvent)).toBeGreaterThan(0);
    });
  });

  describe("calculateShotROI", () => {
    it("calculates ROI and average XPts across team field goal attempts", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          locationX: 5,
          locationY: 5,
          shotQuality: SHOT_QUALITY.OPEN,
        },
        {
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          locationX: 50,
          locationY: 10,
          shotQuality: SHOT_QUALITY.CONTESTED,
        },
        // Opponent shot should be ignored
        {
          id: "3",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          locationX: 50,
          locationY: 10,
        },
      ];

      const roiResult = calculateShotROI(stats as StatEvent[]);
      expect(roiResult.totalPoints).toBe(3);
      expect(Number(roiResult.totalXPts)).toBeGreaterThan(0);
      expect(roiResult.roi).toBeDefined();
      expect(roiResult.avgXPts).toBeDefined();
    });

    it("handles zero field goal attempts safely", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
        },
      ];

      const roiResult = calculateShotROI(stats as StatEvent[]);
      expect(roiResult).toEqual({
        roi: "0.00",
        avgXPts: "0.00",
        totalXPts: "0.0",
        totalPoints: 0,
      });
    });
  });

  describe("calculatePaintTouchStats", () => {
    it("tracks paint touches and subsequent scoring within 15 seconds", () => {
      const stats: Partial<StatEvent>[] = [
        {
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 300,
        },
        {
          id: "2",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 290, // 10s after paint touch
        },
        {
          id: "3",
          playerId: "p1",
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 200,
        },
        {
          id: "4",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER, // Breaks possession before score
          period: 1,
          clockTime: 195,
        },
        {
          id: "5",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 190,
        },
      ];

      const result = calculatePaintTouchStats(stats as StatEvent[]);
      expect(result.total).toBe(2);
      expect(result.pppt).toBe("1.00");
    });

    it("returns 0.00 pppt when no paint touches occur", () => {
      const result = calculatePaintTouchStats([]);
      expect(result).toEqual({ total: 0, pppt: "0.00" });
    });
  });

  describe("calculateAssistNetwork", () => {
    it("builds playmaker network and identifies top passers and finishers", () => {
      const timestamp = 1700000000;
      const stats: Partial<StatEvent>[] = [
        {
          id: "a1",
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
          timestamp,
        },
        {
          id: "m1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp,
        },
        {
          id: "a2",
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
          timestamp: timestamp + 10,
        },
        {
          id: "m2",
          playerId: "p3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: timestamp + 10,
        },
      ];

      const network = calculateAssistNetwork(stats as StatEvent[]);
      expect(network.nodes).toHaveLength(3);
      expect(network.edges).toHaveLength(2);

      expect(network.primaryPlaymakerId).toBe("p1");
      expect(network.primaryFinisherId).toBe("p2");

      const p1Node = network.nodes.find((n) => n.playerId === "p1");
      expect(p1Node?.assists).toBe(2);
      expect(p1Node?.pointsGenerated).toBe(5);

      const edgeP1P2 = network.edges.find(
        (e) => e.passerId === "p1" && e.finisherId === "p2",
      );
      expect(edgeP1P2?.count).toBe(1);
      expect(edgeP1P2?.points).toBe(3);
    });

    it("returns null primary IDs when no assisted field goals exist", () => {
      const network = calculateAssistNetwork([]);
      expect(network.nodes).toEqual([]);
      expect(network.edges).toEqual([]);
      expect(network.primaryPlaymakerId).toBeNull();
      expect(network.primaryFinisherId).toBeNull();
    });
  });
});
