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
  periodType: string = "QUARTERS",
) => {
  const db = dbOverride || defaultDb;
  const initialPeriodDuration = getPeriodDurationSeconds(
    currentPeriod || 1,
    periodType,
    periodLength,
    overtimeLength,
  );
  const [clockSeconds, setClockSeconds] = useState<number>(
    initialClock ?? initialPeriodDuration,
  );
  const clockSecondsRef = useRef(clockSeconds);
  const prevInitialClockRef = useRef(initialClock);
  const prevCurrentPeriodRef = useRef(currentPeriod);
  const prevPeriodLengthRef = useRef(periodLength);
  const prevOvertimeLengthRef = useRef(overtimeLength);
  const prevPeriodTypeRef = useRef(periodType);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const isClockRunningRef = useRef(isClockRunning);
  const isToggleLockedRef = useRef(false);
  const lastWallClockRef = useRef<number | null>(null);
  const [period, setPeriod] = useState<number>(currentPeriod || 1);
  const periodRef = useRef(period);
  const [isHydrated, setIsHydrated] = useState<boolean>(!gameId);
  const hydratedGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    isClockRunningRef.current = isClockRunning;
    isToggleLockedRef.current = false;
    if (isClockRunning) {
      lastWallClockRef.current = Date.now();
    } else {
      lastWallClockRef.current = null;
    }
  }, [isClockRunning]);

  useEffect(() => {
    periodRef.current = period;
  }, [period]);

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

  // End-of-period buzzer alert state
  const [isBuzzerActive, setIsBuzzerActive] = useState(false);
  const pendingArrowFlipRef = useRef<boolean>(false);

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
          let resolvedClock =
            typeof g.clockTime === "number" ? g.clockTime : null;
          if (g.isClockRunning && g.lastWallClock) {
            const now = Date.now();
            const elapsed = Math.floor((now - g.lastWallClock) / 1000);
            if (elapsed > 0 && resolvedClock !== null) {
              resolvedClock = Math.max(0, resolvedClock - elapsed);
              db.games
                .update(gameId, {
                  clockTime: resolvedClock,
                  isClockRunning: resolvedClock > 0,
                  lastWallClock: resolvedClock > 0 ? now : undefined,
                  synced: 0,
                })
                .catch((err) => {
                  logger.error(
                    "Failed to persist cold mount resynced clock:",
                    err,
                  );
                });
            }
            if (resolvedClock > 0) {
              setIsClockRunning(true);
              lastWallClockRef.current = now;
            } else {
              setIsClockRunning(false);
              lastWallClockRef.current = null;
            }
          } else if (g.isClockRunning === false) {
            setIsClockRunning(false);
          }

          if (resolvedClock !== null) {
            setClockSeconds(resolvedClock);
            clockSecondsRef.current = resolvedClock;
          }
          if (typeof g.currentPeriod === "number") {
            setPeriod(g.currentPeriod);
          }
          if (g.pendingPossessionFlip) {
            pendingArrowFlipRef.current = true;
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

  // Intermission Clock State
  const [isIntermission, setIsIntermission] = useState(false);
  const wasRunningRef = useRef(false);
  const [intermissionSeconds, setIntermissionSeconds] = useState(0);
  const [intermissionLabel, setIntermissionLabel] = useState<
    "INTERMISSION" | "HALFTIME"
  >("INTERMISSION");

  const triggerPendingArrowFlip = useCallback(async () => {
    if (!gameId) return;
    try {
      const currentGame = await db.games.get(gameId);
      if (!pendingArrowFlipRef.current && !currentGame?.pendingPossessionFlip) {
        return;
      }
      pendingArrowFlipRef.current = false;
      if (
        currentGame?.possessionArrow &&
        currentGame.possessionArrow !== "NONE"
      ) {
        const nextArrow =
          currentGame.possessionArrow === "OUR_TEAM" ? "OPPONENT" : "OUR_TEAM";
        await db.games.update(gameId, {
          possessionArrow: nextArrow,
          pendingPossessionFlip: false,
          synced: 0,
        });
        await syncService.pushUpdates();
      } else {
        await db.games.update(gameId, {
          pendingPossessionFlip: false,
          synced: 0,
        });
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

  // Period duration configuration hydration safety guard
  useEffect(() => {
    if (!isHydrated) return;
    const maxSeconds = getPeriodDurationSeconds(
      period,
      periodType,
      periodLength,
      overtimeLength,
    );
    if (
      (periodLength !== undefined &&
        periodLength !== prevPeriodLengthRef.current) ||
      (overtimeLength !== undefined &&
        overtimeLength !== prevOvertimeLengthRef.current) ||
      (periodType !== undefined && periodType !== prevPeriodTypeRef.current)
    ) {
      prevPeriodLengthRef.current = periodLength;
      prevOvertimeLengthRef.current = overtimeLength;
      prevPeriodTypeRef.current = periodType;

      setClockSeconds((prev) => {
        if (prev > maxSeconds) return maxSeconds;
        return Math.max(0, prev);
      });
    }
  }, [periodLength, overtimeLength, periodType, period, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isClockRunning && clockSeconds === 0) {
      setIsClockRunning(false);
      unlockAudioContext();
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
        syncService.pushUpdates().catch((err) => {
          logger.error("Failed to push stat updates on clock expiration:", err);
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
            unlockAudioContext();
            playBuzzerSound();
            setIsBuzzerActive(true);
            if (gameId) {
              db.games
                .update(gameId, {
                  isIntermission: false,
                  intermissionSeconds: 0,
                  synced: 0,
                })
                .catch((err) => {
                  logger.error(
                    "Failed to clear intermission state in db:",
                    err,
                  );
                });
            }
          }
          return Math.max(0, prev - 1);
        });
      }, 1000);
    } else if (isIntermission && intermissionSeconds === 0) {
      setIsIntermission(false);
      unlockAudioContext();
      playBuzzerSound();
      setIsBuzzerActive(true);
      if (gameId) {
        db.games
          .update(gameId, {
            isIntermission: false,
            intermissionSeconds: 0,
            synced: 0,
          })
          .catch((err) => {
            logger.error("Failed to clear zero intermission state in db:", err);
          });
      }
    } else if (isClockRunning && clockSeconds > 0) {
      interval = setInterval(() => {
        if (pendingArrowFlipRef.current) {
          triggerPendingArrowFlip();
        }
        lastWallClockRef.current = Date.now();
        setClockSeconds((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0 && prev > 0) {
            unlockAudioContext();
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
              syncService.pushUpdates().catch((err) => {
                logger.error(
                  "Failed to push stat updates on 0:00 interval tick:",
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

  // Resynchronize clock time on tab focus recovery (visibilitychange)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isClockRunningRef.current &&
        lastWallClockRef.current !== null
      ) {
        const now = Date.now();
        const elapsedSeconds = Math.floor(
          (now - lastWallClockRef.current) / 1000,
        );
        if (elapsedSeconds > 0) {
          lastWallClockRef.current = now;
          setClockSeconds((prev) => {
            const next = Math.max(0, prev - elapsedSeconds);
            if (next === 0 && prev > 0) {
              unlockAudioContext();
              playBuzzerSound();
              setIsBuzzerActive(true);
              setIsClockRunning(false);
              if (gameId) {
                db.games
                  .update(gameId, {
                    clockTime: 0,
                    currentPeriod: periodRef.current,
                    synced: 0,
                  })
                  .catch((err) => {
                    logger.error(
                      "Failed to persist clock state on tab focus 0:00 expiration:",
                      err,
                    );
                  });
              }
            } else if (gameId) {
              db.games
                .update(gameId, {
                  clockTime: next,
                  currentPeriod: periodRef.current,
                  synced: 0,
                })
                .catch((err) => {
                  logger.error(
                    "Failed to persist resynced clock state on tab focus:",
                    err,
                  );
                });
            }
            return next;
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId, db]);

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
      if (gameId) {
        db.games
          .update(gameId, {
            isIntermission: true,
            intermissionSeconds: durationSeconds,
            synced: 0,
          })
          .catch((err) => {
            logger.error("Failed to persist start intermission state:", err);
          });
      }
    },
    [gameId, db],
  );

  const stopIntermission = useCallback(() => {
    setIsIntermission(false);
    setIntermissionSeconds(0);
    if (gameId) {
      db.games
        .update(gameId, {
          isIntermission: false,
          intermissionSeconds: 0,
          synced: 0,
        })
        .catch((err) => {
          logger.error("Failed to clear intermission state in db:", err);
        });
    }
  }, [gameId, db]);

  useEffect(() => {
    if (isClockRunning && gameId) {
      wasRunningRef.current = true;
      const syncInterval = setInterval(() => {
        db.games
          .update(gameId, {
            clockTime: clockSecondsRef.current,
            currentPeriod: period,
            isClockRunning: true,
            lastWallClock: lastWallClockRef.current ?? Date.now(),
            synced: 0,
          })
          .catch((err) => {
            logger.error(
              "Failed to persist running clock interval state:",
              err,
            );
          });
      }, 1000);
      return () => {
        clearInterval(syncInterval);
        db.games
          .update(gameId, {
            clockTime: clockSecondsRef.current,
            currentPeriod: period,
            isClockRunning: isClockRunningRef.current,
            lastWallClock: isClockRunningRef.current
              ? (lastWallClockRef.current ?? Date.now())
              : undefined,
            synced: 0,
          })
          .catch((err) => {
            logger.error("Failed to persist clock state on unmount:", err);
          });
      };
    } else if (!isClockRunning && gameId && wasRunningRef.current) {
      wasRunningRef.current = false;
      db.games
        .update(gameId, {
          clockTime: clockSecondsRef.current,
          currentPeriod: period,
          isClockRunning: false,
          lastWallClock: undefined,
          synced: 0,
        })
        .catch((err) => {
          logger.error("Failed to persist paused clock state:", err);
        });
    }
  }, [isClockRunning, gameId, period, db]);

  const handleToggleClock = useCallback(() => {
    if (!isHydrated || isToggleLockedRef.current) return;
    isToggleLockedRef.current = true;
    setTimeout(() => {
      isToggleLockedRef.current = false;
    }, 150);
    unlockAudioContext();
    setIsClockRunning((prev) => {
      const next = !prev;
      const now = Date.now();
      let currentSubSecondTime = clockSecondsRef.current;
      if (next) {
        setIsBuzzerActive(false);
        lastWallClockRef.current = now;
        if (pendingArrowFlipRef.current) {
          triggerPendingArrowFlip();
        }
      } else {
        if (lastWallClockRef.current !== null && clockSecondsRef.current < 60) {
          const elapsedSecs = (now - lastWallClockRef.current) / 1000;
          if (elapsedSecs > 0) {
            const preciseRemaining = Math.max(
              0,
              clockSecondsRef.current - elapsedSecs,
            );
            currentSubSecondTime = Math.round(preciseRemaining * 10) / 10;
            setClockSeconds(currentSubSecondTime);
            clockSecondsRef.current = currentSubSecondTime;
          }
        }
        lastWallClockRef.current = null;
      }
      if (gameId) {
        db.games
          .update(gameId, {
            clockTime: currentSubSecondTime,
            currentPeriod: periodRef.current,
            isClockRunning: next,
            lastWallClock: next ? now : undefined,
            synced: 0,
          })
          .catch((err) => {
            logger.error("Failed to update game clock state on toggle:", err);
          });
      }
      return next;
    });
  }, [isHydrated, gameId, db, triggerPendingArrowFlip]);

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
        let isPendingFlip = false;
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
          isPendingFlip = true;

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
          pendingPossessionFlip: isPendingFlip,
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
