import { describe, it, expect } from "vitest";
import {
  isClutchEvent,
  calculateOpponentThreats,
  calculateHaltAlerts,
} from "../analytics/proactive";
import { ACTION_TYPES } from "../../../constants/stats";

describe("proactive analytics", () => {
  describe("isClutchEvent", () => {
    it("should return false if score diff > 5", () => {
      expect(isClutchEvent(4, 100, 6, "QUARTERS")).toBe(false);
      expect(isClutchEvent(4, 100, -6, "QUARTERS")).toBe(false);
    });

    it("should return false if not final period and not OT", () => {
      expect(isClutchEvent(1, 100, 2, "QUARTERS")).toBe(false);
      expect(isClutchEvent(3, 100, 2, "QUARTERS")).toBe(false);
    });

    it("should return true in OT regardless of time", () => {
      expect(isClutchEvent(5, 300, 2, "QUARTERS")).toBe(true);
      expect(isClutchEvent(3, 300, 2, "HALVES")).toBe(true);
    });

    it("should return true in final period if under clutch time limit", () => {
      // Quarters: 4 mins (240s)
      expect(isClutchEvent(4, 240, 2, "QUARTERS")).toBe(true);
      expect(isClutchEvent(4, 241, 2, "QUARTERS")).toBe(false);

      // Halves: 2 mins (120s)
      expect(isClutchEvent(2, 120, 2, "HALVES")).toBe(true);
      expect(isClutchEvent(2, 121, 2, "HALVES")).toBe(false);
    });
  });

  describe("calculateOpponentThreats", () => {
    const gameId = "game-1";
    it("should identify a hot player by points", () => {
      const stats: any[] = [
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: 1,
        },
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: 2,
        },
        {
          gameId,
          playerId: "OPPONENT:10",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: 3,
        },
      ];
      const threats = calculateOpponentThreats(stats);
      expect(threats).toHaveLength(1);
      expect(threats[0].playerId).toBe("OPPONENT:10");
      expect(threats[0].isHot).toBe(true);
    });

    it("should identify a hot player by consecutive makes", () => {
      const stats: any[] = [
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
      ];
      const threats = calculateOpponentThreats(stats);
      expect(threats).toHaveLength(1);
      expect(threats[0].isHot).toBe(true);
    });

    it("should identify a hot player by straight points", () => {
      const stats: any[] = [
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
      ];
      const threats = calculateOpponentThreats(stats);
      expect(threats).toHaveLength(1);
      expect(threats[0].isHot).toBe(true);
    });

    it("should reset straight points when team scores", () => {
      const stats: any[] = [
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
        { gameId, playerId: "TEAM_1", type: ACTION_TYPES.MAKE, points: 2 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
      ];
      const threats = calculateOpponentThreats(stats);
      expect(threats).toHaveLength(0); // Only 2 straight points after team score
    });

    it("should identify clutch threats", () => {
      const stats: any[] = [
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 3 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
        { gameId, playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2 },
      ];
      const threats = calculateOpponentThreats(stats, {
        period: 4,
        clockTime: 100,
        scoreDiff: 2,
        periodType: "QUARTERS",
      });
      expect(threats).toHaveLength(1);
      expect(threats[0].isClutchThreat).toBe(true);
    });
  });

  describe("calculateHaltAlerts", () => {
    const players: any[] = [
      { id: "p1", isStar: 1 },
      { id: "p2", isStar: 0 },
    ];
    const statsMap = new Map();
    const jerseyMap = new Map([
      ["p1", "1"],
      ["p2", "2"],
    ]);
    const gameData: any = {
      onCourtIds: new Set(["p1", "p2"]),
      teamFoulStats: { teamFouls: 0, oppFouls: 0 },
      stintDurations: new Map(),
      currentScore: 50,
      opponentScore: 50,
      activeDefensiveScheme: "MAN",
    };

    it("should alert for star foul trouble", () => {
      // Period 1, 2 fouls
      statsMap.set("p1", { fouls: 2 });
      let alerts = calculateHaltAlerts({
        players,
        statsMap,
        gameData,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(alerts.some((a) => a.type === "FOUL")).toBe(true);

      // Period 2, 3 fouls
      statsMap.set("p1", { fouls: 3 });
      alerts = calculateHaltAlerts({
        players,
        statsMap,
        gameData,
        period: 2,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(alerts.some((a) => a.type === "FOUL")).toBe(true);

      // Period 3, 4 fouls
      statsMap.set("p1", { fouls: 4 });
      alerts = calculateHaltAlerts({
        players,
        statsMap,
        gameData,
        period: 3,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(
        alerts.some((a) => a.type === "FOUL" && a.severity === "error"),
      ).toBe(true);
    });

    it("should alert for bonus status", () => {
      gameData.teamFoulStats.oppFouls = 4;
      const alerts = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(
        alerts.some((a) => a.type === "BONUS" && a.severity === "info"),
      ).toBe(true);

      gameData.teamFoulStats.oppFouls = 5;
      const alerts2 = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(
        alerts2.some((a) => a.type === "BONUS" && a.severity === "warning"),
      ).toBe(true);
    });

    it("should alert for fatigue", () => {
      gameData.stintDurations.set("p1", 9 * 60);
      const alerts = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(alerts.some((a) => a.type === "FATIGUE")).toBe(true);
    });

    it("should alert for clutch mode", () => {
      const alerts = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData: { ...gameData, currentScore: 50, opponentScore: 48 },
        period: 4,
        clockSeconds: 100,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      expect(alerts.some((a) => a.type === "CLUTCH")).toBe(true);
    });

    it("should alert for ref conflict", () => {
      const alerts = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData: {
          ...gameData,
          activeDefensiveScheme: "PRESS",
          teamFoulStats: { teamFouls: 5, oppFouls: 5 },
        },
        period: 1,
        clockSeconds: 480, // 4 mins elapsed
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
      });
      // 10 fouls in 4 mins = 2.5 FPM > 0.8
      expect(alerts.some((a) => a.type === "REF_CONFLICT")).toBe(true);
    });

    it("should alert for archetype mismatch", () => {
      const alerts = calculateHaltAlerts({
        players,
        statsMap: new Map(),
        gameData,
        period: 1,
        clockSeconds: 300,
        periodType: "QUARTERS",
        maxStintDuration: 8,
        jerseyMap,
        matchups: { "OPPONENT:10": "p1" },
        oppMostFrequentPlayType: { "OPPONENT:10": "PnR" },
        archetypeEfficiency: { p1: { PnR: 30 } },
      });
      expect(alerts.some((a) => a.type === "CONFLICT")).toBe(true);
    });
  });

  describe("calculateOpponentThreats extra coverage", () => {
    it("handles misses resetting consecutive makes", () => {
      const stats: any[] = [
        { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2, timestamp: 1 },
        { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2, timestamp: 2 },
        { playerId: "OPPONENT:10", type: ACTION_TYPES.MISS, points: 2, timestamp: 3 },
        { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 2, timestamp: 4 },
      ];
      const threats = calculateOpponentThreats(stats);
      // isHot should be false because consecutiveMakes was reset and points (6) < 8 and straightPoints (6) reset on Team score (not here though)
      // Wait, straightPoints is NOT reset here. But straightPoints >= 6 makes it hot!
      // p1: 2, p2: 2, p3: 2 (makes 6). isHot becomes true at p3!
      expect(threats.find(t => t.playerId === "OPPONENT:10")?.isHot).toBe(true);
    });

    it("handles misses resetting consecutive makes (with lower points)", () => {
        const stats: any[] = [
          { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 1, timestamp: 1 },
          { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 1, timestamp: 2 },
          { playerId: "OPPONENT:10", type: ACTION_TYPES.MISS, points: 2, timestamp: 3 },
          { playerId: "OPPONENT:10", type: ACTION_TYPES.MAKE, points: 1, timestamp: 4 },
        ];
        const threats = calculateOpponentThreats(stats);
        expect(threats).toHaveLength(0);
      });
  });
});
