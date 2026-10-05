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

  it("initializes with provided values and restores initialClock even when 0", async () => {
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 0, 5, db));
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));
    expect(result.current.clockSeconds).toBe(0);
    expect(result.current.period).toBe(1);
    expect(result.current.isClockRunning).toBe(false);
  });

  it("enforces hydration lock until IndexedDB state recovery is resolved", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 240,
      currentPeriod: 3,
      synced: 1,
    } as any);

    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
      expect(result.current.clockSeconds).toBe(240);
      expect(result.current.period).toBe(3);
    });
  });

  it("preserves 0:00 period-end clock snapshot from db.games on session resume (Period-Start Zero-Clock Hydration Interlock)", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 0,
      currentPeriod: 2,
      synced: 1,
    } as any);

    // Initial render with default fallback initialClock = 600
    const { result, rerender } = renderHook(
      (props) =>
        useGameClock(gameId, 10, props.period, props.initialClock, 5, db),
      {
        initialProps: { period: 2, initialClock: 600 },
      },
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
      expect(result.current.clockSeconds).toBe(0);
      expect(result.current.period).toBe(2);
    });

    // Rerender with initialClock = 600 passed from caller
    rerender({ period: 2, initialClock: 600 });

    expect(result.current.clockSeconds).toBe(0);
  });

  it("toggles the clock and saves to DB", async () => {
    await db.games.add({ id: gameId, clockTime: 600, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

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

  it("decrements clock when running and triggers buzzer and auto-pause persistence when reaching zero", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 1,
      currentPeriod: 1,
      synced: 1,
    } as any);
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 1, 5, db));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.handleToggleClock();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.clockSeconds).toBe(0);
    expect(result.current.isClockRunning).toBe(false);
    expect(result.current.isBuzzerActive).toBe(true);

    vi.useRealTimers();
    await waitFor(async () => {
      const game = await db.games.get(gameId);
      expect(game?.clockTime).toBe(0);
    });
  });

  it("handles edit clock and persists with boundary clamping", async () => {
    await db.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    await act(async () => {
      await result.current.handleEditClock(8, 30, "QUARTERS");
    });

    expect(result.current.clockSeconds).toBe(510);
    let game = await db.games.get(gameId);
    expect(game?.clockTime).toBe(510);
    expect(game?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();

    // Attempt negative minutes/seconds -> clamped to 0
    await act(async () => {
      await result.current.handleEditClock(-5, -10, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(0);

    // Attempt overflow minutes (e.g. 25 minutes for 10-minute period) -> clamped to 600
    await act(async () => {
      await result.current.handleEditClock(25, 0, "QUARTERS");
    });
    expect(result.current.clockSeconds).toBe(600);
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
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

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
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

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

  it("stops clock and persists clockTime: 0 when it reaches zero", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 10,
      currentPeriod: 1,
      synced: 1,
    } as any);
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 1, 5, db));

    await act(async () => {
      result.current.setIsClockRunning(true);
    });

    expect(result.current.isClockRunning).toBe(true);

    await act(async () => {
      result.current.setClockSeconds(0);
    });

    // waitFor the effect to set isClockRunning to false and persist to db
    await waitFor(async () => {
      expect(result.current.isClockRunning).toBe(false);
      const game = await db.games.get(gameId);
      expect(game?.clockTime).toBe(0);
    });
  });

  it("persists paused clockSeconds to IndexedDB when isClockRunning becomes false", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 600,
      currentPeriod: 1,
      synced: 1,
    } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    act(() => {
      result.current.setClockSeconds(450);
    });

    await act(async () => {
      result.current.setIsClockRunning(false);
    });

    await waitFor(async () => {
      const game = await db.games.get(gameId);
      expect(game?.clockTime).toBe(450);
    });
  });

  it("retains exact sub-second precision when paused under 60 seconds (Scoreboard Live Clock Tenths Guard)", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 59.4,
      currentPeriod: 4,
      synced: 1,
    } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 4, 59.4, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    expect(result.current.clockSeconds).toBe(59.4);

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    act(() => {
      result.current.setClockSeconds(42.3);
    });

    await act(async () => {
      result.current.setIsClockRunning(false);
    });

    await waitFor(async () => {
      expect(result.current.clockSeconds).toBe(42.3);
      const game = await db.games.get(gameId);
      expect(game?.clockTime).toBe(42.3);
    });
  });

  it("syncs clock to database when toggled", async () => {
    await db.games.add({ id: gameId, clockTime: 600, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

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
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

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
    await act(async () => {
      await vi.runAllTimersAsync();
    });

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

  it("automatically awards throw-in possession and formats alert message on period transition", async () => {
    await db.games.add({
      id: gameId,
      teamId: "team-1",
      opponent: "Eagles",
      currentPeriod: 1,
      periodLength: 10,
      possessionArrow: "OUR_TEAM",
      synced: 1,
    } as any);
    await db.teams.add({
      id: "team-1",
      name: "Tigers",
    } as any);

    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    let res: { nextPeriod: number; alertMessage: string | null } | null = null;
    await act(async () => {
      res = await result.current.handleNextPeriod("QUARTERS");
    });

    expect(res?.nextPeriod).toBe(2);
    expect(res?.alertMessage).toBe(
      "Period started: Tigers Possession via Alternating Arrow.",
    );

    // Verify POSSESSION stat was recorded for OUR_TEAM
    const stats = await db.stats.where("gameId").equals(gameId).toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe("POSSESSION");
    expect(stats[0].playerId).toBe("OUR_TEAM");
    expect(stats[0].period).toBe(2);

    // Verify possession arrow was NOT flipped immediately in DB
    let game = await db.games.get(gameId);
    expect(game?.possessionArrow).toBe("OUR_TEAM");

    // Trigger clock tick / arrow flip
    await act(async () => {
      await result.current.triggerPendingArrowFlip();
    });

    // Verify possession arrow is now flipped to OPPONENT
    game = await db.games.get(gameId);
    expect(game?.possessionArrow).toBe("OPPONENT");
  });

  it("handles NaN inputs gracefully in handleEditClock", async () => {
    await db.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    await act(async () => {
      await result.current.handleEditClock(NaN, NaN, "QUARTERS");
    });

    expect(result.current.clockSeconds).toBe(0);
  });

  it("adds OT timeouts for both teams on overtime transition", async () => {
    await db.games.add({
      id: gameId,
      currentPeriod: 4,
      periodLength: 10,
      synced: 1,
    } as any);

    const { result } = renderHook(() =>
      useGameClock(gameId, 10, undefined, 0, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    await act(async () => {
      result.current.setPeriod(4);
    });

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(5);
    const stats = await db.stats.where("gameId").equals(gameId).toArray();
    const timeoutStats = stats.filter((s) => s.type === "REMOVE_TIMEOUT");
    expect(timeoutStats).toHaveLength(2);
  });

  it("auto-dismisses buzzer active state after timer duration", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    act(() => {
      result.current.setIsBuzzerActive(true);
    });
    expect(result.current.isBuzzerActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.isBuzzerActive).toBe(false);
  });

  it("handles error when db.games.update fails during handleEditClock or handleAdjustClock or handleNextPeriod", async () => {
    await db.games.add({ id: gameId, synced: 1 } as any);
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    vi.spyOn(db.games, "update").mockRejectedValue(new Error("Update failed"));

    await act(async () => {
      await result.current.handleEditClock(5, 0, "QUARTERS");
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update game clock:",
      expect.any(Error),
    );

    await act(async () => {
      await result.current.handleAdjustClock(-10, "QUARTERS");
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to adjust game clock:",
      expect.any(Error),
    );

    await act(async () => {
      const res = await result.current.handleNextPeriod("QUARTERS");
      expect(res).toBeNull();
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update game period:",
      expect.any(Error),
    );
  });

  it("handles error when triggerPendingArrowFlip fails", async () => {
    await db.games.add({
      id: gameId,
      possessionArrow: "OUR_TEAM",
      synced: 1,
    } as any);

    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    result.current.pendingArrowFlipRef.current = true;
    vi.spyOn(db.games, "get").mockRejectedValue(new Error("Get failed"));

    await act(async () => {
      await result.current.triggerPendingArrowFlip();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to flip possession arrow on clock tick:",
      expect.any(Error),
    );
  });

  it("triggers buzzer sound when intermission reaches 1s and resets intermission when it reaches 0s", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.startIntermission("INTERMISSION", 2);
    });

    expect(result.current.isIntermission).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.intermissionSeconds).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.intermissionSeconds).toBe(0);
    expect(result.current.isBuzzerActive).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isIntermission).toBe(false);
  });

  it("handles opponent possession arrow on next period transition", async () => {
    await db.games.add({
      id: gameId,
      teamId: "team-1",
      opponent: "Eagles",
      currentPeriod: 1,
      periodLength: 10,
      possessionArrow: "OPPONENT",
      synced: 1,
    } as any);

    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );
    await waitFor(() => expect(result.current.isClockHydrated).toBe(true));

    let res: { nextPeriod: number; alertMessage: string | null } | null = null;
    await act(async () => {
      res = await result.current.handleNextPeriod("QUARTERS");
    });

    expect(res?.alertMessage).toBe(
      "Period started: Eagles Possession via Alternating Arrow.",
    );

    // Verify POSSESSION stat recorded for OPPONENT
    const stats = await db.stats.where("gameId").equals(gameId).toArray();
    expect(stats[0].playerId).toBe("OPPONENT");

    // Trigger arrow flip
    await act(async () => {
      await result.current.triggerPendingArrowFlip();
    });

    const game = await db.games.get(gameId);
    expect(game?.possessionArrow).toBe("OUR_TEAM");
  });

  it("handles clock hydration failure from IndexedDB gracefully", async () => {
    vi.spyOn(db.games, "get").mockRejectedValue(
      new Error("Hydration DB error"),
    );
    const { result } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to hydrate game clock state from db:",
      expect.any(Error),
    );
  });

  it("handles 0:00 clock expiration persistence error during clock tick interval", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 1,
      currentPeriod: 1,
      synced: 1,
    } as any);

    vi.useFakeTimers();
    const { result } = renderHook(() => useGameClock(gameId, 10, 1, 1, 5, db));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    vi.spyOn(db.games, "update").mockRejectedValue(
      new Error("0:00 persistence error"),
    );

    act(() => {
      result.current.handleToggleClock();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(result.current.clockSeconds).toBe(0);
    expect(result.current.isClockRunning).toBe(false);

    vi.useRealTimers();
    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to persist paused clock state on 0:00 expiration:",
        expect.any(Error),
      );
    });
  });

  it("handles clock reset for overtime periods with shorter period length", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 0,
      currentPeriod: 4,
      synced: 1,
    } as any);

    const { result } = renderHook(() => useGameClock(gameId, 10, 4, 0, 5, db));

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
    });

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    // Advance from Period 4 (regular regulation) to Period 5 (OT1), which should default to 300s (5 mins)
    expect(result.current.period).toBe(5);
    expect(result.current.clockSeconds).toBe(300);
  });

  it("preserves exact sub-minute clock seconds on toggle pause", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 45,
      currentPeriod: 2,
      synced: 1,
    } as any);

    const { result } = renderHook(() => useGameClock(gameId, 10, 2, 45, 5, db));

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
    });

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(false);
    expect(result.current.clockSeconds).toBe(45);
  });

  it("flushes and persists running clock state to IndexedDB on component unmount (Navigation Unsaved State Lock Guard)", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 600,
      currentPeriod: 1,
      synced: 1,
    } as any);

    const { result, unmount } = renderHook(() =>
      useGameClock(gameId, 10, 1, 600, 5, db),
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
    });

    act(() => {
      result.current.handleToggleClock();
    });
    expect(result.current.isClockRunning).toBe(true);

    act(() => {
      result.current.setClockSeconds(582);
    });

    // Unmount while clock is running
    unmount();

    await waitFor(async () => {
      const game = await db.games.get(gameId);
      expect(game?.clockTime).toBe(582);
    });
  });

  it("hydrates period duration seconds correctly when periodType and periodLength are configured (Game Session Period Clock Duration Hydration Guard)", async () => {
    await db.games.add({
      id: gameId,
      clockTime: 480,
      currentPeriod: 1,
      periodLength: 8, // 8-minute High School quarter
      synced: 1,
    } as any);

    const { result } = renderHook(() => useGameClock(gameId, 8, 1, 480, 4, db));

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
      expect(result.current.clockSeconds).toBe(480);
      expect(result.current.period).toBe(1);
    });

    // Test editing clock with custom 8-minute max boundary
    await act(async () => {
      await result.current.handleEditClock(10, 0, "QUARTERS"); // Attempt 10 mins (> 8 mins max)
    });

    // Clamped strictly to 8 minutes (480s)
    expect(result.current.clockSeconds).toBe(480);

    // Test transition to next period with custom 8-minute length
    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(2);
    expect(result.current.clockSeconds).toBe(480);

    // Test OT transition (period 5) with custom 4-minute overtime length
    await act(async () => {
      result.current.setPeriod(4);
    });

    await act(async () => {
      await result.current.handleNextPeriod("QUARTERS");
    });

    expect(result.current.period).toBe(5);
    expect(result.current.clockSeconds).toBe(240); // 4-minute OT duration
  });

  it("clamps clockSeconds safely when period duration settings change without zeroing out saved time", async () => {
    // Initial clock at 500s for 10-min period (600s)
    const { result, rerender } = renderHook(
      (props) =>
        useGameClock(
          gameId,
          props.periodLength,
          1,
          500,
          props.overtimeLength,
          db,
          "QUARTERS",
        ),
      {
        initialProps: { periodLength: 10, overtimeLength: 5 },
      },
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
      expect(result.current.clockSeconds).toBe(500);
    });

    // Update periodLength setting to 8 mins (480s max). 500s > 480s -> clamped to 480s
    rerender({ periodLength: 8, overtimeLength: 4 });

    await waitFor(() => {
      expect(result.current.clockSeconds).toBe(480);
    });

    // Update periodLength setting to 12 mins (720s max). 480s <= 720s -> kept at 480s without reset/zeroing
    rerender({ periodLength: 12, overtimeLength: 4 });

    await waitFor(() => {
      expect(result.current.clockSeconds).toBe(480);
    });
  });

  it("initializes clockSeconds using overtimeLength when starting in overtime without initialClock (Overtime Clock Length Interlock)", async () => {
    // Period 5 (OT1) in QUARTERS format with 4-minute overtime length and omitted initialClock
    const { result } = renderHook(() =>
      useGameClock(gameId, 8, 5, undefined, 4, db, "QUARTERS"),
    );

    await waitFor(() => {
      expect(result.current.isClockHydrated).toBe(true);
      expect(result.current.period).toBe(5);
      expect(result.current.clockSeconds).toBe(240); // 4 mins * 60 = 240s
    });
  });
});
