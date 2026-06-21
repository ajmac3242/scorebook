import { describe, it, expect } from "vitest";
import {
  calculateOpponentScoutingStats,
  calculatePlayEfficiency,
  calculateSituationalStats,
} from "../analytics/efficiency";
import { ACTION_TYPES } from "../../../constants/stats";

describe("efficiency analytics", () => {
  const gameId = "game-1";
  describe("calculateOpponentScoutingStats", () => {
    it("should aggregate stats for opponent players", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: 1,
        },
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: 2,
        },
        {
          gameId,
          playerId: "OPPONENT:11",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: 3,
        },
      ];
      const result = calculateOpponentScoutingStats(stats);
      expect(result.size).toBe(2);
      expect(result.get("OPPONENT:10")?.points).toBe(2);
      expect(result.get("OPPONENT:10")?.attempts).toBe(2);
      expect(result.get("OPPONENT:11")?.points).toBe(3);
    });
  });

  describe("calculatePlayEfficiency", () => {
    it("should aggregate stats by play name", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playName: "Hammer",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          playName: "Hammer",
        },
        {
          gameId,
          playerId: "p2",
          type: ACTION_TYPES.TURNOVER,
          playName: "Hammer",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          playName: "Elevator",
        },
      ];
      const result = calculatePlayEfficiency(stats);
      expect(result).toHaveLength(2);
      const hammer = result.find((r) => r.name === "Hammer");
      expect(hammer?.attempts).toBe(2);
      expect(hammer?.points).toBe(2);
      // Possessions = FGA + 0.44 * FTA + TO - OREB
      // 2 + 0 + 1 - 0 = 3
      // PPP = 2 / 3 = 0.67
      expect(hammer?.ppp).toBe("0.67");
    });
  });

  describe("calculateSituationalStats", () => {
    it("should aggregate stats by situation", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.FOUL_SHOOTING,
          situation: "ATO",
        },
      ];
      const result = calculateSituationalStats(stats, "1.00");
      expect(result).toHaveLength(1);
      expect(result[0].situation).toBe("ATO");
      expect(result[0].attempts).toBe(2);
      expect(result[0].successRate).toBe("100.0"); // 2 successes (make + foul shooting) / 2 possessions
    });

    it("handles FT makes/misses and turnovers in situations", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          situation: "EOR",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          situation: "EOR",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          situation: "EOR",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          situation: "EOR",
        },
      ];
      const result = calculateSituationalStats(stats);
      const eor = result.find((r) => r.situation === "EOR");
      expect(eor?.attempts).toBe(1); // Only the 3pt make
      expect(eor?.points).toBe(4); // 1 + 3
    });
  });

  describe("calculatePlayEfficiency extra coverage", () => {
    it("handles FT makes/misses and 3pt makes", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          playName: "P",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          playName: "P",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          playName: "P",
        },
      ];
      const result = calculatePlayEfficiency(stats);
      expect(result[0].attempts).toBe(1);
    });
  });
});
