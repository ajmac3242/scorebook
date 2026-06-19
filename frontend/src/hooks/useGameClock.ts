import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../db";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";

export const useGameClock = (
  gameId: string | null,
  periodLength: number | undefined,
  currentPeriod: number | undefined,
  initialClock: number | undefined,
  overtimeLength?: number,
) => {
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
    if (currentPeriod && currentPeriod !== period) {
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
  }, [isClockRunning, gameId]);

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
  }, [gameId]);

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
    [gameId],
  );

  const handleNextPeriod = useCallback(
    async (periodType: string) => {
      const nextPeriod = period < 10 ? period + 1 : 1;
      setPeriod(nextPeriod);

      const isOT =
        periodType === "QUARTERS" ? nextPeriod > 4 : nextPeriod > 2;
      const duration = isOT
        ? overtimeLength || 5
        : periodLength || (periodType === "QUARTERS" ? 10 : 20);

      const nextSeconds = duration * 60;
      setClockSeconds(nextSeconds);
      setIsClockRunning(false);

      if (gameId) {
        try {
          await db.games.update(gameId, {
            currentPeriod: nextPeriod,
            clockTime: nextSeconds,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game period:", err);
        }
      }
    },
    [gameId, period, periodLength, overtimeLength],
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
