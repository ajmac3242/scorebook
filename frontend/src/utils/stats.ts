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
  blocks: number;
  offRebounds: number;
  defRebounds: number;
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
 * @param {PlayerAggregates} player - The player aggregate record.
 * @param {StatEvent} stat - The statistical event to process.
 */
function processStatEvent(player: PlayerAggregates, stat: StatEvent) {
  player.gamesPlayed.add(stat.gameId);

  switch (stat.type) {
    case ACTION_TYPES.MAKE:
      player.points += stat.points || 0;
      player.makes++;
      player.attempts++;
      break;
    case ACTION_TYPES.MISS:
      player.attempts++;
      break;
    case ACTION_TYPES.REBOUND:
      player.rebounds++;
      break;
    case ACTION_TYPES.OFF_REBOUND:
      player.offRebounds++;
      player.rebounds++;
      break;
    case ACTION_TYPES.DEF_REBOUND:
      player.defRebounds++;
      player.rebounds++;
      break;
    case ACTION_TYPES.BLOCK:
      player.blocks++;
      break;
    case ACTION_TYPES.ASSIST:
      player.assists++;
      break;
    case ACTION_TYPES.STEAL:
      player.steals++;
      break;
    case ACTION_TYPES.TURNOVER:
      player.turnovers++;
      break;
    case ACTION_TYPES.FOUL:
      player.fouls++;
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
  const statsMap = new Map<string, PlayerAggregates>();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const playerId = player.id!.toString();
    statsMap.set(playerId, {
      id: player.id,
      name: player.name,
      avatarColor: player.avatarColor,
      jerseyNumber: jerseyMap.get(playerId) || "",
      gamesPlayed: new Set(),
      gp: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      turnovers: 0,
      blocks: 0,
      offRebounds: 0,
      defRebounds: 0,
      makes: 0,
      attempts: 0,
      fgPct: "0.0",
      fouls: 0,
    });
  }
  return statsMap;
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
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    const player = statsMap.get(stat.playerId);
    if (player) {
      processStatEvent(player, stat);
    }
  }

  // Finalize totals, percentages, and averages
  // ⚡ Bolt: Iterate over map values directly to skip O(N) key extraction and O(1) lookups.
  const result: PlayerAggregates[] = [];
  for (const player of statsMap.values()) {
    // We default gp (games played) to 1 for per-game calculations even if 0
    // to prevent division by zero errors, though technically it should be 0.
    const gp = player.gamesPlayed.size || 1;
    player.gp = player.gamesPlayed.size;
    player.fgPct =
      player.attempts > 0
        ? formatToOne((player.makes / player.attempts) * 100)
        : "0.0";

    if (viewType === "average") {
      // Optimization: Update numeric fields directly to avoid object spread overhead and memory churn.
      player.points = roundToOne(player.points / gp);
      player.rebounds = roundToOne(player.rebounds / gp);
      player.assists = roundToOne(player.assists / gp);
      player.steals = roundToOne(player.steals / gp);
      player.turnovers = roundToOne(player.turnovers / gp);
      player.blocks = roundToOne(player.blocks / gp);
      player.offRebounds = roundToOne(player.offRebounds / gp);
      player.defRebounds = roundToOne(player.defRebounds / gp);
      player.fouls = roundToOne(player.fouls / gp);
    }
    result.push(player);
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
  // ⚡ Bolt: Use a Map for game totals to improve lookup performance and avoid object overhead.
  const gameTotals = new Map<string, { team: number; opp: number }>();
  // Pre-populate Map with targeted game IDs to eliminate conditional checks in the hot loop.
  for (const gId of targetGameIds) {
    gameTotals.set(gId, { team: 0, opp: 0 });
  }

  let totalPoints = 0;
  let totalRebounds = 0;
  let totalOffRebounds = 0;
  let totalDefRebounds = 0;
  let totalAssists = 0;
  let totalBlocks = 0;
  let totalOppPoints = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    const { gameId, playerId, type, points: eventPoints } = stat;

    const totals = gameTotals.get(gameId);
    if (!totals) continue;

    const pointsValue = eventPoints || 0;

    if (playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      totalOppPoints += pointsValue;
      totals.opp += pointsValue;
    } else {
      totalPoints += pointsValue;
      totals.team += pointsValue;

      if (type === ACTION_TYPES.REBOUND) {
        totalRebounds++;
      } else if (type === ACTION_TYPES.OFF_REBOUND) {
        totalOffRebounds++;
        totalRebounds++;
      } else if (type === ACTION_TYPES.DEF_REBOUND) {
        totalDefRebounds++;
        totalRebounds++;
      } else if (type === ACTION_TYPES.ASSIST) {
        totalAssists++;
      } else if (type === ACTION_TYPES.BLOCK) {
        totalBlocks++;
      }
    }
  }

  let wins = 0;
  let losses = 0;
  // ⚡ Bolt: Iterate over map values directly to improve iteration performance.
  for (const totals of gameTotals.values()) {
    if (totals.team > totals.opp) wins++;
    else if (totals.team < totals.opp) losses++;
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
 * Calculates aggregated statistics for the opponent in a single game.
 *
 * @param {StatEvent[]} stats - List of statistical events for the game.
 * @returns {object} Opponent statistical summary.
 */
export const calculateOpponentAggregates = (stats: StatEvent[]) => {
  let points = 0;
  let makes = 0;
  let misses = 0;
  let rebounds = 0;
  let offRebounds = 0;
  let defRebounds = 0;
  let assists = 0;
  let blocks = 0;
  let steals = 0;
  let turnovers = 0;
  let fouls = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      switch (stat.type) {
        case ACTION_TYPES.MAKE:
          points += stat.points || 0;
          makes++;
          break;
        case ACTION_TYPES.MISS:
          misses++;
          break;
        case ACTION_TYPES.REBOUND:
          rebounds++;
          break;
        case ACTION_TYPES.OFF_REBOUND:
          offRebounds++;
          rebounds++;
          break;
        case ACTION_TYPES.DEF_REBOUND:
          defRebounds++;
          rebounds++;
          break;
        case ACTION_TYPES.ASSIST:
          assists++;
          break;
        case ACTION_TYPES.BLOCK:
          blocks++;
          break;
        case ACTION_TYPES.STEAL:
          steals++;
          break;
        case ACTION_TYPES.TURNOVER:
          turnovers++;
          break;
        case ACTION_TYPES.FOUL:
          fouls++;
          break;
      }
    }
  }

  const attempts = makes + misses;
  return {
    points,
    makes,
    attempts,
    fgPct: attempts > 0 ? ((makes / attempts) * 100).toFixed(1) : "0.0",
    rebounds,
    offRebounds,
    defRebounds,
    assists,
    blocks,
    steals,
    turnovers,
    fouls,
  };
};

