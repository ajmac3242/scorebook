import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates, calculateLineupStats } from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent } from "../db";

describe("Scout Repro Tests", () => {
  describe("Bug 1: Multi-period Minutes Played", () => {
    it("should correctly calculate minutes for a player playing across periods", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600, // 10:00 in P1
          period: 1,
          timestamp: "2023-01-01T10:00:00Z",
        },
        // Period 1 ends, Period 2 starts
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300, // 5:00 in P2
          period: 2,
          timestamp: "2023-01-01T10:20:00Z",
        },
      ];

      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      // Correct calculation:
      // P1: 10:00 to 0:00 = 600s
      // P2: 10:00 (assumed) to 5:00 = 300s
      // Total: 900s = 15 minutes.
      // CURRENT LOGIC will probably do 600 - 300 = 300s = 5 minutes.
      expect(p1.min).toBe(15);
    });
  });

  describe("Bug 3: Free Throws in FGA/FGM", () => {
    it("should not count free throws in field goal attempts/makes", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1, // Free Throw
          period: 1,
          timestamp: "2023-01-01T10:00:00Z",
        },
      ];

      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      expect(p1.points).toBe(1);
      expect(p1.makes).toBe(0); // Should be 0 FGM
      expect(p1.attempts).toBe(0); // Should be 0 FGA
      expect(p1.fgPct).toBe("0.0");
    });
  });

  describe("Bug 2: Lineup Efficiency Across Periods", () => {
    it("should correctly calculate lineup time across periods", () => {
       const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_IN, clockTime: 600, period: 1, timestamp: "1" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.SUB_IN, clockTime: 600, period: 1, timestamp: "2" },
        { gameId: "g1", playerId: "p3", type: ACTION_TYPES.SUB_IN, clockTime: 600, period: 1, timestamp: "3" },
        { gameId: "g1", playerId: "p4", type: ACTION_TYPES.SUB_IN, clockTime: 600, period: 1, timestamp: "4" },
        { gameId: "g1", playerId: "p5", type: ACTION_TYPES.SUB_IN, clockTime: 600, period: 1, timestamp: "5" },
        // Period transition
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_OUT, clockTime: 300, period: 2, timestamp: "6" },
      ];

      const results = calculateLineupStats(stats);
      expect(results.length).toBe(1);
      // P1: 10 mins, P2: 5 mins. Total 15 mins = 900s.
      expect(results[0].seconds).toBe(900);
    });
  });
});
