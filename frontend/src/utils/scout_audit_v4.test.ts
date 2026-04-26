import { describe, it, expect } from "vitest";
import {
  calculateMatchupStats,
  calculatePlayerAggregates,
  calculateLineupStats,
} from "./stats";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout: Audit V4", () => {
  describe("calculateMatchupStats terminators Bug", () => {
    it("should reset inOpponentPossession when our team scores", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MISS,
          clockTime: 300,
          period: 1,
          timestamp: "1000",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 290,
          period: 1,
          timestamp: "1100",
        },
        // At this point, opponent should NOT be in possession.
        // If we don't reset, the next miss + def reb will count as a stop for p1 guarding OPP:10
        {
          id: "3",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MATCHUP,
          relatedPlayerId: "p1",
          clockTime: 280,
          period: 1,
          timestamp: "1200",
        },
        {
          id: "4",
          gameId: "g1",
          playerId: "OPPONENT:20", // Different player misses
          type: ACTION_TYPES.MISS,
          clockTime: 270,
          period: 1,
          timestamp: "1300",
        },
        {
          id: "5",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          clockTime: 268,
          period: 1,
          timestamp: "1400",
        },
      ];

      const results = calculateMatchupStats(stats);
      const m1 = results.find(r => r.opponentPlayerId === "OPPONENT:10");
      // If bug exists, m1 might have a stop or possession because inOpponentPossession was true from event 1
      // when event 5 happened (if it matched defender p1).
      // Actually event 5 uses opponentPossessionPlayerId which would be OPPONENT:20.
      // So let's make it more direct.

      const stats2: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MISS,
          clockTime: 300,
          period: 1,
          timestamp: "1000",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 290,
          period: 1,
          timestamp: "1100",
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MATCHUP,
          relatedPlayerId: "p1",
          clockTime: 280,
          period: 1,
          timestamp: "1200",
        },
        {
          id: "4",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND, // This shouldn't count as a stop for anyone since no miss preceded it IN THIS POSSESSION
          clockTime: 270,
          period: 1,
          timestamp: "1300",
        }
      ];
      const results2 = calculateMatchupStats(stats2);
      expect(results2.length).toBe(0); // Should have no matchup stats yet
    });
  });

  describe("calculatePlayerAggregates average volume Bug", () => {
    it("should average shooting volume (makes, attempts, etc.)", () => {
      const players: Player[] = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 1,
          timestamp: "1000",
        },
        {
          id: "2",
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          clockTime: 300,
          period: 1,
          timestamp: "2000",
        },
      ];

      const results = calculatePlayerAggregates(players, stats, [], "average");
      const p1 = results.find(r => r.id === "p1");
      expect(p1?.gp).toBe(2);
      // BUG: Currently it returns total makes (1) and attempts (2)
      expect(p1?.makes).toBe(0.5);
      expect(p1?.attempts).toBe(1);
    });
  });

  describe("calculateLineupStats missing metrics", () => {
    it("should include efgPct and toPct in LineupAggregates", () => {
      const stats: StatEvent[] = [
        { id: '1', gameId: 'g1', playerId: 'p1', type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: '1' },
        { id: '2', gameId: 'g1', playerId: 'p2', type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: '2' },
        { id: '3', gameId: 'g1', playerId: 'p3', type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: '3' },
        { id: '4', gameId: 'g1', playerId: 'p4', type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: '4' },
        { id: '5', gameId: 'g1', playerId: 'p5', type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: '5' },
        { id: '6', gameId: 'g1', playerId: 'p1', type: ACTION_TYPES.MAKE, points: 3, period: 1, clockTime: 500, timestamp: '6' },
        { id: '7', gameId: 'g1', playerId: 'p2', type: ACTION_TYPES.TURNOVER, period: 1, clockTime: 400, timestamp: '7' },
      ];

      const results = calculateLineupStats(stats) as any[];
      expect(results.length).toBe(1);
      const l1 = results[0];
      // eFG% = (FGM + 0.5 * 3PM) / FGA = (1 + 0.5 * 1) / 1 = 1.5 -> 150.0%
      // TO% = TO / (FGA + 0.44*FTA + TO - OREB) = 1 / (1 + 0 + 1 - 0) = 0.5 -> 50.0%
      expect(l1.efgPct).toBe("150.0");
      expect(l1.toPct).toBe("50.0");
    });
  });
});
