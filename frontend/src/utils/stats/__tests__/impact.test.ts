/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  calculateOnOffStats,
  calculateMatchupStats,
  calculatePlayerStreaks,
  calculateStopsAndKills,
  calculateIndividualDefensiveBreakdown,
} from "../impact";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("impact analytics", () => {
  const players = [
    { id: "p1", name: "Player 1" },
    { id: "p2", name: "Player 2" },
  ];

  describe("calculateOnOffStats", () => {
    it("should calculate correct on/off ratings", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 500,
          timestamp: "2026-01-01T00:00:01Z",
          synced: 1,
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 400,
          timestamp: "2026-01-01T00:00:02Z",
          synced: 1,
        },
        {
          id: "s4",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          period: 1,
          clockTime: 300,
          timestamp: "2026-01-01T00:00:03Z",
          synced: 1,
        },
        {
          id: "s5",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 200,
          timestamp: "2026-01-01T00:00:04Z",
          synced: 1,
        },
      ];

      const result = calculateOnOffStats(stats, players);
      const p1Stats = result.find((r) => r.playerId === "p1")!;

      // P1 was on for s2 (2 pts) and s3 (3 pts). Total 5 pts.
      // P1 was off for s5 (2 pts).
      expect(p1Stats.on.ptsFor).toBe(5);
      expect(p1Stats.off.ptsFor).toBe(2);
    });

    it("should handle field goals and turnovers for on/off", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 500,
          timestamp: "2026-01-01T00:00:01Z",
          synced: 1,
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          clockTime: 400,
          timestamp: "2026-01-01T00:00:02Z",
          synced: 1,
        },
      ];
      const result = calculateOnOffStats(stats, players);
      const p1Stats = result.find((r) => r.playerId === "p1")!;
      // P1 made a 2pt shot (FGA=1, Make=1) and had a turnover (TO=1)
      // Possessions = FGA + 0.44*FTA + TO - OREB = 1 + 0 + 1 - 0 = 2
      expect(p1Stats.on.possessions).toBe(2);
    });
  });

  describe("calculateMatchupStats", () => {
    it("should track points allowed by defender", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
      ];

      const result = calculateMatchupStats(stats, players, new Map());
      const matchup = result.find((r) => r.defenderId === "p1");

      expect(matchup).toBeDefined();
      expect(matchup?.pointsAllowed).toBe(2);
      expect(matchup?.totalPossessions).toBe(1);
    });

    it("should track stops on turnovers", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          primaryDefenderId: "p2",
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
      ];

      const result = calculateMatchupStats(stats, players, new Map());
      const matchup = result.find((r) => r.defenderId === "p2");

      expect(matchup).toBeDefined();
      expect(matchup?.stops).toBe(1);
      expect(matchup?.stopPct).toBe("100.0");
    });

    it("should handle defensive rebound as a stop in matchup stats", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          primaryDefenderId: "p1",
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          period: 1,
          clockTime: 590,
          timestamp: "2026-01-01T00:00:01Z",
          synced: 1,
        },
      ];

      const result = calculateMatchupStats(stats, players, new Map());
      const matchup = result.find((r) => r.defenderId === "p1");
      expect(matchup?.stops).toBe(1);
    });
  });

  describe("calculateIndividualDefensiveBreakdown", () => {
    it("should calculate breakdown for defenders", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          breakdownReason: "Middle-Drive",
          period: 1,
          timestamp: "1",
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          primaryDefenderId: "p1",
          breakdownReason: "Middle-Drive",
          period: 1,
          timestamp: "2",
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p2",
          breakdownReason: "Baseline-Leak",
          period: 1,
          timestamp: "3",
        },
      ];
      const jerseyMap = new Map([
        ["p1", "10"],
        ["p2", "20"],
      ]);
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        [
          { id: "p1", name: "Player 1" } as any,
          { id: "p2", name: "Player 2" } as any,
        ],
        jerseyMap,
      );

      expect(result).toHaveLength(2);
      const p1Data = result.find((r) => r.playerId === "p1")!;
      expect(p1Data.pointsAllowed).toBe(5);
      expect(p1Data.primaryReason).toBe("Middle-Drive");
      expect(p1Data.breakdowns).toContainEqual({
        reason: "Middle-Drive",
        points: 5,
        frequency: 2,
      });

      const p2Data = result.find((r) => r.playerId === "p2")!;
      expect(p2Data.pointsAllowed).toBe(2);
    });

    it("handles missing breakdown reason", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          primaryDefenderId: "p1",
          period: 1,
          timestamp: "1",
        },
      ];
      const result = calculateIndividualDefensiveBreakdown(
        stats,
        [{ id: "p1", name: "Player 1" } as any],
        new Map(),
      );
      expect(result[0].primaryReason).toBe("No Reason Logged");
    });
  });

  describe("calculatePlayerStreaks", () => {
    it("should identify HOT players", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 500,
          timestamp: "2026-01-01T00:00:01Z",
          synced: 1,
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 400,
          timestamp: "2026-01-01T00:00:02Z",
          synced: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });

    it("should identify COLD players", () => {
      const stats: StatEvent[] = [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          period: 1,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
          synced: 1,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          period: 1,
          clockTime: 500,
          timestamp: "2026-01-01T00:00:01Z",
          synced: 1,
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          period: 1,
          clockTime: 400,
          timestamp: "2026-01-01T00:00:02Z",
          synced: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("COLD");
    });
  });

  describe("calculateStopsAndKills", () => {
    it("should track stops and kills", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "3",
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(1);
    });

    it("should reset streak on opponent make", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "4",
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(0);
      expect(result.currentStreak).toBe(1);
    });

    it("should count defensive rebound as a stop", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          period: 1,
          timestamp: "2",
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
      expect(result.currentStreak).toBe(1);
    });

    it("should reset streak on technical foul", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          period: 1,
          timestamp: "2",
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
      expect(result.currentStreak).toBe(0);
    });
  });
});
