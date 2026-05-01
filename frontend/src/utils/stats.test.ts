import { describe, it, expect } from "vitest";
import {
  getInitials,
  getPlayerJersey,
  calculatePlayerAggregates,
  calculateTeamAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  isEventInPeriod,
  isOpponentId,
  calculateGameResult,
  calculatePlayerStreaks,
  calculateLineupStats,
  getBonusStatus,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  calculateOpponentThreats,
  isClutchEvent,
  calculateOpponentScoutingStats,
  calculatePlayEfficiency,
  calculateTeamSeasonAverages,
  calculatePlayerStintTimeline,
  calculateOnOffStats,
  calculateMatchupStats,
  getClutchSeconds,
  calculateTargetAttackStats,
  calculateTimeoutRecommendation,
  generatePlayerNarrative,
  calculateOfficiatingStats,
  calculatePaceAnalytics,
  calculateClutchPlaybookRanking,
  type PlayerAggregates,
  type MatchupStats,
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

    it("correctly tracks TECHNICAL_FOUL in player aggregates", () => {
      const techStats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          period: 1,
          timestamp: "t1",
        },
      ];
      const results = calculatePlayerAggregates(players, techStats);
      expect(results.find((r) => r.id === "p1")?.fouls).toBe(1);
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

    it("tracks 3PT attempts and percentage correctly", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 3,
          timestamp: "2",
          period: 1,
        },
      ];
      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];
      expect(p1.threePM).toBe(1);
      expect(p1.threePA).toBe(2);
      expect(p1.threePPct).toBe("50.0");
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
      expect(res2.record).toBe("0-0-2");
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
      expect(results[1]).toMatchObject({
        time: "0:10",
        Team: 2,
        Opponent: 0,
        Spread: 2,
        event: "2PT MAKE",
      });
      expect(results[2]).toMatchObject({
        time: "5:00",
        Team: 2,
        Opponent: 3,
        Spread: -1,
        event: "3PT MAKE",
      });
      expect(results[3]).toMatchObject({
        time: "11:00",
        Team: 4,
        Opponent: 3,
        Spread: 1,
        event: "2PT MAKE",
      });
    });

    it("handles no scoring events", () => {
      const results = calculateScoreFlow([], 10);
      expect(results).toEqual([
        { time: "00:00", Team: 0, Opponent: 0, Spread: 0 },
      ]);
    });

    it("handles custom period length", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 2,
          clockTime: 480, // 8:00 elapsed in 12 min period -> 12:00 + 4:00 = 16:00
          timestamp: "t1",
        },
      ];
      // 12 minute periods. 12:00 (P1) + (12:00 - 8:00) (P2) = 16:00
      const results = calculateScoreFlow(stats, 12);
      expect(results[1]).toMatchObject({
        time: "16:00",
        Team: 2,
        Opponent: 0,
        Spread: 2,
        event: "2PT MAKE",
      });
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
      expect(isEventInPeriod(3, 2, "HALVES")).toBe(true); // OT included in 2nd half
      expect(isEventInPeriod(4, 2, "HALVES")).toBe(true); // 2nd OT included
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

    it("isolates stints by gameId correctly (multi-game isolation)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:01Z",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:02Z",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:03Z",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:04Z",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-01T10:00:05Z",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2023-01-01T10:00:06Z",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-02T10:00:01Z",
        },
        {
          gameId: "g2",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-02T10:00:02Z",
        },
        {
          gameId: "g2",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-02T10:00:03Z",
        },
        {
          gameId: "g2",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-02T10:00:04Z",
        },
        {
          gameId: "g2",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2023-01-02T10:00:05Z",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 5,
          period: 1,
          timestamp: "2023-01-02T10:00:06Z",
        },
      ];
      const results = calculateLineupStats(stats);
      expect(results.length).toBe(1);
      expect(results[0].pointsFor).toBe(7);
      expect(results[0].seconds).toBe(1200);
    });

    it("handles simultaneous events using priority (SUB_IN > MAKE > SUB_OUT)", () => {
      const players = [{ id: "p1", name: "Player 1" }];
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

      // calculatePlayerAggregates calls sortStats
      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      // If SUB_IN didn't come first, p1 wouldn't have been "active" to get the 2 points
      // because they would have been SUB_IN'd *after* the MAKE in the processing loop.
      expect(p1.points).toBe(2);
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

  describe("calculatePossessions", () => {
    it("calculates possessions accurately using the standard formula", () => {
      // FGA + 0.44 * FTA + TO - OREB
      // 10 + 0.44 * 10 + 2 - 1 = 10 + 4.4 + 2 - 1 = 15.4
      expect(calculatePossessions(10, 10, 2, 1)).toBeCloseTo(15.4);
    });

    it("handles zero values", () => {
      expect(calculatePossessions(0, 0, 0, 0)).toBe(0);
    });
  });

  describe("calculatePpp", () => {
    it("calculates points per possession correctly", () => {
      expect(calculatePpp(20, 10)).toBe("2.00");
      expect(calculatePpp(15, 10)).toBe("1.50");
    });

    it("returns 0.00 for zero possessions", () => {
      expect(calculatePpp(10, 0)).toBe("0.00");
    });
  });

  describe("calculateOpponentThreats", () => {
    it("identifies a hot opponent based on points (>= 8)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateOpponentThreats(stats);
      expect(result.length).toBe(1);
      expect(result[0].playerId).toBe("OPPONENT:1");
      expect(result[0].isHot).toBe(true);
    });

    it("identifies a hot opponent based on consecutive makes (>= 3)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateOpponentThreats(stats);
      expect(result.length).toBe(1);
      expect(result[0].playerId).toBe("OPPONENT:2");
      expect(result[0].isHot).toBe(true);
    });

    it("resets consecutive makes on a miss and straight points on team score", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "PLAYER:1", // Our team scores
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2.5",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MISS,
          points: 2,
          timestamp: "3",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "4",
          period: 1,
        },
      ];
      const result = calculateOpponentThreats(stats);
      // Only 6 points total, no 3 consecutive makes, and straight points reset by team score
      expect(result.length).toBe(0);
    });

    it("identifies a hot opponent based on straight points (>= 6)", () => {
      const stats = [
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:3",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2",
          period: 1,
        },
      ];
      const result = calculateOpponentThreats(stats);
      expect(result.length).toBe(1);
      expect(result[0].straightPoints).toBe(6);
      expect(result[0].isHot).toBe(true);
    });
  });

  describe("isClutchEvent", () => {
    it("returns true for clutch situations", () => {
      // Period 4, 2:00 left, 3 point lead
      expect(isClutchEvent(4, 120, 3, "QUARTERS")).toBe(true);
      // Period 2, 0:30 left, 5 point deficit
      expect(isClutchEvent(2, 30, -5, "HALVES")).toBe(true);
    });

    it("returns false if not in final period", () => {
      expect(isClutchEvent(3, 120, 2, "QUARTERS")).toBe(false);
      expect(isClutchEvent(1, 60, 0, "HALVES")).toBe(false);
    });

    it("returns false if clock > 4 minutes", () => {
      expect(isClutchEvent(4, 241, 2, "QUARTERS")).toBe(false);
    });

    it("returns false if score diff > 5", () => {
      expect(isClutchEvent(4, 60, 6, "QUARTERS")).toBe(false);
      expect(isClutchEvent(4, 60, -10, "QUARTERS")).toBe(false);
    });
  });

  describe("clutch filtering in aggregates", () => {
    const players = [{ id: "p1", name: "Player 1" }];
    const stats: StatEvent[] = [
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 300,
        timestamp: "1",
      },
      {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 4,
        clockTime: 120, // Clutch!
        timestamp: "2",
      },
    ];

    it("calculatePlayerAggregates filters clutch events", () => {
      const all = calculatePlayerAggregates(players, stats);
      expect(all[0].points).toBe(4);

      const clutch = calculatePlayerAggregates(players, stats, [], "total", {
        clutchOnly: true,
        periodType: "QUARTERS",
      });
      expect(clutch[0].points).toBe(2);
    });

    it("calculateLineupStats filters clutch stints", () => {
      const lineupStats = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "0",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "0.1",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "0.2",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "0.3",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: "0.4",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 4,
          clockTime: 120, // Clutch make
          timestamp: "10",
        },
      ];

      const all = calculateLineupStats(lineupStats);
      expect(all[0].pointsFor).toBe(2);

      const clutch = calculateLineupStats(lineupStats, {
        clutchOnly: true,
        periodType: "QUARTERS",
      });
      expect(clutch[0].pointsFor).toBe(2);
      // It should still have 2 points because the make itself is clutch
    });
  });

  describe("isOpponentId", () => {
    it("returns true for exact 'OPPONENT' ID", () => {
      expect(isOpponentId("OPPONENT")).toBe(true);
    });

    it("returns true for jersey-prefixed opponent IDs", () => {
      expect(isOpponentId("OPPONENT:12")).toBe(true);
      expect(isOpponentId("OPPONENT:0")).toBe(true);
    });

    it("returns false for regular player IDs", () => {
      expect(isOpponentId("p1")).toBe(false);
      expect(isOpponentId("some-uuid-v4")).toBe(false);
    });

    it("returns false for IDs that happen to contain the word opponent but not as prefix", () => {
      expect(isOpponentId("NOT_OPPONENT")).toBe(false);
      expect(isOpponentId("PLAYER_OPPONENT")).toBe(false);
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

    it("resets stop streak on any team foul (FOUL, TECHNICAL_FOUL, etc.)", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
          period: 1,
        },
        // Stop earned, streak = 1
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          timestamp: "2",
          period: 1,
        },
        // Foul resets streak to 0
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "3",
          period: 1,
        },
        // Stop earned, streak = 1
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(2);
      expect(result.currentStreak).toBe(1);
    });

    it("differentiates between offensive and defensive fouls for stop streak", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "1",
          period: 1,
        },
        // Streak = 1. Now we commit an offensive foul (while we have ball)
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
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
      // isOurPossession becomes true after first TO. p1 FOUL is offensive -> streak NOT reset.
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(2);
      expect(result.currentStreak).toBe(2);
    });

    it("awards a stop for opponent offensive fouls", () => {
      const stats: StatEvent[] = [
        // Opponent has ball, they commit a foul (offensive)
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.FOUL,
          timestamp: "1",
          period: 1,
        },
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(1);
      expect(result.currentStreak).toBe(1);
    });
  });

  describe("getClutchSeconds", () => {
    it("calculates overlap correctly when stint spans the clutch threshold", () => {
      // Regulation clutch starts at 240s in QUARTERS.
      // Stint from 300s to 120s should have 120s of clutch (240 - 120).
      const clutch = getClutchSeconds(4, 300, 120, 2, "QUARTERS");
      expect(clutch).toBe(120);
    });

    it("returns 0 if score difference is too large", () => {
      const clutch = getClutchSeconds(4, 100, 0, 10, "QUARTERS");
      expect(clutch).toBe(0);
    });

    it("returns full interval in overtime regardless of time", () => {
      const clutch = getClutchSeconds(5, 300, 200, 2, "QUARTERS");
      expect(clutch).toBe(100);
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

  describe("calculateOpponentScoutingStats", () => {
    it("aggregates stats for opponent players across multiple games", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:24",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g2",
          playerId: "OPPONENT:24",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g2",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculateOpponentScoutingStats(stats);
      const opp24 = result.get("OPPONENT:24")!;
      expect(opp24.points).toBe(5);
      expect(opp24.makes).toBe(2);
      expect(result.get("OPPONENT:10")?.points).toBe(2);
    });
  });

  describe("calculatePlayEfficiency", () => {
    it("calculates efficiency metrics for named plays", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          playName: "SLOB",
          timestamp: "1",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MISS,
          points: 3,
          playName: "SLOB",
          timestamp: "2",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          playName: "SLOB",
          timestamp: "3",
          period: 1,
        },
      ];
      const result = calculatePlayEfficiency(stats);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("SLOB");
      expect(result[0].attempts).toBe(2);
      expect(result[0].points).toBe(2);
      // Possessions = FGA (2) + 0.44 * FTA (0) + TO (1) - OREB (0) = 3
      expect(result[0].ppp).toBe("0.67");
    });
  });

  describe("calculateTeamSeasonAverages", () => {
    it("returns team season ppp average", () => {
      const games: Game[] = [
        {
          id: "g1",
          completed: 1,
          teamId: "t1",
          opponent: "Opp",
          date: "2023-01-01",
          location: "Home",
        },
      ];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
          period: 1,
        },
      ];
      const result = calculateTeamSeasonAverages(games, stats);
      // 1 possession (1 make), 2 points -> PPP 2.00
      expect(result.ppp).toBe("2.00");
    });
  });

  describe("calculateMatchupStats", () => {
    it("attributes points allowed to the assigned defender", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          relatedPlayerId: "p1",
          type: ACTION_TYPES.MATCHUP,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          relatedPlayerId: "p2",
          type: ACTION_TYPES.MATCHUP,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "4",
        },
      ];

      const results = calculateMatchupStats(stats);
      const m1 = results.find(
        (r) => r.ourPlayerId === "p1" && r.opponentPlayerId === "OPPONENT:10",
      )!;
      const m2 = results.find(
        (r) => r.ourPlayerId === "p2" && r.opponentPlayerId === "OPPONENT:10",
      )!;

      expect(m1.pointsAllowed).toBe(2);
      expect(m2.pointsAllowed).toBe(3);
    });

    it("attributes stops correctly to defender", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          relatedPlayerId: "p1",
          type: ACTION_TYPES.MATCHUP,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.TURNOVER,
          period: 1,
          timestamp: "2",
        },
      ];
      const results = calculateMatchupStats(stats);
      const m1 = results.find(
        (r) => r.ourPlayerId === "p1" && r.opponentPlayerId === "OPPONENT:10",
      )!;
      expect(m1.stops).toBe(1);
      expect(m1.stopPct).toBe("100.0");
    });
  });

  describe("calculateOnOffStats", () => {
    it("calculates ON and OFF impact stats correctly", () => {
      const players = [
        { id: "p1", name: "Player 1" },
        { id: "p2", name: "Player 2" },
      ];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        // p1 is ON, p2 is OFF. Team scores.
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2",
        },
        // p1 is ON, p2 is OFF. Opponent scores.
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 300,
          period: 1,
          timestamp: "5",
        },
        // p1 is OFF, p2 is ON. Team scores.
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "6",
        },
      ];

      const result = calculateOnOffStats(players, stats);
      const p1 = result.find((r) => r.playerId === "p1")!;
      const p2 = result.find((r) => r.playerId === "p2")!;

      // p1 was ON for 2 team pts and 3 opp pts.
      expect(p1.onPointsFor).toBe(2);
      expect(p1.onPointsAgainst).toBe(3);
      // p1 was OFF for 3 team pts and 0 opp pts.
      expect(p1.offPointsFor).toBe(3);
      expect(p1.offPointsAgainst).toBe(0);

      // p2 was ON for 3 team pts and 0 opp pts.
      expect(p2.onPointsFor).toBe(3);
      expect(p2.onPointsAgainst).toBe(0);
      // p2 was OFF for 2 team pts and 3 opp pts.
      expect(p2.offPointsFor).toBe(2);
      expect(p2.offPointsAgainst).toBe(3);
    });

    it("isolates game totals correctly for On/Off calculation (multi-game isolation)", () => {
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
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "3",
        },
        // Game 2
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "5",
        },
      ];
      // Total game points: 5. p1 ON for 5. p1 OFF should be 0.
      const result = calculateOnOffStats(players, stats);
      const p1 = result[0];
      expect(p1.onPointsFor).toBe(5);
      expect(p1.offPointsFor).toBe(0);
    });

    it("verifies OFF stats are exactly zero when a player is on the court for the whole game", () => {
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
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "OPPONENT",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "3",
        },
        // No SUB_OUT
      ];
      const result = calculateOnOffStats(players, stats);
      const p1 = result[0];

      expect(p1.onPointsFor).toBe(2);
      expect(p1.onPointsAgainst).toBe(2);
      expect(p1.offPointsFor).toBe(0);
      expect(p1.offPointsAgainst).toBe(0);
      expect(p1.offPossessions).toBe(0);
      expect(p1.netDifferential).toBe("0.0");
    });
  });

  describe("calculatePlayerStintTimeline", () => {
    it("records a basic stint correctly", () => {
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
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          period: 1,
          timestamp: "2",
        },
      ];
      const result = calculatePlayerStintTimeline(stats);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        playerId: "p1",
        period: 1,
        startClock: 600,
        endClock: 300,
      });
    });

    it("handles multi-period stints (staying on court)", () => {
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
        // Action in P2 without sub
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          period: 2,
          clockTime: 400,
          timestamp: "3",
        },
      ];
      const result = calculatePlayerStintTimeline(stats);
      // P1: 600-0, P2: 600-0 (end of game)
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        playerId: "p1",
        period: 1,
        startClock: 600,
        endClock: 0,
      });
      expect(result[1]).toEqual({
        playerId: "p1",
        period: 2,
        startClock: 600,
        endClock: 0,
      });
    });
  });

  describe("calculateTargetAttackStats", () => {
    const playerStats: PlayerAggregates[] = [
      {
        id: "p1",
        name: "Attacker 1",
        efgPct: "60.0",
        attempts: 5,
      } as PlayerAggregates,
      {
        id: "p2",
        name: "Attacker 2",
        efgPct: "40.0",
        attempts: 5,
      } as PlayerAggregates,
    ];

    it("identifies the opponent defender with highest PPP allowed", () => {
      const matchups: MatchupStats[] = [
        {
          opponentPlayerId: "OPPONENT:1",
          pointsAllowed: 10,
          possessions: 5,
          isOpponentDefender: true,
        } as MatchupStats,
        {
          opponentPlayerId: "OPPONENT:2",
          pointsAllowed: 2,
          possessions: 5,
          isOpponentDefender: true,
        } as MatchupStats,
      ];
      const result = calculateTargetAttackStats(matchups, playerStats);
      expect(result?.targetOpponentId).toBe("OPPONENT:1");
      expect(result?.pppAllowed).toBe("2.00");
      expect(result?.suggestedAttackerId).toBe("p1");
    });

    it("returns null if no opponent defenders are tracked", () => {
      const result = calculateTargetAttackStats([], playerStats);
      expect(result).toBeNull();
    });
  });

  describe("calculateTimeoutRecommendation", () => {
    it("recommends timeout on 10-0 run", () => {
      const result = calculateTimeoutRecommendation({
        opponentRun: "10-0",
        teamFoulTrouble: false,
        clutchMode: false,
        timeoutsRemaining: 3,
        isClockRunning: true,
        scoreSpread: -2,
        clockSeconds: 300,
        period: 1,
      });
      expect(result?.recommendation).toContain("STOP THE RUN");
      expect(result?.urgency).toBe("HIGH");
    });

    it("recommends timeout in late game clutch situation", () => {
      const result = calculateTimeoutRecommendation({
        opponentRun: null,
        teamFoulTrouble: false,
        clutchMode: true,
        timeoutsRemaining: 1,
        isClockRunning: false,
        scoreSpread: -2,
        clockSeconds: 20,
        period: 4,
      });
      expect(result?.recommendation).toContain("STRATEGIC");
      expect(result?.urgency).toBe("HIGH");
    });

    it("returns null recommendation when not needed", () => {
      const result = calculateTimeoutRecommendation({
        opponentRun: null,
        teamFoulTrouble: false,
        clutchMode: false,
        timeoutsRemaining: 2,
        isClockRunning: true,
        scoreSpread: 2,
        clockSeconds: 90,
        period: 2,
      });
      expect(result?.recommendation).toBeNull();
    });
  });

  describe("generatePlayerNarrative", () => {
    const player = {
      name: "John Doe",
      min: 10,
      points: 15,
      efgPct: "65.0",
      turnovers: 1,
      attempts: 8,
      fgPct: "60.0",
      threePPct: "45.0",
      threePA: 4,
    } as PlayerAggregates;

    it("generates a positive narrative for high efficiency", () => {
      const result = generatePlayerNarrative(player);
      expect(result?.strength).toContain("Elite efficiency");
    });

    it("returns null for players with low minutes", () => {
      const lowMinPlayer = { ...player, min: 0.05 } as PlayerAggregates;
      const result = generatePlayerNarrative(lowMinPlayer);
      expect(result).toBeNull();
    });

    it("identifies growth area for high turnovers", () => {
      const toPlayer = { ...player, turnovers: 5 } as PlayerAggregates;
      const result = generatePlayerNarrative(toPlayer);
      expect(result?.growth).toContain("High turnover rate");
    });
  });
});

