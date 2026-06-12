import { describe, it, expect } from "vitest";
import {
  generateHalftimeTalkingPoints,
  generatePracticePrescription,
  calculateDefensiveIntegrity,
} from "../analytics/coaching";
import { StatEvent } from "../../../db";
import { ACTION_TYPES } from "../../../constants/stats";

describe("coaching analytics", () => {
  describe("generateHalftimeTalkingPoints", () => {
    it("should generate talking points when efficiency is down and threats exist", () => {
      const jerseyMap = new Map([["player:1", "10"]]);
      const result = generateHalftimeTalkingPoints({
        teamPpp: "0.80",
        seasonPpp: "1.00",
        opponentThreats: [
          {
            playerId: "opp:22",
            points: 15,
            makes: 6,
            consecutiveMakes: 3,
            straightPoints: 8,
            isHot: true,
          },
        ],
        topLineups: [
          {
            lineup: ["player:1"],
            pointsFor: 10,
            pointsAgainst: 5,
            netRating: 5,
            seconds: 600,
            netRatingPer40: "20.0",
          },
        ],
        jerseyMap,
      });

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe("Efficiency is down; stop settling.");
      expect(result[1].text).toBe("Neutralize Opponent #22.");
      expect(result[2].text).toBe("Utilize Lineup [10].");
    });

    it("should generate encouraging talking points when efficiency is high and no threats", () => {
      const result = generateHalftimeTalkingPoints({
        teamPpp: "1.10",
        seasonPpp: "1.00",
        opponentThreats: [],
        topLineups: [],
        jerseyMap: new Map(),
      });

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe("Maintain offensive pressure.");
      expect(result[1].text).toBe("Solid defensive discipline.");
      expect(result[2].text).toBe("Rotation adjustments needed.");
    });

    it("should handle jersey mapping edge cases", () => {
      const result = generateHalftimeTalkingPoints({
        teamPpp: "1.00",
        seasonPpp: "1.00",
        opponentThreats: [
          {
            playerId: "unknown",
            points: 10,
            makes: 4,
            consecutiveMakes: 1,
            straightPoints: 2,
            isHot: false,
          },
        ],
        topLineups: [
          {
            lineup: ["unknown"],
            pointsFor: 0,
            pointsAgainst: 0,
            netRating: 0,
            seconds: 0,
            netRatingPer40: "0",
          },
        ],
        jerseyMap: new Map(),
      });

      expect(result[1].text).toBe("Neutralize Opponent #??.");
      expect(result[2].text).toBe("Utilize Lineup [??].");
    });
  });

  describe("generatePracticePrescription", () => {
    it("should suggest drills when metrics are below season averages", () => {
      const result = generatePracticePrescription({
        gameStats: [],
        teamStats: { ftPct: "60", turnoverRate: "20", orebPct: "20" },
        seasonAverages: { ftPct: "75", turnoverRate: "10", orebPct: "30" },
      });

      expect(result).toHaveLength(3);
      expect(result[0].metric).toBe("Free Throw %");
      expect(result[1].metric).toBe("Turnover Rate");
      expect(result[2].metric).toBe("Offensive Rebound %");
    });

    it("should suggest nothing when metrics are good", () => {
      const result = generatePracticePrescription({
        gameStats: [],
        teamStats: { ftPct: "80", turnoverRate: "8", orebPct: "35" },
        seasonAverages: { ftPct: "75", turnoverRate: "10", orebPct: "30" },
      });

      expect(result).toHaveLength(0);
    });
  });

  describe("calculateDefensiveIntegrity", () => {
    it("should group defensive breakdowns by reason", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT:1",
          points: 3,
          breakdownReason: "Blow-by",
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT:1",
          points: 2,
          breakdownReason: "Blow-by",
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT:2",
          points: 2,
          breakdownReason: "Transition",
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT:2",
          points: 2,
          // Unattributed
        },
        {
          type: ACTION_TYPES.MISS, // Should be ignored by isScoringEvent
          playerId: "OPPONENT:1",
          points: 0,
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: "player:1", // Should be ignored (not opponent)
          points: 2,
        },
      ];

      const result = calculateDefensiveIntegrity(stats as StatEvent[]);

      expect(result).toHaveLength(3);
      expect(result[0].reason).toBe("Blow-by");
      expect(result[0].points).toBe(5);
      expect(result[0].frequency).toBe(2);

      expect(
        result.find((r) => r.reason === "Other / Unattributed")?.points,
      ).toBe(2);
    });

    it("should handle empty stat events and unattributed reasons", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT",
          points: 2,
          // no breakdownReason
        },
      ];
      const result = calculateDefensiveIntegrity(stats as StatEvent[]);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe("Other / Unattributed");
      expect(result[0].percentage).toBe("100.0");
    });

    it("should return empty array for no stats", () => {
      expect(calculateDefensiveIntegrity([])).toEqual([]);
    });
  });
});
