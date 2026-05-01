import { describe, it, expect } from "vitest";
import {
  sortStats,
  getPeriodLen,
  isOpponentId,
  isActive,
  isScoringEvent,
  isFreeThrow,
  isThreePointAttempt,
  calcPct,
  initializeStatsMap,
  applyActionToAggregate,
} from "./core";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent, Player, TeamPlayer } from "../../db";
import { PlayerAggregates } from "./types";

describe("stats core utilities", () => {
  describe("sortStats", () => {
    it("sorts stats by timestamp", () => {
      const stats = [
        { id: "1", timestamp: "2023-01-01T10:00:02Z", type: ACTION_TYPES.MAKE },
        { id: "2", timestamp: "2023-01-01T10:00:01Z", type: ACTION_TYPES.MAKE },
      ] as StatEvent[];
      const sorted = sortStats(stats);
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("1");
    });

    it("sorts SUB_IN before other types at same timestamp", () => {
      const stats = [
        { id: "1", timestamp: "2023-01-01T10:00:00Z", type: ACTION_TYPES.MAKE },
        {
          id: "2",
          timestamp: "2023-01-01T10:00:00Z",
          type: ACTION_TYPES.SUB_IN,
        },
      ] as StatEvent[];
      const sorted = sortStats(stats);
      expect(sorted[0].type).toBe(ACTION_TYPES.SUB_IN);
      expect(sorted[1].type).toBe(ACTION_TYPES.MAKE);
    });

    it("sorts SUB_OUT after other types at same timestamp", () => {
      const stats = [
        {
          id: "1",
          timestamp: "2023-01-01T10:00:00Z",
          type: ACTION_TYPES.SUB_OUT,
        },
        { id: "2", timestamp: "2023-01-01T10:00:00Z", type: ACTION_TYPES.MAKE },
      ] as StatEvent[];
      const sorted = sortStats(stats);
      expect(sorted[0].type).toBe(ACTION_TYPES.MAKE);
      expect(sorted[1].type).toBe(ACTION_TYPES.SUB_OUT);
    });
  });

  describe("getPeriodLen", () => {
    it("returns 10 mins for regular period (standard)", () => {
      expect(getPeriodLen(1, {})).toBe(600);
    });
    it("returns 5 mins for OT (standard)", () => {
      expect(getPeriodLen(5, {})).toBe(300);
    });
    it("respects custom lengths", () => {
      expect(getPeriodLen(1, { periodLength: 12 })).toBe(720);
      expect(getPeriodLen(5, { overtimeLength: 2 })).toBe(120);
    });
    it("handles HALVES type", () => {
      expect(getPeriodLen(2, { periodType: "HALVES" })).toBe(600);
      expect(getPeriodLen(3, { periodType: "HALVES" })).toBe(300);
    });
  });

  describe("isOpponentId", () => {
    it("identifies opponent IDs", () => {
      expect(isOpponentId(SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
      expect(isOpponentId(SPECIAL_PLAYER_IDS.OPPONENT + ":12")).toBe(true);
      expect(isOpponentId("P123")).toBe(false);
      expect(isOpponentId(null)).toBe(false);
      expect(isOpponentId("")).toBe(false);
    });
  });

  describe("helper predicates", () => {
    it("isActive works", () => {
      expect(isActive({} as StatEvent)).toBe(true);
      expect(isActive({ deletedAt: "some" } as StatEvent)).toBe(false);
    });
    it("isScoringEvent works", () => {
      expect(isScoringEvent({ type: ACTION_TYPES.MAKE } as StatEvent)).toBe(
        true,
      );
      expect(isScoringEvent({ type: ACTION_TYPES.MISS } as StatEvent)).toBe(
        false,
      );
    });
    it("isFreeThrow works", () => {
      expect(isFreeThrow({ points: 1 } as StatEvent)).toBe(true);
      expect(isFreeThrow({ points: 2 } as StatEvent)).toBe(false);
    });
    it("isThreePointAttempt works", () => {
      expect(isThreePointAttempt({ points: 3 } as StatEvent)).toBe(true);
      expect(isThreePointAttempt({ points: 2 } as StatEvent)).toBe(false);
    });
  });

  describe("calcPct", () => {
    it("calculates percentage correctly", () => {
      expect(calcPct(1, 2)).toBe("50.0");
      expect(calcPct(0, 5)).toBe("0.0");
      expect(calcPct(5, 0)).toBe("0.0");
    });
  });

  describe("initializeStatsMap", () => {
    it("initializes a map with players and jersey numbers", () => {
      const players = [
        { id: "p1", name: "Player 1", avatarColor: "red" },
      ] as unknown as Player[];
      const teamPlayers = [
        { playerId: "p1", jerseyNumber: "10" },
      ] as unknown as TeamPlayer[];
      const map = initializeStatsMap(players, teamPlayers);
      expect(map.has("p1")).toBe(true);
      expect(map.get("p1")?.name).toBe("Player 1");
      expect(map.get("p1")?.jerseyNumber).toBe("10");
    });
  });

  describe("applyActionToAggregate", () => {
    it("handles MAKE (2PT)", () => {
      const agg = { points: 0, makes: 0, attempts: 0 } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MAKE, points: 2 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.points).toBe(2);
      expect(agg.makes).toBe(1);
      expect(agg.attempts).toBe(1);
    });

    it("handles MAKE (FT)", () => {
      const agg = { points: 0, ftm: 0, fta: 0 } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MAKE, points: 1 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.points).toBe(1);
      expect(agg.ftm).toBe(1);
      expect(agg.fta).toBe(1);
    });

    it("handles MAKE (3PT)", () => {
      const agg = {
        points: 0,
        makes: 0,
        attempts: 0,
        threePM: 0,
        threePA: 0,
      } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MAKE, points: 3 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.points).toBe(3);
      expect(agg.makes).toBe(1);
      expect(agg.attempts).toBe(1);
      expect(agg.threePM).toBe(1);
      expect(agg.threePA).toBe(1);
    });

    it("handles MISS (2PT)", () => {
      const agg = { attempts: 0, threePA: 0 } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MISS, points: 2 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.attempts).toBe(1);
    });

    it("handles MISS (3PT)", () => {
      const agg = { attempts: 0, threePA: 0 } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MISS, points: 3 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.attempts).toBe(1);
      expect(agg.threePA).toBe(1);
    });

    it("handles MISS (FT)", () => {
      const agg = { fta: 0 } as PlayerAggregates;
      const stat = { type: ACTION_TYPES.MISS, points: 1 } as StatEvent;
      applyActionToAggregate(agg, stat);
      expect(agg.fta).toBe(1);
    });

    it("handles REBOUND", () => {
      const agg = {
        rebounds: 0,
        offRebounds: 0,
        defRebounds: 0,
      } as PlayerAggregates;
      applyActionToAggregate(agg, {
        type: ACTION_TYPES.OFF_REBOUND,
      } as StatEvent);
      expect(agg.rebounds).toBe(1);
      expect(agg.offRebounds).toBe(1);

      applyActionToAggregate(agg, {
        type: ACTION_TYPES.DEF_REBOUND,
      } as StatEvent);
      expect(agg.rebounds).toBe(2);
      expect(agg.defRebounds).toBe(1);

      applyActionToAggregate(agg, { type: ACTION_TYPES.REBOUND } as StatEvent);
      expect(agg.rebounds).toBe(3);
    });

    it("handles other actions", () => {
      const agg = {
        assists: 0,
        steals: 0,
        turnovers: 0,
        blocks: 0,
        fouls: 0,
      } as PlayerAggregates;
      applyActionToAggregate(agg, { type: ACTION_TYPES.ASSIST } as StatEvent);
      expect(agg.assists).toBe(1);
      applyActionToAggregate(agg, { type: ACTION_TYPES.STEAL } as StatEvent);
      expect(agg.steals).toBe(1);
      applyActionToAggregate(agg, { type: ACTION_TYPES.TURNOVER } as StatEvent);
      expect(agg.turnovers).toBe(1);
      applyActionToAggregate(agg, { type: ACTION_TYPES.BLOCK } as StatEvent);
      expect(agg.blocks).toBe(1);
      applyActionToAggregate(agg, { type: ACTION_TYPES.FOUL } as StatEvent);
      expect(agg.fouls).toBe(1);
    });
  });
});
