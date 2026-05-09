import { describe, it, expect } from "vitest";
import {
  calculateTacticalGoalStatus,
  analyzeOpponentArchetype,
  calculateFatigueDecay,
  calculateOpponentThreats,
  calculateHaltAlerts,
  calculateWinningTimeRecommendations,
} from "./analytics";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent, Player } from "../../db";
import { PlayerAggregates, GameAnalyticsContext } from "./types";

describe("analytics.ts", () => {
  describe("calculateTacticalGoalStatus", () => {
    it("calculates goal status correctly", () => {
      const stats: Partial<StatEvent>[] = [
        { playerId: "1", type: ACTION_TYPES.MAKE, points: 2 },
        { playerId: "1", type: ACTION_TYPES.TURNOVER },
        { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
      ];
      const goals = [
        { metric: "TO Rate", threshold: 15, direction: "below" as const },
      ];
      const results = calculateTacticalGoalStatus({
        stats: stats as StatEvent[],
        goals,
      });
      expect(results[0].metric).toBe("TO Rate");
      expect(results[0].isMet).toBeDefined();
    });
  });

  describe("analyzeOpponentArchetype", () => {
    it("returns Scouting... for low attempts", () => {
      expect(analyzeOpponentArchetype([])).toBe("Scouting...");
    });

    it("identifies Long-Range Marksmen", () => {
      const stats: Partial<StatEvent>[] = Array(10).fill({
        playerId: "OPPONENT:1",
        type: ACTION_TYPES.MAKE,
        points: 3,
      });
      const result = analyzeOpponentArchetype(stats as StatEvent[]);
      if (typeof result === "string") {
        throw new Error("Expected object, got string");
      }
      expect(result.type).toBe("Long-Range Marksmen");
    });

    it("identifies Rim-Heavy Slashing", () => {
      const stats: Partial<StatEvent>[] = Array(10).fill({
        playerId: "OPPONENT:1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        locationX: 50,
        locationY: 30, // Near rim
      });
      const result = analyzeOpponentArchetype(stats as StatEvent[]);
      if (typeof result === "string") {
        throw new Error("Expected object, got string");
      }
      expect(result.type).toBe("Rim-Heavy Slashing");
    });
  });

  describe("calculateFatigueDecay", () => {
    it("returns 100 for fresh players", () => {
      expect(calculateFatigueDecay(300, 10)).toBe(100);
    });

    it("decays for over-extended players", () => {
      const efficiency = calculateFatigueDecay(600, 8); // 8m limit, at 10m
      expect(efficiency).toBeLessThan(100);
    });
  });

  describe("calculateOpponentThreats", () => {
    it("identifies hot opponent players", () => {
      const stats: Partial<StatEvent>[] = Array(5).fill({
        gameId: "g1",
        playerId: "OPPONENT:12",
        type: ACTION_TYPES.MAKE,
        points: 2,
      });
      const threats = calculateOpponentThreats(stats as StatEvent[]);
      expect(threats).toHaveLength(1);
      expect(threats[0].playerId).toBe("OPPONENT:12");
      expect(threats[0].isHot).toBe(true);
    });
  });

  describe("calculateHaltAlerts", () => {
    it("triggers foul alerts for star players", () => {
      const players: Partial<Player>[] = [{ id: "p1", isStar: 1 }];
      const statsMap = new Map<string, PlayerAggregates>([
        ["p1", { fouls: 3 } as PlayerAggregates],
      ]);
      const gameData: Partial<GameAnalyticsContext> = {
        onCourtIds: new Set(["p1"]),
        teamFoulStats: { oppFouls: 0, teamFouls: 0 },
        stintDurations: new Map(),
      };
      const alerts = calculateHaltAlerts({
        players: players as Player[],
        statsMap,
        gameData: gameData as GameAnalyticsContext,
        period: 2,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 10,
        jerseyMap: new Map([["p1", "23"]]),
      });
      expect(alerts.some((a) => a.type === "FOUL")).toBe(true);
    });

    it("triggers fatigue alerts", () => {
      const gameData: Partial<GameAnalyticsContext> = {
        onCourtIds: new Set(["p1"]),
        teamFoulStats: { oppFouls: 0, teamFouls: 0 },
        stintDurations: new Map([["p1", 700]]),
      };
      const alerts = calculateHaltAlerts({
        players: [],
        statsMap: new Map(),
        gameData: gameData as GameAnalyticsContext,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 10,
        jerseyMap: new Map([["p1", "23"]]),
      });
      expect(alerts.some((a) => a.type === "FATIGUE")).toBe(true);
    });
  });

  describe("calculateWinningTimeRecommendations", () => {
    it("provides recommendations", () => {
      const rec = calculateWinningTimeRecommendations({
        gameStats: [],
        playbookEfficiency: [
          {
            name: "Set 1",
            ppp: "1.2",
            attempts: 5,
            makes: 3,
            points: 6,
            efg: "60",
          },
        ],
        refTightness: 0.5,
        opponentThreats: [],
        teamFouls: 2,
        oppFouls: 2,
        scoreDiff: 2,
        clockSeconds: 30,
        timeoutsRemaining: 2,
      });
      expect(rec.offensive.recommendation).toContain("Set 1");
      expect(rec.timeout.strategy).toBe("USE");
    });
  });
});
