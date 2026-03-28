/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, TeamPlayer, Player, Game } from "../db";
import { roundToOne, formatToOne, determineResult } from "./mathUtils";

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
    default:
      break;
  }
}

/**
 * Initializes a map of player aggregates with default values.
 *
 * @param {Record<string, any>[]} players - List of player objects.
 * @param {TeamPlayer[]} teamPlayers - Team roster for jersey numbers.
 * @returns {Record<string, PlayerAggregates>} Initialized map.
 */
function initializeStatsMap(
  players: Player[],
  teamPlayers: TeamPlayer[],
): Record<string, PlayerAggregates> {
  // Optimization: Pre-map jersey numbers by playerId to avoid O(P * TP) complexity.
  const jerseyMap = new Map();
  for (let i = 0; i < teamPlayers.length; i++) {
    jerseyMap.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber);
  }

  // Optimization: Use a for loop instead of reduce() to avoid function call overhead
  // and repeated object spread/mutation during initialization.
  const acc: Record<string, PlayerAggregates> = {};
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const pId = p.id!;
    acc[pId] = {
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
    };
  }
  return acc;
}

/**
 * Calculates aggregated statistics for a list of players based on a set of events.
 * Supports both total and per-game average calculations.
 *
 * @param {Record<string, any>[]} players - List of player objects.
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
    if (statsMap[s.playerId]) {
      processStatEvent(statsMap[s.playerId], s);
    }
  }

  // Finalize totals, percentages, and averages
  return Object.values(statsMap).map((p) => {
    // We default gp (games played) to 1 for per-game calculations even if 0
    // to prevent division by zero errors, though technically it should be 0.
    const gp = p.gamesPlayed.size || 1;
    p.gp = p.gamesPlayed.size;
    p.fgPct =
      p.attempts > 0 ? formatToOne((p.makes / p.attempts) * 100) : "0.0";

    if (viewType === "average") {
      // Calculate per-game averages if requested, rounding to 1 decimal place.
      const averaged: PlayerAggregates = {
        ...p,
        points: roundToOne(p.points / gp),
        rebounds: roundToOne(p.rebounds / gp),
        assists: roundToOne(p.assists / gp),
        steals: roundToOne(p.steals / gp),
        turnovers: roundToOne(p.turnovers / gp),
      };
      return averaged;
    }
    return p;
  });
};

/**
 * Calculates aggregated team statistics (PPG, RPG, etc.) and W/L record.
 *
 * This function iterates through games, calculates results for each game
 * using the provided event stream, and aggregates them into team-wide averages.
 *
 * @param {Record<string, any>[]} games - List of games.
 * @param {StatEvent[]} stats - List of statistical events across those games.
 * @param {boolean} completedOnly - (Optional) Only include completed games, defaults to true.
 * @returns {Record<string, unknown>} Team level aggregates.
 */
export const calculateTeamAggregates = (
  games: Game[],
  stats: StatEvent[],
  completedOnly = true,
) => {
  // Optimization: Pre-filter and collect game IDs in a single pass.
  const targetGameIds = new Set<string>();
  let targetCount = 0;
  for (let i = 0; i < games.length; i++) {
    if (!completedOnly || games[i].completed === 1) {
      targetGameIds.add(games[i].id!);
      targetCount++;
    }
  }

  // Optimization: Aggregate all stats in a single pass without intermediate grouping.
  // Use a map to track per-game totals for record calculation.
  const gameTotals: Record<string, { team: number; opp: number }> = {};
  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalOppPoints = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (targetGameIds.has(s.gameId)) {
      if (!gameTotals[s.gameId]) gameTotals[s.gameId] = { team: 0, opp: 0 };

      if (s.playerId === "OPPONENT") {
        const pts = s.points || 0;
        totalOppPoints += pts;
        gameTotals[s.gameId].opp += pts;
      } else {
        const pts = s.points || 0;
        totalPoints += pts;
        gameTotals[s.gameId].team += pts;
        if (s.type === ACTION_TYPES.REBOUND) totalRebounds++;
        else if (s.type === ACTION_TYPES.ASSIST) totalAssists++;
      }
    }
  }

  let wins = 0;
  let losses = 0;
  for (const gId in gameTotals) {
    const { team, opp } = gameTotals[gId];
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
 * Aggregates statistics for a single game.
 * @param {StatEvent[]} gameStats - Events for the specific game.
 * @returns {object} Aggregated points, rebounds, and assists.
 */
function aggregateStatsForGame(gameStats: StatEvent[]) {
  // Replace reduce with for...of to minimize per-iteration overhead in hot paths
  const acc = { teamPoints: 0, oppPoints: 0, rebounds: 0, assists: 0 };
  for (const s of gameStats) {
    if (s.playerId === "OPPONENT") {
      acc.oppPoints += s.points || 0;
    } else {
      acc.teamPoints += s.points || 0;
      if (s.type === ACTION_TYPES.REBOUND) acc.rebounds++;
      if (s.type === ACTION_TYPES.ASSIST) acc.assists++;
    }
  }
  return acc;
}

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
      if (s.playerId === "OPPONENT") {
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
