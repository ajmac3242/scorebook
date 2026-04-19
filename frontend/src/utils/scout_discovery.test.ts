import { describe, it, expect } from "vitest";
import {
  calculatePlayerAggregates,
  calculateTeamAggregates,
  sortStats,
} from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, Player, Game } from "../db";

describe("Scout Discovery: Edge Cases", () => {
  describe("Simultaneous Events Ordering", () => {
    it("SUB_IN should ideally precede a MAKE at the same timestamp", () => {
      const stats: StatEvent[] = [
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:00.000Z",
          period: 1,
          clockTime: 600,
        },
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "2023-01-01T10:00:00.000Z",
          period: 1,
          clockTime: 600,
        },
      ];

      const sorted = sortStats(stats);
      // Currently, sortStats only uses timestamp. Since they are equal, order is preserved or arbitrary.
      // If "MAKE" comes first, p1 might not get credit if the aggregation logic hasn't "started" their stint.

      const players: Player[] = [{ id: "p1", name: "Player 1" }];
      const aggregates = calculatePlayerAggregates(players, sorted);
      const p1 = aggregates.find(a => a.id === "p1");

      // If this fails, it means the player didn't get points because they weren't "in" yet.
      // Actually calculatePlayerAggregates processes them in order.
      expect(p1?.points).toBe(2);
    });
  });

  describe("Team Record with Draws", () => {
    it("should represent draws in the record string if they exist", () => {
      const games: Game[] = [
        { id: "g1", completed: 1, teamId: "t1", opponent: "Opp1", date: "1", location: "H" },
        { id: "g2", completed: 1, teamId: "t1", opponent: "Opp2", date: "2", location: "H" },
      ];
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1", period: 1 },
        { gameId: "g1", playerId: "OPPONENT", type: ACTION_TYPES.MAKE, points: 2, timestamp: "2", period: 1 }, // Draw
        { gameId: "g2", playerId: "p1", type: ACTION_TYPES.MAKE, points: 3, timestamp: "3", period: 1 },
        { gameId: "g2", playerId: "OPPONENT", type: ACTION_TYPES.MAKE, points: 2, timestamp: "4", period: 1 }, // Win
      ];

      const result = calculateTeamAggregates(games, stats);
      // Currently it returns "1-0" because it only counts wins and losses.
      // A more standard record would be "1-0-1" or handle it.
      expect(result.record).toContain("-0-1");
    });
  });

  describe("Overtime Team Fouls (QUARTERS)", () => {
    it("might need different bonus limits for overtime", () => {
      // This is more of a design question, but let's see how it behaves.
      // In many leagues, OT has a lower foul limit for bonus than a full quarter.
    });
  });
});
