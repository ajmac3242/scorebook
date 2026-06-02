import { useCallback } from "react";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { SPECIAL_PLAYER_IDS, ACTION_TYPES } from "../../../constants/stats";
import { logger } from "../../../utils/logger";

export const usePossessionTracker = (gameId: string | null) => {
  const togglePossession = useCallback(
    async (
      currentPossession: string | null,
      period: number,
      clockSeconds: number,
    ) => {
      if (!gameId) return;

      const targetTeam =
        currentPossession === SPECIAL_PLAYER_IDS.OUR_TEAM
          ? SPECIAL_PLAYER_IDS.OPPONENT
          : SPECIAL_PLAYER_IDS.OUR_TEAM;

      try {
        await db.stats.add({
          id: crypto.randomUUID(),
          gameId: gameId,
          playerId: targetTeam,
          type: ACTION_TYPES.POSSESSION,
          period,
          clockTime: clockSeconds,
          timestamp: new Date().toISOString(),
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to toggle possession:", err);
      }
    },
    [gameId],
  );

  return {
    togglePossession,
  };
};
