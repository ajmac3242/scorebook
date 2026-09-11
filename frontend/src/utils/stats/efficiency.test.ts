import { describe, it, expect } from "vitest";
import {
  calculateOpponentScoutingStats,
  calculatePlayEfficiency,
  calculateSituationalStats,
} from "./analytics/efficiency";
import { ACTION_TYPES } from "../../constants/stats";

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
    it("should aggregate stats by play name including free throws, 3pt makes, misses, and turnovers", () => {
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
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          playName: "Elevator",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          playName: "Elevator",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          playName: "Corner3",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
          playName: "Corner3",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          deletedAt: "2026-01-01T00:00:00.000Z",
          playName: "Corner3",
        },
      ];
      const result = calculatePlayEfficiency(stats);
      expect(result).toHaveLength(3);
      const hammer = result.find((r) => r.name === "Hammer");
      expect(hammer?.attempts).toBe(2);
      expect(hammer?.points).toBe(2);
      expect(hammer?.ppp).toBe("0.67");

      const elevator = result.find((r) => r.name === "Elevator");
      expect(elevator?.points).toBe(4);

      const corner3 = result.find((r) => r.name === "Corner3");
      expect(corner3?.points).toBe(3);
      expect(corner3?.attempts).toBe(1);
    });
  });

  describe("calculateSituationalStats", () => {
    it("should aggregate stats by situation and handle free throws, 3-pointers, turnovers, and opponent filters", () => {
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
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "ATO",
        },
        {
          gameId,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          deletedAt: "2026-01-01T00:00:00.000Z",
          situation: "ATO",
        },
      ];
      const result = calculateSituationalStats(stats, "1.00");
      expect(result).toHaveLength(1);
      expect(result[0].situation).toBe("ATO");
      expect(result[0].attempts).toBe(3);
      expect(result[0].points).toBe(6);
    });
  });
});
