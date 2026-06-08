import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type StatEvent, type Team } from "../../../db";
import { calculateTeamAggregates } from "../../../utils/stats";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";

export type TeamAggregateSummary = {
  record: string;
  ppg: string;
  rpg: string;
  apg: string;
  oppg: string;
  gamesPlayed: number;
};

type UseTeamsDataProps = {
  teams: Team[];
  showSnackbar: (
    _message: string,
    _severity?: "success" | "error" | "info" | "warning",
  ) => void;
};

export type UseTeamsDataReturn = {
  teamAggregatesMap: Record<string, TeamAggregateSummary>;
  handleToggleFavorite: (
    _teamId: string,
    _currentFavorite: number,
    _e: React.MouseEvent,
  ) => Promise<void>;
};

export const useTeamsData = ({
  teams,
  showSnackbar,
}: UseTeamsDataProps): UseTeamsDataReturn => {
  const teamIds = useMemo(
    () => teams.map((team) => team.id).filter(Boolean) as string[],
    [teams],
  );

  const allGamesQueryResult = useLiveQuery(() => {
    if (teamIds.length === 0) return [];
    return db.games.where("teamId").anyOf(teamIds).toArray();
  }, [teamIds]);

  const allGames = useMemo(
    () => allGamesQueryResult || [],
    [allGamesQueryResult],
  );

  const gameIds = useMemo(
    () => allGames.map((game) => game.id).filter(Boolean) as string[],
    [allGames],
  );

  const allStatsQueryResult = useLiveQuery(() => {
    if (gameIds.length === 0) return [];
    return db.stats.where("gameId").anyOf(gameIds).toArray();
  }, [gameIds]);

  const allStats = useMemo(
    () => (allStatsQueryResult || []) as StatEvent[],
    [allStatsQueryResult],
  );

  const teamAggregatesMap = useMemo(() => {
    const gamesByTeam: Record<string, (typeof allGames)[0][]> = {};
    for (const game of allGames) {
      if (!gamesByTeam[game.teamId]) gamesByTeam[game.teamId] = [];
      gamesByTeam[game.teamId].push(game);
    }

    const statsByGame: Record<string, StatEvent[]> = {};
    for (const stat of allStats) {
      if (!statsByGame[stat.gameId]) statsByGame[stat.gameId] = [];
      statsByGame[stat.gameId].push(stat);
    }

    const results: Record<string, TeamAggregateSummary> = {};
    for (const team of teams) {
      const teamGames = gamesByTeam[team.id!] || [];
      const teamStats: StatEvent[] = teamGames.flatMap(
        (g) => statsByGame[g.id!] || [],
      );

      results[team.id!] = {
        ...(calculateTeamAggregates(teamGames, teamStats) as Omit<
          TeamAggregateSummary,
          "gamesPlayed"
        >),
        gamesPlayed: teamGames.length,
      };
    }

    return results;
  }, [teams, allGames, allStats]);

  const handleToggleFavorite = async (
    teamId: string,
    currentFavorite: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      if (!currentFavorite) {
        const allFavorites = await db.teams
          .where("isFavorite")
          .equals(1)
          .toArray();

        for (const favoriteTeam of allFavorites) {
          if (favoriteTeam.id !== teamId) {
            await db.teams.update(favoriteTeam.id!, {
              isFavorite: 0,
              synced: 0,
            });
          }
        }

        await db.teams.update(teamId, { isFavorite: 1, synced: 0 });
      } else {
        await db.teams.update(teamId, { isFavorite: 0, synced: 0 });
      }

      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle favorite team", err, { teamId });
      showSnackbar("Could not update favorite team", "error");
    }
  };

  return {
    teamAggregatesMap,
    handleToggleFavorite,
  };
};
