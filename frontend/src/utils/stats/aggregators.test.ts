import { describe, it, expect } from "vitest";
import * as aggregators from "./aggregators";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { buildGameEvent, buildPlayer, buildGame } from "../../test-factories";

describe("aggregators", () => {
  describe("sortStats", () => {
    it("should sort stats by timestamp and priority", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          type: ACTION_TYPES.SUB_OUT,
          timestamp: "2026-01-01T00:00:10Z",
        }),
        buildGameEvent({
          id: "2",
          type: ACTION_TYPES.MAKE,
          timestamp: "2026-01-01T00:00:10Z",
        }),
        buildGameEvent({
          id: "3",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "2026-01-01T00:00:10Z",
        }),
        buildGameEvent({
          id: "4",
          type: ACTION_TYPES.MAKE,
          timestamp: "2026-01-01T00:00:05Z",
        }),
      ];
      const sorted = aggregators.sortStats(stats);
      expect(sorted[0].timestamp).toBe("2026-01-01T00:00:05Z");
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
      expect(aggregators.isActive(buildGameEvent())).toBe(true);
      expect(
        aggregators.isActive(buildGameEvent({ deletedAt: "2023-01-01" })),
      ).toBe(false);
    });
  });

  describe("isScoringEvent", () => {
    it("should return true for MAKE", () => {
      expect(
        aggregators.isScoringEvent(buildGameEvent({ type: ACTION_TYPES.MAKE })),
      ).toBe(true);
      expect(
        aggregators.isScoringEvent(buildGameEvent({ type: ACTION_TYPES.MISS })),
      ).toBe(false);
    });
  });

  describe("isFoulAction", () => {
    it("should return true for foul types", () => {
      expect(
        aggregators.isFoulAction(buildGameEvent({ type: ACTION_TYPES.FOUL })),
      ).toBe(true);
      expect(
        aggregators.isFoulAction(
          buildGameEvent({ type: ACTION_TYPES.TECHNICAL_FOUL }),
        ),
      ).toBe(true);
      expect(
        aggregators.isFoulAction(buildGameEvent({ type: ACTION_TYPES.MAKE })),
      ).toBe(false);
    });
  });

  describe("isFieldGoal", () => {
    it.each([
      [ACTION_TYPES.MAKE, 2, true],
      [ACTION_TYPES.MAKE, 3, true],
      [ACTION_TYPES.MISS, 2, true],
      [ACTION_TYPES.MISS, 3, true],
      [ACTION_TYPES.MAKE, 1, false], // Free throw
      [ACTION_TYPES.MISS, 1, false], // Free throw
      [ACTION_TYPES.REBOUND, 0, false],
    ])("isFieldGoal(%s, points: %d) should be %s", (type, points, expected) => {
      expect(aggregators.isFieldGoal(buildGameEvent({ type, points }))).toBe(
        expected,
      );
    });
  });

  describe("calcPct", () => {
    it("should calculate percentage correctly", () => {
      expect(aggregators.calcPct(1, 2)).toBe("50.0");
      expect(aggregators.calcPct(1, 3)).toBe("33.3");
      expect(aggregators.calcPct(0, 0)).toBe("0.0");
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
  });

  describe("calculateEfgPct", () => {
    it("should calculate eFG% correctly", () => {
      // (Makes + 0.5 * 3PM) / Attempts
      // (4 + 0.5 * 2) / 10 = 5 / 10 = 50%
      expect(aggregators.calculateEfgPct(4, 2, 10)).toBe("50.0");
    });
  });

  describe("calculateTsPct", () => {
    it("should calculate TS% correctly", () => {
      // Points / (2 * (FGA + 0.44 * FTA))
      // 10 / (2 * (10 + 0.44 * 0)) = 10 / 20 = 50%
      expect(aggregators.calculateTsPct(10, 10, 0)).toBe("50.0");
    });
  });

  describe("getInitials", () => {
    it("should return initials", () => {
      expect(aggregators.getInitials("John Doe")).toBe("JD");
      expect(aggregators.getInitials("   Jane   Smith   ")).toBe("JS");
      expect(aggregators.getInitials("Single")).toBe("S");
      expect(aggregators.getInitials(null)).toBe("");
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
    });

    it("should resolve player name", () => {
      expect(aggregators.getPlayerDisplayName("p1", namesMap)).toBe(
        "Player One",
      );
      expect(aggregators.getPlayerDisplayName("unknown", namesMap)).toBe(
        "Unknown Player",
      );
    });

    it("should resolve team timeout name gracefully", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
          new Map(),
        ),
      ).toBe("Our Team");
    });

    it("should resolve opponent without name map gracefully", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OPPONENT,
          new Map(),
        ),
      ).toBe("Opponent");
    });

    it("should resolve team without team name gracefully", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OUR_TEAM,
          new Map(),
        ),
      ).toBe("Our Team");
    });

    it("should resolve opponent jersey without game opponent gracefully", () => {
      expect(
        aggregators.getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OPPONENT + ":23",
          new Map(),
        ),
      ).toBe("Opponent #23");
    });
  });

  describe("getBonusStatus", () => {
    describe("QUARTERS", () => {
      it.each([
        [0, false, "default"],
        [4, false, "warning.main"],
        [5, true, "error.main"],
      ])(
        "getBonusStatus(%d fouls, QUARTERS) should have isBonus=%s and color=%s",
        (fouls, isBonus, color) => {
          const res = aggregators.getBonusStatus(fouls, "QUARTERS");
          expect(res.isBonus).toBe(isBonus);
          expect(res.color).toBe(color);
        },
      );
    });

    describe("HALVES", () => {
      it.each([
        [0, false, false, "default"],
        [6, false, false, "warning.main"],
        [7, true, false, "error.main"],
        [10, true, true, "error.main"],
      ])(
        "getBonusStatus(%d fouls, HALVES) should have isBonus=%s, isDouble=%s, and color=%s",
        (fouls, isBonus, isDouble, color) => {
          const res = aggregators.getBonusStatus(fouls, "HALVES");
          expect(res.isBonus).toBe(isBonus);
          expect(res.isDouble).toBe(isDouble);
          expect(res.color).toBe(color);
        },
      );
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
        hockeyAssists: 0,
        steals: 0,
        turnovers: 0,
        fouls: 0,
        blocks: 0,
      };

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MAKE, points: 2 }),
      );
      expect(agg.points).toBe(2);
      expect(agg.makes).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MAKE, points: 3 }),
      );
      expect(agg.threePM).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MISS, points: 2 }),
      );
      expect(agg.attempts).toBe(3);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MISS, points: 3 }),
      );
      expect(agg.threePA).toBe(2);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MAKE, points: 1 }),
      );
      expect(agg.ftm).toBe(1);
      expect(agg.fta).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MISS, points: 1 }),
      );
      expect(agg.fta).toBe(2);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.REBOUND }),
      );
      expect(agg.rebounds).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.OFF_REBOUND }),
      );
      expect(agg.offRebounds).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.DEF_REBOUND }),
      );
      expect(agg.defRebounds).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.FOUL }),
      );
      expect(agg.fouls).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.STEAL }),
      );
      expect(agg.steals).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.TURNOVER }),
      );
      expect(agg.turnovers).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.ASSIST }),
      );
      expect(agg.assists).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.HOCKEY_ASSIST }),
      );
      expect(agg.hockeyAssists).toBe(1);

      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.BLOCK }),
      );
      expect(agg.blocks).toBe(1);
    });
  });

  describe("calculateTeamAggregates", () => {
    it("should calculate team aggregates correctly", () => {
      const games = [buildGame({ id: "g1", completed: 1 })];
      const stats = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 2,
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
        }),
        buildGameEvent({
          id: "4",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 2,
        }),
        buildGameEvent({
          id: "5",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
        }), // FT make
        buildGameEvent({
          id: "6",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
        }), // FT miss
        buildGameEvent({
          id: "7",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 1,
        }), // Opp FT make
        buildGameEvent({
          id: "8",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MISS,
          points: 1,
        }), // Opp FT miss
        buildGameEvent({
          id: "9",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
        }),
        buildGameEvent({
          id: "10",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        }),
        buildGameEvent({
          id: "11",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.OFF_REBOUND,
        }),
        buildGameEvent({
          id: "12",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.OFF_REBOUND,
        }),
        buildGameEvent({
          id: "13",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.DEF_REBOUND,
        }),
        buildGameEvent({
          id: "14",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
        }),
        buildGameEvent({
          id: "15",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
        }),
        buildGameEvent({
          id: "16",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.ASSIST,
        }),
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.ppg).toBe("3.0");
      expect(agg.oppg).toBe("4.0");
      expect(agg.record).toBe("0-1");
      expect(agg.apg).toBe("1.0");
    });

    it("should handle draws", () => {
      const games = [buildGame({ id: "g1", completed: 1 })];
      const stats = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 2,
        }),
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats);
      expect(agg.record).toBe("0-0-1");
    });

    it("should handle opponent defensive rebounds and non-completed games", () => {
      const games = [buildGame({ id: "g1", completed: 0 })];
      const stats = [
        buildGameEvent({
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.DEF_REBOUND,
        }),
      ];
      const agg = aggregators.calculateTeamAggregates(games, stats, false);
      expect(agg.totalGames).toBe(1);
    });

    it("should handle empty stats and games", () => {
      const agg = aggregators.calculateTeamAggregates([], []);
      expect(agg.totalGames).toBe(0);
      expect(agg.ppg).toBe("0.0");
    });
  });

  describe("calculateOpponentAggregates", () => {
    it("should calculate opponent aggregates correctly", () => {
      const stats = [
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
        }),
        buildGameEvent({
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.TURNOVER,
        }),
      ];
      const agg = aggregators.calculateOpponentAggregates(stats);
      expect(agg.points).toBe(3);
      expect(agg.turnovers).toBe(1);
    });
  });

  describe("calculateGameResult", () => {
    it("should calculate game result correctly", () => {
      const stats = [
        buildGameEvent({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
        }),
        buildGameEvent({
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 1,
        }),
      ];
      const result = aggregators.calculateGameResult("g1", stats);
      expect(result.teamScore).toBe(2);
      expect(result.oppScore).toBe(1);
      expect(result.result).toBe("W");
    });
  });

  describe("initializeStatsMap", () => {
    it("should initialize stats map for players", () => {
      const players = [buildPlayer({ id: "p1", name: "Jacob" })];
      const teamPlayers = [{ playerId: "p1", teamId: "t1", jerseyNumber: "10" } as any];
      const statsMap = aggregators.initializeStatsMap(players, teamPlayers);
      expect(statsMap.has("p1")).toBe(true);
      expect(statsMap.get("p1")?.jerseyNumber).toBe("10");
    });
  });

  describe("calculateTeamSeasonAverages", () => {
    it("should calculate season averages", () => {
      const games = [buildGame({ id: "g1", completed: 1 })];
      const stats = [
        buildGameEvent({ gameId: "g1", type: ACTION_TYPES.MAKE, points: 2 }),
      ];
      const avgs = aggregators.calculateTeamSeasonAverages(games, stats);
      expect(avgs.ppp).toBeDefined();
    });
  });

  describe("getBonusStatus edge cases", () => {
    it("should handle custom thresholds", () => {
      const res = aggregators.getBonusStatus(3, "QUARTERS", 3, 5);
      expect(res.isBonus).toBe(true);
      expect(res.isDouble).toBe(false);
    });

    it("should handle double bonus with custom threshold", () => {
      const res = aggregators.getBonusStatus(5, "QUARTERS", 3, 5);
      expect(res.isDouble).toBe(true);
    });

    it("should handle bonus label and color", () => {
      const res = aggregators.getBonusStatus(5, "QUARTERS");
      expect(res.label).toBe("BONUS");
      expect(res.color).toBe("error.main");
    });

    it("should handle double bonus label", () => {
      const res = aggregators.getBonusStatus(10, "HALVES");
      expect(res.isDouble).toBe(true);
      expect(res.label).toBe("BONUS");
    });
  });

  describe("isEventInPeriod", () => {
    it("should handle QUARTERS", () => {
      expect(aggregators.isEventInPeriod(1, 1, "QUARTERS")).toBe(true);
      expect(aggregators.isEventInPeriod(4, 4, "QUARTERS")).toBe(true);
      expect(aggregators.isEventInPeriod(5, 4, "QUARTERS")).toBe(true); // OT
      expect(aggregators.isEventInPeriod(1, 2, "QUARTERS")).toBe(false);
    });

    it("should handle HALVES", () => {
      expect(aggregators.isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(aggregators.isEventInPeriod(2, 2, "HALVES")).toBe(true);
      expect(aggregators.isEventInPeriod(3, 2, "HALVES")).toBe(true); // OT
      expect(aggregators.isEventInPeriod(1, 2, "HALVES")).toBe(false);
      expect(aggregators.isEventInPeriod(2, 1, "HALVES")).toBe(false);
    });

    it("should fallback to QUARTERS if type unknown", () => {
      expect(aggregators.isEventInPeriod(1, 1, "UNKNOWN")).toBe(true);
    });
  });

  describe("calculatePossessions edge cases", () => {
    it("should handle 0 possessions in calculatePpp", () => {
      expect(aggregators.calculatePpp(10, 0)).toBe("0.00");
    });
  });

  describe("applyActionToAggregate edge cases", () => {
    it("should handle undefined points", () => {
      const agg: any = { points: 0, makes: 0, attempts: 0 };
      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MAKE, points: undefined }),
      );
      expect(agg.points).toBe(0);
    });

    it("should skip threePM if agg has no threePM", () => {
      const agg: any = { points: 0, makes: 0, attempts: 0 };
      aggregators.applyActionToAggregate(
        agg,
        buildGameEvent({ type: ACTION_TYPES.MAKE, points: 3 }),
      );
      expect(agg.threePM).toBeUndefined();
    });
  });
});

  describe("applyActionToAggregate additional cases", () => {
    it("handles 3pt attempt without threePM property in agg", () => {
      const agg: any = { makes: 0, attempts: 0, points: 0 };
      aggregators.applyActionToAggregate(agg, buildGameEvent({ type: ACTION_TYPES.MAKE, points: 3 }));
      expect(agg.points).toBe(3);
      expect(agg.threePM).toBeUndefined();
    });

    it("handles FT attempt without ftm/fta properties in agg", () => {
      const agg: any = { points: 0 };
      aggregators.applyActionToAggregate(agg, buildGameEvent({ type: ACTION_TYPES.MAKE, points: 1 }));
      expect(agg.points).toBe(1);
      expect(agg.ftm).toBeUndefined();
    });
  });

  describe("getBonusStatus additional cases", () => {
    it("handles edge case fouls exactly at warning threshold", () => {
       // Config for QUARTERS is single: 5, so warning: 4.
       const status = aggregators.getBonusStatus(4, "QUARTERS");
       expect(status.color).toBe("warning.main");
    });
  });
