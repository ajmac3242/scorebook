/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameClock } from "../useGameClock";
import { mockDb } from "../../dbMock";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";

vi.mock("../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

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

  it("updates clock when initialClock changes and clock is not running", () => {
    const { result, rerender } = renderHook(
      ({ initialClock }) => useGameClock(gameId, 10, 1, initialClock),
      {
        initialProps: { initialClock: 600 },
      },
    );

    rerender({ initialClock: 300 });
    expect(result.current.clockSeconds).toBe(300);
  });

  it("stops clock when it reaches zero", () => {
    // Using undefined for initialClock and 1/60 for periodLength to get 1 second clock
    // This avoids the reset-to-initialClock effect when the clock stops
    const { result } = renderHook(() => useGameClock(gameId, 1 / 60, 1, undefined));

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.clockSeconds).toBe(0);
    expect(result.current.isClockRunning).toBe(false);
  });

  it("periodically syncs clock to database when running", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));

    act(() => {
      result.current.handleToggleClock();
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.clockTime).toBe(600);
    expect(game?.synced).toBe(0);
  });

  it("logs error when handleEditClock fails", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    vi.spyOn(mockDb.games, "update").mockRejectedValue(new Error("Sync Error"));

    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));

    await act(async () => {
      await result.current.handleEditClock(5, 0);
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update game clock:",
      expect.any(Error),
    );
  });

  it("logs error when handleNextPeriod fails", async () => {
    await mockDb.games.add({ id: gameId, synced: 1 } as any);
    vi.spyOn(mockDb.games, "update").mockRejectedValue(new Error("Sync Error"));

    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update game period:",
      expect.any(Error),
    );
  });
});
