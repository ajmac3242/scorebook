import { describe, it, expect } from "vitest";
import * as aggregators from "../aggregators";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

describe("aggregators", () => {
  describe("sortStats", () => {
    it("should sort stats by timestamp and priority", () => {
      const stats: any[] = [
        { type: ACTION_TYPES.SUB_OUT, timestamp: 100 },
        { type: ACTION_TYPES.MAKE, timestamp: 100 },
        { type: ACTION_TYPES.SUB_IN, timestamp: 100 },
        { type: ACTION_TYPES.MAKE, timestamp: 50 },
      ];
      const sorted = aggregators.sortStats(stats);
      expect(sorted[0].timestamp).toBe(50);
      expect(sorted[1].type).toBe(ACTION_TYPES.SUB_IN);
      expect(sorted[2].type).toBe(ACTION_TYPES.MAKE);
      expect(sorted[3].type).toBe(ACTION_TYPES.SUB_OUT);
    });
  });

  describe("isOpponentId", () => {
    it("should correctly identify opponent IDs", () => {
      expect(aggregators.isOpponentId(SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
      expect(
        aggregators.isOpponentId(SPECIAL_PLAYER_IDS.OPPONENT + ":10"),
      ).toBe(true);
      expect(aggregators.isOpponentId("TEAM_1")).toBe(false);
    });
  });

  describe("isActive", () => {
    it("should return true if deletedAt is missing", () => {
      expect(aggregators.isActive({} as any)).toBe(true);
      expect(aggregators.isActive({ deletedAt: "2023-01-01" } as any)).toBe(
        false,
      );
    });
  });

  describe("isScoringEvent", () => {
    it("should return true for MAKE", () => {
      expect(
        aggregators.isScoringEvent({ type: ACTION_TYPES.MAKE } as any),
      ).toBe(true);
      expect(
        aggregators.isScoringEvent({ type: ACTION_TYPES.MISS } as any),
      ).toBe(false);
    });
  });

  describe("isFoulAction", () => {
    it("should return true for foul types", () => {
      expect(aggregators.isFoulAction({ type: ACTION_TYPES.FOUL } as any)).toBe(
        true,
      );
      expect(
        aggregators.isFoulAction({ type: ACTION_TYPES.FOUL_SHOOTING } as any),
      ).toBe(true);
      expect(
        aggregators.isFoulAction({ type: ACTION_TYPES.FOUL_NON_SHOOTING } as any),
      ).toBe(true);
      expect(
        aggregators.isFoulAction({ type: ACTION_TYPES.TECHNICAL_FOUL } as any),
      ).toBe(true);
      expect(aggregators.isFoulAction({ type: ACTION_TYPES.MAKE } as any)).toBe(
        false,
      );
    });
  });

  describe("isFreeThrow", () => {
    it("should return true if points is 1", () => {
      expect(aggregators.isFreeThrow({ points: 1 } as any)).toBe(true);
      expect(aggregators.isFreeThrow({ points: 2 } as any)).toBe(false);
    });
  });

  describe("isThreePointAttempt", () => {
    it("should return true if points is 3", () => {
      expect(aggregators.isThreePointAttempt({ points: 3 } as any)).toBe(true);
      expect(aggregators.isThreePointAttempt({ points: 2 } as any)).toBe(false);
    });
  });

  describe("isFieldGoal", () => {
    it("should return true for MAKE/MISS that is not a free throw", () => {
      expect(aggregators.isFieldGoal({ type: ACTION_TYPES.MAKE, points: 2 } as any)).toBe(true);
      expect(aggregators.isFieldGoal({ type: ACTION_TYPES.MISS, points: 2 } as any)).toBe(true);
      expect(aggregators.isFieldGoal({ type: ACTION_TYPES.MAKE, points: 3 } as any)).toBe(true);
      expect(aggregators.isFieldGoal({ type: ACTION_TYPES.MAKE, points: 1 } as any)).toBe(false);
      expect(aggregators.isFieldGoal({ type: ACTION_TYPES.REBOUND } as any)).toBe(false);
    });
  });

  describe("calcPct", () => {
    it("should calculate percentage correctly", () => {
      expect(aggregators.calcPct(1, 2)).toBe("50.0");
      expect(aggregators.calcPct(1, 3)).toBe("33.3");
      expect(aggregators.calcPct(0, 0)).toBe("0.0");
      expect(aggregators.calcPct(2, 2)).toBe("100.0");
    });
  });

  describe("calculateFgPct", () => {
    it("should calculate FG% correctly", () => {
      expect(aggregators.calculateFgPct(2, 4)).toBe("50.0");
      expect(aggregators.calculateFgPct(0, 0)).toBe("0.0");
    });
  });

  describe("calculateFtPct", () => {
    it("should calculate FT% correctly", () => {
      expect(aggregators.calculateFtPct(3, 4)).toBe("75.0");
      expect(aggregators.calculateFtPct(0, 0)).toBe("0.0");
    });
  });

  describe("calculatePpp", () => {
    it("should calculate PPP correctly", () => {
      expect(aggregators.calculatePpp(10, 10)).toBe("1.00");
      expect(aggregators.calculatePpp(11, 10)).toBe("1.10");
      expect(aggregators.calculatePpp(0, 0)).toBe("0.00");
    });
  });

  describe("calculatePossessions", () => {
    it("should calculate possessions correctly with object", () => {
      const params = { fga: 10, fta: 4, turnovers: 2, offRebounds: 1 };
      // 10 + 0.44 * 4 + 2 - 1 = 10 + 1.76 + 2 - 1 = 12.76
      expect(aggregators.calculatePossessions(params)).toBe(12.76);
    });

    it("should calculate possessions correctly with individual arguments", () => {
      // 20 + 0.44 * 10 + 5 - 3 = 20 + 4.4 + 5 - 3 = 26.4
      expect(aggregators.calculatePossessions(20, 10, 5, 3)).toBe(26.4);
    });

    it("should return zero when all inputs are zero", () => {
      expect(aggregators.calculatePossessions(0, 0, 0, 0)).toBe(0);
      expect(aggregators.calculatePossessions({ fga: 0, fta: 0, turnovers: 0, offRebounds: 0 })).toBe(0);
    });
  });

  describe("calculateEfgPct", () => {
    it("should calculate eFG% correctly", () => {
      // (Makes + 0.5 * 3PM) / Attempts
      // (4 + 0.5 * 2) / 10 = 5 / 10 = 50%
      expect(aggregators.calculateEfgPct(4, 2, 10)).toBe("50.0");
      expect(aggregators.calculateEfgPct(0, 0, 0)).toBe("0.0");
    });
  });

  describe("calculateTsPct", () => {
    it("should calculate TS% correctly", () => {
      // Points / (2 * (FGA + 0.44 * FTA))
      // 10 / (2 * (10 + 0.44 * 0)) = 10 / 20 = 50%
      expect(aggregators.calculateTsPct(10, 10, 0)).toBe("50.0");
      expect(aggregators.calculateTsPct(0, 0, 0)).toBe("0.0");
    });
  });

  describe("getInitials", () => {
    it("should return initials", () => {
      expect(aggregators.getInitials("John Doe")).toBe("JD");
      expect(aggregators.getInitials("   Jane   Smith   ")).toBe("JS");
      expect(aggregators.getInitials("Single")).toBe("S");
      expect(aggregators.getInitials(null)).toBe("");
      expect(aggregators.getInitials(undefined)).toBe("");
    });
  });

  describe("getPlayerDisplayName", () => {
    const namesMap = new Map([["p1", "Player One"]]);
    it("should resolve opponent name", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OPPONENT,
          namesMap,
          "Opp Team",
        ),
      ).toBe("Opp Team");
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          namesMap,
          "Opp Team",
        ),
      ).toBe("Opp Team #10");
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OPPONENT,
          namesMap,
          undefined,
        ),
      ).toBe("Opponent");
    });

    it("should resolve team name", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OUR_TEAM,
          namesMap,
          "Opp",
          "Our Team",
        ),
      ).toBe("Our Team");
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
          namesMap,
          "Opp",
          undefined,
        ),
      ).toBe("Our Team");
    });

    it("should resolve player name", () => {
      expect(aggregators.getPlayerDisplayName("p1", namesMap)).toBe(
        "Player One",
      );
      expect(aggregators.getPlayerDisplayName("unknown", namesMap)).toBe(
        "Unknown Player",
      );
    });
  });

  describe("getBonusStatus", () => {
    it.each([
      ["QUARTERS", 0, false, false, "default"],
      ["QUARTERS", 3, false, false, "default"],
      ["QUARTERS", 4, false, false, "warning.main"],
      ["QUARTERS", 5, true, false, "error.main"],
      ["QUARTERS", 10, true, false, "error.main"],
      ["HALVES", 0, false, false, "default"],
      ["HALVES", 5, false, false, "default"],
      ["HALVES", 6, false, false, "warning.main"],
      ["HALVES", 7, true, false, "error.main"],
      ["HALVES", 9, true, false, "error.main"],
      ["HALVES", 10, true, true, "error.main"],
      ["HALVES", 15, true, true, "error.main"],
    ])("should return correct status for %s with %i fouls", (periodType, fouls, expectedBonus, expectedDouble, expectedColor) => {
      const res = aggregators.getBonusStatus(fouls, periodType);
      expect(res.isBonus).toBe(expectedBonus);
      expect(res.isDouble).toBe(expectedDouble);
      expect(res.color).toBe(expectedColor);
    });
  });

  describe("applyActionToAggregate", () => {
    it("should update aggregate for various actions", () => {
      const agg: any = {
        points: 0,
        makes: 0,
        attempts: 0,
        threePM: 0,
        threePA: 0,
        ftm: 0,
        fta: 0,
        rebounds: 0,
        offRebounds: 0,
        defRebounds: 0,
        assists: 0,
        steals: 0,
        turnovers: 0,
        fouls: 0,
        blocks: 0,
        hockeyAssists: 0,
      };

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MAKE,
        points: 2,
      } as any);
      expect(agg.points).toBe(2);
      expect(agg.makes).toBe(1);
      expect(agg.attempts).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MISS,
        points: 2,
      } as any);
      expect(agg.attempts).toBe(2);
      expect(agg.makes).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MAKE,
        points: 3,
      } as any);
      expect(agg.points).toBe(5);
      expect(agg.makes).toBe(2);
      expect(agg.attempts).toBe(3);
      expect(agg.threePM).toBe(1);
      expect(agg.threePA).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MISS,
        points: 3,
      } as any);
      expect(agg.attempts).toBe(4);
      expect(agg.threePA).toBe(2);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MAKE,
        points: 1,
      } as any);
      expect(agg.ftm).toBe(1);
      expect(agg.fta).toBe(1);
      expect(agg.points).toBe(6);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.MISS,
        points: 1,
      } as any);
      expect(agg.fta).toBe(2);
      expect(agg.ftm).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.REBOUND,
      } as any);
      expect(agg.rebounds).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.OFF_REBOUND,
      } as any);
      expect(agg.offRebounds).toBe(1);
      expect(agg.rebounds).toBe(2);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.DEF_REBOUND,
      } as any);
      expect(agg.defRebounds).toBe(1);
      expect(agg.rebounds).toBe(3);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.FOUL,
      } as any);
      expect(agg.fouls).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.BLOCK,
      } as any);
      expect(agg.blocks).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.STEAL,
      } as any);
      expect(agg.steals).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.ASSIST,
      } as any);
      expect(agg.assists).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.HOCKEY_ASSIST,
      } as any);
      expect(agg.hockeyAssists).toBe(1);

      aggregators.applyActionToAggregate(agg, {
        type: ACTION_TYPES.TURNOVER,
      } as any);
      expect(agg.turnovers).toBe(1);
    });
  });

  describe("initializeStatsMap", () => {
    it("should initialize a map of players", () => {
      const players: any[] = [{ id: "p1", name: "P1" }];
      const teamPlayers: any[] = [{ playerId: "p1", jerseyNumber: "10" }];
      const statsMap = aggregators.initializeStatsMap(players, teamPlayers);
      expect(statsMap.has("p1")).toBe(true);
      expect(statsMap.get("p1")?.jerseyNumber).toBe("10");
    });
  });

  describe("calculateTeamAggregates", () => {
    it("should calculate team aggregates correctly", () => {
      const games: any[] = [{ id: "g1", completed: 1 }];
      const stats: any[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2 },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
        },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, points: 2 },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
        },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 1 },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MISS, points: 1 },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.TURNOVER },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.OFF_REBOUND },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.DEF_REBOUND },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.ASSIST },
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.ppg).toBe("3.0");
      expect(agg.oppg).toBe("3.0");
      expect(agg.totalGames).toBe(1);
    });

    it("should handle opponent specifics", () => {
      const games: any[] = [{ id: "g1", completed: 1 }];
      const stats: any[] = [
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MISS, points: 2 },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MAKE, points: 1 },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MISS, points: 1 },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.TURNOVER },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.OFF_REBOUND },
        { gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.DEF_REBOUND },
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.oppg).toBe("1.0");
    });

    it("should handle non-opponent rebounds and assists", () => {
      const games: any[] = [{ id: "g1", completed: 1 }];
      const stats: any[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.REBOUND },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.DEF_REBOUND },
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.ASSIST },
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.rpg).toBe("2.0");
      expect(agg.apg).toBe("1.0");
    });

    it("should return empty aggregate for no stats", () => {
      const agg = aggregators.calculateTeamAggregates([], []);
      expect(agg.ppg).toBe("0.0");
      expect(agg.totalGames).toBe(0);
    });

    it("should ignore inactive stats", () => {
      const games: any[] = [{ id: "g1", completed: 1 }];
      const stats: any[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, deletedAt: "now" },
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.ppg).toBe("0.0");
    });
  });

  describe("calculateOpponentAggregates", () => {
    it("should calculate opponent aggregates correctly", () => {
      const stats: any[] = [
        {
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
        },
        {
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
        },
      ];
      const agg = aggregators.calculateOpponentAggregates(stats);
      expect(agg.points).toBe(2);
      expect(agg.attempts).toBe(2);
    });
  });

  describe("calculateGameResult", () => {
    it("should calculate game result correctly", () => {
      const stats: any[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2 },
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 1,
        },
      ];
      const res = aggregators.calculateGameResult("g1", stats);
      expect(res.teamScore).toBe(2);
      expect(res.oppScore).toBe(1);
      expect(res.result).toBe("W");
    });
  });

  describe("calculateTeamSeasonAverages", () => {
    it("should calculate averages from games and stats", () => {
      const games: any[] = [{ id: "g1", completed: 1 }];
      const stats: any[] = [
        { gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2 },
      ];
      const avgs = aggregators.calculateTeamSeasonAverages(games, stats);
      expect(avgs.ppp).toBeDefined();
      expect(avgs.ftPct).toBeDefined();
    });
  });

  describe("isEventInPeriod", () => {
    it.each([
      [1, 1, "QUARTERS", true],
      [2, 2, "QUARTERS", true],
      [4, 4, "QUARTERS", true],
      [5, 4, "QUARTERS", true],
      [6, 4, "QUARTERS", true],
      [5, 5, "QUARTERS", true],
      [1, 2, "QUARTERS", false],
      [4, 3, "QUARTERS", false],
      [1, 1, "HALVES", true],
      [2, 2, "HALVES", true],
      [3, 2, "HALVES", true],
      [3, 3, "HALVES", true],
      [2, 3, "HALVES", true],
      [1, 2, "HALVES", false],
      [2, 1, "HALVES", false],
    ])("eventPeriod %i, currentPeriod %i in %s should return %s", (eventPeriod, currentPeriod, periodType, expected) => {
      expect(aggregators.isEventInPeriod(eventPeriod, currentPeriod, periodType)).toBe(expected);
    });
  });
});
