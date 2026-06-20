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
import { XPTS_TABLE, ShotZone } from "../../shotZones";
import { buildGameEvent } from "../../../test-factories";

describe("advanced analytics", () => {
  describe("calculateSparkPlugIndex", () => {
    it("should calculate composite index based on hustle and momentum", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FLOOR_DIVE,
          period: 1,
          clockTime: 500,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 400,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 450,
          timestamp: "3",
        },
      ];
      const result = calculateSparkPlugIndex(stats);
      const p1 = result.find((r) => r.playerId === "p1")!;
      expect(p1.hustleStats).toBe(1);
      // P2 scored 3pts within 120s of P1's hustle. P1 also scored 2pts. Total momentum = 5.
      expect(p1.momentumScore).toBe(5);
      // Math.round(1 * 2 + 5 / 2) = Math.round(2 + 2.5) = 5
      expect(p1.compositeIndex).toBe(5);
    });

    it("should sort result by compositeIndex", () => {
      const stats = [
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.FLOOR_DIVE }),
        buildGameEvent({ playerId: "p2", type: ACTION_TYPES.FLOOR_DIVE }),
        buildGameEvent({ playerId: "p2", type: ACTION_TYPES.FLOOR_DIVE }),
      ];
      const result = calculateSparkPlugIndex(stats);
      expect(result[0].playerId).toBe("p2");
    });
  });

  describe("calculateScoreFlow", () => {
    it("should generate timeline of scores and spread", () => {
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 550,
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 500,
        }),
      ];
      const result = calculateScoreFlow(stats);
      expect(result).toHaveLength(3); // Start + 2 makes
      expect(result[1].Team).toBe(2);
      expect(result[1].Spread).toBe(2);
      expect(result[2].Opponent).toBe(3);
      expect(result[2].Spread).toBe(-1);
    });

    it("should handle FTA, TO, OREB for both sides", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT;
      const stats = [
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.MISS, points: 1 }), // FTA
        buildGameEvent({ playerId: oppId, type: ACTION_TYPES.MISS, points: 1 }), // Opp FTA
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.TURNOVER }),
        buildGameEvent({ playerId: oppId, type: ACTION_TYPES.TURNOVER }),
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.OFF_REBOUND }),
        buildGameEvent({ playerId: oppId, type: ACTION_TYPES.OFF_REBOUND }),
        buildGameEvent({ type: ACTION_TYPES.SUB_IN, playerId: "p2" }),
        buildGameEvent({ type: ACTION_TYPES.SUB_OUT, playerId: "p2" }),
        buildGameEvent({ type: ACTION_TYPES.TIMEOUT }),
      ];
      const result = calculateScoreFlow(stats);
      expect(result).toBeDefined();
    });
  });

  describe("calculateXPts", () => {
    const zoneCoords: Record<ShotZone, { x: number; y: number }> = {
      RA: { x: 50, y: 10 },
      PAINT: { x: 40, y: 20 },
      MID_LEFT: { x: 10, y: 20 },
      MID_CENTER: { x: 50, y: 50 },
      MID_RIGHT: { x: 90, y: 20 },
      "3PT_LEFT_CORNER": { x: 5, y: 10 },
      "3PT_RIGHT_CORNER": { x: 95, y: 10 },
      "3PT_LEFT": { x: 1, y: 80 },
      "3PT_CENTER": { x: 50, y: 90 },
      "3PT_RIGHT": { x: 99, y: 40 },
    };

    const testCases: [ShotZone, "OPEN" | "CONTESTED", number][] = [];
    (Object.keys(XPTS_TABLE) as ShotZone[]).forEach((zone) => {
      testCases.push([zone, "OPEN", XPTS_TABLE[zone].OPEN]);
      testCases.push([zone, "CONTESTED", XPTS_TABLE[zone].CONTESTED]);
    });

    it.each(testCases)(
      "returns expected points for %s %s",
      (zone, quality, expected) => {
        const { x, y } = zoneCoords[zone];
        const stat: StatEvent = {
          gameId: "g1",
          playerId: "p1",
          period: 1,
          type: ACTION_TYPES.MAKE,
          locationX: x,
          locationY: y,
          shotQuality: quality,
          timestamp: "1",
        };
        expect(calculateXPts(stat)).toBe(expected);
      },
    );

    it("returns 0.75 for free throws", () => {
      const stat = buildGameEvent({
        type: ACTION_TYPES.MAKE,
        points: 1,
      });
      expect(calculateXPts(stat)).toBe(0.75);
    });

    it("returns 0 for non-shot events or inactive", () => {
      expect(
        calculateXPts(buildGameEvent({ type: ACTION_TYPES.REBOUND })),
      ).toBe(0);
      expect(
        calculateXPts(
          buildGameEvent({ type: ACTION_TYPES.MAKE, deletedAt: "now" }),
        ),
      ).toBe(0);
    });

    it("handles missing shot quality by defaulting to CONTESTED", () => {
      const stat = buildGameEvent({
        type: ACTION_TYPES.MAKE,
        locationX: 50,
        locationY: 10,
        shotQuality: undefined,
      });
      // RA Contested is 1.25
      expect(calculateXPts(stat)).toBe(1.25);
    });
  });

  describe("calculateShotROI", () => {
    it("calculates ROI comparing actual points to expected", () => {
      const stats = [
        buildGameEvent({
          type: ACTION_TYPES.MAKE,
          points: 2,
          locationX: 50,
          locationY: 10,
          shotQuality: "OPEN",
        }), // xPts = 1.65
      ];
      const result = calculateShotROI(stats);
      // roi = 2 / 1.65 - 1 = 1.212 - 1 = 0.21
      expect(result.roi).toBe("0.21");
      expect(result.totalPoints).toBe(2);
      expect(result.totalXPts).toBe("1.6"); // 1.65 .toFixed(1) is 1.6 (even rounding)
    });

    it("skips opponent stats, inactive stats, and non-shots", () => {
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
        }),
        buildGameEvent({ type: ACTION_TYPES.MAKE, deletedAt: "now" }),
        buildGameEvent({ type: ACTION_TYPES.REBOUND }),
      ];
      const result = calculateShotROI(stats);
      expect(result.totalPoints).toBe(0);
    });
  });

  describe("calculatePaintTouchStats", () => {
    it("tracks points scored after a paint touch", () => {
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 600,
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 590,
        }),
      ];
      const result = calculatePaintTouchStats(stats);
      expect(result.total).toBe(1);
      expect(result.pppt).toBe("2.00");
    });

    it("stops searching after 15 seconds or period change or turnover", () => {
      const p1 = "p1";
      const stats = [
        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 600,
        }),
        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.MAKE,
          period: 1,
          clockTime: 580,
        }), // Too late (20s)

        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 500,
        }),
        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          clockTime: 495,
        }),
        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.MAKE,
          period: 1,
          clockTime: 490,
        }), // After TO

        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.PAINT_TOUCH,
          period: 1,
          clockTime: 400,
        }),
        buildGameEvent({
          playerId: p1,
          type: ACTION_TYPES.MAKE,
          period: 2,
          clockTime: 395,
        }), // Different period
      ];
      const result = calculatePaintTouchStats(stats);
      expect(result.total).toBe(3);
      expect(result.pppt).toBe("0.00");
    });
  });

  describe("calculateAssistNetwork", () => {
    it("builds network of passers and finishers", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          period: 1,
          type: ACTION_TYPES.ASSIST,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          period: 1,
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
        },
      ];
      const result = calculateAssistNetwork(stats);
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.primaryPlaymakerId).toBe("p1");
      expect(result.primaryFinisherId).toBe("p2");
    });

    it("handles 3pt assists and skips same-player assists", () => {
      const ts = new Date().toISOString();
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
          timestamp: ts,
        }),
        buildGameEvent({
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: ts,
        }),
        // Same player assist (should be skipped by logic)
        buildGameEvent({
          playerId: "p3",
          type: ACTION_TYPES.ASSIST,
          timestamp: ts + "1",
        }),
        buildGameEvent({
          playerId: "p3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: ts + "1",
        }),
      ];
      const result = calculateAssistNetwork(stats);
      const edge = result.edges.find((e) => e.passerId === "p1");
      expect(edge?.efg).toBeDefined();
      // p3 should not even be in nodes because they had no valid assists/assisted makes
      expect(result.nodes.find((n) => n.playerId === "p3")).toBeUndefined();
    });
  });
});
