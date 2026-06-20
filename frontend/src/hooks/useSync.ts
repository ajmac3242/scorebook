import { useState, useEffect, useCallback } from "react";
import { syncService } from "../utils/syncService";

/**
 * useSync hook for monitoring and triggering synchronization.
 *
 * WHY: Provides a reactive way for components to show sync status (LIVE/OFFLINE)
 * and trigger manual syncs without interacting with the singleton service directly.
 */
export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(syncService.getSyncingStatus());
  const [hasUnsynced, setHasUnsynced] = useState(false);

  useEffect(() => {
    // Check initial state
    syncService.hasUnsyncedChanges().then(setHasUnsynced);

    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
      // Re-check unsynced count when a sync operation finishes
      if (!status) {
        syncService.hasUnsyncedChanges().then(setHasUnsynced);
      }
    });
    return unsubscribe;
  }, []);

  const pushUpdates = useCallback(async () => {
    await syncService.pushUpdates();
  }, []);

  const pullAll = useCallback(async () => {
    await syncService.pullAll();
  }, []);

  return {
    isSyncing,
    hasUnsynced,
    pushUpdates,
    pullAll,
  };
};
