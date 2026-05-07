import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { calculateOpponentScoutingStats } from "../utils/stats";

export const useOpponentScouting = (opponentId: string | undefined) => {
  const opponent = useLiveQuery(
    () =>
      opponentId ? db.opponents.get(opponentId) : Promise.resolve(undefined),
    [opponentId]
  );

  const games = useLiveQuery(
    () =>
      opponentId
        ? db.games.where("opponentId").equals(opponentId).toArray()
        : Promise.resolve([]),
    [opponentId]
  );

  const gameIds = useMemo(
    () => (games?.map((g) => g.id).filter(Boolean) as string[]) || [],
    [games]
  );

  const stats = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats.where("gameId").anyOf(gameIds).toArray()
        : Promise.resolve([]),
    [gameIds]
  );

  const scoutingStats = useMemo(() => {
    if (!stats) return new Map();
    return calculateOpponentScoutingStats(stats);
  }, [stats]);

  const sortedPlayers = useMemo(() => {
    return Array.from(scoutingStats.entries()).sort(
      (a, b) => b[1].points - a[1].points
    );
  }, [scoutingStats]);

  return {
    opponent,
    games,
    sortedPlayers,
  };
};
