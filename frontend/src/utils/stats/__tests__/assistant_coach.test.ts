import { describe, it, expect } from "vitest";
import {
  calculateDefensiveIntegrity,
  calculateSituationalStats,
} from "../analytics";
import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("Assistant Coach Analytics", () => {
  describe("calculateDefensiveIntegrity", () => {
    it("aggregates points allowed by breakdown reason", () => {
      const stats: Partial<StatEvent>[] = [
        {
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          breakdownReason: "Missed Rotation",
        },
        {
          playerId: "OPPONENT:2",
          type: ACTION_TYPES.MAKE,
          points: 3,
          breakdownReason: "Missed Rotation",
        },
        {
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          breakdownReason: "Transition Leak",
        },
        { playerId: "PLAYER:1", type: ACTION_TYPES.MAKE, points: 2 }, // Should be ignored (our team)
      ];

      const result = calculateDefensiveIntegrity(stats as StatEvent[]);
      expect(result).toHaveLength(2);
      expect(result[0].reason).toBe('Missed Rotation');
      expect(result[0].points).toBe(5);
      expect(result[0].percentage).toBe('71.4'); // 5 / 7 * 100
      expect(result[1].reason).toBe('Transition Leak');
      expect(result[1].points).toBe(2);
      expect(result[1].percentage).toBe('28.6'); // 2 / 7 * 100
    });

    it("handles unattributed buckets", () => {
      const stats: Partial<StatEvent>[] = [
        { playerId: "OPPONENT:1", type: ACTION_TYPES.MAKE, points: 2 },
      ];
      const result = calculateDefensiveIntegrity(stats as StatEvent[]);
      expect(result[0].reason).toBe("Other / Unattributed");
    });
  });

  describe("calculateSituationalStats", () => {
    it("aggregates PPP and eFG% by situation for our team only", () => {
      const stats: Partial<StatEvent>[] = [
        {
          playerId: "PLAYER:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "ATO",
        },
        {
          playerId: "PLAYER:1",
          type: ACTION_TYPES.MISS,
          points: 0,
          situation: "ATO",
        },
        {
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "ATO",
        }, // Should be ignored (opponent)
      ];

      const result = calculateSituationalStats(stats as StatEvent[]);
      expect(result).toHaveLength(1);
      expect(result[0].situation).toBe("ATO");
      expect(result[0].attempts).toBe(2);
      expect(result[0].points).toBe(2);
      expect(result[0].ppp).toBe("1.00"); // 2 points / 2 possessions
    });
  });
});
