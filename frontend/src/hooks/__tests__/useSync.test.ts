import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStatWriter } from "../useStatWriter";
import { syncService } from "../../utils/syncService";
import { db } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { mockDb } from "../../dbMock";

// Mock UserPool
vi.mock("../../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(() => ({
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "test-token" }),
        }),
      ),
    })),
  },
}));

// We need to use the real syncService but it uses the real db by default.
// In tests, we want to ensure it uses what we expect.
// syncService.ts imports { db } from "../db".
// We can use the mockDb which is already set up in the project for testing.

describe("Sync and Offline Behavior", () => {
  const gameId = "game-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.reset();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("writeStat creates records with synced: 0 before synchronization", async () => {
    // Mock pushUpdates to do nothing so we can verify the state after add but before sync completion
    const pushSpy = vi
      .spyOn(syncService, "pushUpdates")
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useStatWriter(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
    });

    const stats = await db.stats.toArray();
    expect(stats.length).toBe(1);
    expect(stats[0].synced).toBe(0);
    expect(pushSpy).toHaveBeenCalled();
  });

  it("syncService.pushUpdates transitions synced: 0 to 1 on success", async () => {
    // Seed database with unsynced stat
    const statId = "stat-123";
    await db.stats.add({
      id: statId,
      gameId,
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 600,
      synced: 0,
      timestamp: new Date().toISOString(),
    });

    server.use(
      http.post("*/api/games/game-1/stats", () => {
        return HttpResponse.json({ id: statId, synced: 1 }, { status: 201 });
      })
    );

    await syncService.pushUpdates();

    const stat = await db.stats.get(statId);
    expect(stat?.synced).toBe(1);
  });

  it("syncService.pushUpdates leaves synced: 0 on failure", async () => {
    const statId = "stat-fail";
    await db.stats.add({
      id: statId,
      gameId,
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 600,
      synced: 0,
      timestamp: new Date().toISOString(),
    });

    server.use(
      http.post("*/api/games/game-1/stats", () => {
        return new HttpResponse("Server Error", { status: 500 });
      })
    );

    await syncService.pushUpdates();

    const stat = await db.stats.get(statId);
    expect(stat?.synced).toBe(0);
  });

  it("identifies unsynced changes and retries successfully", async () => {
    await db.stats.add({
      id: "stat-retry",
      gameId,
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 600,
      synced: 0,
      timestamp: new Date().toISOString(),
    });

    expect(await syncService.hasUnsyncedChanges()).toBe(true);

    // 1. Fail first attempt
    server.use(
      http.post("*/api/games/game-1/stats", () => {
        return new HttpResponse("Service Unavailable", { status: 503 });
      })
    );
    await syncService.pushUpdates();
    expect((await db.stats.get("stat-retry"))?.synced).toBe(0);

    // 2. Succeed second attempt
    server.use(
      http.post("*/api/games/game-1/stats", () => {
        return HttpResponse.json({ id: "stat-retry", synced: 1 }, { status: 201 });
      })
    );
    await syncService.pushUpdates();
    expect((await db.stats.get("stat-retry"))?.synced).toBe(1);
    expect(await syncService.hasUnsyncedChanges()).toBe(false);
  });
});
