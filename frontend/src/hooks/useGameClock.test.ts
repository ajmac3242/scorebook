import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "../test-utils";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useGameClock } from "./useGameClock";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import type { AppDatabase } from "../db";

const { AppDatabase: RealAppDatabase } =
  await vi.importActual<typeof import("../db")>("../db");

vi.mock("../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGameClock Hook (Hook-level with fake-indexeddb)", () => {
  let db: AppDatabase;
  const gameId = "game-1";

  beforeEach(async () => {
    db = new RealAppDatabase(
      "TestDB_Clock_" + Math.random(),
    ) as unknown as AppDatabase;
    await db.open();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.useRealTimers();
    const name = db.name;
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(name);
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    expect(result.current.clockSeconds).toBe(600);
    expect(result.current.period).toBe(1);
    expect(result.current.isClockRunning).toBe(false);
  });

  it("toggles the clock and saves to DB", async () => {
    await db.games.add({ id: gameId, clockTime: 600, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    const game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(600);
    expect(game?.synced).toBe(0);

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(false);
  });

  it("decrements clock when running and triggers buzzer when reaching zero", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 1, 5, db));

    act(() => {
      result.current.handleToggleClock();
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.clockSeconds).toBe(0);
    expect(result.current.isClockRunning).toBe(false);
    expect(result.current.isBuzzerActive).toBe(true);
  });

  it("handles edit clock and persists", async () => {
    await db.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });

    expect(result.current.clockSeconds).toBe(510);
    const game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(510);
    expect(game?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles next period (regulation)", async () => {
    await db.games.add({
      id: gameId,
      currentPeriod: 1,
      periodLength: 10,
      synced: 1,
    } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, undefined, 5, db),
    );

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(600);
    const game = await db.games.get(gameId);
    expect(game?.currentPeriod).toBe(2);
    expect(game?.clockTime).toBe(600);
  });

  it("handles OT period advancement", async () => {
    await db.games.add({
      id: gameId,
      currentPeriod: 4,
      periodLength: 10,
      synced: 1,
    } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, undefined, 5, db),
    );

    // Move end of period 4 to OT1 (Period 5)
    await act(async () => {
      result.current.setPeriod(4);
    });

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(5);
    expect(result.current.clockSeconds).toBe(300); // 5 min OT1
    let game = await db.games.get(gameId);
    expect(game?.currentPeriod).toBe(5);
    expect(game?.clockTime).toBe(300);

    // Advance OT1 to OT2 (Period 6)
    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(6);
    expect(result.current.clockSeconds).toBe(300); // 5 min OT2
    game = await db.games.get(gameId);
    expect(game?.currentPeriod).toBe(6);
    expect(game?.clockTime).toBe(300);

    // Advance OT2 to OT3 (Period 7)
    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(7);
    expect(result.current.clockSeconds).toBe(300); // 5 min OT3
    game = await db.games.get(gameId);
    expect(game?.currentPeriod).toBe(7);
  });

  it("stops clock when it reaches zero", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 1, 5, db));

    await act(async () => {
      result.current.setIsClockRunning(true);
    });

    expect(result.current.isClockRunning).toBe(true);

    await act(async () => {
      result.current.setClockSeconds(0);
    });

    // waitFor the effect to set isClockRunning to false
    await waitFor(() => {
      expect(result.current.isClockRunning).toBe(false);
    });
  });

  it("syncs clock to database when toggled", async () => {
    await db.games.add({ id: gameId, clockTime: 600, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    await act(async () => {
      result.current.setClockSeconds(590);
    });

    // Toggle clock syncs current clockSecondsRef
    await act(async () => {
      result.current.handleToggleClock();
    });

    const game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(590);
    expect(game?.synced).toBe(0);
  });

  it("handles adjust clock and clamps within bounds (0 to max period length)", async () => {
    await db.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 599, 5, db),
    );

    // Increment clock (+1s) -> 600s
    await act(async () => {
      await result.current.handleAdjustClock(1, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(600);
    let game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(600);

    // Overflow attempt (+1s when already at 600s max) -> remains 600s
    await act(async () => {
      await result.current.handleAdjustClock(1, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(600);

    // Decrement clock (-1s) -> 599s
    await act(async () => {
      await result.current.handleAdjustClock(-1, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(599);

    // Set clock to 0 and attempt underflow (-1s) -> remains 0s
    await act(async () => {
      result.current.setClockSeconds(0);
    });
    await act(async () => {
      await result.current.handleAdjustClock(-1, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(0);
    game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(0);
  });

  it("handles startIntermission and countdown timer", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    act(() => {
      result.current.startIntermission("HALFTIME", 600);
    });

    expect(result.current.isIntermission).toBe(true);
    expect(result.current.intermissionLabel).toBe("HALFTIME");
    expect(result.current.intermissionSeconds).toBe(600);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.intermissionSeconds).toBe(599);

    act(() => {
      result.current.stopIntermission();
    });

    expect(result.current.isIntermission).toBe(false);
  });
});
