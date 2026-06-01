import { db } from "../../db";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";

type UseGameTimeoutProps = {
  gameId: string | null;
  isReadOnly: boolean;
  trackingMode: "TEAM" | "OPPONENT";
  period: number;
  clockSeconds: number;
};

export const useGameTimeout = ({
  gameId,
  trackingMode,
  period,
  clockSeconds,
}: UseGameTimeoutProps) => {
  const handleTimeout = async () => {
    if (!gameId) return;
    try {
      await db.stats.add({
        id: crypto.randomUUID(),
        gameId,
        playerId:
          trackingMode === "TEAM"
            ? SPECIAL_PLAYER_IDS.TEAM_TIMEOUT
            : SPECIAL_PLAYER_IDS.OPPONENT,
        type: ACTION_TYPES.TIMEOUT,
        period,
        clockTime: clockSeconds,
        points: 0,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (error) {
      logger.error("Failed to record timeout", error);
    }
  };

  return { handleTimeout };
};
