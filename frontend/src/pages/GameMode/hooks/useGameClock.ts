import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";
import { getPeriodDurationSeconds } from "../../../utils/mathUtils";

type UseGameClockProps = {
  gameId: string | null;
  period: number;
  periodType: string;
  setPeriod: (_p: number) => void;
  setClockSeconds: (_s: number) => void;
  setIsClockRunning: (_r: boolean) => void;
  setIsClockEditDialogOpen: (_o: boolean) => void;
  periodLength?: number;
  overtimeLength?: number;
};

export const useGameClock = ({
  gameId,
  period,
  periodType,
  setPeriod,
  setClockSeconds,
  setIsClockRunning,
  setIsClockEditDialogOpen,
  periodLength,
  overtimeLength,
}: UseGameClockProps) => {
  const handleEditClock = async (mins: number, secs: number) => {
    if (!gameId) return;
    const totalSeconds = mins * 60 + secs;
    try {
      await db.games.update(gameId, { clockTime: totalSeconds, synced: 0 });
      setClockSeconds(totalSeconds);
      setIsClockEditDialogOpen(false);
    } catch (error) {
      logger.error("Failed to update clock", error);
    }

    syncService.pushUpdates().catch((err) => {
      logger.error("Failed to push clock updates", err);
    });
  };

  const handleNextPeriod = async () => {
    if (!gameId) return;
    const nextPeriod = period + 1;
    const nextSeconds = getPeriodDurationSeconds(
      nextPeriod,
      periodType,
      periodLength,
      overtimeLength,
    );
    try {
      const currentGame = await db.games.where("id").equals(gameId).first();
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
    } catch (error) {
      logger.error("Failed to advance period", error);
    }

    syncService.pushUpdates().catch((err) => {
      logger.error("Failed to push period updates", err);
    });
  };

  return { handleEditClock, handleNextPeriod };
};
