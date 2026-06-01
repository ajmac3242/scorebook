import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { calculateTeamSeasonAverages } from "../../utils/stats";

export function useGameData(gameId: string | undefined) {
  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as string)
        : Promise.resolve(undefined),
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

  const teamSeasonStats = useMemo(() => {
    return (
      teamSeasonStatsResult || {
        ppp: "0.00",
        ftPct: "0.0",
        turnoverRate: "0.0",
        orebPct: "0.0",
      }
    );
  }, [teamSeasonStatsResult]);

  const teamPlayersResult = useLiveQuery(
    () =>
      game?.teamId
        ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
        : Promise.resolve([]),
    [game?.teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersResult || [],
    [teamPlayersResult],
  );

  const playerIds = useMemo(
    () => teamPlayers.map((tp) => tp.playerId.toString()),
    [teamPlayers],
  );

  const playersResult = useLiveQuery(
    () => db.players.where("id").anyOf(playerIds).toArray(),
    [playerIds],
  );
  const players = useMemo(() => playersResult || [], [playersResult]);

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

export type GameData = ReturnType<typeof useGameData>;
