import { describe, it, expect } from "vitest";
import {
  getInitials,
  getPlayerJersey,
  calculatePlayerAggregates,
  calculateTeamAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  isEventInPeriod,
  calculateGameResult,
  calculatePlayerStreaks,
  calculateLineupStats,
  getBonusStatus,
  calculateStopsAndKills,
  calculateTsPct,
  sortStats,
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

    it("handles average calculation when a player has 0 games played (division-by-zero protection)", () => {
      const results = calculatePlayerAggregates(players, [], [], "average");
      // Results should be 0, not NaN or Infinity
      expect(results[0].points).toBe(0);
      expect(results[0].gp).toBe(0);
    });

    it("calculates MIN and plus/minus correctly", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:00Z",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2023-01-01T10:01:00Z",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "2023-01-01T10:02:00Z",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "2023-01-01T10:03:00Z",
        },
      ];
      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];
      expect(p1.min).toBe(5); // (600 - 300) / 60 = 5 mins
      expect(p1.plusMinus).toBe(1); // Team scored 3, Opponent scored 2 while p1 was in
      expect(p1.efgPct).toBe("150.0"); // (1 + 0.5 * 1) / 1 * 100 = 150%
    });

    it("handles period transitions for player MIN and plus/minus correctly", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        // Score in P1
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2",
        },
        // Transition to P2. P1 stint should end at 0:00 (600s played).
        // A new stint should start for P2.
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 2,
          clockTime: 300,
          timestamp: "3",
        },
        // Sub out in P2
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 240,
          period: 2,
          timestamp: "4",
        },
      ];
      // Period length defaults to 10 mins (600s)
      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      // MIN: 10 mins (P1) + (10 - 4) mins (P2) = 16 mins
      expect(p1.min).toBe(16);
      // Plus/Minus: +2 (P1) - 3 (P2) = -1
      expect(p1.plusMinus).toBe(-1);
    });

    it("calculates 3PA and FTA correctly for both makes and misses", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 3,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          period: 1,
          timestamp: "4",
        },
      ];
      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      expect(p1.threePM).toBe(1);
      expect(p1.threePA).toBe(2);
      expect(p1.threePct).toBe("50.0");
      expect(p1.ftm).toBe(1);
      expect(p1.fta).toBe(2);
      expect(p1.ftPct).toBe("50.0");
    });

    it("calculates live minutes accurately using liveContext", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
      ];
      // Live at 5:00 (300s remaining)
      const options = {
        liveContext: { clockTime: 300, period: 1 },
      };
      const results = calculatePlayerAggregates(
        players,
        stats,
        [],
        "total",
        options,
      );
      const p1 = results[0];
      // (600 - 300) / 60 = 5 mins
      expect(p1.min).toBe(5);
    });
  });

  describe("calculateLineupStats", () => {
    it("calculates lineup efficiency correctly", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "5",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "6",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "7",
        },
      ];
      const results = calculateLineupStats(stats);
      expect(results.length).toBe(1);
      expect(results[0].pointsFor).toBe(2);
      expect(results[0].seconds).toBe(300);
      expect(results[0].netRating).toBe(2);
    });

    it("handles period transitions correctly (closing and restarting stints)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "5",
        },
        // Score 2 points in P1
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "6",
        },
        // Transition to P2 - active lineup should be recorded for remaining P1 time (600s)
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 2,
          timestamp: "7",
        },
      ];
      const results = calculateLineupStats(stats);
      expect(results.length).toBe(1);
      // P1: 2 pts for, 0 against, 600 seconds
      // P2: 0 pts for (the 3 pts against happened AT the transition or in P2)
      // Actually, the logic records P1 stint when it sees P2 event.
      // Then it starts a new stint for P2.
      // The 3 pts against in P2 will be recorded in the final stint (end of game).
      expect(results[0].pointsFor).toBe(2);
      expect(results[0].pointsAgainst).toBe(3);
      expect(results[0].seconds).toBe(1200); // 600 (P1) + 600 (P2)
    });

    it("isolates stints by gameId correctly (multi-game isolation)", () => {
      const stats: StatEvent[] = [
        // Game 1: 10 mins played, +2
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "101",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "102",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "103",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "104",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "105",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "106",
        },
        // Game 2: Same lineup, 10 mins played, +5
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "201",
        },
        {
          gameId: "g2",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "202",
        },
        {
          gameId: "g2",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "203",
        },
        {
          gameId: "g2",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "204",
        },
        {
          gameId: "g2",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "205",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 5,
          period: 1,
          timestamp: "206",
        },
      ];
      const results = calculateLineupStats(stats);
      expect(results.length).toBe(1);
      expect(results[0].pointsFor).toBe(7);
      expect(results[0].seconds).toBe(1200);
    });

    it("handles multiple substitutions at the exact same clockTime correctly", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "5",
        },
        // Score 2 pts at 5:00
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 1,
          timestamp: "6",
        },
        // Double sub at 5:00
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "7",
        },
        {
          gameId: "g1",
          playerId: "p6",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 300,
          period: 1,
          timestamp: "8",
        },
        // Score 3 pts with new lineup at 2:00
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          clockTime: 120,
          period: 1,
          timestamp: "9",
        },
      ];
      const results = calculateLineupStats(stats);
      // Lineup 1: p1,p2,p3,p4,p5 -> 2 pts for, 300 seconds
      // Lineup 2: p2,p3,p4,p5,p6 -> 3 pts for, 300 seconds (final stint to 0:00)
      expect(results.length).toBe(2);
      const l1 = results.find((r) => r.lineup.includes("p1"))!;
      const l2 = results.find((r) => r.lineup.includes("p6"))!;
      expect(l1.pointsFor).toBe(2);
      expect(l1.seconds).toBe(300);
      expect(l2.pointsFor).toBe(3);
      expect(l2.seconds).toBe(300);
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

  describe("calculateOpponentAggregates", () => {
    it("calculates opponent stats correctly", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "t1",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          period: 1,
          timestamp: "t2",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.REBOUND,
          period: 1,
          timestamp: "t3",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "t4",
        },
      ];
      const results = calculateOpponentAggregates(stats);
      expect(results.points).toBe(3);
      expect(results.makes).toBe(1);
      expect(results.attempts).toBe(2);
      expect(results.rebounds).toBe(1);
    });

    it("aggregates individual opponent jerseys (e.g., OPPONENT:12) into opponent totals", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:12",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "t1",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:5",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "t2",
        },
      ];
      const results = calculateOpponentAggregates(stats);
      expect(results.points).toBe(5);
      expect(results.makes).toBe(2);
    });
  });

  describe("calculateScoreFlow", () => {
    it("generates score flow data correctly using game clock", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 590, // 0:10 elapsed
          timestamp: "t1",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          clockTime: 300, // 5:00 elapsed
          timestamp: "t2",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 2,
          clockTime: 540, // 10:00 + 1:00 = 11:00 elapsed
          timestamp: "t3",
        },
      ];
      const results = calculateScoreFlow(stats, 10);
      expect(results.length).toBe(4);
      expect(results[1]).toEqual({ time: "0:10", Team: 2, Opponent: 0 });
      expect(results[2]).toEqual({ time: "5:00", Team: 2, Opponent: 3 });
      expect(results[3]).toEqual({ time: "11:00", Team: 4, Opponent: 3 });
    });
  });

  describe("isEventInPeriod", () => {
    it("handles QUARTERS logic", () => {
      expect(isEventInPeriod(1, 1, "QUARTERS")).toBe(true);
      expect(isEventInPeriod(2, 1, "QUARTERS")).toBe(false);
    });

    it("handles HALVES logic", () => {
      expect(isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(isEventInPeriod(2, 1, "HALVES")).toBe(false);
      expect(isEventInPeriod(2, 2, "HALVES")).toBe(true);
      expect(isEventInPeriod(3, 2, "HALVES")).toBe(true);
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

    it("ignores events marked as deletedAt", () => {
      const statsWithDeleted: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "t1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "t2",
          period: 1,
          deletedAt: "2023-01-01T10:05:00Z",
        },
      ];
      const res = calculateGameResult("g1", statsWithDeleted);
      expect(res.teamScore).toBe(2);
      expect(res.result).toBe("W");
    });
  });

  describe("calculatePlayerStreaks", () => {
    it("identifies a HOT streak (3 consecutive makes)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2023-01-01T10:01:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:02:00Z",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });

    it("identifies a COLD streak (3 consecutive misses)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          timestamp: "2023-01-01T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          timestamp: "2023-01-01T10:01:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          timestamp: "2023-01-01T10:02:00Z",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("COLD");
    });

    it("returns null for fewer than 3 attempts", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:01:00Z",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe(null);
    });

    it("handles mixed streaks (resets to null if interrupted)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe(null);
    });

    it("ignores non-scoring actions (rebounds, assists)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
          timestamp: "4",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "5",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });

    it("ignores free throws (points === 1) and does not let them affect field goal streaks", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:01Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:02Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          timestamp: "2023-01-01T10:00:03Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          timestamp: "2023-01-01T10:00:04Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2023-01-01T10:00:05Z",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });

    it("properly handles chronological order even if stats are unsorted", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
      ];
      const result = calculatePlayerStreaks(stats);
      expect(result.get("p1")).toBe("HOT");
    });
  });

  describe("calculateStopsAndKills", () => {
    it("calculates stops and kills correctly", () => {
      const stats: StatEvent[] = [
        // Stop 1: Turnover
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
          period: 1,
        },
        // Stop 2: Miss + Def Rebound
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "3",
          period: 1,
        },
        // Stop 3: Another Turnover -> Should trigger a Kill
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "4",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(1);
      expect(result.currentStreak).toBe(0);
    });

    it("breaks streak on opponent score", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(2);
      expect(result.totalKills).toBe(0);
      expect(result.currentStreak).toBe(1);
    });

    it("does NOT count stop on offensive rebound", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(0);
      expect(result.currentStreak).toBe(0);
    });

    it("handles multiple misses in one possession without double counting", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
    });

    it("handles MISS -> OFF_REBOUND -> MISS -> DEF_REBOUND correctly", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "3",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "4",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      // First MISS + OFF_REBOUND sequence does not count as stop yet.
      // Second MISS + DEF_REBOUND sequence counts as 1 stop.
      expect(result.totalStops).toBe(1);
    });

    it("isolates stops and streaks by gameId (multi-game isolation)", () => {
      const stats: StatEvent[] = [
        // Game 1: 2 stops, streak 2
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2",
          period: 1,
        },
        // Game 2: 1 stop, streak should start from 0
        {
          gameId: "g2",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.currentStreak).toBe(1); // Should be 1, not 3 (no Kill triggered across games)
      expect(result.totalKills).toBe(0);
    });

    it("handles look-ahead logic gracefully when a MISS is the final event", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MISS,
          timestamp: "1",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      // No stop earned because we don't know who got the rebound
      expect(result.totalStops).toBe(0);
    });
  });

  describe("calculateTsPct", () => {
    it("calculates True Shooting percentage correctly", () => {
      // 10 points, 4 attempts, 2 FTA -> 10 / (2 * (4 + 0.44 * 2)) = 10 / (2 * 4.88) = 10 / 9.76 = 1.0245... -> 102.5%
      expect(calculateTsPct(10, 4, 2)).toBe("102.5");
    });

    it("returns '0.0' when there are no attempts or FTA (division by zero protection)", () => {
      expect(calculateTsPct(0, 0, 0)).toBe("0.0");
      expect(calculateTsPct(10, 0, 0)).toBe("0.0");
    });
  });

  describe("sortStats", () => {
    it("sorts by timestamp primarily", () => {
      const stats: StatEvent[] = [
        {
          id: "b",
          timestamp: "2023-01-01T10:02:00Z",
          gameId: "g1",
          playerId: "p1",
          type: "MAKE",
          period: 1,
        },
        {
          id: "a",
          timestamp: "2023-01-01T10:01:00Z",
          gameId: "g1",
          playerId: "p1",
          type: "MAKE",
          period: 1,
        },
      ];
      const sorted = sortStats(stats);
      expect(sorted[0].id).toBe("a");
      expect(sorted[1].id).toBe("b");
    });

    it("uses id as a secondary sort key for identical timestamps (deterministic sorting)", () => {
      const stats: StatEvent[] = [
        {
          id: "z",
          timestamp: "2023-01-01T10:00:00Z",
          gameId: "g1",
          playerId: "p1",
          type: "MAKE",
          period: 1,
        },
        {
          id: "m",
          timestamp: "2023-01-01T10:00:00Z",
          gameId: "g1",
          playerId: "p1",
          type: "MAKE",
          period: 1,
        },
      ];
      const sorted = sortStats(stats);
      expect(sorted[0].id).toBe("m");
      expect(sorted[1].id).toBe("z");
    });
  });

  describe("getBonusStatus", () => {
    describe("QUARTERS", () => {
      it("returns default for 0-3 fouls", () => {
        const res = getBonusStatus(3, "QUARTERS");
        expect(res.isBonus).toBe(false);
        expect(res.color).toBe("default");
      });

      it("returns warning for 4 fouls", () => {
        const res = getBonusStatus(4, "QUARTERS");
        expect(res.isBonus).toBe(false);
        expect(res.color).toBe("warning.main");
      });

      it("returns bonus for 5+ fouls", () => {
        const res = getBonusStatus(5, "QUARTERS");
        expect(res.isBonus).toBe(true);
        expect(res.isDouble).toBe(false);
        expect(res.label).toBe("BONUS");
        expect(res.color).toBe("error.main");
      });
    });

    it("falls back to QUARTERS rules for unknown period types", () => {
      const res = getBonusStatus(5, "OVERTIME");
      expect(res.isBonus).toBe(true);
      expect(res.label).toBe("BONUS");
    });

    describe("HALVES", () => {
      it("returns default for 0-5 fouls", () => {
        const res = getBonusStatus(5, "HALVES");
        expect(res.isBonus).toBe(false);
        expect(res.color).toBe("default");
      });

      it("returns warning for 6 fouls", () => {
        const res = getBonusStatus(6, "HALVES");
        expect(res.isBonus).toBe(false);
        expect(res.color).toBe("warning.main");
      });

      it("returns single bonus for 7-9 fouls", () => {
        const res = getBonusStatus(7, "HALVES");
        expect(res.isBonus).toBe(true);
        expect(res.isDouble).toBe(false);
        expect(res.color).toBe("error.main");
      });

      it("returns double bonus for 10+ fouls", () => {
        const res = getBonusStatus(10, "HALVES");
        expect(res.isBonus).toBe(true);
        expect(res.isDouble).toBe(true);
        expect(res.color).toBe("error.main");
      });
    });
  });
});
