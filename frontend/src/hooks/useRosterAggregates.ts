import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { calculatePlayerAggregates } from "../utils/stats";

/**
 * Computes aggregate stats for every active (non-archived, non-deleted) player
 * on a given team, across all completed games for that team.
 *
 * Returns an array of plain stat records keyed by the numeric stat keys used
 * by StatRankRow — one record per player — so the calling component can rank
 * any individual player against the full roster without extra computation.
 *
 * @param teamId - The team whose roster should be aggregated.
 * @returns Array of per-player stat records ({ points, rebounds, ... }) plus
 *          the raw playerId for identification, or an empty array while data
 *          is loading.
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

export function useRosterAggregates(teamId: string | null | undefined): RosterPlayerStats[] {
  // All team-player relationships for this team
  const teamPlayers = useLiveQuery(
    () =>
      teamId
        ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  ) ?? [];

  // All games for this team
  const games = useLiveQuery(
    () =>
      teamId
        ? db.games.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  ) ?? [];

  // All players referenced by this team's teamPlayers
  const playerIds = useMemo(
    () => teamPlayers.map((tp) => tp.playerId),
    [teamPlayers],
  );

  const players = useLiveQuery(
    () =>
      playerIds.length > 0
        ? db.players.where("id").anyOf(playerIds).toArray()
        : Promise.resolve([]),
    [playerIds],
  ) ?? [];

  // All stat events for these games
  const gameIds = useMemo(
    () => games.map((g) => g.id).filter((id): id is string => !!id),
    [games],
  );

  const allStats = useLiveQuery(
    () =>
      gameIds.length > 0
        ? db.stats.where("gameId").anyOf(gameIds).toArray()
        : Promise.resolve([]),
    [gameIds],
  ) ?? [];

  return useMemo(() => {
    if (!teamId || players.length === 0 || allStats.length === 0) return [];

    // Only include active (non-deleted, non-archived) players
    const activePlayers = players.filter(
      (p) => !p.deletedAt && !p.isArchived,
    );

    const aggregates = calculatePlayerAggregates(
      activePlayers,
      allStats,
      teamPlayers,
      "total",
      {},
    );

    return aggregates.map((agg) => ({
      playerId: String(agg.id),
      points:   agg.points,
      rebounds: agg.rebounds,
      assists:  agg.assists,
      fgPctRaw: parseFloat(agg.fgPct),
      min:      agg.min,
      steals:   agg.steals,
      blocks:   agg.blocks,
      turnovers: agg.turnovers,
    }));
  }, [teamId, players, allStats, teamPlayers]);
}
