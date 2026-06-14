import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useStats } from "../useStats";
import { ACTION_TYPES } from "../../constants/stats";

// Unmock the database to use the real Dexie with fake-indexeddb
vi.unmock("../../db");
// Unmock dexie-react-hooks to use the real implementation with fake-indexeddb
vi.unmock("dexie-react-hooks");

import { AppDatabase } from "../../db";

describe("useStats", () => {
  let db: AppDatabase;
  const gameId = "test-game-123";

  beforeEach(async () => {
    db = new AppDatabase();
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete("ScorebookDB");
  });

  it("initializes with empty stats", () => {
    const { result } = renderHook(() => useStats(gameId));
    expect(result.current.stats).toEqual([]);
    expect(result.current.isSaving).toBe(false);
  });

  it("writes a new stat and persists it", async () => {
    const { result } = renderHook(() => useStats(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(1));

    const stat = result.current.stats[0];
    expect(stat.playerId).toBe("p1");
    expect(stat.type).toBe(ACTION_TYPES.MAKE);
    expect(stat.points).toBe(2);
    expect(stat.gameId).toBe(gameId);
  });

  it("updates an existing stat when editing", async () => {
    const { result } = renderHook(() => useStats(gameId));

    let savedStat: any;
    await act(async () => {
      savedStat = await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        period: 1,
        clockTime: 590,
      });
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(1));

    await act(async () => {
      await result.current.writeStat({
        isEditing: true,
        editingStatId: savedStat.id,
        type: ACTION_TYPES.MAKE,
        points: 3,
      });
    });

    await waitFor(() => {
      const updated = result.current.stats.find((s) => s.id === savedStat.id);
      expect(updated?.type).toBe(ACTION_TYPES.MAKE);
      expect(updated?.points).toBe(3);
    });
  });

  it("soft deletes a stat", async () => {
    const { result } = renderHook(() => useStats(gameId));

    let savedStat: any;
    await act(async () => {
      savedStat = await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.FOUL,
        period: 1,
        clockTime: 500,
      });
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(1));

    await act(async () => {
      await result.current.deleteStat(savedStat.id);
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(0));

    // Verify it's still in the DB but with deletedAt
    const dbStat = await db.stats.get(savedStat.id);
    expect(dbStat?.deletedAt).toBeDefined();
  });

  it("undoes the last recorded stat", async () => {
    const { result } = renderHook(() => useStats(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        clockTime: 400,
      });
      // Small delay to ensure different timestamps if needed
      await new Promise((r) => setTimeout(r, 10));
      await result.current.writeStat({
        playerId: "p2",
        type: ACTION_TYPES.ASSIST,
        period: 1,
        clockTime: 400,
      });
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(2));

    await act(async () => {
      await result.current.undoLastStat();
    });

    await waitFor(() => {
      expect(result.current.stats).toHaveLength(1);
      expect(result.current.stats[0].playerId).toBe("p1");
    });
  });

  it("isolates stats by gameId", async () => {
    const otherGameId = "other-game";
    const { result: result1 } = renderHook(() => useStats(gameId));
    const { result: result2 } = renderHook(() => useStats(otherGameId));

    await act(async () => {
      await result1.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        clockTime: 300,
      });
    });

    await waitFor(() => {
      expect(result1.current.stats).toHaveLength(1);
      expect(result2.current.stats).toHaveLength(0);
    });
  });
});
