import { describe, it, expect } from "vitest";
import {
  calculatePlayerStreaks,
  calculateStopsAndKills,
  calculateOnOffStats,
  calculateMatchupStats,
  calculateIndividualDefensiveBreakdown,
} from "../impact";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { buildGameEvent, buildPlayer } from "../../../test-factories";

describe("impact analytics", () => {
  describe("calculatePlayerStreaks", () => {
    it("should identify HOT and COLD streaks", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "6",
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:06Z",
        }),
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
      expect(result.get("p2")).toBe("COLD");
    });

    it("should handle mixed results and game resets", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g2",
          timestamp: "2026-01-01T00:01:01Z",
        }),
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBeNull();
    });

    it("handles shift when history length > 3", () => {
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "3",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "4",
        }),
      ];
      // History should be [MAKE, MISS, MAKE] -> null streak
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBeNull();
    });

    it("ignores free throws and handles game resets", () => {
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          gameId: "g1",
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "3",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          gameId: "g1",
          timestamp: "4",
        }),
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });
  });

  describe("calculateStopsAndKills", () => {
    it("should track stops and identify kills", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "2026-01-01T00:00:02Z",
        }), // Stop 1
        buildGameEvent({
          id: "3",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2026-01-01T00:00:03Z",
        }), // Stop 2
        buildGameEvent({
          id: "4",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
          timestamp: "2026-01-01T00:00:05Z",
        }), // Stop 3 -> Kill
        buildGameEvent({
          id: "6",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "2026-01-01T00:00:06Z",
        }),
        buildGameEvent({
          id: "7",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          timestamp: "2026-01-01T00:00:07Z",
        }),
        buildGameEvent({
          id: "8",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          timestamp: "2026-01-01T00:00:08Z",
        }),
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(1);
    });

    it("should handle possession transitions correctly", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.REBOUND,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "6",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "2026-01-01T00:00:06Z",
        }), // Stop
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
    });

    it("resets currentStreak on technical foul regardless of possession", () => {
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
        }),
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalKills).toBe(0);
    });

    it("handles game resets and our turnovers", () => {
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          gameId: "g1",
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          gameId: "g1",
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          gameId: "g1",
          timestamp: "3",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          gameId: "g1",
          timestamp: "4",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          gameId: "g2",
          timestamp: "5",
        }),
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(4);
      expect(result.totalKills).toBe(1);
    });

    it("handles opponent rebounds and makes resetting our possession", () => {
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.REBOUND,
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "4",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "5",
        }),
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(0);
    });
  });

  describe("calculateOnOffStats", () => {
    it("should calculate on/off ratings", () => {
      const players = [buildPlayer({ id: "p1", name: "Player 1" })];
      const stats = [
        buildGameEvent({
          id: "s1",
          type: ACTION_TYPES.SUB_IN,
          playerId: "p1",
          clockTime: 600,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "m1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "p1",
          clockTime: 500,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "o1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          clockTime: 450,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "s2",
          type: ACTION_TYPES.SUB_OUT,
          playerId: "p1",
          clockTime: 400,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "m2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: "p2",
          clockTime: 300,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "t1",
          type: ACTION_TYPES.TURNOVER,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:06Z",
        }),
        buildGameEvent({
          id: "r1",
          type: ACTION_TYPES.OFF_REBOUND,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:07Z",
        }),
        buildGameEvent({
          id: "f1",
          type: ACTION_TYPES.MISS,
          points: 1,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:08Z",
        }), // Team FTA
        buildGameEvent({
          id: "f2",
          type: ACTION_TYPES.MISS,
          points: 1,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          timestamp: "2026-01-01T00:00:09Z",
        }), // Opp FTA
      ];
      const result = calculateOnOffStats(stats, players as any);
      const p1 = result.find((r) => r.playerId === "p1");
      expect(p1?.on.ptsFor).toBe(2);
      expect(p1?.on.ptsAgainst).toBe(2);
      expect(p1?.off.ptsFor).toBe(3);
    });

    it("handles inactive and various event types for off stats", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "3",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "4",
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "5",
          deletedAt: "now",
        }),
      ];
      const result = calculateOnOffStats(stats, players);
      expect(result[0].off.possessions).toBeGreaterThan(0);
    });
  });

  describe("calculateMatchupStats", () => {
    it("should track points allowed per matchup", () => {
      const players = [{ id: "p1", name: "P1" }];
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT;
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: oppId,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: oppId,
          type: ACTION_TYPES.TURNOVER,
          primaryDefenderId: "p1",
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          playerId: oppId,
          type: ACTION_TYPES.MISS,
          primaryDefenderId: "p1",
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "2026-01-01T00:00:04Z",
        }),
      ];
      const result = calculateMatchupStats(stats, players, new Map());
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].pointsAllowed).toBe(2);
      expect(result[0].stops).toBe(2);
    });

    it("handles matchups with no colon in opponent ID and missing defenders", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "unknown",
          timestamp: "1",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          timestamp: "2",
        }),
      ];
      const result = calculateMatchupStats(stats, players, new Map());
      expect(
        result.find(
          (m) => m.opponentId === SPECIAL_PLAYER_IDS.OPPONENT + ":10",
        ),
      ).toBeDefined();
    });
  });

  describe("calculateIndividualDefensiveBreakdown", () => {
    it("should aggregate points by breakdown reason", () => {
      const players = [buildPlayer({ id: "p1", name: "P1" })];
      const jerseyMap = new Map([["p1", "10"]]);
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          primaryDefenderId: "p1",
          breakdownReason: "Poor Closeout",
        }),
        buildGameEvent({
          id: "2",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p2", // Unknown player
        }),
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players as any,
        jerseyMap,
      );
      expect(result).toHaveLength(1);
      expect(result[0].pointsAllowed).toBe(3);
    });

    it("should handle multiple reasons and sort by points, plus default reason", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          breakdownReason: "Reason A",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          primaryDefenderId: "p1",
          breakdownReason: "Reason B",
        }),
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players as any,
        new Map(),
      );
      expect(result[0].primaryReason).toBe("Reason B");
    });

    it("uses default reason if breakdownReason is missing", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
        }),
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players as any,
        new Map(),
      );
      expect(result[0].primaryReason).toBe("No Reason Logged");
    });

    it("handles inactive stats", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          deletedAt: "2026-01-01T00:00:00Z",
        }),
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players as any,
        new Map(),
      );
      expect(result).toHaveLength(0);
    });

    it("handles missing primaryReason (N/A fallback)", () => {
      const players = [{ id: "p1", name: "P1" }];
      const result = calculateIndividualDefensiveBreakdown(
        [],
        players as any,
        new Map(),
      );
      expect(result).toHaveLength(0);
    });

    it("handles multiple makes for same reason", () => {
      const players = [{ id: "p1", name: "P1" }];
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          breakdownReason: "Reason A",
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          breakdownReason: "Reason A",
        }),
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players as any,
        new Map(),
      );
      expect(result[0].breakdowns[0].frequency).toBe(2);
    });
  });
});
