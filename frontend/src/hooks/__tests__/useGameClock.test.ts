import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useGameClock } from "../useGameClock";

// Unmock to use real logic with fake-indexeddb
vi.unmock("../../db");
vi.unmock("dexie-react-hooks");

// Mock syncService to avoid timeouts and network calls
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
    // Add initial game data
    await db.games.add({
      id: gameId,
      teamId: "t1",
      opponent: "Opp",
      date: "2023-01-01",
      location: "Loc",
      currentPeriod: 1,
      clockTime: 600,
      periodLength: 10,
    } as any);
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (db.isOpen()) await db.close();
    await Dexie.delete("ScorebookDB");
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );
    expect(result.current.clockSeconds).toBe(600);
    expect(result.current.period).toBe(1);
  });

  it("toggles the clock", async () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );

    await act(async () => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    await act(async () => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(false);
  });

  it("decrements clock", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );
    await act(async () => {
      result.current.handleToggleClock();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.clockSeconds).toBe(599);
    vi.useRealTimers();
  });

  it("stops at zero", async () => {
    // Avoid passing initialClock to prevent reset-to-initial effect
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, undefined),
    );

    await act(async () => {
      result.current.setClockSeconds(1);
    });

    await act(async () => {
      result.current.handleToggleClock();
    });

    // Real time wait for the 1s interval
    await new Promise((r) => setTimeout(r, 1500));

    expect(result.current.clockSeconds).toBe(0);

    await waitFor(() => {
      expect(result.current.isClockRunning).toBe(false);
    }, { timeout: 2000 });
  });

  it("handles edit clock and persists it", async () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );
    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });
    expect(result.current.clockSeconds).toBe(510);
    await waitFor(async () => {
      const g = await db.games.get(gameId);
      expect(g?.clockTime).toBe(510);
    }, { timeout: 2000 });
  });

  it("handles next period and persists it", async () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );
    expect(result.current.period).toBe(1);

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(600);

    await waitFor(async () => {
      const g = await db.games.get(gameId);
      expect(g?.currentPeriod).toBe(2);
    });
  });

  it("respects periodLength in handleNextPeriod", async () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 8, undefined, 480),
    );
    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });
    await waitFor(() => expect(result.current.period).toBe(2));
    expect(result.current.clockSeconds).toBe(480);
  });

  it("handles overtime transition", async () => {
    // Pass undefined for initialClock to avoid it resetting the clock to 0 after handleNextPeriod
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, undefined),
    );

    await act(async () => {
      result.current.setPeriod(4);
      result.current.setClockSeconds(0);
    });
    expect(result.current.period).toBe(4);

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(5);
    expect(result.current.clockSeconds).toBe(600);
  });

  it("resets clock seconds via setClockSeconds", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 600));

    await act(async () => {
      result.current.setClockSeconds(300);
    });
    expect(result.current.clockSeconds).toBe(300);
  });

  it("persists clock automatically when running", async () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 600),
    );
    await act(async () => {
      result.current.handleToggleClock();
    });

    // Advance 5.5s of real time.
    await new Promise((r) => setTimeout(r, 6000));

    const g = await db.games.get(gameId);
    expect(g?.clockTime).toBeLessThan(600);
  }, 15000);
});
