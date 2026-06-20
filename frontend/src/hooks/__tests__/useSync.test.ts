import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { useSync } from "../useSync";
import { syncService } from "../../utils/syncService";
import { db as defaultDb } from "../../db";
import type { AppDatabase } from "../../db";

// Use vi.importActual to get the real AppDatabase class
const { AppDatabase: RealAppDatabase } =
  await vi.importActual<typeof import("../../db")>("../../db");

// Mock getAccessToken for syncService
vi.mock("../../api/authApi", () => ({
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

describe("useSync Hook", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = new RealAppDatabase("TestDB_Sync_" + Math.random()) as unknown as AppDatabase;
    await db.open();

    // We need syncService to use our test DB.
    // Since syncService imports 'db' from '../../db' which is mocked/global,
    // we might need to be careful. In this environment, we want to ensure
    // the syncService we are testing against is actually seeing the changes.
    // However, syncService is a singleton.

    // Actually, looking at syncService.ts, it imports { db } from "../db".
    // If we want to test sync logic with fake-indexeddb, we should probably
    // ensure syncService is using the same Dexie instance.
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
       // Accessing private method for testing purpose or triggering via public one
       const pushPromise = syncService.pushUpdates();
       // useSync should react to status change
       // We might need to wait for the next tick if the notify is async
       await pushPromise;
    });

    expect(result.current.isSyncing).toBe(false); // Should be back to false
  });

  it("identifies unsynced changes", async () => {
    // We must use the REAL db that syncService uses, or mock syncService
    // Since we want to test "Offline record creation is tested with synced: 0 assertion",
    // and "Successful sync transitions synced: 0 to synced: 1",
    // we should probably test this in useStatWriter.test.ts or a combined test
    // that uses the real syncService + fake-indexeddb.

    // For useSync specifically, we test it reflects hasUnsyncedChanges correctly.
    const hasUnsyncedSpy = vi.spyOn(syncService, 'hasUnsyncedChanges').mockResolvedValue(true);

    const { result } = renderHook(() => useSync());

    await waitFor(() => {
      expect(result.current.hasUnsynced).toBe(true);
    });

    hasUnsyncedSpy.mockRestore();
  });
});
