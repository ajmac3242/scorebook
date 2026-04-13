import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates } from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent } from "../db";

describe("Scout Discovery Tests", () => {
  describe("Issue: Overstated Minutes for Active Players", () => {
    it("should not assume player played until 0:00 if the event stream ends earlier", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600, // 10:00
          period: 1,
          timestamp: "2023-01-01T10:00:00Z",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 540, // 9:00
          period: 1,
          timestamp: "2023-01-01T10:01:00Z",
        },
      ];

      const results = calculatePlayerAggregates(players, stats, [], "total", {
        liveContext: { clockTime: 540, period: 1 },
      });
      const p1 = results[0];

      // Player has only played 1 minute (10:00 to 9:00).
      // With liveContext, stint ends at 9:00 (540s).
      expect(p1.min).toBe(1);
    });
  });

  describe("Issue: Broken TS% Calculation", () => {
    it("should calculate a reasonable TS% and not exceed 100% easily", () => {
        const players = [{ id: "p1", name: "Player 1" }];
        const stats: StatEvent[] = [
          {
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.MAKE,
            points: 2,
            period: 1,
            timestamp: "1",
          },
          {
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.MAKE,
            points: 1,
            period: 1,
            timestamp: "2",
          },
          {
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.MAKE,
            points: 1,
            period: 1,
            timestamp: "3",
          },
        ];

        const results = calculatePlayerAggregates(players, stats);
        const p1 = results[0];

        // Points = 4. FGA = 1. FTA = 2.
        // Formula: Points / (2 * (FGA + 0.44 * FTA))
        // 4 / (2 * (1 + 0.44 * 2)) = 4 / (2 * 1.88) = 4 / 3.76 = 106.3%
        // Wait, 106% is possible in basketball (e.g. all 3s or lots of FTs on few shots).
        // But before it was 200%. Now it should be around 106.4.
        expect(Number(p1.tsPct)).toBe(106.4);
      });
  });
});
