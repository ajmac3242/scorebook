import { describe, it, expect } from "vitest";
import {
  calculatePlayerAggregates,
  getBonusStatus,
} from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent } from "../db";

describe("Scout Quality Tests", () => {
  describe("Bug: Redundant SUB_IN events", () => {
    it("should correctly handle multiple SUB_IN events without a SUB_OUT", () => {
      const players = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600, // 10:00
          period: 1,
          timestamp: "1",
        },
        // Redundant SUB_IN at 8:00
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 480, // 8:00
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300, // 5:00
          period: 1,
          timestamp: "3",
        },
      ];

      const results = calculatePlayerAggregates(players, stats);
      const p1 = results[0];

      // P1: 10:00 to 8:00 (2 mins) + 8:00 to 5:00 (3 mins) = 5 mins.
      // If NOT handled, it might just use the LAST SUB_IN: 8:00 to 5:00 = 3 mins.
      expect(p1.min).toBe(5);
    });
  });

  describe("UX: Halves Bonus Labeling", () => {
    it("should return 'BONUS (1&1)' for 7-9 fouls in HALVES", () => {
      const result7 = getBonusStatus(7, "HALVES");
      expect(result7.label).toBe("BONUS (1&1)");

      const result9 = getBonusStatus(9, "HALVES");
      expect(result9.label).toBe("BONUS (1&1)");
    });

    it("should return 'DOUBLE BONUS' for 10+ fouls in HALVES", () => {
      const result10 = getBonusStatus(10, "HALVES");
      expect(result10.label).toBe("DOUBLE BONUS");
    });

    it("should return standard 'BONUS' for QUARTERS", () => {
      const result5 = getBonusStatus(5, "QUARTERS");
      expect(result5.label).toBe("BONUS");
    });
  });
});
