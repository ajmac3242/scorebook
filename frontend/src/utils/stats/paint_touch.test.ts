import { describe, it, expect } from "vitest";
import { calculatePaintTouchStats } from "./analytics";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("calculatePaintTouchStats", () => {
  it("calculates total paint touches and points per paint touch", () => {
    const stats: Partial<StatEvent>[] = [
      {
        type: ACTION_TYPES.PAINT_TOUCH,
        clockTime: 600,
        period: 1,
        playerId: "p1",
      },
      {
        type: ACTION_TYPES.MAKE,
        points: 2,
        clockTime: 590, // 10s after
        period: 1,
        playerId: "p1",
      },
      {
        type: ACTION_TYPES.PAINT_TOUCH,
        clockTime: 500,
        period: 1,
        playerId: "p2",
      },
      {
        type: ACTION_TYPES.MISS,
        clockTime: 490,
        period: 1,
        playerId: "p2",
      },
    ];

    const result = calculatePaintTouchStats(stats as StatEvent[]);
    expect(result.total).toBe(2);
    // 2 points from first touch, 0 from second. PPPT = 2 / 2 = 1.00
    expect(result.pppt).toBe("1.00");
  });

  it("respects the 15-second window", () => {
    const stats: Partial<StatEvent>[] = [
      {
        type: ACTION_TYPES.PAINT_TOUCH,
        clockTime: 600,
        period: 1,
        playerId: "p1",
      },
      {
        type: ACTION_TYPES.MAKE,
        points: 2,
        clockTime: 580, // 20s after
        period: 1,
        playerId: "p1",
      },
    ];

    const result = calculatePaintTouchStats(stats as StatEvent[]);
    expect(result.total).toBe(1);
    expect(result.pppt).toBe("0.00");
  });

  it("stops at turnover or possession change", () => {
    const stats: Partial<StatEvent>[] = [
      {
        type: ACTION_TYPES.PAINT_TOUCH,
        clockTime: 600,
        period: 1,
        playerId: "p1",
      },
      {
        type: ACTION_TYPES.TURNOVER,
        clockTime: 595,
        period: 1,
        playerId: "p1",
      },
      {
        type: ACTION_TYPES.MAKE,
        points: 2,
        clockTime: 590,
        period: 1,
        playerId: "p1",
      },
    ];

    const result = calculatePaintTouchStats(stats as StatEvent[]);
    expect(result.total).toBe(1);
    expect(result.pppt).toBe("0.00");
  });
});
