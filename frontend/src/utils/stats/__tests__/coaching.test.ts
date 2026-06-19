import { describe, it, expect } from "vitest";
import {
  generateHalftimeTalkingPoints,
  generatePracticePrescription,
  calculateDefensiveIntegrity,
} from "../analytics/coaching";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("coaching analytics", () => {
  describe("generateHalftimeTalkingPoints", () => {
    it("generates points based on efficiency and threats", () => {
      const params = {
        teamPpp: "0.85",
        seasonPpp: "1.05",
        opponentThreats: [
          { playerId: "OPPONENT:10", points: 15, makes: 6, attempts: 10, consecutiveMakes: 0, straightPoints: 0, isHot: false }
        ],
        topLineups: [
          { lineup: ["p1", "p2", "p3", "p4", "p5"], netRating: 10, pointsFor: 15, pointsAgainst: 5, seconds: 300, netRatingPer40: "80.0" }
        ],
        jerseyMap: new Map([["p1", "1"], ["p2", "2"], ["p3", "3"], ["p4", "4"], ["p5", "5"]])
      };

      const result = generateHalftimeTalkingPoints(params);
      expect(result).toHaveLength(3);
      expect(result[0].text).toBe("Efficiency is down; stop settling.");
      expect(result[1].text).toBe("Neutralize Opponent #10.");
      expect(result[2].text).toBe("Utilize Lineup [1,2,3,4,5].");
    });

    it("generates positive points when performing well", () => {
      const params = {
        teamPpp: "1.15",
        seasonPpp: "1.05",
        opponentThreats: [],
        topLineups: [],
        jerseyMap: new Map()
      };
      const result = generateHalftimeTalkingPoints(params);
      expect(result[0].text).toBe("Maintain offensive pressure.");
      expect(result[1].text).toBe("Solid defensive discipline.");
      expect(result[2].text).toBe("Rotation adjustments needed.");
    });
  });

  describe("generatePracticePrescription", () => {
    it("prescribes drills based on metric underperformance", () => {
      const params = {
        gameStats: [],
        teamStats: { ftPct: "50.0", turnoverRate: "25.0", orebPct: "15.0" },
        seasonAverages: { ftPct: "75.0", turnoverRate: "15.0", orebPct: "30.0" }
      };
      const result = generatePracticePrescription(params);
      expect(result).toHaveLength(3);
      expect(result.find(r => r.metric === "Free Throw %")).toBeDefined();
      expect(result.find(r => r.metric === "Turnover Rate")).toBeDefined();
      expect(result.find(r => r.metric === "Offensive Rebound %")).toBeDefined();
    });

    it("returns empty when performance meets averages", () => {
        const params = {
          gameStats: [],
          teamStats: { ftPct: "80.0", turnoverRate: "12.0", orebPct: "35.0" },
          seasonAverages: { ftPct: "75.0", turnoverRate: "15.0", orebPct: "30.0" }
        };
        const result = generatePracticePrescription(params);
        expect(result).toHaveLength(0);
      });
  });

  describe("calculateDefensiveIntegrity", () => {
    it("groups points allowed by breakdown reason", () => {
      const stats: StatEvent[] = [
        { gameId: "g1", period: 1, playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MAKE, points: 2, breakdownReason: "Middle-Drive", timestamp: "1" },
        { gameId: "g1", period: 1, playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MAKE, points: 3, breakdownReason: "Middle-Drive", timestamp: "2" },
        { gameId: "g1", period: 1, playerId: SPECIAL_PLAYER_IDS.OPPONENT, type: ACTION_TYPES.MAKE, points: 2, breakdownReason: "Baseline-Leak", timestamp: "3" },
      ];
      const result = calculateDefensiveIntegrity(stats);
      expect(result).toHaveLength(2);
      expect(result[0].reason).toBe("Middle-Drive");
      expect(result[0].points).toBe(5);
      expect(result[0].percentage).toBe("71.4");
    });
  });
});
