import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useSync } from "../useSync";
import { syncService } from "../../utils/syncService";
import type { AppDatabase } from "../../db";

const { AppDatabase: RealAppDatabase } =
  await vi.importActual<typeof import("../../db")>("../../db");

// Mock getAccessToken for syncService
vi.mock("../../api/authApi", () => ({
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

describe("useSync Hook", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = new (RealAppDatabase as any)(
      "TestDB_Sync_" + Math.random(),
    );
    await db.open();
  });

  afterEach(async () => {
    const name = db.name;
    if (db.isOpen()) await db.close();
    await Dexie.delete(name);
  });

  it("reflects sync status from syncService", async () => {
    const { result } = renderHook(() => useSync());

    expect(result.current.isSyncing).toBe(false);

    // Simulate starting sync
    await act(async () => {
      const pushPromise = syncService.pushUpdates();
      await pushPromise;
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it("identifies unsynced changes", async () => {
    const hasUnsyncedSpy = vi
      .spyOn(syncService, "hasUnsyncedChanges")
      .mockResolvedValue(true);

    const { result } = renderHook(() => useSync());

    await waitFor(() => {
      expect(result.current.hasUnsynced).toBe(true);
    });

    hasUnsyncedSpy.mockRestore();
  });

  it("calls pushUpdates and pullAll", async () => {
    const pushSpy = vi.spyOn(syncService, "pushUpdates").mockResolvedValue(undefined);
    const pullSpy = vi.spyOn(syncService, "pullAll").mockResolvedValue(undefined);

    const { result } = renderHook(() => useSync());

    await act(async () => {
        await result.current.pushUpdates();
        await result.current.pullAll();
    });

    expect(pushSpy).toHaveBeenCalled();
    expect(pullSpy).toHaveBeenCalled();
  });
});
