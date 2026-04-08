/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { StatEvent, TeamPlayer, Player, Game } from "../db";
import { roundToOne, formatToOne, determineResult } from "./mathUtils";

/**
 * Interface for aggregated team statistics.
 */
export interface TeamAggregates {
  ppg: string;
  rpg: string;
  apg: string;
  oppg: string;
  record: string;
  totalGames: number;
}

/**
 * Interface for aggregated player statistics.
 */
export interface PlayerAggregates {
  id: number | string;
  name: string;
  avatarColor?: string;
  jerseyNumber?: string;
  gamesPlayed: Set<number | string>;
  gp: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  turnovers: number;
  makes: number;
  attempts: number;
  fgPct: string;
  fouls: number;
}

/**
 * Returns the initials of a name (max 2 characters).
 * @param {string} name - The full name.
 * @returns {string} The uppercase initials.
 */
export const getInitials = (name: string | undefined | null): string => {
  if (!name) return "";
  // Optimization: Use a simple loop to extract initials instead of split() and regex,
  // reducing array allocations and string processing overhead.
  const trimmed = name.trim();
  if (!trimmed) return "";
  let initials = trimmed[0].toUpperCase();
  for (let i = 1; i < trimmed.length; i++) {
    if (trimmed[i - 1] === " " && trimmed[i] !== " ") {
      initials += trimmed[i].toUpperCase();
      if (initials.length >= 2) break;
    }
  }
  return initials;
};

/**
 * Retrieves the jersey number for a player from the team roster.
 * @param {number | string | undefined} pId - The player ID.
 * @param {TeamPlayer[]} teamPlayers - The team-player junction records.
 * @returns {string} The jersey number or an empty string.
 */
export const getPlayerJersey = (
  pId: number | string | undefined,
  teamPlayers: TeamPlayer[],
): string => {
  if (!pId) return "";
  const tp = teamPlayers.find((t) => t.playerId === pId);
  return tp?.jerseyNumber || "";
};

/**
 * Updates a player's statistics based on a single statistical event.
 * @param {PlayerAggregates} p - The player aggregate record.
 * @param {StatEvent} s - The statistical event to process.
 */
function processStatEvent(p: PlayerAggregates, s: StatEvent) {
  p.gamesPlayed.add(s.gameId);

  switch (s.type) {
    case ACTION_TYPES.MAKE:
      p.points += s.points || 0;
      p.makes++;
      p.attempts++;
      break;
    case ACTION_TYPES.MISS:
      p.attempts++;
      break;
    case ACTION_TYPES.REBOUND:
      p.rebounds++;
      break;
    case ACTION_TYPES.ASSIST:
      p.assists++;
      break;
    case ACTION_TYPES.STEAL:
      p.steals++;
      break;
    case ACTION_TYPES.TURNOVER:
      p.turnovers++;
      break;
    case ACTION_TYPES.FOUL:
      p.fouls++;
      break;
    default:
      break;
  }
}

/**
 * Initializes a map of player aggregates with default values.
 *
 * @param {Player[]} players - List of player objects.
 * @param {TeamPlayer[]} teamPlayers - Team roster for jersey numbers.
 * @returns {Record<string, PlayerAggregates>} Initialized map.
 */
function initializeStatsMap(
  players: Player[],
  teamPlayers: TeamPlayer[],
): Map<string, PlayerAggregates> {
  // Optimization: Pre-map jersey numbers by playerId to avoid O(P * TP) complexity.
  const jerseyMap = new Map<string, string | undefined>();
  for (let i = 0; i < teamPlayers.length; i++) {
    jerseyMap.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
  }

  // ⚡ Bolt: Use a Map instead of a Record for stats aggregation.
  // Maps provide more consistent O(1) performance for lookups and insertions
  // of dynamic keys and avoid overhead when iterating via .values().
  const acc = new Map<string, PlayerAggregates>();
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const pId = p.id!.toString();
    acc.set(pId, {
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      jerseyNumber: jerseyMap.get(pId) || "",
      gamesPlayed: new Set(),
      gp: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      turnovers: 0,
      makes: 0,
      attempts: 0,
      fgPct: "0.0",
      fouls: 0,
    });
  }
  return acc;
}

/**
 * Calculates aggregated statistics for a list of players based on a set of events.
 * Supports both total and per-game average calculations.
 *
 * @param {Player[]} players - List of player objects.
 * @param {StatEvent[]} stats - List of statistical events to process.
 * @param {TeamPlayer[]} teamPlayers - (Optional) Team roster for jersey numbers.
 * @param {"total" | "average"} viewType - (Optional) Type of calculation, defaults to "total".
 * @returns {PlayerAggregates[]} Array of aggregated statistics.
 */
