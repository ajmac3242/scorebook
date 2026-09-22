import { describe, it, expect } from "vitest";
import { calculatePlayerStreaks } from "./streaks";
import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("streaks.ts", () => {
  const baseStat: StatEvent = {
    id: "s1",
    gameId: "g1",
    type: ACTION_TYPES.MAKE,
    playerId: "p1",
    points: 2,
    period: 1,
    clockTime: 600,
    timestamp: "2026-09-22T00:00:00Z",
    synced: 1,
  };

  it("returns empty map when stats array is empty or null", () => {
    expect(calculatePlayerStreaks([])).toEqual(new Map());
    expect(calculatePlayerStreaks(null as any)).toEqual(new Map());
  });

  it("identifies HOT status for 3 consecutive makes (field goals)", () => {
    const stats: StatEvent[] = [
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 3, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBe("HOT");
  });

  it("identifies COLD status for 3 consecutive misses", () => {
    const stats: StatEvent[] = [
      { ...baseStat, type: ACTION_TYPES.MISS, points: 0, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MISS, points: 0, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MISS, points: 0, playerId: "p1" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBe("COLD");
  });

  it("ignores 1-point free throws for shooting streak calculations", () => {
    const stats: StatEvent[] = [
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 1, playerId: "p1" }, // free throw ignored
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
      { ...baseStat, type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
    ];

    const streaks = calculatePlayerStreaks(stats, { isSorted: true });
    expect(streaks.get("p1")).toBe("HOT");
  });

  it("resets player streaks when gameId changes", () => {
    const stats: StatEvent[] = [
      { ...baseStat, gameId: "g1", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
      { ...baseStat, gameId: "g1", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
      { ...baseStat, gameId: "g2", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBeNull();
  });
});
