import { useCallback } from "react";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

type UseGameTimeoutProps = {
  gameId: string | null;
  isReadOnly: boolean;
  trackingMode: "TEAM" | "OPPONENT";
  period: number;
  clockSeconds: number;
};

export const useGameTimeout = ({
  gameId,
  isReadOnly,
  trackingMode,
  period,
  clockSeconds,
}: UseGameTimeoutProps) => {
  const handleTimeout = useCallback(async () => {
    if (!gameId || isReadOnly) return;
    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId,
        playerId:
          trackingMode === "OPPONENT"
            ? SPECIAL_PLAYER_IDS.OPPONENT
            : SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        type: ACTION_TYPES.TIMEOUT,
        period,
        clockTime: clockSeconds,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to record timeout:", err);
    }
  }, [gameId, isReadOnly, trackingMode, period, clockSeconds]);

  return { handleTimeout };
};
