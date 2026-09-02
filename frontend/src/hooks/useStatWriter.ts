import { useState, useCallback } from "react";
import { db as defaultDb, type StatEvent, type AppDatabase } from "../db";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { ACTION_TYPES } from "../constants/stats";
import { calculateGameResult } from "../utils/stats/aggregators";

export const useStatWriter = (
  gameId: string | null,
  dbOverride?: AppDatabase,
) => {
  const db = dbOverride || defaultDb;
  const [isSavingStat, setIsSavingStat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const writeStat = useCallback(
    async (
      statData: Partial<StatEvent> & {
        isEditing?: boolean;
        editingStatId?: string | null;
      },
    ) => {
      if (!gameId) return null;
      setIsSavingStat(true);
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
        setIsSavingStat(false);
      }
    },
    [gameId, db],
  );

  const deleteStat = useCallback(
    async (statId: string) => {
      setIsDeleting(true);
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
        setIsDeleting(false);
      }
    },
    [db],
  );

  const quickSub = useCallback(
    async (
      originalOnCourt: Set<string>,
      finalOnCourt: Set<string>,
      period: number,
      clockSeconds: number,
    ) => {
      if (!gameId) return;
      const timestamp = new Date().toISOString();
      const toSubOut = Array.from(originalOnCourt).filter(
        (id) => !finalOnCourt.has(id),
      );
      const toSubIn = Array.from(finalOnCourt).filter(
        (id) => !originalOnCourt.has(id) && !id.startsWith("EMPTY"),
      );

      for (const pId of toSubOut) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_OUT,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }

      for (const pId of toSubIn) {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: pId,
          type: ACTION_TYPES.SUB_IN,
          period,
          clockTime: clockSeconds,
          timestamp,
          synced: 0,
        });
      }
      await syncService.pushUpdates();
    },
    [gameId, db],
  );

  const endHighGame = useCallback(async () => {
    if (!gameId) return;
    setIsEnding(true);
    try {
      const _writerStats = await db.stats
        .where("gameId")
        .equals(gameId)
        .toArray();
      const { teamScore: _wts, oppScore: _wos } = calculateGameResult(
        gameId,
        _writerStats,
      );

      const currentGame = await db.games.get(gameId);

      // Extract all opponent jersey numbers recorded during play
      const oppJerseys = new Set<string>();
      if (currentGame?.opponentRoster) {
        currentGame.opponentRoster.forEach((j) => oppJerseys.add(j));
      }

      _writerStats.forEach((s) => {
        if (!s.deletedAt && s.playerId && s.playerId.includes(":")) {
          const parts = s.playerId.split(":");
          if (parts[0] === "OPPONENT" && parts[1]) {
            oppJerseys.add(parts[1]);
          }
        }
      });

      const updatedOpponentRoster = Array.from(oppJerseys).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });

      await db.games.update(gameId, {
        completed: 1,
        teamScore: _wts,
        oppScore: _wos,
        opponentRoster: updatedOpponentRoster,
        synced: 0,
      });

      // Save merged roster back to persistent Opponent record if linked
      if (currentGame?.opponentId && updatedOpponentRoster.length > 0) {
        const persistentOpp = await db.opponents.get(currentGame.opponentId);
        if (persistentOpp) {
          const existingSet = new Set(persistentOpp.roster || []);
          let changed = false;
          updatedOpponentRoster.forEach((j) => {
            if (!existingSet.has(j)) {
              existingSet.add(j);
              changed = true;
            }
          });
          if (changed) {
            const newPersistentRoster = Array.from(existingSet).sort((a, b) => {
              const numA = parseInt(a, 10);
              const numB = parseInt(b, 10);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return a.localeCompare(b);
            });
            await db.opponents.update(currentGame.opponentId, {
              roster: newPersistentRoster,
              synced: 0,
            });
          }
        }
      }

      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to end game:", err);
      throw err;
    } finally {
      setIsEnding(false);
    }
  }, [gameId, db]);

  return {
    isSavingStat,
    setIsSavingStat,
    isDeleting,
    setIsDeleting,
    isEnding,
    setIsEnding,
    writeStat,
    deleteStat,
    quickSub,
    endHighGame,
  };
};