/**
 * Calculates the score flow data for a game based on chronological events.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events.
 * @returns {object[]} Array of data points for score flow visualization.
 */
export const calculateScoreFlow = (stats: StatEvent[]) => {
  let teamScore = 0;
  let oppScore = 0;
  const result = [{ time: "00:00", Team: 0, Opponent: 0 }];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.type === ACTION_TYPES.MAKE) {
      if (stat.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
        oppScore += stat.points || 0;
      } else {
        teamScore += stat.points || 0;
      }
      // ⚡ Bolt: Use high-performance string slicing instead of Intl.DateTimeFormat
      // to extract "mm:ss" from ISO timestamps, reducing CPU and memory overhead.
      result.push({
        time: stat.timestamp.slice(14, 19),
        Team: teamScore,
        Opponent: oppScore,
      });
    }
  }
  return result;
};

/**
 * Determines if a statistical event occurred within the specified game period.
 * Handles different logic for QUARTERS vs HALVES.
 *
 * @param {number} eventPeriod - The period recorded on the event.
 * @param {number} currentPeriod - The current game period being viewed.
 * @param {string} periodType - 'QUARTERS' or 'HALVES'.
 * @returns {boolean} True if the event belongs to the current period context.
 */
export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  if (periodType === "QUARTERS") {
    return eventPeriod === currentPeriod;
  }
  // HALVES: Period 1 is first half, Period >= 2 are second half/OT
  return currentPeriod === 1 ? eventPeriod === 1 : eventPeriod >= 2;
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
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.gameId === gameId) {
      if (stat.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
        oppScore += stat.points || 0;
      } else {
        teamScore += stat.points || 0;
      }
    }
  }

  // Determine game result: W (Win), L (Loss), D (Draw/Tie).
  const result = determineResult(teamScore, oppScore);
  return { teamScore, oppScore, result };
};

/**
 * 🏀 CoachBoard: calculatePlayerStreaks
 * Why: Identifies players with scoring momentum (Hot/Cold) to assist with rotation decisions.
 * "Hot" is defined as 3+ consecutive field goal makes.
 * "Cold" is defined as 3+ consecutive field goal misses.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for the game.
 * @returns {Map<string, 'HOT' | 'COLD' | null>} Map of player IDs to their current streak status.
 */
export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  // ⚡ Bolt: Track streaks for all players in a single pass.
  // Optimization: Track only the last three actions per player using a fixed-size buffer
  // to reduce memory churn and avoid large array allocations for long games.
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();

  const sorted = options.isSorted
    ? stats
    : [...stats].sort((a, b) => {
        if (a.timestamp < b.timestamp) return -1;
        if (a.timestamp > b.timestamp) return 1;
        return 0;
      });

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (s.deletedAt) continue;

    // We only track streaks for field goal attempts
    if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
      // Skip free throws (points === 1) for field goal streaks
      if (s.type === ACTION_TYPES.MAKE && s.points === 1) continue;

      const pId = s.playerId;
      let history = playerStreaks.get(pId);
      if (!history) {
        history = [];
        playerStreaks.set(pId, history);
      }

      history.push(s.type === ACTION_TYPES.MAKE ? "MAKE" : "MISS");
      if (history.length > 3) {
        history.shift(); // Keep only last 3 to minimize memory overhead
      }
    }
  }

  const result = new Map<string, "HOT" | "COLD" | null>();
  for (const [pId, history] of playerStreaks.entries()) {
    if (history.length < 3) {
      result.set(pId, null);
      continue;
    }

    // Direct index access is faster than .every() or .slice()
    if (
      history[0] === "MAKE" &&
      history[1] === "MAKE" &&
      history[2] === "MAKE"
    ) {
      result.set(pId, "HOT");
    } else if (
      history[0] === "MISS" &&
      history[1] === "MISS" &&
      history[2] === "MISS"
    ) {
      result.set(pId, "COLD");
    } else {
      result.set(pId, null);
    }
  }

  return result;
};
