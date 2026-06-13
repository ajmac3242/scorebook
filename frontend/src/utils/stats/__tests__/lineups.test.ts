import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates, calculateLineupStats } from "../lineups";
import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent, TeamPlayer } from "../../../db";

describe("lineup and player aggregates", () => {
  describe("calculatePlayerAggregates", () => {
    it("calculates total aggregates correctly", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const teamPlayers: TeamPlayer[] = [{ id: "tp1", teamId: "t1", playerId: "p1", jerseyNumber: "10" }];
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, timestamp: "t1" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "t2" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.REBOUND, period: 1, timestamp: "t3" },
      ];
      const results = calculatePlayerAggregates(players, stats, teamPlayers);
      expect(results[0].points).toBe(2);
      expect(results[0].attempts).toBe(2);
      expect(results[0].rebounds).toBe(1);
    });

    it("calculates MIN and plus/minus correctly", () => {
       const players = [{ id: "p1", name: "Player 1" }];
       const stats: StatEvent[] = [
         { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "t1" },
         { gameId: "g1", playerId: "OPPONENT", type: ACTION_TYPES.MAKE, points: 2, period: 1, clockTime: 500, timestamp: "t2" },
         { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_OUT, period: 1, clockTime: 400, timestamp: "t3" },
       ];
       const results = calculatePlayerAggregates(players, stats, []);
       expect(results[0].min).toBeGreaterThan(0);
       expect(results[0].plusMinus).toBe(-2);
    });
  });

  describe("calculateLineupStats", () => {
    it("calculates lineup efficiency correctly", () => {
      // Lineup stats require 5 players to be "active" to record a stint.
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "2023-01-01T10:00:01Z" },
        { gameId: "g1", playerId: "p3", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "2023-01-01T10:00:02Z" },
        { gameId: "g1", playerId: "p4", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "2023-01-01T10:00:03Z" },
        { gameId: "g1", playerId: "p5", type: ACTION_TYPES.SUB_IN, period: 1, clockTime: 600, timestamp: "2023-01-01T10:00:04Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, clockTime: 500, timestamp: "2023-01-01T10:00:05Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.SUB_OUT, period: 1, clockTime: 400, timestamp: "2023-01-01T10:00:06Z" },
      ];
      const lineups = calculateLineupStats(stats);
      expect(lineups.length).toBeGreaterThan(0);
      expect(lineups[0].pointsFor).toBe(2);
    });
  });
});
