import { describe, it, expect } from "vitest";
import {
  calculateSituationalStats,
  calculateWinningTimeRecommendations,
  calculateDefensiveIntegrity
} from "./analytics";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("New Analytics Logic", () => {
  const mockStats: StatEvent[] = [
    {
      id: "1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      situation: "ATO",
      timestamp: new Date().toISOString(),
      period: 4,
      clockTime: 200,
    },
    {
      id: "2",
      gameId: "g1",
      playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
      type: ACTION_TYPES.MAKE,
      points: 2,
      breakdownType: "Missed Rotation",
      timestamp: new Date().toISOString(),
      period: 4,
      clockTime: 180,
    },
  ];

  it("calculates situational stats correctly", () => {
    const result = calculateSituationalStats(mockStats, "1.00");
    const ato = result.find(s => s.situation === "ATO");
    expect(ato).toBeDefined();
    expect(ato?.points).toBe(2);
    expect(ato?.ppp).toBe("2.00");
    expect(ato?.pppDelta).toBe("1.00");
  });

  it("calculates defensive integrity correctly", () => {
    const result = calculateDefensiveIntegrity(mockStats);
    expect(result.tacticalWeakLink).toBe("Missed Rotation");
    const mr = result.breakdowns.find(b => b.type === "Missed Rotation");
    expect(mr?.points).toBe(2);
  });

  it("calculates winning time recommendations", () => {
    const result = calculateWinningTimeRecommendations({
      gameStats: mockStats,
      playbookEfficiency: [{ name: "Floppy", attempts: 5, makes: 3, points: 7, ppp: "1.40", efg: "70.0" }],
      refTightness: 0.9,
      opponentThreats: [{ playerId: "OPPONENT:10", points: 10, makes: 4, consecutiveMakes: 2, straightPoints: 4, isHot: true }],
      teamFouls: 4,
      oppFouls: 3,
      scoreDiff: -2,
      clockSeconds: 30,
      timeoutsRemaining: 2,
    });

    expect(result.offensive.recommendation).toContain("Floppy");
    expect(result.defensive.recommendation).toContain("Refs are tight");
    expect(result.timeout.strategy).toBe("USE");
  });
});
