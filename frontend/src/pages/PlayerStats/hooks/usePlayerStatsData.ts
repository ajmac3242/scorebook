import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import { alpha, useTheme } from "@mui/material";
import { db } from "../../../db";
import { useTeams } from "../../../hooks/useTeams";
import { getInitials } from "../../../utils/stats";

type UsePlayerStatsDataProps = {
  playerId: string | undefined;
  teamIdParam: string | null;
};

export const usePlayerStatsData = ({
  playerId,
  teamIdParam,
}: UsePlayerStatsDataProps) => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] = useState("");

  const player = useLiveQuery(
    () => (playerId ? db.players.get(playerId) : undefined),
    [playerId],
  );

  useEffect(() => {
    if (!player?.deletedAt) {
      setTimeLeft("");
      return;
    }

    const updateCountdown = () => {
      const deleteTime = dayjs(player.deletedAt).add(24, "hour");
      const diff = deleteTime.diff(dayjs());

      if (diff <= 0) {
        setTimeLeft("Deleting now...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [player?.deletedAt]);

  const teams = useTeams();

  const teamPlayers =
    useLiveQuery(
      () =>
        playerId
          ? db.teamPlayers
              .where("playerId")
              .equals(playerId.toString())
              .toArray()
          : [],
      [playerId],
    ) || [];

  const gamesQueryResult = useLiveQuery(
    () =>
      teamIdParam ? db.games.where("teamId").equals(teamIdParam).toArray() : [],
    [teamIdParam],
  );
  const games = useMemo(() => gamesQueryResult || [], [gamesQueryResult]);

  const allStatsResult = useLiveQuery(
    () =>
      playerId !== undefined
        ? db.stats.where("playerId").equals(playerId).toArray()
        : [],
    [playerId],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const gameIdSet = useMemo(() => {
    const set = new Set<string | undefined>();
    for (let i = 0; i < games.length; i++) {
      set.add(games[i].id);
    }
    return set;
  }, [games]);

  const currentTeam = useMemo(
    () => teams.find((team) => team.id?.toString() === teamIdParam?.toString()),
    [teams, teamIdParam],
  );

  const getJerseyNumber = () => {
    if (!teamIdParam) return "";

    return (
      teamPlayers.find(
        (teamPlayer) => teamPlayer.teamId.toString() === teamIdParam.toString(),
      )?.jerseyNumber ?? ""
    );
  };

  const isDeleted = !!player?.deletedAt;
  const accent = player?.avatarColor || theme.palette.primary.main;
  const accentSoft = alpha(accent, 0.12);
  const accentSoftStrong = alpha(accent, 0.18);
  const accentBorder = alpha(accent, 0.3);
  const accentFocus = alpha(accent, 0.22);
  const jerseyNumber = getJerseyNumber();

  return {
    player,
    teams,
    teamPlayers,
    games,
    allStats,
    gameIdSet,
    currentTeam,
    isDeleted,
    timeLeft,
    accent,
    accentSoft,
    accentSoftStrong,
    accentBorder,
    accentFocus,
    jerseyNumber,
    getInitials: (name: string) => getInitials(name),
  };
};
