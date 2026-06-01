import { useCallback } from "react";
import { db, type Game } from "../../../db";
import { syncService } from "../../../utils/syncService";

type UseMatchupAssignmentProps = {
  gameId: string | null;
  game: Game | undefined;
};

export const useMatchupAssignment = ({
  gameId,
  game,
}: UseMatchupAssignmentProps) => {
  const handleAssignDefender = useCallback(
    async (opponentId: string, playerId: string) => {
      if (!gameId) return;
      const newMatchups = {
        ...(game?.matchups || {}),
        [opponentId]: game?.matchups?.[opponentId] === playerId ? "" : playerId,
      };
      await db.games.update(gameId, {
        matchups: newMatchups,
        synced: 0,
      });
      await syncService.pushUpdates();
    },
    [gameId, game?.matchups],
  );

  return { handleAssignDefender };
};
