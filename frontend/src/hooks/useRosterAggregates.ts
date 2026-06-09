import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { calculatePlayerAggregates } from "../utils/stats";

/**
 * Computes aggregate stats for every active (non-archived, non-deleted) player
 * on a given team, across all completed games for that team.
 *
 * Returns a stable array of per-player stat records keyed by the numeric stat
 * keys used by StatRankRow — one record per player — so the calling component
 * can rank any individual player against the full roster without extra work.
 *
 * @param teamId - The team whose roster should be aggregated.
 */
export interface RosterPlayerStats {
  playerId: string;
  points: number;
  rebounds: number;
  assists: number;
  fgPctRaw: number;
  min: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

const EMPTY_ARRAY: never[] = [];

export function useRosterAggregates(
  teamId: string | null | undefined,
): RosterPlayerStats[] {
  const rawTeamPlayers = useLiveQuery(
    () =>
      teamId
        ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  );

  const rawGames = useLiveQuery(
    () =>
      teamId
        ? db.games.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  );

  // Stabilise so downstream useMemos don't re-run while Dexie is still loading
  const teamPlayers = useMemo(
    () => rawTeamPlayers ?? EMPTY_ARRAY,
    [rawTeamPlayers],
  );

  const games = useMemo(() => rawGames ?? EMPTY_ARRAY, [rawGames]);

  const playerIds = useMemo(
    () => teamPlayers.map((tp) => tp.playerId),
    [teamPlayers],
  );

  const rawPlayers = useLiveQuery(
    () =>
      playerIds.length > 0
        ? db.players.where("id").anyOf(playerIds).toArray()
        : Promise.resolve([]),
    [playerIds],
  );

  const gameIds = useMemo(
    () => games.map((g) => g.id).filter((id): id is string => !!id),
    [games],
  );

  const rawStats = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats.where("gameId").anyOf(gameIds).toArray()
        : Promise.resolve([]),
    [gameIds],
  );

  // Stabilise the remaining two reactive values
  const players = useMemo(() => rawPlayers ?? EMPTY_ARRAY, [rawPlayers]);
  const allStats = useMemo(() => rawStats ?? EMPTY_ARRAY, [rawStats]);

  return useMemo(() => {
    if (!teamId || players.length === 0 || allStats.length === 0) return [];

    const activePlayers = players.filter((p) => !p.deletedAt && !p.isArchived);

    const aggregates = calculatePlayerAggregates(
      activePlayers,
      allStats,
      teamPlayers,
      "total",
      {},
    );

    return aggregates.map((agg) => ({
      playerId: String(agg.id),
      points: agg.points,
      rebounds: agg.rebounds,
      assists: agg.assists,
      fgPctRaw: parseFloat(agg.fgPct),
      min: agg.min,
      steals: agg.steals,
      blocks: agg.blocks,
      turnovers: agg.turnovers,
    }));
  }, [teamId, players, allStats, teamPlayers]);
}
