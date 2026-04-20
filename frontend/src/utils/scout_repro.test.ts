import { describe, it, expect } from "vitest";
import {
  isClutchEvent,
  calculateStopsAndKills,
  calculateOpponentThreats,
  calculatePlayerStreaks,
  calculateOpponentScoutingStats,
} from "./stats";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { StatEvent } from "../db";

describe("Scout: Detailed Quality Audit", () => {
  describe("isClutchEvent (Clutch Time Definition)", () => {
    // Parameters: isClutchEvent(period, clockTimeInSeconds, scoreDifference, periodType)

    it("identifies clutch time in regulation for QUARTERS (last 4 mins, <= 5 pts)", () => {
      // P4, 4:00 (240s), within 5 pts -> Clutch
      expect(isClutchEvent(4, 240, 5, "QUARTERS")).toBe(true);
      expect(isClutchEvent(4, 241, 5, "QUARTERS")).toBe(false);
    });

    it("identifies clutch time in regulation for HALVES (last 2 mins, <= 5 pts)", () => {
      // P2, 2:00 (120s), within 5 pts -> Clutch
      expect(isClutchEvent(2, 120, 5, "HALVES")).toBe(true);
      expect(isClutchEvent(2, 121, 5, "HALVES")).toBe(false);
    });

    it("identifies all of overtime as clutch time in QUARTERS mode if score is within 5", () => {
      // Overtime (P5) is always clutch if score is close, regardless of clock
      expect(isClutchEvent(5, 300, 2, "QUARTERS")).toBe(true);
    });

    it("identifies all of overtime as clutch time in HALVES mode if score is within 5", () => {
      // Overtime (P3+) is always clutch if score is close, regardless of clock
      expect(isClutchEvent(3, 1100, 2, "HALVES")).toBe(true);
    });

    it("never considers large score differences as clutch", () => {
      expect(isClutchEvent(4, 30, 6, "QUARTERS")).toBe(false);
      expect(isClutchEvent(5, 30, 10, "QUARTERS")).toBe(false);
    });
  });

  describe("Multi-Game State Leakage", () => {
    it("should reset stops streak when gameId changes", () => {
      const stats: StatEvent[] = [
        { id: "1", gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.TURNOVER, timestamp: "1000" }, // Stop 1
        { id: "2", gameId: "g1", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.TURNOVER, timestamp: "1100" }, // Stop 2
        { id: "3", gameId: "g2", playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.TURNOVER, timestamp: "2000" }, // Stop 1 (new game)
      ];
      const result = calculateStopsAndKills(stats);
      expect(result.totalStops).toBe(3);
      expect(result.totalKills).toBe(0); // If it leaked, totalKills would be 1
    });

    it("should reset opponent threats when gameId changes", () => {
       const stats: StatEvent[] = [
         { id: "1", gameId: "g1", playerId: "OPPONENT:24", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1000" },
         { id: "2", gameId: "g1", playerId: "OPPONENT:24", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1100" },
         { id: "3", gameId: "g2", playerId: "OPPONENT:24", type: ACTION_TYPES.MAKE, points: 2, timestamp: "2000" },
         { id: "4", gameId: "g2", playerId: "OPPONENT:24", type: ACTION_TYPES.MAKE, points: 2, timestamp: "2100" },
       ];
       const threats = calculateOpponentThreats(stats);
       // OPPONENT:24 has 4 points per game.
       // Should not be a threat if threshold is 8 per game.
       const threat = threats.find(t => t.playerId === "OPPONENT:24");
       expect(threat).toBeUndefined();
    });

    it("should reset player streaks when gameId changes", () => {
      const stats: StatEvent[] = [
        { id: "1", gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1000" },
        { id: "2", gameId: "g1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1100" },
        { id: "3", gameId: "g2", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, timestamp: "2000" },
      ];
      const streaks = calculatePlayerStreaks(stats);
      // Should not be HOT because only 1 make in g2
      expect(streaks.get("p1")).toBeNull();
    });
  });

  describe("Opponent Scouting Efficiency", () => {
    it("correctly tracks FTA and possessions for opponent scouting", () => {
      const stats: StatEvent[] = [
        { id: "1", gameId: "g1", playerId: "OPPONENT:24", type: ACTION_TYPES.MAKE, points: 2, timestamp: "1000" },
        { id: "2", gameId: "g1", playerId: "OPPONENT:24", type: ACTION_TYPES.MISS, points: 1, timestamp: "1100" }, // FTA (1)
        { id: "3", gameId: "g1", playerId: "OPPONENT:24", type: ACTION_TYPES.TURNOVER, timestamp: "1200" },
      ];
      const scouting = calculateOpponentScoutingStats(stats);
      const opp24 = scouting.get("OPPONENT:24");

      // Expected possessions = FGA (1) + 0.44 * FTA (1) + TO (1) - OREB (0) = 2.44
      // Possession display is rounded (Math.round(2.44) = 2)
      // PPP = points (2) / possessions (2.44) = 0.819... -> 0.82
      expect(opp24?.possessions).toBe(2);
      expect(opp24?.ppp).toBe("0.82");
      expect(opp24?.fta).toBe(1);
    });
  });
});
