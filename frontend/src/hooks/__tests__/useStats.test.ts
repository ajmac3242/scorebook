import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useStats } from "../useStats";
import { ACTION_TYPES } from "../../constants/stats";

// Unmock to use real logic with fake-indexeddb
vi.unmock("../../db");
vi.unmock("dexie-react-hooks");

import { db } from "../../db";

describe("useStats", () => {
  const gameId = "test-game-123";

  beforeEach(async () => {
    if (db.isOpen()) await db.close();
    await Dexie.delete("ScorebookDB");
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) await db.close();
    await Dexie.delete("ScorebookDB");
  });

  it("initializes with empty stats", () => {
    const { result } = renderHook(() => useStats(gameId));
    expect(result.current.stats).toEqual([]);
    expect(result.current.totals).toEqual({
      fgm: 0,
      fga: 0,
      ftm: 0,
      fta: 0,
      points: 0,
    });
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
    expect(stat.points).toBe(2);
    expect(result.current.totals.points).toBe(2);
    expect(result.current.totals.fgm).toBe(1);
  });

  it("filters stats by player and period", async () => {
    const { result } = renderHook(() => useStats(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
      await result.current.writeStat({
        playerId: "p2",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        clockTime: 500,
      });
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 0,
        period: 2,
        clockTime: 400,
      });
    });

    await waitFor(() => expect(result.current.stats).toHaveLength(3));

    const p1Stats = result.current.getStatsByPlayer("p1");
    expect(p1Stats).toHaveLength(2);
    expect(p1Stats.every((s) => s.playerId === "p1")).toBe(true);

    const period2Stats = result.current.getStatsByPeriod(2);
    expect(period2Stats).toHaveLength(1);
    expect(period2Stats[0].period).toBe(2);
  });

  it("separates FT and FG in aggregation", async () => {
    const { result } = renderHook(() => useStats(gameId));

    await act(async () => {
      // 2PT Make
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
      // FT Make
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 1,
        period: 1,
        clockTime: 550,
      });
      // 3PT Miss
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 3,
        period: 1,
        clockTime: 500,
      });
      // FT Miss
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 1,
        period: 1,
        clockTime: 450,
      });
    });

    await waitFor(() => {
      expect(result.current.totals.fgm).toBe(1);
      expect(result.current.totals.fga).toBe(2); // 2pt make + 3pt miss
      expect(result.current.totals.ftm).toBe(1);
      expect(result.current.totals.fta).toBe(2); // ft make + ft miss
      expect(result.current.totals.points).toBe(3);
    });
  });

  it("undoes the last recorded stat across multiple writes", async () => {
    const { result } = renderHook(() => useStats(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 400,
      });
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

  it("isolates stats between different games", async () => {
    const game2Id = "other-game";
    const { result: r1 } = renderHook(() => useStats(gameId));
    const { result: r2 } = renderHook(() => useStats(game2Id));

    await act(async () => {
      await r1.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 300,
      });
    });

    await waitFor(() => {
      expect(r1.current.stats).toHaveLength(1);
      expect(r2.current.stats).toHaveLength(0);
    });
  });
});
