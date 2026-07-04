import { useState, useEffect, useRef, useCallback } from "react";
import { db as defaultDb, type AppDatabase } from "../db";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import { getPeriodDurationSeconds } from "../utils/mathUtils";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";

/**
 * useGameClock hook for managing game time and periods.
 * Supports dependency injection for easier testing.
 */
export const useGameClock = (
  gameId: string | null,
  periodLength: number | undefined,
  currentPeriod: number | undefined,
  initialClock: number | undefined,
  overtimeLength?: number,
  dbOverride?: AppDatabase,
) => {
  const db = dbOverride || defaultDb;
  const [clockSeconds, setClockSeconds] = useState<number>(
    initialClock ?? (periodLength ? periodLength * 60 : 600),
  );
  const clockSecondsRef = useRef(clockSeconds);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [period, setPeriod] = useState<number>(currentPeriod || 1);

  useEffect(() => {
    clockSecondsRef.current = clockSeconds;
  }, [clockSeconds]);

  useEffect(() => {
    if (currentPeriod !== undefined && currentPeriod !== period) {
      setPeriod(currentPeriod);
    }
    if (initialClock !== undefined && !isClockRunning) {
      setClockSeconds(initialClock);
    }
  }, [currentPeriod, initialClock, isClockRunning, period]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isClockRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        setClockSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (clockSeconds === 0) {
      setIsClockRunning(false);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, clockSeconds]);

  useEffect(() => {
    if (isClockRunning && gameId) {
      const syncInterval = setInterval(async () => {
        await db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [isClockRunning, gameId, db]);

  const handleToggleClock = useCallback(() => {
    setIsClockRunning((prev) => {
      const next = !prev;
      if (gameId) {
        db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }
      return next;
    });
  }, [gameId, db]);

  const handleEditClock = useCallback(
    async (mins: number, secs: number) => {
      const totalSeconds = mins * 60 + secs;
      setClockSeconds(totalSeconds);
      if (gameId) {
        try {
          await db.games.update(gameId, {
            clockTime: totalSeconds,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
    },
    [gameId, db],
  );

  const handleNextPeriod = useCallback(
    async (periodType: string) => {
      if (!gameId) return;

      const nextPeriod = period + 1;
      const nextSeconds = getPeriodDurationSeconds(
        nextPeriod,
        periodType,
        periodLength,
        overtimeLength,
      );

      try {
        const currentGame = await db.games.get(gameId);
        const timestamp = new Date().toISOString();

        // 1. Automated Period-Start Possession (Rule 4.1.2)
        if (nextPeriod > 1 && currentGame?.possessionArrow) {
          await db.stats.add({
            id: crypto.randomUUID(),
            gameId,
            playerId: currentGame.possessionArrow,
            type: ACTION_TYPES.POSSESSION,
            period: nextPeriod,
            clockTime: nextSeconds,
            timestamp,
            synced: 0,
          });
        }

        // 2. Overtime Ruleset Governance (Additional Timeout)
        const isOT =
          (periodType === "QUARTERS" && nextPeriod > 4) ||
          (periodType === "HALVES" && nextPeriod > 2);

        if (isOT) {
          await db.stats.add({
            id: crypto.randomUUID(),
            gameId,
            playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
            type: ACTION_TYPES.REMOVE_TIMEOUT,
            period: nextPeriod,
            clockTime: nextSeconds,
            timestamp,
            synced: 0,
          });
          await db.stats.add({
            id: crypto.randomUUID(),
            gameId,
            playerId: SPECIAL_PLAYER_IDS.OPPONENT,
            type: ACTION_TYPES.REMOVE_TIMEOUT,
            period: nextPeriod,
            clockTime: nextSeconds,
            timestamp,
            synced: 0,
          });
        }

        // 3. Possession Arrow Flipping
        const nextArrow =
          nextPeriod > 1 && currentGame?.possessionArrow
            ? currentGame.possessionArrow === "OUR_TEAM"
              ? "OPPONENT"
              : "OUR_TEAM"
            : currentGame?.possessionArrow;

        await db.games.update(gameId, {
          currentPeriod: nextPeriod,
          clockTime: nextSeconds,
          possessionArrow: nextArrow,
          synced: 0,
        });

        setPeriod(nextPeriod);
        setClockSeconds(nextSeconds);
        setIsClockRunning(false);
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to update game period:", err);
      }
    },
    [gameId, period, periodLength, overtimeLength, db],
  );

  return {
    clockSeconds,
    setClockSeconds,
    clockSecondsRef,
    isClockRunning,
    setIsClockRunning,
    period,
    setPeriod,
    handleToggleClock,
    handleEditClock,
    handleNextPeriod,
  };
};
