import { describe, it, expect } from "vitest";
import {
  sortStats,
  isOpponentId,
  isActive,
  isScoringEvent,
  isFoulAction,
  isFreeThrow,
  isThreePointAttempt,
  isFieldGoal,
  calcPct,
  calculateFgPct,
  calculatePpp,
  calculatePossessions,
  calculateFtPct,
  calculateEfgPct,
  calculateTsPct,
  getInitials,
  getPlayerDisplayName,
  getBonusStatus,
  updateScores,
  applyActionToAggregate,
  isEventInPeriod,
} from "./helpers";
import { StatEvent } from "../../db";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { BaseStats } from "./types";

describe("helpers.ts", () => {
  describe("sortStats", () => {
    it("sorts stats chronologically and prioritizes SUB_IN over other actions at the same timestamp", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          timestamp: "2026-09-20T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          timestamp: "2026-09-20T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          timestamp: "2026-09-20T10:00:00Z",
          period: 1,
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          timestamp: "2026-09-20T09:59:59Z",
          period: 1,
        },
      ];

      const sorted = sortStats(stats);
      expect(sorted[0].timestamp).toBe("2026-09-20T09:59:59Z");
      expect(sorted[1].type).toBe(ACTION_TYPES.SUB_IN);
      expect(sorted[2].type).toBe(ACTION_TYPES.MAKE);
      expect(sorted[3].type).toBe(ACTION_TYPES.SUB_OUT);
    });
  });

  describe("isOpponentId", () => {
    it("identifies opponent IDs and guards empty strings / non-opponent IDs", () => {
      expect(isOpponentId("")).toBe(false);
      expect(isOpponentId(SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
      expect(isOpponentId(`${SPECIAL_PLAYER_IDS.OPPONENT}:23`)).toBe(true);
      expect(isOpponentId("p123")).toBe(false);
      expect(isOpponentId("OUR_TEAM")).toBe(false);
    });
  });

  describe("isActive", () => {
    it("returns true for non-deleted stat events and false for deleted ones", () => {
      const activeStat: StatEvent = {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        timestamp: "t1",
      };
      const deletedStat: StatEvent = {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        timestamp: "t1",
        deletedAt: "2026-09-20T10:05:00Z",
      };

      expect(isActive(activeStat)).toBe(true);
      expect(isActive(deletedStat)).toBe(false);
    });
  });

  describe("isScoringEvent", () => {
    it("returns true for MAKE actions and false for others", () => {
      expect(
        isScoringEvent({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);

      expect(
        isScoringEvent({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(false);
    });
  });

  describe("isFoulAction", () => {
    it("identifies all foul action types including Class A and Class B technicals", () => {
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL_SHOOTING,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL_NON_SHOOTING,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL_CLASS_A,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.TECHNICAL_FOUL_CLASS_B,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(true);
      expect(
        isFoulAction({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
          period: 1,
          timestamp: "t1",
        }),
      ).toBe(false);
    });
  });

  describe("isFreeThrow, isThreePointAttempt, isFieldGoal", () => {
    it("identifies free throws, 3-pointers, and field goal attempts", () => {
      const ft: StatEvent = {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 1,
        period: 1,
        timestamp: "t1",
      };
      const fg2: StatEvent = {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "t1",
      };
      const fg3: StatEvent = {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 3,
        period: 1,
        timestamp: "t1",
      };

      expect(isFreeThrow(ft)).toBe(true);
      expect(isFreeThrow(fg2)).toBe(false);

      expect(isThreePointAttempt(fg3)).toBe(true);
      expect(isThreePointAttempt(fg2)).toBe(false);

      expect(isFieldGoal(fg2)).toBe(true);
      expect(isFieldGoal(fg3)).toBe(true);
      expect(isFieldGoal(ft)).toBe(false);
    });
  });

  describe("percentages and efficiency math", () => {
    it("calcPct handles 0 or negative denominators", () => {
      expect(calcPct(5, 0)).toBe("0.0");
      expect(calcPct(5, -1)).toBe("0.0");
      expect(calcPct(1, 2)).toBe("50.0");
    });

    it("calculateFgPct and calculateFtPct format percentages", () => {
      expect(calculateFgPct(3, 4)).toBe("75.0");
      expect(calculateFtPct(4, 5)).toBe("80.0");
    });

    it("calculatePpp calculates points per possession", () => {
      expect(calculatePpp(10, 0)).toBe("0.00");
      expect(calculatePpp(10, 5)).toBe("2.00");
    });

    it("calculatePossessions accepts positional arguments or object parameter", () => {
      // 10 FGA + 0.44 * 10 FTA + 2 TO - 1 OREB = 10 + 4.4 + 2 - 1 = 15.4
      expect(calculatePossessions(10, 10, 2, 1)).toBeCloseTo(15.4);
      expect(
        calculatePossessions({
          fga: 10,
          fta: 10,
          turnovers: 2,
          offRebounds: 1,
        }),
      ).toBeCloseTo(15.4);
    });

    it("calculateEfgPct and calculateTsPct calculate true efficiency", () => {
      // eFG%: (makes + 0.5 * 3PM) / FGA = (2 + 0.5 * 1) / 4 = 2.5 / 4 = 62.5%
      expect(calculateEfgPct(2, 1, 4)).toBe("62.5");

      // TS%: Points / (2 * (FGA + 0.44 * FTA)) = 10 / (2 * (4 + 0.44 * 2)) = 10 / 9.76 = 102.5%
      expect(calculateTsPct(10, 4, 2)).toBe("102.5");
    });
  });

  describe("getInitials", () => {
    it("handles null, undefined, and empty string names", () => {
      expect(getInitials(null)).toBe("");
      expect(getInitials(undefined)).toBe("");
      expect(getInitials("   ")).toBe("");
      expect(getInitials("Michael Jordan")).toBe("MJ");
    });
  });

  describe("getPlayerDisplayName", () => {
    it("resolves player display names across opponent, team, and map lookups", () => {
      const nameMap = new Map<string | number, string>([
        ["p1", "LeBron James"],
      ]);

      expect(
        getPlayerDisplayName(SPECIAL_PLAYER_IDS.OPPONENT, nameMap, "Eagles"),
      ).toBe("Eagles");
      expect(getPlayerDisplayName(SPECIAL_PLAYER_IDS.OPPONENT, nameMap)).toBe(
        "Opponent",
      );

      expect(
        getPlayerDisplayName(
          `${SPECIAL_PLAYER_IDS.OPPONENT}:23`,
          nameMap,
          "Eagles",
        ),
      ).toBe("Eagles #23");
      expect(
        getPlayerDisplayName(`${SPECIAL_PLAYER_IDS.OPPONENT}:23`, nameMap),
      ).toBe("Opponent #23");

      expect(
        getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
          nameMap,
          "Eagles",
          "Lakers",
        ),
      ).toBe("Lakers");
      expect(
        getPlayerDisplayName(
          SPECIAL_PLAYER_IDS.OUR_TEAM,
          nameMap,
          "Eagles",
          "Lakers",
        ),
      ).toBe("Lakers");
      expect(getPlayerDisplayName(SPECIAL_PLAYER_IDS.OUR_TEAM, nameMap)).toBe(
        "Our Team",
      );

      expect(getPlayerDisplayName("p1", nameMap)).toBe("LeBron James");
      expect(getPlayerDisplayName("p2", nameMap)).toBe("Unknown Player");
    });
  });

  describe("getBonusStatus", () => {
    it("returns correct bonus status for default and custom thresholds", () => {
      const q4 = getBonusStatus(5, "QUARTERS");
      expect(q4.isBonus).toBe(true);
      expect(q4.isDouble).toBe(true);

      const h7 = getBonusStatus(7, "HALVES");
      expect(h7.isBonus).toBe(true);
      expect(h7.isDouble).toBe(false);

      const custom = getBonusStatus(3, "QUARTERS", 2, 4);
      expect(custom.isBonus).toBe(true);
      expect(custom.isDouble).toBe(false);

      const warning = getBonusStatus(4, "QUARTERS");
      expect(warning.color).toBe("warning.main");
    });
  });

  describe("updateScores", () => {
    it("updates team and opponent score totals based on stat events", () => {
      const scores = { team: 0, opp: 0 };

      updateScores(
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          timestamp: "t1",
        },
        scores,
      );
      expect(scores.team).toBe(2);

      updateScores(
        {
          gameId: "g1",
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          type: ACTION_TYPES.MAKE,
          points: 3,
          period: 1,
          timestamp: "t2",
        },
        scores,
      );
      expect(scores.opp).toBe(3);

      updateScores(
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
          points: -1,
          period: 1,
          timestamp: "t3",
        },
        scores,
      );
      expect(scores.team).toBe(1);
    });
  });

  describe("applyActionToAggregate", () => {
    function createBaseStats(): BaseStats {
      return {
        points: 0,
        makes: 0,
        attempts: 0,
        ftm: 0,
        fta: 0,
        threePM: 0,
        threePA: 0,
        rebounds: 0,
        offRebounds: 0,
        defRebounds: 0,
        assists: 0,
        hockeyAssists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
      };
    }

    it("applies SYSTEM_ADJUSTMENT, REMOVE_FOUL, MAKE/MISS, rebounds, assists, and fouls", () => {
      const agg = createBaseStats();

      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
        points: 5,
        period: 1,
        timestamp: "t1",
      });
      expect(agg.points).toBe(5);

      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.FOUL,
        period: 1,
        timestamp: "t2",
      });
      expect(agg.fouls).toBe(1);

      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.REMOVE_FOUL,
        period: 1,
        timestamp: "t3",
      });
      expect(agg.fouls).toBe(0);

      // Free throw make
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 1,
        period: 1,
        timestamp: "t4",
      });
      expect(agg.points).toBe(6);
      expect(agg.ftm).toBe(1);
      expect(agg.fta).toBe(1);

      // 3PT make
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        timestamp: "t5",
      });
      expect(agg.points).toBe(9);
      expect(agg.makes).toBe(1);
      expect(agg.attempts).toBe(1);
      expect(agg.threePM).toBe(1);
      expect(agg.threePA).toBe(1);

      // Rebounds & stats
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.OFF_REBOUND,
        period: 1,
        timestamp: "t6",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.DEF_REBOUND,
        period: 1,
        timestamp: "t7",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.BLOCK,
        period: 1,
        timestamp: "t8",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.ASSIST,
        period: 1,
        timestamp: "t9",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.HOCKEY_ASSIST,
        period: 1,
        timestamp: "t10",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.STEAL,
        period: 1,
        timestamp: "t11",
      });
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        timestamp: "t12",
      });

      expect(agg.rebounds).toBe(2);
      expect(agg.offRebounds).toBe(1);
      expect(agg.defRebounds).toBe(1);
      expect(agg.blocks).toBe(1);
      expect(agg.assists).toBe(1);
      expect(agg.hockeyAssists).toBe(1);
      expect(agg.steals).toBe(1);
      expect(agg.turnovers).toBe(1);
    });

    it("ignores personal fouls count for Class B technical fouls", () => {
      const agg = createBaseStats();
      applyActionToAggregate(agg, {
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.TECHNICAL_FOUL_CLASS_B,
        period: 1,
        timestamp: "t1",
      });
      expect(agg.fouls).toBe(0);
    });
  });

  describe("isEventInPeriod", () => {
    it("handles period matching for QUARTERS and HALVES including overtime", () => {
      expect(isEventInPeriod(1, 1, "QUARTERS")).toBe(true);
      expect(isEventInPeriod(2, 1, "QUARTERS")).toBe(false);
      expect(isEventInPeriod(5, 5, "QUARTERS")).toBe(true);

      expect(isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(isEventInPeriod(2, 1, "HALVES")).toBe(false);
      expect(isEventInPeriod(2, 3, "HALVES")).toBe(true); // OT carries over P2 fouls
    });
  });
});
