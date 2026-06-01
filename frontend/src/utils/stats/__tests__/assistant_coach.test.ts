import { describe, it, expect } from "vitest";
import {
  calculateDefensiveIntegrity,
  calculateSituationalStats,
} from "../analytics";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

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
      expect(result[0].reason).toBe("Missed Rotation");
      expect(result[0].points).toBe(5);
      expect(result[0].percentage).toBe("71.4"); // 5 / 7 * 100
      expect(result[1].reason).toBe("Transition Leak");
      expect(result[1].points).toBe(2);
      expect(result[1].percentage).toBe("28.6"); // 2 / 7 * 100
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
    it("aggregates PPP, Delta, and Success Rate by situation", () => {
      const stats: Partial<StatEvent>[] = [
        {
          playerId: "PLAYER:1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          situation: "ATO",
        },
        {
          playerId: "PLAYER:1",
          type: ACTION_TYPES.MISS,
          points: 0,
          situation: "ATO",
        },
        {
          playerId: "PLAYER:1",
          type: ACTION_TYPES.FOUL_SHOOTING,
          situation: "ATO",
        }, // Success (shooting foul)
        {
          playerId: "OPPONENT:1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          situation: "ATO",
        },
      ];

      const teamPpp = "1.00";
      const result = calculateSituationalStats(stats as StatEvent[], teamPpp);

      expect(result).toHaveLength(1);
      expect(result[0].situation).toBe("ATO");
      expect(result[0].attempts).toBe(2); // MAKE 3PT + MISS
      expect(result[0].points).toBe(3);
      expect(result[0].ppp).toBe("1.50"); // 3 points / 2 possessions
      expect(result[0].delta).toBe("0.50"); // 1.50 - 1.00
      expect(result[0].successRate).toBe("100.0"); // 2 successes (Make + Foul) / 2 possessions? No, wait...
      // Actually, possessions for Situational is simplified to fga + 0.44*fta + to.
      // In this test: FGA=2 (Make 3, Miss). Successes = 2 (Make 3, Foul Shooting).
      // Success Rate = 2 / 2 * 100 = 100.0%
    });

    it("handles zero possessions safely", () => {
      const result = calculateSituationalStats([], "1.00");
      expect(result).toHaveLength(0);
    });
  });
});
