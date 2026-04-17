import { describe, it, expect } from "vitest";
import {
  calculatePlayerAggregates,
  calculateStopsAndKills,
  isEventInPeriod
} from "./stats";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout Audit: Quality Fixes", () => {
  const mockPlayers: Player[] = [
    { id: "p1", name: "Player 1", teamId: "t1" },
    { id: "p2", name: "Player 2", teamId: "t1" },
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
          timestamp: 1000,
          period: 1,
          clockTime: 500,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1, // FT Miss
          timestamp: 2000,
          period: 1,
          clockTime: 490,
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2, // FG Make
          timestamp: 3000,
          period: 1,
          clockTime: 480,
        }
      ];

      const aggregates = calculatePlayerAggregates(mockPlayers, stats);
      const p1 = aggregates.find(a => a.id === "p1");

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
          timestamp: 1000,
        }, // Stop 1
        {
          id: "2",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: 2000,
        }, // Stop 2
        {
          id: "3",
          gameId: "g1",
          playerId: "p1", // Our player
          type: ACTION_TYPES.FOUL,
          timestamp: 3000,
        }, // Foul - should reset streak
        {
          id: "4",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: 4000,
        }, // Stop 3 (but streak was reset, so no Kill)
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(0);
      expect(result.currentStreak).toBe(1);
    });

    it("resets streak on technical fouls", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          timestamp: 1000,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          timestamp: 2000,
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

    it("isEventInPeriod works correctly for Halves", () => {
      expect(isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(isEventInPeriod(2, 2, "HALVES")).toBe(true);
      expect(isEventInPeriod(3, 2, "HALVES")).toBe(true); // OT in halves counts towards 2nd half fouls
    });
  });
});
