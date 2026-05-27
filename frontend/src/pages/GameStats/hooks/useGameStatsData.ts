import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { calculateTeamSeasonAverages } from "../../utils/stats";

/**
 * Fetches all raw Dexie data required by the GameStats page.
 * Intentionally contains NO derived analytics — only DB reads.
 */
export function useGameStatsData(gameId: string | undefined) {
  const game = useLiveQuery(
    () =>
      gameId !== undefined ? db.games.get(gameId) : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamSeasonStatsResult = useLiveQuery(
    () =>
      game?.teamId
        ? db.games
            .where("teamId")
            .equals(game.teamId)
            .toArray()
            .then((games) => {
              const gameIds = games.map((g) => g.id!).filter(Boolean);
              return db.stats
                .where("gameId")
                .anyOf(gameIds)
                .toArray()
                .then((allStats) =>
                  calculateTeamSeasonAverages(games, allStats),
                );
            })
        : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamSeasonStats = useMemo(
    () =>
      teamSeasonStatsResult ?? {
        ppp: "0.00",
        ftPct: "0.0",
        turnoverRate: "0.0",
        orebPct: "0.0",
      },
    [teamSeasonStatsResult],
  );

  const teamPlayersResult = useLiveQuery(
    () =>
      game?.teamId
        ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
        : Promise.resolve([]),
    [game?.teamId],
  );

  const teamPlayers = useMemo(
    () => teamPlayersResult ?? [],
    [teamPlayersResult],
  );

  // Stable key avoids re-querying when teamPlayers array reference changes
  // but contents are identical (common with Dexie live queries).
  const playerIdsKey = useMemo(
    () =>
      teamPlayers
        .map((tp) => tp.playerId.toString())
        .sort()
        .join(","),
    [teamPlayers],
  );

  const playersResult = useLiveQuery(
    () =>
      playerIdsKey
        ? db.players.where("id").anyOf(playerIdsKey.split(",")).toArray()
        : Promise.resolve([]),
    [playerIdsKey],
  );

  const players = useMemo(() => playersResult ?? [], [playersResult]);

  const allStatsResult = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.stats.where("gameId").equals(gameId).toArray()
        : Promise.resolve([]),
    [gameId],
  );

  const allStats = useMemo(
    () => (Array.isArray(allStatsResult) ? allStatsResult : []),
    [allStatsResult],
  );

  return {
    game,
    team,
    teamSeasonStats,
    teamPlayers,
    players,
    allStats,
  };
}

export type GameStatsData = ReturnType<typeof useGameStatsData>;
