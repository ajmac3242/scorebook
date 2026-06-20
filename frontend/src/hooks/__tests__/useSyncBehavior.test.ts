import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useStatWriter } from "../useStatWriter";
import { syncService } from "../../utils/syncService";
import { ACTION_TYPES } from "../../constants/stats";
import { db as defaultDb } from "../../db";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";

// We'll use the defaultDb for this test to easily test integration with syncService
describe("Offline/Sync Behavior Integration", () => {
  const gameId = "sync-test-game";

  beforeEach(async () => {
    await defaultDb.stats.clear();
    await defaultDb.games.clear();
    vi.clearAllMocks();
  });

  it("transitions synced: 0 to synced: 1 after successful sync", async () => {
    // 1. Mock the API response
    server.use(
      http.post("*/api/games/sync-test-game/stats", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    const { result } = renderHook(() => useStatWriter(gameId));

    // 2. Create a stat (it should trigger pushUpdates)
    let savedStat;
    await act(async () => {
      savedStat = await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        clockTime: 600,
      });
    });

    // 3. Verify it was initially created as synced: 0 in the hook's return
    // Note: writeStat calls syncService.pushUpdates() BEFORE returning.
    // If sync succeeded, it might already be 1 if sync was awaited.

    const dbStat = await defaultDb.stats.get(savedStat.id);
    expect(dbStat?.synced).toBe(1);
  });

  it("leaves record as synced: 0 on sync failure", async () => {
    // 1. Mock API failure
    server.use(
      http.post("*/api/games/sync-test-game/stats", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useStatWriter(gameId));

    // 2. Create stat
    let savedStat;
    await act(async () => {
      savedStat = await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        period: 1,
        clockTime: 600,
      });
    });

    // 3. Verify it remains synced: 0
    const dbStat = await defaultDb.stats.get(savedStat.id);
    expect(dbStat?.synced).toBe(0);
  });
});
