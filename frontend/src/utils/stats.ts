/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, TeamPlayer } from "../db";

/**
 * Rounds a number to one decimal place and returns it as a number.
 * @param {number} val - The value to round.
 * @returns {number} The rounded number.
 */
const roundToOne = (val: number): number => Number(val.toFixed(1));

/**
 * Formats a number to one decimal place and returns it as a string.
 * @param {number} val - The value to format.
 * @returns {string} The formatted string.
 */
const formatToOne = (val: number): string => val.toFixed(1);

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
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
 * Calculates aggregated statistics for a list of players based on a set of events.
 * Supports both total and per-game average calculations.
 *
 * @param {any[]} players - List of player objects.
 * @param {StatEvent[]} stats - List of statistical events to process.
 * @param {TeamPlayer[]} teamPlayers - (Optional) Team roster for jersey numbers.
 * @param {"total" | "average"} viewType - (Optional) Type of calculation, defaults to "total".
 * @returns {PlayerAggregates[]} Array of aggregated statistics.
 */
/**
 * Updates a player's statistics based on a single statistical event.
 * @param {PlayerAggregates} p - The player aggregate record.
 * @param {StatEvent} s - The statistical event to process.
 */
function processStatEvent(p: PlayerAggregates, s: StatEvent) {
  p.gamesPlayed.add(s.gameId);

  if (s.type === ACTION_TYPES.MAKE) {
    p.points += s.points || 0;
    p.makes += 1;
    p.attempts += 1;
  } else if (s.type === ACTION_TYPES.MISS) {
    p.attempts += 1;
  } else if (s.type === ACTION_TYPES.REBOUND) {
    p.rebounds += 1;
  } else if (s.type === ACTION_TYPES.ASSIST) {
    p.assists += 1;
  } else if (s.type === ACTION_TYPES.STEAL) {
    p.steals += 1;
  } else if (s.type === ACTION_TYPES.TURNOVER) {
    p.turnovers += 1;
  }
}

/**
 * Initializes a map of player aggregates with default values.
 *
 * @param {any[]} players - List of player objects.
 * @param {TeamPlayer[]} teamPlayers - Team roster for jersey numbers.
 * @returns {Record<string, PlayerAggregates>} Initialized map.
 */
function initializeStatsMap(
  players: any[],
  teamPlayers: TeamPlayer[],
): Record<string, PlayerAggregates> {
  return players.reduce((acc, p) => {
    const pId = p.id!;
    acc[pId] = {
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      jerseyNumber:
        teamPlayers.find((tp) => tp.playerId === pId)?.jerseyNumber || "",
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
    return acc;
  }, {} as Record<string, PlayerAggregates>);
}

/**
 * Calculates aggregated statistics for a list of players based on a set of events.
 * Supports both total and per-game average calculations.
 *
 * @param {any[]} players - List of player objects.
 * @param {StatEvent[]} stats - List of statistical events to process.
 * @param {TeamPlayer[]} teamPlayers - (Optional) Team roster for jersey numbers.
 * @param {"total" | "average"} viewType - (Optional) Type of calculation, defaults to "total".
 * @returns {PlayerAggregates[]} Array of aggregated statistics.
 */
export const calculatePlayerAggregates = (
  players: any[],
  stats: StatEvent[],
  teamPlayers: TeamPlayer[] = [],
  viewType: "total" | "average" = "total",
): PlayerAggregates[] => {
  const statsMap = initializeStatsMap(players, teamPlayers);

  // Accumulate statistics from event stream
  stats.forEach((s) => {
    if (statsMap[s.playerId]) {
      processStatEvent(statsMap[s.playerId], s);
    }
  });

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
      return {
        ...p,
        points: roundToOne(p.points / gp),
        rebounds: roundToOne(p.rebounds / gp),
        assists: roundToOne(p.assists / gp),
        steals: roundToOne(p.steals / gp),
        turnovers: roundToOne(p.turnovers / gp),
      } as any;
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
 * @param {any[]} games - List of games.
 * @param {StatEvent[]} stats - List of statistical events across those games.
 * @param {boolean} completedOnly - (Optional) Only include completed games, defaults to true.
 * @returns {object} Team level aggregates.
 */
export const calculateTeamAggregates = (
  games: any[],
  stats: StatEvent[],
  completedOnly = true,
) => {
  // Filter games based on completion status if requested.
  const targetGames = completedOnly
    ? games.filter((g) => g.completed === 1)
    : games;
  const targetGameIds = targetGames.map((g) => g.id);
  const relevantStats = stats.filter((s) =>
    targetGameIds.includes(s.gameId as any),
  );

  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalOppPoints = 0;
  let wins = 0;
  let losses = 0;

  targetGameIds.forEach((gId) => {
    const gameStats = relevantStats.filter((s) => s.gameId === gId);
    const { teamPoints, oppPoints, rebounds, assists } =
      aggregateStatsForGame(gameStats);

    totalPoints += teamPoints;
    totalOppPoints += oppPoints;
    totalRebounds += rebounds;
    totalAssists += assists;

    if (teamPoints > oppPoints) wins++;
    else if (teamPoints < oppPoints) losses++;
  });

  const gp = targetGames.length || 1;
  return {
    ppg: formatToOne(totalPoints / gp),
    rpg: formatToOne(totalRebounds / gp),
    apg: formatToOne(totalAssists / gp),
    oppg: formatToOne(totalOppPoints / gp),
    record: `${wins}-${losses}`,
    totalGames: targetGames.length,
  };
};

/**
 * Aggregates statistics for a single game.
 * @param {StatEvent[]} gameStats - Events for the specific game.
 * @returns {object} Aggregated points, rebounds, and assists.
 */
function aggregateStatsForGame(gameStats: StatEvent[]) {
  let teamPoints = 0;
  let oppPoints = 0;
  let rebounds = 0;
  let assists = 0;

  gameStats.forEach((s) => {
    if (s.playerId === "OPPONENT") {
      oppPoints += s.points || 0;
    } else {
      teamPoints += s.points || 0;
      if (s.type === ACTION_TYPES.REBOUND) rebounds++;
      if (s.type === ACTION_TYPES.ASSIST) assists++;
    }
  });

  return { teamPoints, oppPoints, rebounds, assists };
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
  const { teamScore, oppScore } = stats
    .filter((s) => s.gameId === gameId)
    .reduce(
      (acc, s) => {
        if (s.playerId === "OPPONENT") {
          acc.oppScore += s.points || 0;
        } else {
          acc.teamScore += s.points || 0;
        }
        return acc;
      },
      { teamScore: 0, oppScore: 0 },
    );

  // Determine game result: W (Win), L (Loss), D (Draw/Tie).
  const result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";
  return { teamScore, oppScore, result };
};
