import { useCallback } from "react";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";

type UseGameClockProps = {
  gameId: string | null;
  period: number;
  periodType: string;
  setPeriod: (p: number) => void;
  setClockSeconds: (s: number) => void;
  setIsClockRunning: (r: boolean) => void;
  setIsClockEditDialogOpen: (o: boolean) => void;
};

export const useGameClock = ({
  gameId,
  period,
  periodType,
  setPeriod,
  setClockSeconds,
  setIsClockRunning,
  setIsClockEditDialogOpen,
}: UseGameClockProps) => {
  const handleEditClock = useCallback(
    async (mins: number, secs: number) => {
      const totalSeconds = mins * 60 + secs;
      setClockSeconds(totalSeconds);
      if (gameId) {
        try {
          await db.games.update(gameId, { clockTime: totalSeconds, synced: 0 });
          await syncService.pushUpdates();
        } catch (err) {
          logger.error("Failed to update game clock:", err);
        }
      }
      setIsClockEditDialogOpen(false);
    },
    [gameId, setClockSeconds, setIsClockEditDialogOpen],
  );

  const handleNextPeriod = useCallback(async () => {
    const nextPeriod = period < 10 ? period + 1 : 1;
    setPeriod(nextPeriod);
    const nextSeconds = (periodType === "QUARTERS" ? 10 : 20) * 60;
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
  }, [
    gameId,
    period,
    periodType,
    setPeriod,
    setClockSeconds,
    setIsClockRunning,
  ]);

  return { handleEditClock, handleNextPeriod };
};
