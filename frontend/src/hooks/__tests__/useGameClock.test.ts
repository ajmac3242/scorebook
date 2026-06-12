/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameClock } from "../useGameClock";
import { mockDb } from "../../dbMock";
import { syncService } from "../../utils/syncService";

vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGameClock", () => {
  const gameId = "game-1";

  beforeEach(() => {
    mockDb.reset();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));
    expect(result.current.clockSeconds).toBe(600);
    expect(result.current.period).toBe(1);
    expect(result.current.isClockRunning).toBe(false);
  });

  it("toggles the clock", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));
    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);
    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(false);
  });

  it("decrements clock when running", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));
    act(() => {
      result.current.handleToggleClock();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.clockSeconds).toBe(599);
  });

  it("handles edit clock", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));
    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });
    expect(result.current.clockSeconds).toBe(510);

    const game = await mockDb.games.get(gameId);
    expect(game?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles next period", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, undefined),
    );

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(600);

    const game = await mockDb.games.get(gameId);
    expect(game?.synced).toBe(0);
  });

  it("respects periodLength in handleNextPeriod", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 8, undefined, undefined),
    );

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(480);
  });
});
