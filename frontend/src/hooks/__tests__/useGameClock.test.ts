import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useGameClock } from "../useGameClock";

// Unmock to use real logic
vi.unmock("../../db");
vi.unmock("dexie-react-hooks");

// Mock syncService
vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

import { db } from "../../db";

describe("useGameClock", () => {
  const gameId = "game-1";

  beforeEach(async () => {
    if (db.isOpen()) await db.close();
    await Dexie.delete("ScorebookDB");
    await db.open();
    await db.games.add({
        id: gameId,
        teamId: "t1",
        opponent: "Opp",
        date: "2023-01-01",
        location: "Loc",
        currentPeriod: 1,
        clockTime: 600,
        periodLength: 10
    } as any);
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (db.isOpen()) await db.close();
    await Dexie.delete("ScorebookDB");
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    expect(result.current.clockSeconds).toBe(600);
    expect(result.current.period).toBe(1);
  });

  it("toggles the clock", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    await act(async () => { result.current.handleToggleClock(); });
    expect(result.current.isClockRunning).toBe(true);
    await act(async () => { result.current.handleToggleClock(); });
    expect(result.current.isClockRunning).toBe(false);
  });

  it("decrements clock when running", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    await act(async () => { result.current.handleToggleClock(); });

    act(() => {
        vi.advanceTimersByTime(1000);
    });
    expect(result.current.clockSeconds).toBe(599);
    vi.useRealTimers();
  });

  it("stops at zero", async () => {
    // Avoid initialClock prop to prevent reset-to-initial effect
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, undefined));

    await act(async () => {
        result.current.setClockSeconds(1);
    });

    await act(async () => {
        result.current.handleToggleClock();
    });

    vi.useFakeTimers();
    act(() => {
        vi.advanceTimersByTime(1000);
    });

    expect(result.current.clockSeconds).toBe(0);

    act(() => {
        vi.advanceTimersByTime(0);
    });

    expect(result.current.isClockRunning).toBe(false);
    vi.useRealTimers();
  });

  it("handles edit clock and persists it", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });
    expect(result.current.clockSeconds).toBe(510);
    await waitFor(async () => {
      const g = await db.games.get(gameId);
      expect(g?.clockTime).toBe(510);
    });
  });

  it("handles next period and persists it", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    // Use waitFor for state updates if they are not immediate
    await waitFor(() => {
        expect(result.current.period).toBe(2);
        expect(result.current.clockSeconds).toBe(600);
    });

    await waitFor(async () => {
        const g = await db.games.get(gameId);
        expect(g?.currentPeriod).toBe(2);
    });
  });

  it("persists clock automatically when running", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, undefined, 600));
    await act(async () => {
      result.current.handleToggleClock();
    });

    // Sync interval is 5000ms
    await new Promise(r => setTimeout(r, 6000));

    const g = await db.games.get(gameId);
    expect(g?.clockTime).toBeLessThan(600);
  }, 15000);
});
