import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  calculateTeamAggregates,
  calculatePlayerAggregates,
  calculateLineupStats,
  calculateGameResult,
} from "../utils/stats";
import dayjs from "dayjs";

export const useDashboardData = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [gameCountFilter, setGameCountFilter] = useState<string>("all");

  const favoriteTeam = useLiveQuery(
    () => db.teams.where("isFavorite").equals(1).first(),
    []
  );

  const teamId = favoriteTeam?.id;

  const rawTeamGames = useLiveQuery(
    () => (teamId ? db.games.where("teamId").equals(teamId).toArray() : []),
    [teamId]
  );
  const teamGames = useMemo(() => rawTeamGames || [], [rawTeamGames]);

  const gameIds = useMemo(() => {
    if (!Array.isArray(teamGames)) return [];
    const completed = teamGames
      .filter((g) => g?.completed)
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

    let filtered = completed;
    if (gameCountFilter !== "all") {
      filtered = completed.slice(0, parseInt(gameCountFilter));
    }
    return filtered.map((g) => g.id).filter(Boolean) as string[];
  }, [teamGames, gameCountFilter]);

  const rawAllStats = useLiveQuery(
    () =>
      gameIds.length > 0 ? db.stats.where("gameId").anyOf(gameIds).toArray() : [],
    [gameIds]
  );
  const allStats = useMemo(() => rawAllStats || [], [rawAllStats]);

  const rawTeamPlayers = useLiveQuery(
    () => (teamId ? db.teamPlayers.where("teamId").equals(teamId).toArray() : []),
    [teamId]
  );
  const teamPlayers = useMemo(() => rawTeamPlayers || [], [rawTeamPlayers]);

  const playerIds = useMemo(() => teamPlayers.map((tp) => tp.playerId), [teamPlayers]);

  const rawPlayers = useLiveQuery(
    () => (playerIds.length > 0 ? db.players.where("id").anyOf(playerIds).toArray() : []),
    [playerIds]
  );
  const players = useMemo(() => rawPlayers || [], [rawPlayers]);

  const aggregates = useMemo(() => {
    if (!Array.isArray(teamGames) || !Array.isArray(allStats)) {
      return {
        ppg: "0.0", rpg: "0.0", apg: "0.0", oppg: "0.0",
        record: "0-0", totalGames: 0, ppp: "0.00", possessions: 0, oppPpp: "0.00",
      };
    }
    return calculateTeamAggregates(
      teamGames.filter((g) => gameIds.includes(g?.id || "")),
      allStats
    );
  }, [teamGames, allStats, gameIds]);

  const playerAverages = useMemo(() => {
    if (!Array.isArray(players) || !Array.isArray(allStats) || !Array.isArray(teamPlayers)) return [];
    return calculatePlayerAggregates(players, allStats, teamPlayers, "average");
  }, [players, allStats, teamPlayers]);

  const lineupStats = useMemo(() => {
    if (!Array.isArray(allStats)) return [];
    return calculateLineupStats(allStats).filter((l) => l.seconds > 120);
  }, [allStats]);

  const leaders = useMemo(() => {
    const sortedByPoints = [...playerAverages].sort((a, b) => b.points - a.points);
    const sortedByRebounds = [...playerAverages].sort((a, b) => b.rebounds - a.rebounds);
    const sortedByAssists = [...playerAverages].sort((a, b) => b.assists - a.assists);
    return { ppg: sortedByPoints[0], rpg: sortedByRebounds[0], apg: sortedByAssists[0] };
  }, [playerAverages]);

  const recentResults = useMemo(() => {
    return teamGames
      .filter((g) => g.completed)
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
      .slice(0, 3)
      .map((game) => {
        const { teamScore, oppScore, result } = calculateGameResult(game.id!, allStats);
        return { ...game, teamScore, oppScore, result };
      });
  }, [teamGames, allStats]);

  const upcomingGames = useMemo(() => {
    const now = dayjs();
    return teamGames
      .filter((g) => !g.completed && dayjs(g.date).isAfter(now.subtract(1, "day")))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
      .slice(0, 3);
  }, [teamGames]);

  return {
    favoriteTeam,
    teamGames,
    allStats,
    teamPlayers,
    players,
    aggregates,
    playerAverages,
    lineupStats,
    leaders,
    recentResults,
    upcomingGames,
    selectedPeriod, setSelectedPeriod,
    gameCountFilter, setGameCountFilter,
  };
};