describe("Assistant Coach Analytical Models", () => {
  const mockStats: StatEvent[] = [
    {
      id: "1",
      type: ACTION_TYPES.FOUL,
      playerId: "PLAYER:1",
      period: 1,
      clockTime: "10:00",
      timestamp: "2023-01-01T00:00:00Z",
      gameId: "G1",
    },
    {
      id: "2",
      type: ACTION_TYPES.FOUL,
      playerId: "OPPONENT:1",
      period: 1,
      clockTime: "09:00",
      timestamp: "2023-01-01T00:00:01Z",
      gameId: "G1",
    },
    {
      id: "3",
      type: ACTION_TYPES.MAKE,
      playerId: "PLAYER:1",
      points: 3,
      period: 1,
      clockTime: "08:00",
      timestamp: "2023-01-01T00:00:02Z",
      gameId: "G1",
      playName: "PnR",
    },
  ];

  it("calculateOfficiatingStats calculates correctly", () => {
    const stats = calculateOfficiatingStats(mockStats, 10);
    expect(stats.teamFouls).toBe(1);
    expect(stats.oppFouls).toBe(1);
    expect(stats.fpm).toBe(0.2);
    expect(stats.tightness).toBe("LOW");
  });

  it("calculatePaceAnalytics calculates correctly", () => {
    const pace = calculatePaceAnalytics(10, 1, 300, 10, 70, mockStats);
    expect(pace.pace).toBeGreaterThan(0);
    expect(pace.tempoDelta).toBeDefined();
  });

  it("calculateClutchPlaybookRanking ranks plays", () => {
    const rankings = calculateClutchPlaybookRanking(mockStats, 240, []);
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].playName).toBe("PnR");
  });
});
