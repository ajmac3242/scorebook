import { describe, it, expect } from "vitest";
import {
  calculateSparkPlugIndex,
  calculateMatchupEfficiency,
} from "../analytics";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("Forge Analytics", () => {
  describe("calculateSparkPlugIndex", () => {
    it("should calculate composite index based on hustle and momentum", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FLOOR_DIVE,
          period: 1,
          clockTime: 600,
          timestamp: "2024-01-01T10:00:00Z",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 550,
          timestamp: "2024-01-01T10:00:10Z",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
        {
          id: "3",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 500,
          timestamp: "2024-01-01T10:00:20Z",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
      ];

      const index = calculateSparkPlugIndex(stats);
      expect(index).toHaveLength(1);
      expect(index[0].playerId).toBe("p1");
      expect(index[0].hustleStats).toBe(1);
      expect(index[0].momentumScore).toBe(5); // 3 (p1) + 2 (p2)
      expect(index[0].compositeIndex).toBe(Math.round(1 * 2 + 5 / 2)); // 2 + 2.5 = 4.5 -> 5
    });
  });

  describe("calculateMatchupEfficiency", () => {
    it("should calculate stop percentage for matchups", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          type: ACTION_TYPES.MISS,
          period: 1,
          clockTime: 500,
          primaryDefenderId: "p1",
          timestamp: "t1",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
        {
          id: "2",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 400,
          primaryDefenderId: "p1",
          timestamp: "t2",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
        {
          id: "3",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          clockTime: 300,
          primaryDefenderId: "p1",
          timestamp: "t3",
          synced: 1,
          locationX: 0,
          locationY: 0,
        },
      ];

      const efficiency = calculateMatchupEfficiency(stats, {});
      const p1m10 = efficiency.find(
        (e) =>
          e.teamPlayerId === "p1" &&
          e.oppPlayerId === SPECIAL_PLAYER_IDS.OPPONENT + ":10",
      );
      expect(p1m10).toBeDefined();
      expect(p1m10?.possessions).toBe(3);
      expect(p1m10?.stopPct).toBe(Math.round((2 / 3) * 100)); // Miss + Turnover = 2 stops
    });
  });
});
