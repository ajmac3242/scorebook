import { describe, it, expect } from "vitest";
import {
  calculateMatchupStats,
  calculateOnOffStats,
  calculateOpponentScoutingStats,
} from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout: Audit V5", () => {
  describe("calculateMatchupStats possession accuracy", () => {
    it("should correctly weight free throws in possessions", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MATCHUP,
          relatedPlayerId: "p1",
          clockTime: 300,
          period: 1,
          timestamp: "1000",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 1, // Free throw
          clockTime: 290,
          period: 1,
          timestamp: "1100",
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 1, // Free throw
          clockTime: 289,
          period: 1,
          timestamp: "1110",
        },
      ];

      const results = calculateMatchupStats(stats);
      const m1 = results.find(
        (r) => r.ourPlayerId === "p1" && r.opponentPlayerId === "OPPONENT:10",
      );

      // Currently, this will likely be 2.0 because it increments for every isScoringEvent.
      // It should be 0.44 * 2 = 0.88
      expect(Number(m1?.possessions)).toBeLessThan(1.5);
    });
  });

  describe("calculateOnOffStats multi-game skew", () => {
    it("should only include games the player played in for OFF stats", () => {
      const players: Player[] = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        // Game 1: p1 is active
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "100",
          period: 1,
          clockTime: 600,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "110",
          period: 1,
          clockTime: 590,
        },
        // Game 2: p1 is NOT active, but there are stats
        {
          id: "s3",
          gameId: "g2",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "210",
          period: 1,
          clockTime: 590,
        },
      ];

      const results = calculateOnOffStats(players, stats);
      const p1 = results.find((r) => r.playerId === "p1");

      // If p1 only played in Game 1, their OFF stats for g2 should be ignored
      // if we want a true measure of their impact ON vs OFF in the games they actually participated in.
      // Currently, offPointsFor will likely be 2 (from g2). It should be 0 if g2 is excluded.
      expect(p1?.offPointsFor).toBe(0);
    });
  });

  describe("calculateOpponentScoutingStats average volume", () => {
    it("should support per-game averages for volume stats", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "100",
          period: 1,
        },
        {
          id: "2",
          gameId: "g2",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "200",
          period: 1,
        },
      ];

      // @ts-ignore - testing new parameter
      const results = calculateOpponentScoutingStats(stats, "average");
      const opp10 = results.get("OPPONENT:10");

      // Total points = 2, Games = 2 -> Avg points = 1.0
      expect(opp10?.points).toBe(1.0);
    });
  });
});
