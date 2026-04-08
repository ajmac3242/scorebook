import { describe, it, expect } from "vitest";
import {
  getInitials,
  getPlayerJersey,
  calculatePlayerAggregates,
  calculateTeamAggregates,
  calculateGameResult,
  calculatePlayerStreaks,
} from "./stats";
import { TeamPlayer, StatEvent, Game } from "../db";
import { ACTION_TYPES } from "../constants/stats";

describe("stats utilities", () => {
  describe("getInitials", () => {
    it("returns initials for a two-word name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("returns initials for a single-word name", () => {
      expect(getInitials("John")).toBe("J");
    });

    it("returns up to 2 initials for a three-word name", () => {
      expect(getInitials("John Quincy Adams")).toBe("JQ");
    });

    it("handles multiple spaces between names", () => {
      expect(getInitials("  John    Doe  ")).toBe("JD");
    });

    it("returns an empty string for null, undefined, or empty input", () => {
      expect(getInitials(null)).toBe("");
      expect(getInitials(undefined)).toBe("");
      expect(getInitials("")).toBe("");
    });

    it("handles names with special characters correctly", () => {
      expect(getInitials("O'Neil Sanders")).toBe("OS");
    });

    it("handles single character names", () => {
      expect(getInitials("A B")).toBe("AB");
      expect(getInitials("A")).toBe("A");
    });

    it("handles multiple spaces", () => {
      expect(getInitials("John    Doe")).toBe("JD");
      expect(getInitials("   John   Doe   ")).toBe("JD");
    });
  });

  describe("getPlayerJersey", () => {
    const teamPlayers: TeamPlayer[] = [
      { id: "1", teamId: "t1", playerId: "p1", jerseyNumber: "23" },
      { id: "2", teamId: "t1", playerId: "p2", jerseyNumber: "0" },
    ];

    it("returns the correct jersey number for a matching player", () => {
      expect(getPlayerJersey("p1", teamPlayers)).toBe("23");
    });

    it("returns the correct jersey number for a player with '0' as jersey", () => {
      expect(getPlayerJersey("p2", teamPlayers)).toBe("0");
    });

    it("returns an empty string if player ID is not found", () => {
      expect(getPlayerJersey("p3", teamPlayers)).toBe("");
    });

    it("returns an empty string if player ID is undefined", () => {
      expect(getPlayerJersey(undefined, teamPlayers)).toBe("");
    });

    it("returns an empty string if teamPlayers array is empty", () => {
      expect(getPlayerJersey("p1", [])).toBe("");
    });
  });

  describe("calculatePlayerAggregates", () => {
    const players = [
      { id: "p1", name: "Player 1", avatarColor: "red" },
      { id: "p2", name: "Player 2", avatarColor: "blue" },
    ];
    const teamPlayers: TeamPlayer[] = [
      { id: "tp1", teamId: "t1", playerId: "p1", jerseyNumber: "10" },
      { id: "tp2", teamId: "t1", playerId: "p2", jerseyNumber: "20" },
    ];
    const stats: StatEvent[] = [
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "2023-01-01T10:00:00Z",
      },
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        period: 1,
        timestamp: "2023-01-01T10:01:00Z",
      },
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.REBOUND,
        period: 1,
        timestamp: "2023-01-01T10:02:00Z",
      },
      {
        gameId: "g1",
        playerId: "p2",
        type: ACTION_TYPES.ASSIST,
        period: 1,
        timestamp: "2023-01-01T10:03:00Z",
      },
      {
        gameId: "g2",
        playerId: "p1",
        type: ACTION_TYPES.STEAL,
        period: 1,
        timestamp: "2023-01-02T10:00:00Z",
      },
      {
        gameId: "g2",
        playerId: "p1",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        timestamp: "2023-01-02T10:01:00Z",
      },
      {
        gameId: "g2",
        playerId: "p1",
        type: ACTION_TYPES.FOUL,
        period: 1,
        timestamp: "2023-01-02T10:02:00Z",
      },
    ];

    it("calculates total aggregates correctly", () => {
      const results = calculatePlayerAggregates(
        players,
        stats,
        teamPlayers,
        "total",
      );
      const p1 = results.find((r) => r.id === "p1")!;
      expect(p1.points).toBe(2);
      expect(p1.makes).toBe(1);
      expect(p1.attempts).toBe(2);
      expect(p1.fgPct).toBe("50.0");
      expect(p1.rebounds).toBe(1);
      expect(p1.steals).toBe(1);
      expect(p1.turnovers).toBe(1);
      expect(p1.fouls).toBe(1);
      expect(p1.gp).toBe(2);

      const p2 = results.find((r) => r.id === "p2")!;
      expect(p2.assists).toBe(1);
      expect(p2.gp).toBe(1);
    });

    it("calculates average aggregates correctly", () => {
      const results = calculatePlayerAggregates(
        players,
        stats,
        teamPlayers,
        "average",
      );
      const p1 = results.find((r) => r.id === "p1")!;
      // p1 played 2 games: g1, g2
      expect(p1.points).toBe(1); // 2 points / 2 games
      expect(p1.rebounds).toBe(0.5); // 1 reb / 2 games
      expect(p1.steals).toBe(0.5);
      expect(p1.turnovers).toBe(0.5);
      expect(p1.fouls).toBe(0.5);
      expect(p1.gp).toBe(2);

      const p2 = results.find((r) => r.id === "p2")!;
      // p2 played 1 game: g1
      expect(p2.assists).toBe(1); // 1 assist / 1 game
      expect(p2.gp).toBe(1);
    });

    it("handles players with no stats", () => {
      const results = calculatePlayerAggregates(
        players,
        [],
        teamPlayers,
        "total",
      );
      expect(results.length).toBe(2);
      expect(results[0].points).toBe(0);
      expect(results[0].gp).toBe(0);
    });

    it("returns '0.0' for fgPct when attempts are 0", () => {
      const results = calculatePlayerAggregates(players, [], [], "total");
      expect(results[0].fgPct).toBe("0.0");
    });
  });

  describe("calculateTeamAggregates", () => {
    const games: Game[] = [
      {
        id: "g1",
        completed: 1,
        teamId: "t1",
        opponent: "Opp",
        date: "2023-01-01",
        location: "Home",
      },
      {
        id: "g2",
        completed: 1,
        teamId: "t1",
        opponent: "Opp",
        date: "2023-01-02",
        location: "Home",
      },
      {
        id: "g3",
        completed: 0,
        teamId: "t1",
        opponent: "Opp",
        date: "2023-01-03",
        location: "Home",
      },
    ];
    const stats: StatEvent[] = [
      // Game 1: Win (5-3)
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t1",
      },
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        timestamp: "t2",
      },
      {
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        timestamp: "t3",
      },
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.REBOUND,
        period: 1,
        timestamp: "t4",
      },
      {
        gameId: "g1",
        playerId: "p2",
        type: ACTION_TYPES.ASSIST,
        period: 1,
        timestamp: "t5",
      },
      // Game 2: Loss (2-4)
      {
        gameId: "g2",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t6",
      },
      {
        gameId: "g2",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t7",
      },
      {
        gameId: "g2",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t8",
      },
      // Game 3: Incomplete, team leading (2-0)
      {
        gameId: "g3",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t9",
      },
    ];

    it("calculates team aggregates for completed games only by default", () => {
      const results = calculateTeamAggregates(games, stats);
      // Completed games: g1 (5 pts), g2 (2 pts) -> Avg: 3.5 PPG
      // Opponent pts: g1 (3 pts), g2 (4 pts) -> Avg: 3.5 OPPG
      // Rebounds: g1 (1), g2 (0) -> Avg: 0.5 RPG
      // Assists: g1 (1), g2 (0) -> Avg: 0.5 APG
      // Record: 1-1 (g1 W, g2 L)
      expect(results.ppg).toBe("3.5");
      expect(results.oppg).toBe("3.5");
      expect(results.rpg).toBe("0.5");
      expect(results.apg).toBe("0.5");
      expect(results.record).toBe("1-1");
      expect(results.totalGames).toBe(2);
    });

    it("calculates team aggregates including incomplete games when specified", () => {
      const results = calculateTeamAggregates(games, stats, false);
      // Games: g1 (5), g2 (2), g3 (2) -> Avg: 3.0 PPG
      // Opponent: g1 (3), g2 (4), g3 (0) -> Avg: 2.3 OPPG
      // Record: 2-1 (g1 W, g2 L, g3 W)
      expect(results.ppg).toBe("3.0");
      expect(results.oppg).toBe("2.3");
      expect(results.record).toBe("2-1");
      expect(results.totalGames).toBe(3);
    });

    it("handles empty games or stats", () => {
      const res1 = calculateTeamAggregates([], []);
      expect(res1.totalGames).toBe(0);
      expect(res1.ppg).toBe("0.0");
      expect(res1.record).toBe("0-0");

      const res2 = calculateTeamAggregates(games, []);
      expect(res2.totalGames).toBe(2);
      expect(res2.ppg).toBe("0.0");
      expect(res2.record).toBe("0-0");
    });
  });

  describe("calculateGameResult", () => {
    const stats: StatEvent[] = [
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t1",
      },
      {
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        timestamp: "t2",
      },
      {
        gameId: "g2",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 5,
        period: 1,
        timestamp: "t3",
      },
      {
        gameId: "g2",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t4",
      },
      {
        gameId: "g3",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t5",
      },
      {
        gameId: "g3",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t6",
      },
    ];

    it("returns 'L' for a loss", () => {
      const res = calculateGameResult("g1", stats);
      expect(res.teamScore).toBe(2);
      expect(res.oppScore).toBe(3);
      expect(res.result).toBe("L");
    });

    it("returns 'W' for a win", () => {
      const res = calculateGameResult("g2", stats);
      expect(res.teamScore).toBe(5);
      expect(res.oppScore).toBe(2);
      expect(res.result).toBe("W");
    });

    it("returns 'D' for a draw", () => {
      const res = calculateGameResult("g3", stats);
      expect(res.teamScore).toBe(2);
      expect(res.oppScore).toBe(2);
      expect(res.result).toBe("D");
    });
  });

  describe("calculatePlayerStreaks", () => {
    it("identifies a HOT streak (3 makes)", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:02:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe("HOT");
    });

    it("identifies a COLD streak (3 misses)", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:02:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe("COLD");
    });

    it("returns null for fewer than 3 shots", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:01:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe(null);
    });

    it("returns null for neutral streak (mix of make/miss)", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:02:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe(null);
    });

    it("only considers the last 3 shots", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:02:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:03:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe("HOT");
    });

    it("ignores non-shot events", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.REBOUND, period: 1, timestamp: "2023-01-01T10:00:30Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.FOUL, period: 1, timestamp: "2023-01-01T10:01:30Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:02:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe("HOT");
    });

    it("handles multiple players correctly", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:00:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:01:00Z" },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, period: 1, timestamp: "2023-01-01T10:02:00Z" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:03:00Z" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:04:00Z" },
        { gameId: "g1", playerId: "p2", type: ACTION_TYPES.MISS, period: 1, timestamp: "2023-01-01T10:05:00Z" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      expect(streaks.get("p1")).toBe("HOT");
      expect(streaks.get("p2")).toBe("COLD");
    });
  });
});
