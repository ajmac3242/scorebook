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
      {
        ...baseStat,
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
      },
      {
        ...baseStat,
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
      },
      {
        ...baseStat,
        gameId: "g2",
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
      },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBeNull();
  });

  it("ignores soft-deleted events and non-scoring/non-shot events", () => {
    const stats: StatEvent[] = [
      { ...baseStat, id: "1", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:01Z" },
      { ...baseStat, id: "2", type: ACTION_TYPES.TURNOVER, playerId: "p1", timestamp: "2026-09-22T00:00:02Z" },
      { ...baseStat, id: "3", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", deletedAt: "2026-09-22T00:01:00Z", timestamp: "2026-09-22T00:00:03Z" },
      { ...baseStat, id: "4", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:04Z" },
      { ...baseStat, id: "5", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:05Z" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBe("HOT");
  });

  it("returns null for mixed history or history with fewer than 3 shots", () => {
    const stats: StatEvent[] = [
      { ...baseStat, id: "1", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:01Z" },
      { ...baseStat, id: "2", type: ACTION_TYPES.MISS, points: 0, playerId: "p1", timestamp: "2026-09-22T00:00:02Z" },
      { ...baseStat, id: "3", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:03Z" },
      { ...baseStat, id: "4", type: ACTION_TYPES.MAKE, points: 2, playerId: "p2", timestamp: "2026-09-22T00:00:04Z" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBeNull();
    expect(streaks.get("p2")).toBeNull();
  });

  it("maintains sliding window of last 3 shots when player shoots more than 3 times", () => {
    const stats: StatEvent[] = [
      { ...baseStat, id: "1", type: ACTION_TYPES.MISS, points: 0, playerId: "p1", timestamp: "2026-09-22T00:00:01Z" },
      { ...baseStat, id: "2", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:02Z" },
      { ...baseStat, id: "3", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:03Z" },
      { ...baseStat, id: "4", type: ACTION_TYPES.MAKE, points: 2, playerId: "p1", timestamp: "2026-09-22T00:00:04Z" },
    ];

    const streaks = calculatePlayerStreaks(stats);
    expect(streaks.get("p1")).toBe("HOT");
  });
});
