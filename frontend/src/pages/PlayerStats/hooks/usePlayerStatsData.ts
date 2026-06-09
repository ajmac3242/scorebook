import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { db, type Game, type StatEvent, type Team, type Player } from "../../../db";

type UsePlayerStatsDataArgs = {
  playerId?: string;
  teamIdParam: string | null;
};

const usePlayerStatsData = ({ playerId, teamIdParam }: UsePlayerStatsDataArgs) => {
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(teamIdParam);

  React.useEffect(() => {
    setSelectedTeamId(teamIdParam);
  }, [teamIdParam]);

  const player = useLiveQuery(async () => {
    if (!playerId) return undefined;
    return db.players.get(playerId);
  }, [playerId]) as Player | undefined;

  const teamPlayersQuery = useLiveQuery(async () => {
    if (!playerId) return [];
    return db.teamPlayers.where("playerId").equals(playerId).toArray();
  }, [playerId]);
  const teamPlayers = React.useMemo(() => teamPlayersQuery ?? [], [teamPlayersQuery]);

  const allTeamsQuery = useLiveQuery(async () => db.teams.toArray(), []);
  const allTeams = React.useMemo(() => allTeamsQuery ?? [], [allTeamsQuery]);

  const availableTeams = React.useMemo(
    () => allTeams.filter((team) => teamPlayers.some((tp) => tp.teamId === team.id)),
    [allTeams, teamPlayers],
  ) as Team[];

  const currentTeam = React.useMemo(
    () => availableTeams.find((team) => team.id === selectedTeamId) ?? null,
    [availableTeams, selectedTeamId],
  );

  const gamesQuery = useLiveQuery(async () => {
    const allGames = await db.games.toArray();
    if (selectedTeamId) {
      return allGames.filter((g) => g.teamId === selectedTeamId);
    }
    const teamIds = new Set(teamPlayers.map((tp) => tp.teamId));
    return allGames.filter((g) => teamIds.has(g.teamId));
  }, [selectedTeamId, teamPlayers]);
  const games = React.useMemo(() => gamesQuery ?? [], [gamesQuery]);

  const gameIds = React.useMemo(() => new Set(games.map((g) => g.id)), [games]);

  const allStatsQuery = useLiveQuery(async () => {
    if (!playerId) return [];
    const stats = await db.stats.where("playerId").equals(playerId).toArray();
    return stats.filter((s) => gameIds.has(s.gameId));
  }, [playerId, games]);
  const allStats = React.useMemo(() => allStatsQuery ?? [], [allStatsQuery]);

  const jerseyNumber = React.useMemo(
    () => teamPlayers.find((tp) => tp.teamId === selectedTeamId)?.jerseyNumber ?? null,
    [teamPlayers, selectedTeamId],
  );

  const accent = player?.avatarColor || currentTeam?.primaryColor || "#4f7c8b";
  const accentFocus = currentTeam?.primaryColor || accent;
  const isDeleted = Boolean(player?.deletedAt);
  const timeLeft = player?.deletedAt ? dayjs(player.deletedAt).fromNow(true) : null;

  return {
    player,
    currentTeam,
    availableTeams,
    isDeleted,
    timeLeft,
    accent,
    accentFocus,
    jerseyNumber,
    games,
    allStats,
    scopedGames: games as Game[],
    scopedStats: allStats as StatEvent[],
    selectedTeamId,
    setSelectedTeamId,
  };
};

export { usePlayerStatsData };
