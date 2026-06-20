import { useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db as defaultDb, type StatEvent, type AppDatabase } from "../db";
import { ACTION_TYPES } from "../constants/stats";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";

export interface StatFilters {
  playerId?: string;
  period?: number;
}

/**
 * useStats hook for managing and retrieving game statistics.
 * Supports dependency injection for easier testing.
 */
export const useStats = (
  gameId: string | null,
  filters?: StatFilters,
  dbOverride?: AppDatabase,
) => {
  const db = dbOverride || defaultDb;

  const stats = useLiveQuery(async () => {
    if (!gameId) return [];

    // Efficiency: Use gameId as the primary index
    let collection = db.stats.where("gameId").equals(gameId);

    // Filter by deletedAt and other optional filters
    // Dexie doesn't easily chain where clauses without compound indices
    return collection
      .filter((s) => {
        if (s.deletedAt) return false;
        if (filters?.playerId && s.playerId !== filters.playerId) return false;
        if (filters?.period && s.period !== filters.period) return false;
        return true;
      })
      .toArray();
  }, [gameId, filters?.playerId, filters?.period, db]);

  const aggregates = useMemo(() => {
    if (!stats) return null;

    let points = 0;
    let fgm = 0;
    let fga = 0;
    let ftm = 0;
    let fta = 0;

    stats.forEach((s) => {
      if (s.type === ACTION_TYPES.MAKE) {
        points += s.points || 0;
        if (s.points === 1) {
          ftm++;
          fta++;
        } else {
          fgm++;
          fga++;
        }
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) {
          fta++;
        } else {
          fga++;
        }
      }
    });

    return { points, fgm, fga, ftm, fta };
  }, [stats]);

  const addStat = useCallback(
    async (statData: Partial<StatEvent>) => {
      if (!gameId) return null;
      try {
        const newStat: StatEvent = {
          id: crypto.randomUUID(),
          gameId,
          playerId: statData.playerId!,
          type: statData.type!,
          points: statData.points || 0,
          period: statData.period!,
          clockTime: statData.clockTime!,
          locationX: statData.locationX || 0,
          locationY: statData.locationY || 0,
          timestamp: new Date().toISOString(),
          synced: 0,
          ...statData,
        };
        await db.stats.add(newStat);
        await syncService.pushUpdates();
        return newStat;
      } catch (err) {
        logger.error("Failed to add stat:", err);
        throw err;
      }
    },
    [gameId, db],
  );

  const undoLastStat = useCallback(async () => {
    if (!gameId) return;
    try {
      // Find the most recent non-deleted stat for this game
      const allStats = await db.stats
        .where("gameId")
        .equals(gameId)
        .filter((s) => !s.deletedAt)
        .toArray();

      const lastStat = allStats.sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp),
      )[0];

      if (lastStat?.id) {
        await db.stats.update(lastStat.id, {
          deletedAt: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
      }
    } catch (err) {
      logger.error("Failed to undo last stat:", err);
      throw err;
    }
  }, [gameId, db]);

  return {
    stats: stats || [],
    aggregates,
    addStat,
    undoLastStat,
  };
};
