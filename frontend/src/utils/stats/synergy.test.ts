import { describe, it, expect } from "vitest";
import { calculateSynergyStats } from "./synergy";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("calculateSynergyStats", () => {
  const mockStats: StatEvent[] = [
    {
      id: "1",
      gameId: "game1",
      playerId: "P1",
      type: ACTION_TYPES.SUB_IN,
      period: 1,
      clockTime: 600,
      timestamp: "2023-01-01T10:00:00Z",
    },
    {
      id: "2",
      gameId: "game1",
      playerId: "P2",
      type: ACTION_TYPES.SUB_IN,
      period: 1,
      clockTime: 600,
      timestamp: "2023-01-01T10:00:01Z",
    },
    {
      id: "3",
      gameId: "game1",
      playerId: "OPPONENT",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 540,
      timestamp: "2023-01-01T10:01:00Z",
    },
    {
      id: "4",
      gameId: "game1",
      playerId: "OPPONENT",
      type: ACTION_TYPES.MISS,
      period: 1,
      clockTime: 480,
      timestamp: "2023-01-01T10:02:00Z",
    },
    {
      id: "5",
      gameId: "game1",
      playerId: "P1",
      type: ACTION_TYPES.DEF_REBOUND,
      period: 1,
      clockTime: 475,
      timestamp: "2023-01-01T10:02:05Z",
    },
    {
      id: "6",
      gameId: "game1",
      playerId: "OPPONENT",
      type: ACTION_TYPES.TURNOVER,
      period: 1,
      clockTime: 420,
      timestamp: "2023-01-01T10:03:00Z",
    },
  ];

  it("calculates 2-player unit defensive stats correctly", () => {
    const results = calculateSynergyStats(mockStats, 2);
    expect(results.length).toBe(1);
    const unit = results[0];
    expect(unit.lineup).toEqual(["P1", "P2"]);
    expect(unit.defensiveStops).toBe(2); // One from Miss+DREB, one from TO
    expect(unit.pointsAgainst).toBe(2);
    // Possessions: 1 (Make) + 1 (Miss) + 1 (TO) = 3
    expect(unit.possessions).toBe(3);
    expect(unit.dRtg).toBe("66.7"); // (2/3)*100
  });

  it("ignores stints with fewer players than unit size", () => {
    const shortStats: StatEvent[] = [
      {
        id: "1",
        gameId: "game1",
        playerId: "P1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "2023-01-01T10:00:00Z",
      },
      {
        id: "2",
        gameId: "game1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 540,
        timestamp: "2023-01-01T10:01:00Z",
      },
    ];
    const results = calculateSynergyStats(shortStats, 2);
    expect(results.length).toBe(0);
  });
});
