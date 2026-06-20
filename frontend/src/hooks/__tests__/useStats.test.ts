import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useStats } from "../useStats";
import { ACTION_TYPES } from "../../constants/stats";
import { syncService } from "../../utils/syncService";
import type { AppDatabase } from "../../db";

// Use vi.importActual to get the real AppDatabase class without the mock from setupTests.ts
const { AppDatabase: RealAppDatabase } =
  await vi.importActual<typeof import("../../db")>("../../db");

vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useStats Hook (Hook-level with fake-indexeddb)", () => {
  let db: AppDatabase;
  const gameId = "test-game-123";

  beforeEach(async () => {
    // Fresh in-memory database for each test
    db = new RealAppDatabase(
      "TestDB_Stats_" + Math.random(),
    ) as unknown as AppDatabase;
    await db.open();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    const name = db.name;
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(name);
  });

  it("adds a stat and persists to Dexie", async () => {
    // We'll use a manual query instead of relying on useLiveQuery's timing in this environment
    const { result } = renderHook(() => useStats(gameId, undefined, db));

    await act(async () => {
      await result.current.addStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
    });

    expect(syncService.pushUpdates).toHaveBeenCalled();

    const dbStats = await db.stats.toArray();
    expect(dbStats).toHaveLength(1);
    expect(dbStats[0].playerId).toBe("p1");
    expect(dbStats[0].points).toBe(2);
  });

  it("filters stats by player and period", async () => {
    await db.stats.bulkAdd([
      {
        id: "s1",
        gameId,
        playerId: "p1",
        period: 1,
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "2026-01-01T10:00:00Z",
      },
      {
        id: "s2",
        gameId,
        playerId: "p2",
        period: 1,
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "2026-01-01T10:01:00Z",
      },
      {
        id: "s3",
        gameId,
        playerId: "p1",
        period: 2,
        type: ACTION_TYPES.MAKE,
        points: 3,
        timestamp: "2026-01-01T10:02:00Z",
      },
    ]);

    // Test data seeding verification
    expect(await db.stats.count()).toBe(3);

    const { result: resP1 } = renderHook(() =>
      useStats(gameId, { playerId: "p1" }, db),
    );
    // Wait for the live query to pick up the seeded data
    await waitFor(() => expect(resP1.current.stats).toHaveLength(2), {
      timeout: 3000,
    });
    expect(resP1.current.stats.every((s) => s.playerId === "p1")).toBe(true);

    const { result: resP1P2 } = renderHook(() =>
      useStats(gameId, { playerId: "p1", period: 2 }, db),
    );
    await waitFor(() => expect(resP1P2.current.stats).toHaveLength(1), {
      timeout: 3000,
    });
    expect(resP1P2.current.stats[0].id).toBe("s3");
  });

  it("undos the last stat correctly", async () => {
    await db.stats.bulkAdd([
      {
        id: "s1",
        gameId,
        playerId: "p1",
        period: 1,
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "2026-01-01T10:00:00Z",
        synced: 1,
      },
      {
        id: "s2",
        gameId,
        playerId: "p1",
        period: 1,
        type: ACTION_TYPES.MAKE,
        points: 3,
        timestamp: "2026-01-01T10:05:00Z",
        synced: 1,
      },
    ]);

    const { result } = renderHook(() => useStats(gameId, undefined, db));

    await act(async () => {
      await result.current.undoLastStat();
    });

    const undoneStat = await db.stats.get("s2");
    expect(undoneStat?.deletedAt).toBeDefined();
    expect(undoneStat?.synced).toBe(0);

    const remainingStats = await db.stats
      .where("gameId")
      .equals(gameId)
      .filter((s) => !s.deletedAt)
      .toArray();
    expect(remainingStats).toHaveLength(1);
    expect(remainingStats[0].id).toBe("s1");
  });

  it("calculates aggregates with FT vs FG separation", async () => {
    await db.stats.bulkAdd([
      {
        id: "s1",
        gameId,
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        timestamp: "2026-01-01T10:00:01Z",
      },
      {
        id: "s2",
        gameId,
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        timestamp: "2026-01-01T10:00:02Z",
      },
      {
        id: "s3",
        gameId,
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 1,
        period: 1,
        timestamp: "2026-01-01T10:00:03Z",
      }, // FT
      {
        id: "s4",
        gameId,
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 2,
        period: 1,
        timestamp: "2026-01-01T10:00:04Z",
      },
      {
        id: "s5",
        gameId,
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 1,
        period: 1,
        timestamp: "2026-01-01T10:00:05Z",
      }, // FT Miss
    ]);

    const { result } = renderHook(() => useStats(gameId, undefined, db));

    await waitFor(
      () => {
        expect(result.current.aggregates).toEqual({
          points: 6,
          fgm: 2,
          fga: 3,
          ftm: 1,
          fta: 2,
        });
      },
      { timeout: 3000 },
    );
  });

  it("isolates stats by gameId", async () => {
    await db.stats.bulkAdd([
      {
        id: "s1",
        gameId: "game-A",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        timestamp: "T1",
      },
      {
        id: "s2",
        gameId: "game-B",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        timestamp: "T2",
      },
    ]);

    const { result } = renderHook(() => useStats("game-A", undefined, db));
    await waitFor(
      () => {
        expect(result.current.stats).toHaveLength(1);
        expect(result.current.stats[0].id).toBe("s1");
      },
      { timeout: 3000 },
    );
  });
});
