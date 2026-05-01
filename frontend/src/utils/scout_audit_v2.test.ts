import { describe, it, expect } from "vitest";
import {
  calculateOnOffStats,
  calculatePlayerAggregates,
  calculateStopsAndKills,
} from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout Audit V2 - Reproduction Tests", () => {
  describe("calculateOnOffStats Bug", () => {
    it("fails to calculate OFF stats correctly because totals are not updated", () => {
      const players: Player[] = [
        { id: "p1", name: "Player 1" },
        { id: "p2", name: "Player 2" },
      ];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "2023-01-01T10:00:00Z",
          period: 1,
        },
        // p2 is OFF. Our team scores 2 points.
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:01:00Z",
          period: 1,
        },
      ];

      const resultsArr = calculateOnOffStats(players, stats);
      const p2Stats = resultsArr.find((r) => r.playerId === "p2");

      // CURRENT BUG: totals.ptsFor is 0, so offPointsFor = 0 - 0 = 0.
      // It SHOULD be 2.
      expect(p2Stats?.offPointsFor).toBe(2);
    });
  });

  describe("Variable Period Length Bug", () => {
    it("fails to account for shorter overtime periods in player minutes", () => {
      const players: Player[] = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 300, // 5:00
          period: 5, // Overtime
          timestamp: "2023-01-01T10:00:00Z",
        },
        // Played until end of OT (0:00)
      ];

      // OT is usually 5 mins. If periodLength is 10, OT should still be 5 by default or via option.
      // CURRENT BEHAVIOR: assumes periodLen (10) for ALL periods.
      calculatePlayerAggregates(players, stats, [], "total", {
        periodLength: 10,
        // overtimeLength: 5 // This option doesn't exist yet
      });

      // (300 - 0) / 60 = 5 mins.
      // If it uses periodLength=10, it might still be 5 if it just uses clockTime,
      // BUT if it crosses a boundary, it uses periodLen.

      const statsBoundary: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 4,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE, // Just to have an event in P5
          points: 2,
          clockTime: 300,
          period: 5,
          timestamp: "2",
        }
      ];

      // Regulation 10m. OT 5m.
      // P4: 10m played.
      // P5: 5m - 300s = 0s? No, if OT is 5m, clock starts at 300.
      // If we SUB_IN at 600 in P4 and are still in at end of P5 (5m OT).
      // Total MIN should be 10 (P4) + 5 (P5) = 15.

      const results2 = calculatePlayerAggregates(players, statsBoundary, [], "total", {
        periodLength: 10,
        // overtimeLength: 5
      });

      // CURRENT BUG: uses 10 for P5 too, so 10 + 10 = 20.
      expect(results2[0].min).toBe(15);
    });
  });

  describe("calculateStopsAndKills Refinement", () => {
    it("does not currently count opponent offensive fouls as stops", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.FOUL, // Offensive foul
          timestamp: "2023-01-01T10:00:00Z",
          period: 1,
        },
      ];

      // We need to know it's an offensive foul.
      // In this app, a foul by the player in possession is an offensive foul.
      // The current logic doesn't track possession well enough for fouls.

      // Wait, if I'm Scout, I want to IMPROVE this.
      // Let's see how it handles it now.
      const result = calculateStopsAndKills(stats);
      // CURRENTLY: 0
      expect(result.totalStops).toBe(1);
    });
  });
});
