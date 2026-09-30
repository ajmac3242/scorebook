import { useState, useEffect, useRef, useCallback } from "react";
import { db as defaultDb, type AppDatabase } from "../db";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import { getPeriodDurationSeconds } from "../utils/mathUtils";
import { playBuzzerSound, unlockAudioContext } from "../utils/audioUtils";
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
  const prevInitialClockRef = useRef(initialClock);
  const prevCurrentPeriodRef = useRef(currentPeriod);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [period, setPeriod] = useState<number>(currentPeriod || 1);
  const [isHydrated, setIsHydrated] = useState<boolean>(!gameId);
  const hydratedGameIdRef = useRef<string | null>(null);

  // Auto-unlock WebAudio Context on user interactions
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUserInteraction = () => {
      unlockAudioContext();
    };
    window.addEventListener("click", handleUserInteraction, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchstart", handleUserInteraction, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", handleUserInteraction, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("click", handleUserInteraction, {
        capture: true,
      });
      window.removeEventListener("touchstart", handleUserInteraction, {
        capture: true,
      });
      window.removeEventListener("keydown", handleUserInteraction, {
        capture: true,
      });
    };
  }, []);

  // Hydrate clock state from IndexedDB to prevent default period length overwrites
  useEffect(() => {
    let isMounted = true;
    if (!gameId) {
      setIsHydrated(true);
      return;
    }
    if (hydratedGameIdRef.current === gameId) {
      return;
    }
    setIsHydrated(false);
    db.games
      .get(gameId)
      .then((g) => {
        if (!isMounted) return;
        if (g) {
          if (typeof g.clockTime === "number") {
            setClockSeconds(g.clockTime);
            clockSecondsRef.current = g.clockTime;
          }
          if (typeof g.currentPeriod === "number") {
            setPeriod(g.currentPeriod);
          }
        }
        hydratedGameIdRef.current = gameId;
        setIsHydrated(true);
      })
      .catch((err) => {
        logger.error("Failed to hydrate game clock state from db:", err);
        if (isMounted) {
          hydratedGameIdRef.current = gameId;
          setIsHydrated(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [gameId, db]);

  // End-of-period buzzer alert state
  const [isBuzzerActive, setIsBuzzerActive] = useState(false);
  const pendingArrowFlipRef = useRef<boolean>(false);

  // Intermission Clock State
  const [isIntermission, setIsIntermission] = useState(false);
  const wasRunningRef = useRef(false);
  const [intermissionSeconds, setIntermissionSeconds] = useState(0);
  const [intermissionLabel, setIntermissionLabel] = useState<
    "INTERMISSION" | "HALFTIME"
  >("INTERMISSION");

  const triggerPendingArrowFlip = useCallback(async () => {
    if (!gameId || !pendingArrowFlipRef.current) return;
    pendingArrowFlipRef.current = false;
    try {
      const currentGame = await db.games.get(gameId);
      if (
        currentGame?.possessionArrow &&
        currentGame.possessionArrow !== "NONE"
      ) {
        const nextArrow =
          currentGame.possessionArrow === "OUR_TEAM" ? "OPPONENT" : "OUR_TEAM";
        await db.games.update(gameId, {
          possessionArrow: nextArrow,
          synced: 0,
        });
        await syncService.pushUpdates();
      }
    } catch (err) {
      logger.error("Failed to flip possession arrow on clock tick:", err);
    }
  }, [gameId, db]);

  useEffect(() => {
    clockSecondsRef.current = clockSeconds;
  }, [clockSeconds]);

  useEffect(() => {
    if (
      currentPeriod !== undefined &&
      currentPeriod !== prevCurrentPeriodRef.current
    ) {
      setPeriod(currentPeriod);
      prevCurrentPeriodRef.current = currentPeriod;
    }
    if (
      initialClock !== undefined &&
      initialClock !== prevInitialClockRef.current &&
      !isClockRunning
    ) {
      // Preserve 0:00 period-end clock snapshot from db.games on session resume
      if (clockSecondsRef.current === 0 && initialClock > 0 && isHydrated) {
        prevInitialClockRef.current = initialClock;
        return;
      }
      setClockSeconds(initialClock);
      prevInitialClockRef.current = initialClock;
    }
  }, [currentPeriod, initialClock, isClockRunning, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isClockRunning && clockSeconds === 0) {
      setIsClockRunning(false);
      playBuzzerSound();
      setIsBuzzerActive(true);
      if (gameId) {
        db.games
          .update(gameId, {
            clockTime: 0,
            currentPeriod: period,
            synced: 0,
          })
          .catch((err) => {
            logger.error(
              "Failed to persist clock state on 0:00 expiration:",
              err,
            );
          });
      }
    }
  }, [isHydrated, isClockRunning, clockSeconds, gameId, period, db]);

  useEffect(() => {
    if (!isHydrated) return;
    let interval: ReturnType<typeof setInterval>;
    if (isIntermission && intermissionSeconds > 0) {
      interval = setInterval(() => {
        setIntermissionSeconds((prev) => {
          if (prev <= 1) {
            playBuzzerSound();
            setIsBuzzerActive(true);
          }
          return Math.max(0, prev - 1);
        });
      }, 1000);
    } else if (isIntermission && intermissionSeconds === 0) {
      setIsIntermission(false);
    } else if (isClockRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        if (pendingArrowFlipRef.current) {
          triggerPendingArrowFlip();
        }
        setClockSeconds((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            playBuzzerSound();
            setIsBuzzerActive(true);
            setIsClockRunning(false);
            if (gameId) {
              db.games
                .update(gameId, {
                  clockTime: 0,
                  currentPeriod: period,
                  synced: 0,
                })
                .catch((err) => {
                  logger.error(
                    "Failed to persist paused clock state on 0:00 expiration:",
                    err,
                  );
                });
            }
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    isHydrated,
    isClockRunning,
    clockSeconds,
    isIntermission,
    intermissionSeconds,
    triggerPendingArrowFlip,
    gameId,
    period,
    db,
  ]);

  // Auto-dismiss buzzer alert overlay after 3.5 seconds
  useEffect(() => {
    if (isBuzzerActive) {
      const timer = setTimeout(() => {
        setIsBuzzerActive(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isBuzzerActive]);

  const startIntermission = useCallback(
    (type: "INTERMISSION" | "HALFTIME", durationSeconds: number) => {
      unlockAudioContext();
      setIsClockRunning(false);
      setIntermissionLabel(type);
      setIntermissionSeconds(durationSeconds);
      setIsIntermission(true);
    },
    [],
  );

  const stopIntermission = useCallback(() => {
    setIsIntermission(false);
    setIntermissionSeconds(0);
  }, []);

  useEffect(() => {
    if (isClockRunning && gameId) {
      wasRunningRef.current = true;
      const syncInterval = setInterval(async () => {
        await db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          currentPeriod: period,
          synced: 0,
        });
      }, 1000);
      return () => clearInterval(syncInterval);
    } else if (!isClockRunning && gameId && wasRunningRef.current) {
      wasRunningRef.current = false;
      db.games
        .update(gameId, {
          clockTime: clockSecondsRef.current,
          currentPeriod: period,
          synced: 0,
        })
        .catch((err) => {
          logger.error("Failed to persist paused clock state:", err);
        });
    }
  }, [isClockRunning, gameId, period, db]);

  const handleToggleClock = useCallback(() => {
    if (!isHydrated) return;
    unlockAudioContext();
    setIsClockRunning((prev) => {
      const next = !prev;
      if (next) {
        setIsBuzzerActive(false);
      }
      if (gameId) {
        db.games.update(gameId, {
          clockTime: clockSecondsRef.current,
          synced: 0,
        });
      }
      return next;
    });
  }, [isHydrated, gameId, db]);

  const handleEditClock = useCallback(
    async (mins: number, secs: number, periodType: string = "QUARTERS") => {
      if (!isHydrated) return;
      unlockAudioContext();
      const rawSeconds =
        (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
      const maxSeconds = getPeriodDurationSeconds(
        period,
        periodType,
        periodLength,
        overtimeLength,
      );
      const clampedSeconds = Math.max(0, Math.min(maxSeconds, rawSeconds));
      setClockSeconds(clampedSeconds);
      if (clampedSeconds > 0) {
        setIsBuzzerActive(false);
      }
      if (gameId) {
        try {
          await db.games.update(gameId, {
            clockTime: clampedSeconds,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
    },
    [isHydrated, gameId, period, periodLength, overtimeLength, db],
  );

  const handleAdjustClock = useCallback(
    async (deltaSeconds: number, periodType: string = "QUARTERS") => {
      if (!isHydrated) return;
      unlockAudioContext();
      const maxSeconds = getPeriodDurationSeconds(
        period,
        periodType,
        periodLength,
        overtimeLength,
      );
      const newTime = Math.min(
        maxSeconds,
        Math.max(0, clockSecondsRef.current + deltaSeconds),
      );
      setClockSeconds(newTime);
      if (newTime > 0) {
        setIsBuzzerActive(false);
      }
      if (gameId) {
        try {
          await db.games.update(gameId, {
            clockTime: newTime,
            synced: 0,
          });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to adjust game clock:", err);
        }
      }
    },
    [isHydrated, gameId, period, periodLength, overtimeLength, db],
  );

  const handleNextPeriod = useCallback(
    async (periodType: string) => {
      if (!gameId || !isHydrated) return null;
      unlockAudioContext();

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
        let alertMessage: string | null = null;

        // 1. Automated Period-Start Possession (Rule 4.1.2)
        if (
          nextPeriod > 1 &&
          currentGame?.possessionArrow &&
          currentGame.possessionArrow !== "NONE"
        ) {
          const possessionPlayerId =
            currentGame.possessionArrow === "OUR_TEAM"
              ? SPECIAL_PLAYER_IDS.OUR_TEAM
              : SPECIAL_PLAYER_IDS.OPPONENT;

          await db.stats.add({
            id: crypto.randomUUID(),
            gameId,
            playerId: possessionPlayerId,
            type: ACTION_TYPES.POSSESSION,
            period: nextPeriod,
            clockTime: nextSeconds,
            timestamp,
            synced: 0,
          });

          pendingArrowFlipRef.current = true;

          let teamName = "Our Team";
          if (currentGame.possessionArrow === "OUR_TEAM") {
            if (currentGame.teamId) {
              const teamRecord = await db.teams.get(currentGame.teamId);
              if (teamRecord?.name) teamName = teamRecord.name;
            }
          } else {
            teamName = currentGame.opponent || "Opponent";
          }

          alertMessage = `Period started: ${teamName} Possession via Alternating Arrow.`;
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

        await db.games.update(gameId, {
          currentPeriod: nextPeriod,
          clockTime: nextSeconds,
          synced: 0,
        });

        setPeriod(nextPeriod);
        setClockSeconds(nextSeconds);
        setIsClockRunning(false);
        setIsBuzzerActive(false);
        await syncService.pushUpdates();

        return { nextPeriod, alertMessage };
      } catch (err) {
        logger.error("Failed to update game period:", err);
        return null;
      }
    },
    [isHydrated, gameId, period, periodLength, overtimeLength, db],
  );

  return {
    clockSeconds,
    setClockSeconds,
    clockSecondsRef,
    isClockRunning,
    setIsClockRunning,
    isBuzzerActive,
    setIsBuzzerActive,
    period,
    setPeriod,
    isIntermission,
    intermissionSeconds,
    intermissionLabel,
    startIntermission,
    stopIntermission,
    handleToggleClock,
    handleEditClock,
    handleAdjustClock,
    handleNextPeriod,
    pendingArrowFlipRef,
    triggerPendingArrowFlip,
    isHydrated,
    isClockHydrated: isHydrated,
  };
};
