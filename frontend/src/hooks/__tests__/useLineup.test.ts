import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStatWriter } from "../useStatWriter";
import { useGameAggregator } from "../useGameAggregator";
import { db } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";

// Mock db and syncService
vi.mock("../../db", () => ({
  db: {
    stats: {
      add: vi.fn().mockImplementation((stat) => Promise.resolve(stat.id)),
      update: vi.fn().mockResolvedValue(1),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    games: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useLineup and Substitution Behavior", () => {
  const gameId = "game-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates active lineup correctly via useGameAggregator", () => {
    const stats = [
      {
        playerId: "p1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "2023-01-01T00:00:00.000Z",
      },
      {
        playerId: "p2",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "2023-01-01T00:00:01.000Z",
      },
      {
        playerId: "p1",
        type: ACTION_TYPES.SUB_OUT,
        period: 1,
        clockTime: 300,
        timestamp: "2023-01-01T00:05:00.000Z",
      },
      {
        playerId: "p3",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 300,
        timestamp: "2023-01-01T00:05:01.000Z",
      },
    ] as any;

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 300, undefined, undefined),
    );

    expect(result.current.gameData.onCourtIds).toContain("p2");
    expect(result.current.gameData.onCourtIds).toContain("p3");
    expect(result.current.gameData.onCourtIds).not.toContain("p1");
  });

  it("generates SUB_IN/OUT events correctly via useStatWriter.quickSub", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    const originalOnCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const finalOnCourt = new Set(["p2", "p3", "p4", "p5", "p6"]);

    await act(async () => {
      await result.current.quickSub(originalOnCourt, finalOnCourt, 1, 400);
    });

    // Should sub out p1
    expect(db.stats.add).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "p1",
        type: ACTION_TYPES.SUB_OUT,
        gameId,
        period: 1,
        clockTime: 400,
      }),
    );

    // Should sub in p6
    expect(db.stats.add).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "p6",
        type: ACTION_TYPES.SUB_IN,
        gameId,
        period: 1,
        clockTime: 400,
      }),
    );
  });

  it("handles 5-player active lineup occupancy", () => {
    const stats = [
      {
        playerId: "p1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T1",
      },
      {
        playerId: "p2",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T2",
      },
      {
        playerId: "p3",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T3",
      },
      {
        playerId: "p4",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T4",
      },
      {
        playerId: "p5",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T5",
      },
    ] as any;

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 600, undefined, undefined),
    );

    expect(result.current.gameData.onCourtIds.size).toBe(5);
    ["p1", "p2", "p3", "p4", "p5"].forEach((id) => {
      expect(result.current.gameData.onCourtIds).toContain(id);
    });
  });

  it("handles adding a 6th player (aggregator is additive)", () => {
    const stats = [
      {
        playerId: "p1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T1",
      },
      {
        playerId: "p2",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T2",
      },
      {
        playerId: "p3",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T3",
      },
      {
        playerId: "p4",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T4",
      },
      {
        playerId: "p5",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T5",
      },
      {
        playerId: "p6",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T6",
      },
    ] as any;

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 600, undefined, undefined),
    );

    expect(result.current.gameData.onCourtIds.size).toBe(6);
  });

  it("isolates lineup state by filtering events before passing to useGameAggregator", () => {
    // Note: useGameAggregator assumes it only receives stats for the current game.
    // Isolation is handled by the caller (useGameMode) which queries by gameId.
    // Here we test that the aggregator correctly processes only what's passed.

    const gameAStats = [
      {
        playerId: "p1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T1",
      },
    ] as any;

    const { result: resultA } = renderHook(() =>
      useGameAggregator(gameAStats, 1, 600, undefined, undefined),
    );
    expect(resultA.current.gameData.onCourtIds).toContain("p1");

    const gameBStats = [
      {
        playerId: "p2",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: "T1",
      },
    ] as any;

    const { result: resultB } = renderHook(() =>
      useGameAggregator(gameBStats, 1, 600, undefined, undefined),
    );
    expect(resultB.current.gameData.onCourtIds).toContain("p2");
    expect(resultB.current.gameData.onCourtIds).not.toContain("p1");
  });
});