export const calculatePlayerAggregates = (
  players: Player[],
  stats: StatEvent[],
  teamPlayers: TeamPlayer[] = [],
  viewType: "total" | "average" = "total",
): PlayerAggregates[] => {
  const statsMap = initializeStatsMap(players, teamPlayers);

  // Accumulate statistics from event stream
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    const p = statsMap.get(s.playerId);
    if (p) {
      processStatEvent(p, s);
    }
  }

  // Finalize totals, percentages, and averages
  // ⚡ Bolt: Iterate over map values directly to skip O(N) key extraction and O(1) lookups.
  const result: PlayerAggregates[] = [];
  for (const p of statsMap.values()) {
    // We default gp (games played) to 1 for per-game calculations even if 0
    // to prevent division by zero errors, though technically it should be 0.
    const gp = p.gamesPlayed.size || 1;
    p.gp = p.gamesPlayed.size;
    p.fgPct =
      p.attempts > 0 ? formatToOne((p.makes / p.attempts) * 100) : "0.0";

    if (viewType === "average") {
      // Optimization: Update numeric fields directly to avoid object spread overhead and memory churn.
      p.points = roundToOne(p.points / gp);
      p.rebounds = roundToOne(p.rebounds / gp);
      p.assists = roundToOne(p.assists / gp);
      p.steals = roundToOne(p.steals / gp);
      p.turnovers = roundToOne(p.turnovers / gp);
      p.fouls = roundToOne(p.fouls / gp);
    }
    result.push(p);
  }
  return result;
};

/**
 * Calculates aggregated team statistics (PPG, RPG, etc.) and W/L record.
 *
 * This function iterates through games, calculates results for each game
 * using the provided event stream, and aggregates them into team-wide averages.
 *
 * @param {Game[]} games - List of games.
 * @param {StatEvent[]} stats - List of statistical events across those games.
 * @param {boolean} completedOnly - (Optional) Only include completed games, defaults to true.
 * @returns {Record<string, unknown>} Team level aggregates.
 */
export const calculateTeamAggregates = (
  games: Game[],
  stats: StatEvent[],
  completedOnly = true,
): TeamAggregates => {
  // ⚡ Bolt: Pre-populate the Map with target game IDs in a single pass.
  // This eliminates the need for a separate Set and allows us to skip
  // existence checks inside the high-frequency stats loop.
  const gameTotals = new Map<string, { team: number; opp: number }>();
  let targetCount = 0;
  for (let i = 0; i < games.length; i++) {
    if (!completedOnly || games[i].completed === 1) {
      gameTotals.set(games[i].id!, { team: 0, opp: 0 });
      targetCount++;
    }
  }

  // Optimization: Aggregate all stats in a single pass without intermediate grouping.
  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalOppPoints = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    const totals = gameTotals.get(s.gameId);
    // If the game isn't in our target map, skip it.
    if (!totals) continue;

    const pts = s.points || 0;
    if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      totalOppPoints += pts;
      totals.opp += pts;
    } else {
      totalPoints += pts;
      totals.team += pts;
      if (s.type === ACTION_TYPES.REBOUND) totalRebounds++;
      else if (s.type === ACTION_TYPES.ASSIST) totalAssists++;
    }
  }

  let wins = 0;
  let losses = 0;
  // ⚡ Bolt: Iterate over map values directly to skip O(N) key extraction and property lookup overhead.
  for (const { team, opp } of gameTotals.values()) {
    // Only count games that actually have recorded scores.
    if (team === 0 && opp === 0) continue;
    if (team > opp) wins++;
    else if (team < opp) losses++;
  }

  const gp = targetCount || 1;
  return {
    ppg: formatToOne(totalPoints / gp),
    rpg: formatToOne(totalRebounds / gp),
    apg: formatToOne(totalAssists / gp),
    oppg: formatToOne(totalOppPoints / gp),
    record: `${wins}-${losses}`,
    totalGames: targetCount,
  };
};

/**
 * Calculates the score and result (W, L, D) for a single game.
 *
 * @param {number | string} gameId - The game ID.
 * @param {StatEvent[]} stats - All statistics events for filtering.
 * @returns {object} Final team score, opponent score, and result code.
 */
export const calculateGameResult = (
  gameId: number | string,
  stats: StatEvent[],
) => {
  // Combine filter and reduce into a single pass
  let teamScore = 0;
  let oppScore = 0;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.gameId === gameId) {
      if (s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
        oppScore += s.points || 0;
      } else {
        teamScore += s.points || 0;
      }
    }
  }

  // Determine game result: W (Win), L (Loss), D (Draw/Tie).
  const result = determineResult(teamScore, oppScore);
  return { teamScore, oppScore, result };
};
