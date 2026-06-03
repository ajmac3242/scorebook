import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db, type StatEvent, type TeamPlayer } from "../../../db";
import { useGames } from "../../../hooks/useGames";
import { usePlayers } from "../../../hooks/usePlayers";
import { logger } from "../../../utils/logger";
import {
  calculatePlayerAggregates,
  calculateTeamAggregates,
} from "../../../utils/stats";
import { TeamAggregates, PlayerAggregates } from "../../../utils/stats/types";

type UseTeamStatsDataProps = {
  teamId: string | undefined;
  gameCountFilter: string;
  scheduleView: "upcoming" | "all";
  statView: "total" | "average";
};

export const useTeamStatsData = ({
  teamId,
  gameCountFilter,
  scheduleView: _scheduleView,
  statView,
}: UseTeamStatsDataProps) => {
  const team = useLiveQuery(() => {
    if (teamId === undefined) return undefined;
    return db.teams.get(teamId);
  }, [teamId]);

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (team?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(team.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [team?.deletedAt]);

  const gamesResult = useGames(teamId);
  const allPlayersResult = usePlayers();

  const games = useMemo(
    () => (Array.isArray(gamesResult) ? gamesResult : []),
    [gamesResult],
  );
  const allPlayers = useMemo(
    () => (Array.isArray(allPlayersResult) ? allPlayersResult : []),
    [allPlayersResult],
  );

  const teamPlayersResult = useLiveQuery(() => {
    if (teamId === undefined) return [];
    return db.teamPlayers.where("teamId").equals(teamId.toString()).toArray();
  }, [teamId]);

  const teamPlayers = useMemo<TeamPlayer[]>(
    () => (Array.isArray(teamPlayersResult) ? teamPlayersResult : []),
    [teamPlayersResult],
  );

  const allRecentLocationsResult = useLiveQuery(() => {
    return db.games
      .toArray()
      .then((items) => {
        const locationSet = new Set<string>();
        for (const g of items) {
          if (g.location) locationSet.add(g.location);
        }
        return Array.from(locationSet).sort();
      })
      .catch((error) => {
        logger.error("Failed to fetch locations:", error);
        return [];
      });
  });

  const allRecentLocations = useMemo(
    () =>
      Array.isArray(allRecentLocationsResult) ? allRecentLocationsResult : [],
    [allRecentLocationsResult],
  );

  const allOpponentsResult = useLiveQuery(() => db.opponents.toArray());
  const allOpponents = useMemo(
    () => (Array.isArray(allOpponentsResult) ? allOpponentsResult : []),
    [allOpponentsResult],
  );

  const teamPlayerDetails = useMemo(() => {
    const playerIdSet = new Set(
      teamPlayers.map((tp) => tp.playerId?.toString()).filter(Boolean),
    );
    return allPlayers.filter((p) => playerIdSet.has(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const gameIds = useMemo(() => {
    const completedGames = games
      .filter((g) => g.completed && !g.deletedAt)
      .sort((a, b) => {
        const dateTimeA = a.date + (a.time || "00:00");
        const dateTimeB = b.date + (b.time || "00:00");
        return dateTimeB.localeCompare(dateTimeA);
      });

    let filtered = completedGames;
    if (gameCountFilter !== "all") {
      filtered = completedGames.slice(0, parseInt(gameCountFilter, 10));
    }

    return filtered.map((g) => g.id).filter(Boolean);
  }, [games, gameCountFilter]);

  const allStatsResult = useLiveQuery(() => {
    if (gameIds.length === 0) return [];
    return db.stats
      .where("gameId")
      .anyOf(gameIds as string[])
      .toArray();
  }, [gameIds]);

  const allStats = useMemo(
    () => (Array.isArray(allStatsResult) ? allStatsResult : []) as StatEvent[],
    [allStatsResult],
  );

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats) as TeamAggregates,
    [games, allStats],
  );

  const aggregatedStats = useMemo(() => {
    return calculatePlayerAggregates(
      teamPlayerDetails,
      allStats,
      teamPlayers,
      statView,
    ) as PlayerAggregates[];
  }, [teamPlayerDetails, allStats, teamPlayers, statView]);

  const isDeleted = !!team?.deletedAt;

  const filteredSchedule = useMemo(() => {
    const result = games.filter((g) => {
      return !g.deletedAt;
    });

    return result.sort((a, b) => {
      const dateTimeA = a.date + (a.time || "00:00");
      const dateTimeB = b.date + (b.time || "00:00");
      if (dateTimeA < dateTimeB) return -1;
      if (dateTimeA > dateTimeB) return 1;
      return 0;
    });
  }, [games]);

  const sortedRoster = useMemo(() => {
    const getSortKey = (jersey: string): number => {
      if (!jersey) return 1000;
      if (jersey === "00") return -1;
      const num = parseInt(jersey, 10);
      return isNaN(num) ? 999 : num;
    };

    const jerseyMap = new Map<string | number, string>();
    for (const tp of teamPlayers) {
      jerseyMap.set(tp.playerId, tp.jerseyNumber ?? "");
    }

    return [...teamPlayerDetails]
      .map((player) => ({
        player,
        sortKey: getSortKey(jerseyMap.get(player.id!) ?? ""),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => item.player);
  }, [teamPlayerDetails, teamPlayers]);

  const sortedRosterJerseyMap = useMemo(() => {
    const jerseyMap = new Map<string, string>();
    for (const tp of teamPlayers) {
      jerseyMap.set(tp.playerId, tp.jerseyNumber ?? "");
    }
    return jerseyMap;
  }, [teamPlayers]);

  return {
    team,
    games,
    allPlayers,
    teamPlayers,
    allRecentLocations,
    allOpponents,
    teamPlayerDetails,
    gameIds,
    allStats,
    teamAggregates,
    aggregatedStats,
    isDeleted,
    timeLeft,
    filteredSchedule,
    sortedRoster,
    sortedRosterJerseyMap,
  };
};
