import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameClock } from "./useGameClock";

// Mock the db and syncService
vi.mock("../db", () => ({
  db: {
    games: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGameClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() => useGameClock("game-1", 10, 1, 600));
    expect(result.current.clockSeconds).toBe(600);
    expect(result.current.period).toBe(1);
    expect(result.current.isClockRunning).toBe(false);
  });

  it("toggles the clock", async () => {
    const { result } = renderHook(() => useGameClock("game-1", 10, 1, 600));
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
    const { result } = renderHook(() => useGameClock("game-1", 10, 1, 600));
    act(() => {
      result.current.handleToggleClock();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.clockSeconds).toBe(599);
  });

  it("handles edit clock", async () => {
    const { result } = renderHook(() => useGameClock("game-1", 10, 1, 600));
    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });
    expect(result.current.clockSeconds).toBe(510);
  });

  it("handles next period", async () => {
    // Completely unmount and remount or just use a fresh hook
    const { result } = renderHook(() =>
      useGameClock("game-1", 10, undefined, undefined),
    );

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(600);
  });


  it("respects periodLength in handleNextPeriod", async () => {
    const { result } = renderHook(() =>
      useGameClock("game-1", 8, undefined, undefined),
    );

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(480);
  });
});
