import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Player } from "../../../db";
import { logger } from "../../../utils/logger";
import { calculateTeamSeasonAverages } from "../../../utils/stats";

type UseGameModeQueriesParams = {
  gameId: string | null;
  teamId: string | null;
};

export type UseGameModeQueriesResult = {
  game: Awaited<ReturnType<typeof db.games.get>>;
  team: Awaited<ReturnType<typeof db.teams.get>>;
  gameStats: Awaited<ReturnType<typeof db.stats.toArray>>;
  teamPlayers: Awaited<ReturnType<typeof db.teamPlayers.toArray>>;
  players: Player[];
  teamSeasonStats: ReturnType<typeof calculateTeamSeasonAverages> | undefined;
  playerNamesMap: Map<string, string>;
  playersMap: Map<string, Player>;
  jerseyMap: Map<string, string | undefined>;
  isReadOnly: boolean;
  periodType: string;
};

/**
 * @hook useGameModeQueries
 * @description Centralises all Dexie live-query and derived-map logic that
 * was previously inlined at the top of GameMode.tsx.
 *
 * Responsibilities:
 *  - Fetching game stats, team players, players, game, team and season stats
 *  - Building O(1) lookup maps: playerNamesMap, playersMap, jerseyMap
 *  - Deriving read-only and period-type flags
 *
 * NOT responsible for:
 *  - Clock state / lifecycle
 *  - Event aggregation or scoring
 *  - UI state / dialogs
 */
export function useGameModeQueries({
  gameId,
  teamId,
}: UseGameModeQueriesParams): UseGameModeQueriesResult {
  // ---------------------------------------------------------------------------
  // Raw DB queries
  // ---------------------------------------------------------------------------

  const gameStatsQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      if (!gameId) return [];
      return await db.stats.where("gameId").equals(gameId).toArray();
    } catch (err) {
      logger.error("Failed to fetch game stats:", err);
      return [];
    }
  }, [gameId]);

  const gameStats = useMemo(
    () => gameStatsQueryResult || [],
    [gameStatsQueryResult],
  );

  const teamPlayersQueryResult = useLiveQuery(
    () =>
      teamId
        ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
        : Promise.resolve([]),
    [teamId],
  );

  const teamPlayers = useMemo(
    () => teamPlayersQueryResult || [],
    [teamPlayersQueryResult],
  );

  const playersQueryResult = useLiveQuery(async () => {
    try {
      await db.open();
      if (!teamId) return [];
      const playerIds = teamPlayers.map((t) => t.playerId.toString());
      if (playerIds.length === 0) return [];
      return await db.players.where("id").anyOf(playerIds).toArray();
    } catch (err) {
      logger.error("Failed to fetch players:", err);
      return [];
    }
  }, [teamId, teamPlayers]);

  const players = useMemo(
    () => (playersQueryResult || []) as Player[],
    [playersQueryResult],
  );

  const game = useLiveQuery(
    () =>
      gameId ? db.games.get(gameId as string) : Promise.resolve(undefined),
    [gameId],
  );

  const team = useLiveQuery(
    () =>
      game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined),
    [game?.teamId],
  );

  const teamSeasonStats = useLiveQuery(async () => {
    if (!teamId) return undefined;
    const games = await db.games.where("teamId").equals(teamId).toArray();
    const gameIds = games.map((g) => g.id!).filter(Boolean);
    if (gameIds.length === 0) return undefined;
    const allStats = await db.stats.where("gameId").anyOf(gameIds).toArray();
    return calculateTeamSeasonAverages(games, allStats);
  }, [teamId]);

  // ---------------------------------------------------------------------------
  // Derived O(1) lookup maps
  // ---------------------------------------------------------------------------

  /**
   * ⚡ Bolt: O(1) player name lookups.
   * Pre-calculating a Map prevents O(P) .find() operations in render loops.
   */
  const playerNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.id) map.set(p.id.toString(), p.name);
    }
    return map;
  }, [players]);

  const playersMap = useMemo(() => {
    const map = new Map<string, Player>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.id) map.set(p.id.toString(), p);
    }
    return map;
  }, [players]);

  const jerseyMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
    }
    return map;
  }, [teamPlayers]);

  // ---------------------------------------------------------------------------
  // Simple derived flags
  // ---------------------------------------------------------------------------

  const isReadOnly = !!game?.deletedAt || !!team?.deletedAt;
  const periodType = team?.periodType || "QUARTERS";

  return {
    game,
    team,
    gameStats,
    teamPlayers,
    players,
    teamSeasonStats,
    playerNamesMap,
    playersMap,
    jerseyMap,
    isReadOnly,
    periodType,
  };
}
