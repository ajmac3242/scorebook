import { describe, it, expect } from "vitest";
import { ACTION_TYPES } from "../../../constants/stats";
import {
  calculateNeuralLoad,
  calculatePredictabilityScore,
  calculateVerbalVelocity
} from "../analytics/coaching";
import { StatEvent } from "../../../db";

describe("Forge Neural & Predictability Analytics", () => {
  describe("calculateNeuralLoad", () => {
    it("should accumulate load on tactical switches", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.POSSESSION,
          defensiveScheme: "MAN",
          period: 1,
          clockTime: 600,
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.POSSESSION,
          defensiveScheme: "ZONE",
          period: 1,
          clockTime: 580,
          timestamp: "2024-01-01T00:00:20Z",
        },
      ];
      const onCourtIds = new Set(["p1", "p2"]);
      const result = calculateNeuralLoad(stats, onCourtIds, 600);

      expect(result.playerLoads["p1"]).toBeGreaterThan(0);
      expect(result.playerLoads["p2"]).toBeGreaterThan(0);
      expect(result.unitSpm).toBeGreaterThan(0);
    });

    it("should respect the 0-100 load bounds", () => {
        const stats: StatEvent[] = Array.from({ length: 10 }).map((_, i) => ({
            id: i.toString(),
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.POSSESSION,
            defensiveScheme: i % 2 === 0 ? "MAN" : "ZONE",
            period: 1,
            clockTime: 600 - i * 10,
            timestamp: `2024-01-01T00:0${i}:00Z`,
        }));
        const onCourtIds = new Set(["p1"]);
        const result = calculateNeuralLoad(stats, onCourtIds, 600);
        expect(result.playerLoads["p1"]).toBe(100);
    });
  });

  describe("calculatePredictabilityScore", () => {
    it("should detect repeating play patterns", () => {
      const stats: StatEvent[] = Array.from({ length: 10 }).map((_, i) => ({
        id: i.toString(),
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        playName: i < 8 ? "HAMMER" : "ISO",
        period: 1,
        clockTime: 600 - i * 10,
        timestamp: `2024-01-01T00:0${i}:00Z`,
      }));

      const result = calculatePredictabilityScore(stats);
      expect(result.score).toBe(80);
      expect(result.pattern).toBe("HAMMER");
    });

    it("should return 0 for insufficient data", () => {
        const result = calculatePredictabilityScore([]);
        expect(result.score).toBe(0);
    });
  });

  describe("calculateVerbalVelocity", () => {
    it("should calculate latency between opponent action and vocal engagement", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          period: 1,
          clockTime: 600,
          timestamp: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.VOCAL_ENGAGEMENT,
          period: 1,
          clockTime: 599,
          timestamp: "2024-01-01T00:00:00.500Z",
        },
      ];

      const result = calculateVerbalVelocity(stats);
      expect(result.latency).toBe(0.5);
    });

    it("should handle multiple events and average latency", () => {
        const stats: StatEvent[] = [
            { id: "1", gameId: "g1", playerId: "OPPONENT:1", type: ACTION_TYPES.MAKE, period: 1, clockTime: 600, timestamp: "2024-01-01T00:00:00.000Z" },
            { id: "2", gameId: "g1", playerId: "p1", type: ACTION_TYPES.VOCAL_ENGAGEMENT, period: 1, clockTime: 599, timestamp: "2024-01-01T00:00:00.500Z" },
            { id: "3", gameId: "g1", playerId: "OPPONENT:2", type: ACTION_TYPES.MAKE, period: 1, clockTime: 550, timestamp: "2024-01-01T00:01:00.000Z" },
            { id: "4", gameId: "g1", playerId: "p2", type: ACTION_TYPES.VOCAL_ENGAGEMENT, period: 1, clockTime: 549, timestamp: "2024-01-01T00:01:00.300Z" },
        ];
        const result = calculateVerbalVelocity(stats);
        expect(result.latency).toBe(0.4); // (0.5 + 0.3) / 2
    });
  });
});
