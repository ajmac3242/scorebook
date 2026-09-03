import { describe, it, expect } from "vitest";
import {
  calculatePlayerAggregates,
  calculateStopsAndKills,
  isEventInPeriod,
} from "./stats";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout Audit: Quality Fixes", () => {
  const mockPlayers: Player[] = [
    { id: "p1", name: "Player 1" },
    { id: "p2", name: "Player 2" },
  ];

  describe("Free Throw Tracking", () => {
    it("correctly tracks FTM and FT% for players", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1, // FT Make
          timestamp: "1000",
          period: 1,
          clockTime: 500,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1, // FT Miss
          timestamp: "2000",
          period: 1,
          clockTime: 490,
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2, // FG Make
          timestamp: "3000",
          period: 1,
          clockTime: 480,
        },
      ];

      const aggregates = calculatePlayerAggregates(mockPlayers, stats);
      const p1 = aggregates.find((a) => a.id === "p1");

      expect(p1?.ftm).toBe(1);
      expect(p1?.fta).toBe(2);
      expect(p1?.ftPct).toBe("50.0");
      expect(p1?.makes).toBe(1); // Only FG makes
      expect(p1?.attempts).toBe(1); // Only FG attempts
      expect(p1?.points).toBe(3);
    });
  });

  describe("Defensive Momentum (Stops/Kills)", () => {
    it("resets stop streak when defensive team commits a foul", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1000",
          period: 1,
        }, // Stop 1
        {
          id: "2",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2000",
          period: 1,
        }, // Stop 2 -> Kill 1 (if 3 stops), but here streak = 2
        {
          id: "3",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2500",
          period: 1,
        }, // Stop 3 -> Kill 1, streak = 0
        {
          id: "4",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          timestamp: "2800",
          period: 1,
        }, // Opponent is in possession
        {
          id: "5",
          gameId: "g1",
          playerId: "p1", // Our player
          type: ACTION_TYPES.FOUL,
          timestamp: "3000",
          period: 1,
        }, // Defensive Foul - should reset streak
        {
          id: "6",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "4000",
          period: 1,
        }, // Stop 4 (but streak was reset, so no second Kill)
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(4);
      expect(result.totalKills).toBe(1);
      expect(result.currentStreak).toBe(1);
    });

    it("resets streak on technical fouls", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1000",
          period: 1,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          timestamp: "2000",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.currentStreak).toBe(0);
    });
  });

  describe("Team Foul types", () => {
    it("isEventInPeriod works correctly for Quarters", () => {
      expect(isEventInPeriod(1, 1, "QUARTERS")).toBe(true);
      expect(isEventInPeriod(2, 1, "QUARTERS")).toBe(false);
    });

    it("groups overtime periods with P4 in QUARTERS mode for bonus purposes", () => {
      // In many rulesets, OT is a continuation of P4 for team fouls.
      expect(isEventInPeriod(4, 4, "QUARTERS")).toBe(true);
      expect(isEventInPeriod(4, 5, "QUARTERS")).toBe(true); // P4 foul carries into OT1 (P5)
      expect(isEventInPeriod(4, 6, "QUARTERS")).toBe(true); // P4 foul carries into OT2 (P6)
    });

    it("isEventInPeriod works correctly for Halves", () => {
      expect(isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(isEventInPeriod(2, 2, "HALVES")).toBe(true);
      expect(isEventInPeriod(1, 2, "HALVES")).toBe(false); // 2nd half resets 1st half fouls
      expect(isEventInPeriod(3, 2, "HALVES")).toBe(false); // second half hasn't started yet
      expect(isEventInPeriod(2, 3, "HALVES")).toBe(true); // OT in halves carries over 2nd half fouls (Period 2)
    });
  });

  describe("Cross-Period Minutes Calculation", () => {
    it("accounts for full minutes when periods are skipped in the event stream", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1000",
        },
        // No events in P2
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 3,
          clockTime: 300,
          timestamp: "3000",
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 0,
          period: 3,
          timestamp: "4000",
        },
      ];

      // P1: 10 mins, P2: 10 mins, P3: 10 mins = 30 mins total
      const aggregates = calculatePlayerAggregates(
        mockPlayers,
        stats,
        [],
        "total",
        {
          periodLength: 10,
        },
      );
      const p1 = aggregates.find((a) => a.id === "p1");
      expect(p1?.min).toBe(30); // 10 (P1) + 10 (P2) + 10 (P3) = 30
    });
  });

  describe("Defensive Momentum (Stops/Kills) Edge Cases", () => {
    it("does NOT reset stop streak on offensive fouls", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1000",
          period: 1,
        }, // Stop 1
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          timestamp: "2000",
          period: 1,
        }, // Offensive Foul (not in opponent possession) - should NOT reset streak
        {
          id: "3",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3000",
          period: 1,
        }, // Stop 2
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(2);
      expect(result.currentStreak).toBe(2);
    });

    it("resets streak on fouls committed during opponent possession", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          timestamp: "1000",
          period: 1,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          timestamp: "2000",
          period: 1,
        }, // Defensive Foul - resets streak
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.currentStreak).toBe(0);
    });
  });
});
