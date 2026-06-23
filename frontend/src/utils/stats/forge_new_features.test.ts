import { describe, it, expect } from "vitest";
import {
  calculateAssistNetwork,
  calculateShotROI,
  calculatePaintTouchStats,
} from "./analytics";
import { StatEvent } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";

describe("Forge: Core Analytics Extensions", () => {
  const mockStats: StatEvent[] = [
    {
      id: "1",
      gameId: "game-1",
      playerId: "P1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      locationX: 250 / 5, // RA
      locationY: 47 / 4.7,
      timestamp: "2024-01-01T10:00:00Z",
      period: 1,
      clockTime: 600,
      shotQuality: "OPEN",
    },
    {
      id: "2",
      gameId: "game-1",
      playerId: "P2",
      type: ACTION_TYPES.ASSIST,
      timestamp: "2024-01-01T10:00:00Z",
      period: 1,
      clockTime: 600,
    },
    {
      id: "3",
      gameId: "game-1",
      playerId: "P1",
      type: ACTION_TYPES.PAINT_TOUCH,
      period: 1,
      clockTime: 590,
      timestamp: "2024-01-01T10:00:10Z",
    },
    {
      id: "4",
      gameId: "game-1",
      playerId: "P3",
      type: ACTION_TYPES.MAKE,
      points: 3,
      period: 1,
      clockTime: 580,
      timestamp: "2024-01-01T10:00:20Z",
    },
  ];

  it("should calculate Assist Network correctly", () => {
    // Add a 3pt make with an assist to verify threePM fix for nodes
    const statsWith3ptAssist = [
      ...mockStats,
      {
        id: "5",
        gameId: "game-1",
        playerId: "P4", // Finisher
        type: ACTION_TYPES.MAKE,
        points: 3,
        timestamp: "2024-01-01T10:05:00Z",
        period: 1,
        clockTime: 300,
      },
      {
        id: "6",
        gameId: "game-1",
        playerId: "P5", // Passer
        type: ACTION_TYPES.ASSIST,
        timestamp: "2024-01-01T10:05:00Z",
        period: 1,
        clockTime: 300,
      },
    ];

    const network = calculateAssistNetwork(statsWith3ptAssist);
    expect(network.edges).toHaveLength(2);

    // Check P5 node (Passer of 3pt)
    const p5Node = network.nodes.find((n) => n.playerId === "P5");
    expect(p5Node?.assists).toBe(1);
    expect(p5Node?.pointsGenerated).toBe(3);
    // eFG% for passer should account for the 3pt made by finisher
    // eFG = (Makes + 0.5 * 3PM) / Attempts
    // For passers, "Makes" in eFG calc currently uses val.assistedMakes || val.assists
    // If assistedMakes is 0, it uses assists.
    // eFG = (1 + 0.5 * 1) / 1 = 1.5 -> 150%
    expect(p5Node?.efg).toBe("150.0");

    expect(network.primaryPlaymakerId).toBeDefined();
    expect(network.primaryFinisherId).toBeDefined();
  });

  it("should calculate Shot ROI correctly", () => {
    const roi = calculateShotROI(mockStats);
    // P1 Make: Actual 2, Expected (RA Open) 1.65
    // P3 Make: Actual 3, Expected (3PT Center Contested) 0.78 (defaulted quality)
    // Total Actual: 5, Total Expected: 2.43
    // ROI: (5 / 2.43) - 1 = 1.057
    expect(parseFloat(roi.roi)).toBeGreaterThan(1);
    expect(roi.totalPoints).toBe(5);
  });

  it("should calculate Paint Touch efficiency", () => {
    const stats = calculatePaintTouchStats(mockStats);
    expect(stats.total).toBe(1);
    // P3 scored 10s after P1 paint touch
    expect(stats.pppt).toBe("3.00");
  });
});
