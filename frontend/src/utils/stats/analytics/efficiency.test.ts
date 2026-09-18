import { describe, it, expect } from "vitest";
import {
  calculateOpponentScoutingStats,
  calculatePlayEfficiency,
  calculateSituationalStats,
} from "./efficiency";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("efficiency analytics", () => {
  describe("calculateOpponentScoutingStats", () => {
    it("aggregates scouting stats for opponent players and filters inactive or non-opponent stats", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          playerId: "OPPONENT:23",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "OPPONENT:23",
          type: ACTION_TYPES.MISS,
          points: 0,
          timestamp: "2",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "OPPONENT:23",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
        },
        // Inactive stat
        {
          gameId: "g1",
          period: 1,
          playerId: "OPPONENT:23",
          type: ACTION_TYPES.MAKE,
          points: 2,
          deletedAt: "2026-09-01T00:00:00Z",
          timestamp: "4",
        },
        // Non-opponent stat
        {
          gameId: "g1",
          period: 1,
          playerId: "player1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "5",
        },
      ];

      const result = calculateOpponentScoutingStats(stats);
      expect(result.size).toBe(1);
      const opp23 = result.get("OPPONENT:23");
      expect(opp23).toBeDefined();
      expect(opp23?.points).toBe(3);
      expect(opp23?.attempts).toBe(2);
      expect(opp23?.makes).toBe(1);
      expect(opp23?.turnovers).toBe(1);
      expect(opp23?.fgPct).toBe("50.0");
      expect(opp23?.possessions).toBe(3); // 2 FGA + 1 TO = 3
    });

    it("returns an empty map when given empty or non-opponent stats", () => {
      const result = calculateOpponentScoutingStats([]);
      expect(result.size).toBe(0);
    });
  });

  describe("calculatePlayEfficiency", () => {
    it("calculates play efficiency stats sorted by attempts descending", () => {
      const stats: StatEvent[] = [
        // Play A
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          playName: "Horns Flex",
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          playName: "Horns Flex",
          timestamp: "2",
        },
        // Play B (More attempts)
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playName: "PnP Heavy",
          timestamp: "3",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          playName: "PnP Heavy",
          timestamp: "4",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          playName: "PnP Heavy",
          timestamp: "5",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p3",
          type: ACTION_TYPES.TURNOVER,
          playName: "PnP Heavy",
          timestamp: "6",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1, // FT Make
          playName: "PnP Heavy",
          timestamp: "7",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1, // FT Miss
          playName: "PnP Heavy",
          timestamp: "8",
        },
      ];

      const result = calculatePlayEfficiency(stats);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("PnP Heavy");
      expect(result[0].attempts).toBe(3);
      expect(result[0].makes).toBe(1);
      expect(result[0].points).toBe(3);
      expect(result[1].name).toBe("Horns Flex");
      expect(result[1].attempts).toBe(2);
      expect(result[1].makes).toBe(1);
      expect(result[1].points).toBe(3);
    });

    it("ignores inactive events or events without playName", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playName: "ISO",
          deletedAt: "2026-09-01T00:00:00Z",
          timestamp: "2",
        },
      ];

      const result = calculatePlayEfficiency(stats);
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateSituationalStats", () => {
    it("calculates situational efficiency stats and compares PPP delta against team PPP", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          situation: "BLOB",
          timestamp: "1",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          situation: "BLOB",
          timestamp: "2",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1, // FT Miss
          situation: "BLOB",
          timestamp: "3",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.FOUL_SHOOTING,
          situation: "BLOB",
          timestamp: "4",
        },
        {
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          situation: "BLOB",
          timestamp: "5",
        },
        // Opponent stat should be ignored
        {
          gameId: "g1",
          period: 1,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "BLOB",
          timestamp: "6",
        },
      ];

      const result = calculateSituationalStats(stats, "0.80");
      expect(result).toHaveLength(1);
      expect(result[0].situation).toBe("BLOB");
      expect(result[0].attempts).toBe(2);
      expect(result[0].points).toBe(3);
      expect(parseFloat(result[0].delta)).toBeGreaterThan(0);
    });

    it("returns empty array when no valid situational stats exist", () => {
      expect(calculateSituationalStats([])).toEqual([]);
    });
  });
});
