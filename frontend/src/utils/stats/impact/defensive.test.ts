import { describe, it, expect } from "vitest";
import {
  calculateStopsAndKills,
  calculateMatchupStats,
  calculateIndividualDefensiveBreakdown,
} from "./defensive";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent, Player } from "../../../db";

describe("defensive.ts", () => {
  const baseStat: StatEvent = {
    id: "s1",
    gameId: "g1",
    type: ACTION_TYPES.MAKE,
    playerId: "p1",
    points: 2,
    period: 1,
    clockTime: 600,
    createdAt: "2026-09-22T00:00:00Z",
    updatedAt: "2026-09-22T00:00:00Z",
    synced: 1,
  };

  describe("calculateStopsAndKills", () => {
    it("returns empty default values when stats array is empty or null", () => {
      expect(calculateStopsAndKills([])).toEqual({
        totalStops: 0,
        totalKills: 0,
        currentStreak: 0,
        killEvents: [],
      });
      expect(calculateStopsAndKills(null as any)).toEqual({
        totalStops: 0,
        totalKills: 0,
        currentStreak: 0,
        killEvents: [],
      });
    });

    it("resets streak when gameId changes", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          gameId: "g2",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        },
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.currentStreak).toBe(1);
      expect(result.totalKills).toBe(0);
    });

    it("calculates 3-stop kills and tracks kill events", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: `${SPECIAL_PLAYER_IDS.OPPONENT}:10`,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          playerId: `${SPECIAL_PLAYER_IDS.OPPONENT}:10`,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          playerId: `${SPECIAL_PLAYER_IDS.OPPONENT}:10`,
          type: ACTION_TYPES.TURNOVER,
          clockTime: 300,
          period: 2,
        },
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(1);
      expect(result.currentStreak).toBe(0);
      expect(result.killEvents).toEqual([{ period: 2, clockTime: 300 }]);
    });

    it("resets streak on opponent make, team foul on defense, or technical foul", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
        },
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
        },
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
        },
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(2);
      expect(result.currentStreak).toBe(0);
    });

    it("handles team turnovers, defensive rebounds, and opponent rebounds during possession tracking", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
        },
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
        },
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.DEF_REBOUND,
        },
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
        },
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
        },
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
        },
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
      expect(result.currentStreak).toBe(1);
    });

    it("ignores soft-deleted events", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
          deletedAt: "2026-09-22T00:01:00Z",
        },
      ];

      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(0);
    });
  });

  describe("calculateMatchupStats", () => {
    it("calculates defender points allowed and stop percentage", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: "OPPONENT:23",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
        },
        {
          ...baseStat,
          playerId: "OPPONENT:23",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.TURNOVER,
        },
      ];

      const players = [{ id: "p1", name: "LeBron James" }];
      const jerseyMap = new Map([["OPPONENT:23", "23"]]);

      const result = calculateMatchupStats(stats, players, jerseyMap);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        opponentId: "OPPONENT:23",
        opponentJersey: "23",
        defenderId: "p1",
        defenderName: "LeBron James",
        pointsAllowed: 3,
        stops: 1,
        totalPossessions: 2,
        stopPct: "50.0",
      });
    });

    it("handles opponent miss followed by defensive rebound and fallback opponent jersey format", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MISS,
        },
        {
          ...baseStat,
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
        },
      ];

      const players = [{ id: "p1", name: "LeBron James" }];
      const jerseyMap = new Map();

      const result = calculateMatchupStats(stats, players, jerseyMap);

      expect(result).toHaveLength(1);
      expect(result[0].opponentJersey).toBe("??");
      expect(result[0].stops).toBe(1);
      expect(result[0].totalPossessions).toBe(1);
    });

    it("returns 0.0 stopPct when totalPossessions is 0", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: "OPPONENT:11",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 0,
        },
      ];

      const players = [{ id: "p1", name: "LeBron James" }];
      const jerseyMap = new Map();

      const result = calculateMatchupStats(stats, players, jerseyMap);
      expect(result).toHaveLength(1);
      expect(result[0].stopPct).toBe("0.0");
    });
  });

  describe("calculateIndividualDefensiveBreakdown", () => {
    it("aggregates points allowed and breakdown reasons per defender", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: "OPPONENT:10",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          breakdownReason: "Poor Closeout",
        },
        {
          ...baseStat,
          playerId: "OPPONENT:10",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          breakdownReason: "Poor Closeout",
        },
        {
          ...baseStat,
          playerId: "OPPONENT:10",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          breakdownReason: "Missed Rotation",
        },
      ];

      const players: Player[] = [
        {
          id: "p1",
          name: "Anthony Davis",
          teamId: "t1",
          jerseyNumber: "3",
          createdAt: "",
          updatedAt: "",
          synced: 1,
        },
      ];

      const jerseyMap = new Map([["p1", "3"]]);

      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players,
        jerseyMap,
      );

      expect(result).toHaveLength(1);
      expect(result[0].playerName).toBe("Anthony Davis");
      expect(result[0].pointsAllowed).toBe(7);
      expect(result[0].primaryReason).toBe("Poor Closeout");
      expect(result[0].breakdowns).toEqual([
        { reason: "Poor Closeout", points: 5, frequency: 2 },
        { reason: "Missed Rotation", points: 2, frequency: 1 },
      ]);
    });

    it("handles fallback default reason when breakdownReason is omitted", () => {
      const stats: StatEvent[] = [
        {
          ...baseStat,
          playerId: "OPPONENT:10",
          primaryDefenderId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
        },
      ];

      const players: Player[] = [
        {
          id: "p1",
          name: "Anthony Davis",
          teamId: "t1",
          jerseyNumber: "3",
          createdAt: "",
          updatedAt: "",
          synced: 1,
        },
      ];

      const jerseyMap = new Map();

      const result = calculateIndividualDefensiveBreakdown(
        stats,
        players,
        jerseyMap,
      );

      expect(result[0].jerseyNumber).toBe("??");
      expect(result[0].primaryReason).toBe("No Reason Logged");
    });
  });
});
