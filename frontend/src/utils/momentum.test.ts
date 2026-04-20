import { describe, it, expect } from "vitest";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculateOpponentRun,
  calculateScoringDrought,
  calculateOpponentThreats,
} from "./momentum";
import { StatEvent } from "../db";

describe("Momentum Alert Logic", () => {
  describe("Opponent Run Detection", () => {
    it("detects an 8-0 run", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
      ] as StatEvent[];
      expect(calculateOpponentRun(stats)).toBe("8-0");
    });

    it("ignores run if team scores", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        { type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" }, // Our team
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
      ] as StatEvent[];
      expect(calculateOpponentRun(stats)).toBe(null);
    });
  });

  describe("Scoring Drought Detection", () => {
    const periodLen = 600; // 10 mins

    it("detects drought within the same period", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "p1",
          period: 1,
          clockTime: 500,
        },
      ] as StatEvent[];
      // 500 - 300 = 200s (3m 20s)
      expect(calculateScoringDrought(stats, 1, 300, periodLen)).toBe("3m 20s");
      // 500 - 400 = 100s (< 3m)
      expect(calculateScoringDrought(stats, 1, 400, periodLen)).toBe(null);
    });

    it("detects drought from start of game if no scores", () => {
      const stats: StatEvent[] = [];
      // 4 minutes into P1 (600 - 360 = 240s)
      expect(calculateScoringDrought(stats, 1, 360, periodLen)).toBe("4m 0s");
    });
  });

  describe("Opponent Threat Detection", () => {
    it("detects threat based on total points (8+)", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: "OPPONENT:10",
          timestamp: "1",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: "OPPONENT:10",
          timestamp: "2",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:10",
          timestamp: "3",
        },
      ] as StatEvent[];
      expect(calculateOpponentThreats(stats)).toContain("OPPONENT:10");
    });

    it("detects threat based on consecutive FGM (3+)", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "1",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "2",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "3",
        },
      ] as StatEvent[];
      expect(calculateOpponentThreats(stats)).toContain("OPPONENT:24");
    });

    it("resets streak on miss", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "1",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "2",
        },
        {
          type: ACTION_TYPES.MISS,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "3",
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:24",
          timestamp: "4",
        },
      ] as StatEvent[];
      expect(calculateOpponentThreats(stats)).not.toContain("OPPONENT:24");
    });
  });
});
