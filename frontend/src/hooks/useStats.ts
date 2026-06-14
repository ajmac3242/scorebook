import { useState, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";

export const useStats = (gameId: string | null) => {
  const [isSaving, setIsSaving] = useState(false);

  const stats = useLiveQuery(
    () => (gameId ? db.stats.where("gameId").equals(gameId).toArray() : []),
    [gameId],
  );

  const activeStats = useMemo(
    () => (stats || []).filter((s) => !s.deletedAt),
    [stats],
  );

  const writeStat = useCallback(
    async (
      statData: Partial<StatEvent> & {
        isEditing?: boolean;
        editingStatId?: string | null;
      },
    ) => {
      if (!gameId) return null;
      setIsSaving(true);
      try {
        let savedStat: StatEvent;
        if (statData.isEditing && statData.editingStatId) {
          const updates: Record<string, unknown> = { ...statData };
          delete updates.isEditing;
          delete updates.editingStatId;
          delete updates.id;

          await db.stats.update(statData.editingStatId, {
            ...updates,
            synced: 0,
          });
          savedStat = (await db.stats.get(statData.editingStatId))!;
        } else {
          savedStat = {
            id: crypto.randomUUID(),
            gameId: gameId,
            playerId: statData.playerId!,
            type: statData.type!,
            points: statData.points || 0,
            locationX: statData.locationX || 0,
            locationY: statData.locationY || 0,
            playName: statData.playName,
            shotQuality: statData.shotQuality,
            period: statData.period!,
            clockTime: statData.clockTime!,
            timestamp: new Date().toISOString(),
            synced: 0,
          };
          await db.stats.add(savedStat);
        }
        await syncService.pushUpdates();
        return savedStat;
      } catch (err) {
        logger.error("Failed to write stat:", err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [gameId],
  );

  const deleteStat = useCallback(async (statId: string) => {
    setIsSaving(true);
    try {
      await db.stats.update(statId, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to delete stat:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const undoLastStat = useCallback(async () => {
    if (!gameId) return;
    // We need to find the most recent stat that isn't deleted.
    const lastStat = await db.stats
      .where("gameId")
      .equals(gameId)
      .filter((s) => !s.deletedAt)
      .toArray()
      .then(
        (arr) => arr.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0],
      );

    if (lastStat && lastStat.id) {
      await deleteStat(lastStat.id);
    }
  }, [gameId, deleteStat]);

  return {
    stats: activeStats,
    isSaving,
    writeStat,
    deleteStat,
    undoLastStat,
  };
};
