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
 * Interface for opponent statistics.
 */
export interface OpponentAggregates {
  points: number;
  makes: number;
  attempts: number;
  fgPct: string;
  rebounds: number;
  offRebounds: number;
  defRebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  turnovers: number;
  fouls: number;
  min: number; // in seconds
  plusMinus: number;
}

/**
 * Interface for score flow data points.
 */
export interface ScoreFlowPoint {
  time: string;
  Team: number;
  Opponent: number;
}

/**
 * Interface for bonus status.
 */
export interface BonusStatus {
  label: string;
  isBonus: boolean;
  isDouble: boolean;
  color: string;
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
  threePM: number;
  fgPct: string;
  efgPct: string;
  tsPct: string;
  plusMinus: number;
  min: number;
  fouls: number;
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
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
};

/**
 * Retrieves the jersey number for a player from the team roster.
 * @param {number | string | undefined} playerId - The player ID.
 * @param {TeamPlayer[]} teamPlayers - The team-player junction records.
 * @returns {string} The jersey number or an empty string.
 */
export const getPlayerJersey = (
  playerId: number | string | undefined,
  teamPlayers: TeamPlayer[],
): string => {
  if (!playerId) return "";
  const tp = teamPlayers.find((t) => t.playerId === playerId);
  return tp?.jerseyNumber ?? "";
};

/**
 * Determines bonus status labels and colors based on foul counts and period type.
 *
 * WHY: Basketball foul rules vary by competition format:
 * - QUARTERS (e.g. NBA/FIBA): Team enters the "Bonus" on the 5th foul of the quarter.
 *   The 4th foul is a warning state (often triggers UI changes like orange color).
 * - HALVES (e.g. NCAA): Team enters "1-and-1" bonus on the 7th foul and "Double Bonus"
 *   on the 10th foul. The 6th foul is the warning state.
 *
 * @param fouls - Current foul count for the period.
 * @param periodType - The game format ('QUARTERS' or 'HALVES').
 */
export const getBonusStatus = (
  fouls: number,
  periodType: string,
): BonusStatus => {
  if (periodType === "QUARTERS") {
    if (fouls >= 5) {
      return {
        label: "BONUS",
        isBonus: true,
        isDouble: false,
        color: "error.main",
      };
    }
    if (fouls === 4) {
      return {
        label: "",
        isBonus: false,
        isDouble: false,
        color: "warning.main",
      };
    }
    return { label: "", isBonus: false, isDouble: false, color: "default" };
  }

  // HALVES logic
  if (fouls >= 10) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: true,
      color: "error.main",
    };
  }
  if (fouls >= 7) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: false,
      color: "error.main",
    };
  }
  if (fouls === 6) {
    return {
      label: "",
      isBonus: false,
      isDouble: false,
      color: "warning.main",
    };
  }
  return { label: "", isBonus: false, isDouble: false, color: "default" };
};

/**
 * Updates team and opponent scores based on a statistical event.
 * @param {StatEvent} stat - The event to process.
 * @param {{ team: number; opp: number }} scores - Current scores.
 */
export const updateScores = (
  stat: StatEvent,
  scores: { team: number; opp: number },
) => {
  if (stat.type === ACTION_TYPES.MAKE) {
    const points = stat.points || 0;
    if (stat.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      scores.opp += points;
    } else {
      scores.team += points;
    }
  }
};

/**
 * Common fields for statistical aggregates.
 */
interface BaseStats {
  points: number;
  makes: number;
  attempts: number;
  rebounds: number;
  offRebounds: number;
  defRebounds: number;
  assists: number;
  steals: number;
  turnovers: number;
  blocks: number;
  fouls: number;
  threePM?: number;
}

/**
 * Applies a statistical action to an aggregate record.
 * @param {BaseStats} agg - The aggregate record to update.
 * @param {StatEvent} stat - The statistical event.
 */
export const applyActionToAggregate = (agg: BaseStats, stat: StatEvent) => {
  switch (stat.type) {
    case ACTION_TYPES.MAKE:
      agg.points += stat.points || 0;
      // 🏀 CoachBoard: Field Goal Tracking
      // Why: Free throws (1pt) should not be counted as FGM or FGA.
      if (stat.points !== 1) {
        agg.makes++;
        agg.attempts++;
      }
      if (stat.points === 3 && agg.threePM !== undefined) agg.threePM++;
      break;
    case ACTION_TYPES.MISS:
      agg.attempts++;
      break;
    case ACTION_TYPES.REBOUND:
      agg.rebounds++;
      break;
    case ACTION_TYPES.OFF_REBOUND:
      agg.offRebounds++;
      agg.rebounds++;
      break;
    case ACTION_TYPES.DEF_REBOUND:
      agg.defRebounds++;
      agg.rebounds++;
      break;
    case ACTION_TYPES.BLOCK:
      agg.blocks++;
      break;
    case ACTION_TYPES.ASSIST:
      agg.assists++;
      break;
    case ACTION_TYPES.STEAL:
      agg.steals++;
      break;
    case ACTION_TYPES.TURNOVER:
      agg.turnovers++;
      break;
    case ACTION_TYPES.FOUL:
      agg.fouls++;
      break;
  }
};

/**
 * Updates a player's statistics based on a single statistical event.
 * @param {PlayerAggregates} player - The player aggregate record.
 * @param {StatEvent} stat - The statistical event to process.
 */
function processStatEvent(player: PlayerAggregates, stat: StatEvent) {
  player.gamesPlayed.add(stat.gameId);
  applyActionToAggregate(player, stat);
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
      jerseyNumber: jerseyMap.get(playerId) ?? "",
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
      threePM: 0,
      fgPct: "0.0",
      efgPct: "0.0",
      tsPct: "0.0",
      plusMinus: 0,
      min: 0,
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

  // Track player stints for MIN and plus-minus
  const activeStints = new Map<
    string,
    { startClock: number; startScoreDiff: number }
  >();
  // ⚡ Bolt: Use pre-sorted stats or sort them if needed.
  const sortedStats = [...stats].sort((a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;
    return 0;
  });

  const scores = { team: 0, opp: 0 };
  let currentPeriod = 1;

  // Accumulate statistics from event stream
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    if (stat.deletedAt) continue;

    const { playerId, type, clockTime, period } = stat;

    // 🏀 CoachBoard: Handle period transitions for active stints
    // Why: Ensures minutes played and plus-minus are calculated correctly
    // even if a player stays on the court across period boundaries.
    if (period && period > currentPeriod) {
      for (const [pId, stint] of activeStints.entries()) {
        const playerAgg = statsMap.get(pId);
        if (playerAgg) {
          // Finish stint for the previous period (assumed to end at 0:00)
          playerAgg.min += stint.startClock;
          playerAgg.plusMinus +=
            scores.team - scores.opp - stint.startScoreDiff;

          // Start new stint for the current period (assumed to start at 10 mins)
          stint.startClock = 600;
          stint.startScoreDiff = scores.team - scores.opp;
        }
      }
      currentPeriod = period;
    }

    // Update global score
    updateScores(stat, scores);

    const player = statsMap.get(playerId);
    if (player) {
      processStatEvent(player, stat);
    }

    // Handle Sub-In/Sub-Out for MIN and Plus-Minus
    if (type === ACTION_TYPES.SUB_IN && clockTime !== undefined) {
      activeStints.set(playerId, {
        startClock: clockTime,
        startScoreDiff: scores.team - scores.opp,
      });
    } else if (type === ACTION_TYPES.SUB_OUT && clockTime !== undefined) {
      const stint = activeStints.get(playerId);
      if (stint) {
        const playerAgg = statsMap.get(playerId);
        if (playerAgg) {
          playerAgg.min += stint.startClock - clockTime;
          playerAgg.plusMinus +=
            scores.team - scores.opp - stint.startScoreDiff;
        }
        activeStints.delete(playerId);
      }
    }
  }

  // Handle players still on court at end of game
  for (const [pId, stint] of activeStints.entries()) {
    const playerAgg = statsMap.get(pId);
    if (playerAgg) {
      playerAgg.min += stint.startClock; // Assuming game ends at 0:00
      playerAgg.plusMinus += scores.team - scores.opp - stint.startScoreDiff;
    }
  }

  // Finalize totals, percentages, and averages
  const result: PlayerAggregates[] = [];
  const isAverage = viewType === "average";
  for (const player of statsMap.values()) {
    const gpActual = player.gamesPlayed.size;
    const gp = gpActual || 1;
    player.gp = gpActual;
    player.fgPct =
      player.attempts > 0
        ? formatToOne((player.makes / player.attempts) * 100)
        : "0.0";

    // eFG% = (FGM + 0.5 * 3PM) / FGA
    player.efgPct =
      player.attempts > 0
        ? formatToOne(
            ((player.makes + 0.5 * player.threePM) / player.attempts) * 100,
          )
        : "0.0";

    // TS% = Points / (2 * (FGA + 0.44 * FTA))
    // Note: We don't have FTA explicitly in StatEvent yet.
    // For now, we use a slightly conservative approximation of TS%.
    player.tsPct =
      player.attempts > 0
        ? formatToOne((player.points / (2 * player.attempts)) * 100)
        : "0.0";

    if (isAverage) {
      player.points = roundToOne(player.points / gp);
      player.rebounds = roundToOne(player.rebounds / gp);
      player.assists = roundToOne(player.assists / gp);
      player.steals = roundToOne(player.steals / gp);
      player.turnovers = roundToOne(player.turnovers / gp);
      player.blocks = roundToOne(player.blocks / gp);
      player.offRebounds = roundToOne(player.offRebounds / gp);
      player.defRebounds = roundToOne(player.defRebounds / gp);
      player.fouls = roundToOne(player.fouls / gp);
      player.min = roundToOne(player.min / (60 * gp)); // Convert to avg mins
      player.plusMinus = roundToOne(player.plusMinus / gp);
    } else {
      player.min = roundToOne(player.min / 60); // Total mins
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
  // Optimization: Aggregate all stats in a single pass without intermediate grouping.
  // ⚡ Bolt: Use a Map for game totals to improve lookup performance and avoid object overhead.
  const gameTotals = new Map<string, { team: number; opp: number }>();
  let targetCount = 0;

  // Pre-populate Map with targeted game IDs to eliminate conditional checks in the hot loop.
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    if (!completedOnly || g.completed === 1) {
      gameTotals.set(g.id!, { team: 0, opp: 0 });
      targetCount++;
    }
  }

  let totalPoints = 0;
  let totalRebounds = 0;
  let totalAssists = 0;
  let totalOppPoints = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    const { gameId, playerId, type } = stat;

    const totals = gameTotals.get(gameId);
    if (!totals) continue;

    updateScores(stat, totals);

    if (playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      if (type === ACTION_TYPES.MAKE) totalOppPoints += stat.points || 0;
    } else {
      if (type === ACTION_TYPES.MAKE) totalPoints += stat.points || 0;

      if (type === ACTION_TYPES.REBOUND) {
        totalRebounds++;
      } else if (type === ACTION_TYPES.OFF_REBOUND) {
        totalRebounds++;
      } else if (type === ACTION_TYPES.DEF_REBOUND) {
        totalRebounds++;
      } else if (type === ACTION_TYPES.ASSIST) {
        totalAssists++;
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
 * @returns {OpponentAggregates} Opponent statistical summary.
 */
export const calculateOpponentAggregates = (
  stats: StatEvent[],
): OpponentAggregates => {
  const agg = {
    points: 0,
    makes: 0,
    attempts: 0,
    rebounds: 0,
    offRebounds: 0,
    defRebounds: 0,
    assists: 0,
    blocks: 0,
    steals: 0,
    turnovers: 0,
    fouls: 0,
  };

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
      applyActionToAggregate(agg, stat);
    }
  }

  return {
    ...agg,
    fgPct:
      agg.attempts > 0 ? ((agg.makes / agg.attempts) * 100).toFixed(1) : "0.0",
    min: 0,
    plusMinus: 0,
  };
};

/**
 * Calculates the score flow data for a game based on chronological events.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events.
 * @returns {ScoreFlowPoint[]} Array of data points for score flow visualization.
 */
export const calculateScoreFlow = (stats: StatEvent[]): ScoreFlowPoint[] => {
  const scores = { team: 0, opp: 0 };
  const result = [{ time: "00:00", Team: 0, Opponent: 0 }];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.type === ACTION_TYPES.MAKE) {
      updateScores(stat, scores);
      // ⚡ Bolt: Use high-performance string slicing instead of Intl.DateTimeFormat
      // to extract "mm:ss" from ISO timestamps, reducing CPU and memory overhead.
      result.push({
        time: stat.timestamp.slice(14, 19),
        Team: scores.team,
        Opponent: scores.opp,
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
): boolean =>
  periodType === "QUARTERS"
    ? eventPeriod === currentPeriod
    : currentPeriod === 1
      ? eventPeriod === 1
      : eventPeriod >= 2;

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
  const scores = { team: 0, opp: 0 };
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (stat.deletedAt) continue;

    if (stat.gameId === gameId) {
      updateScores(stat, scores);
    }
  }

  // Determine game result: W (Win), L (Loss), D (Draw/Tie).
  const result = determineResult(scores.team, scores.opp);
  return { teamScore: scores.team, oppScore: scores.opp, result };
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
/**
 * 🏀 CoachBoard: calculateLineupStats
 *
 * WHY: Lineup efficiency (Plus/Minus for 5-player units) is a critical coaching metric
 * for determining which player combinations work best together.
 *
 * This function handles several complex edge cases:
 * 1. MULTI-GAME: Correctly isolates stints by gameId to prevent cross-game time bleeding.
 * 2. PERIOD TRANSITIONS: Closes active stints at 0:00 of the current period and
 *    re-opens them at the start (default 600s) of the next period if no sub occurred.
 * 3. SUB TRACKING: Uses a Set to track the active 5-man unit and records a "stint"
 *    every time a substitution or period end occurs.
 */
export interface LineupAggregates {
  lineup: string[]; // Player IDs
  pointsFor: number;
  pointsAgainst: number;
  netRating: number;
  seconds: number;
}

/**
 * Generates a unique, sorted string key for a set of players.
 * @param {Set<string> | string[]} players - The players in the lineup.
 * @returns {string} The sorted lineup key.
 */
const getLineupKey = (players: Set<string> | string[]): string =>
  Array.from(players).sort().join(",");

/**
 * Updates a lineup's statistical aggregate with data from a specific stint.
 * @param {Map<string, LineupAggregates>} lineupStats - Map of lineup aggregates.
 * @param {string} key - Lineup key.
 * @param {number} seconds - Duration of the stint.
 * @param {number} ptsFor - Points scored during the stint.
 * @param {number} ptsAgainst - Points allowed during the stint.
 */
const recordLineupStint = (
  lineupStats: Map<string, LineupAggregates>,
  key: string,
  seconds: number,
  ptsFor: number,
  ptsAgainst: number,
) => {
  let agg = lineupStats.get(key);
  if (!agg) {
    agg = {
      lineup: key.split(","),
      pointsFor: 0,
      pointsAgainst: 0,
      netRating: 0,
      seconds: 0,
    };
    lineupStats.set(key, agg);
  }
  agg.seconds += seconds;
  agg.pointsFor += ptsFor;
  agg.pointsAgainst += ptsAgainst;
};

export const calculateLineupStats = (
  stats: StatEvent[],
): LineupAggregates[] => {
  // Group stats by gameId to handle multi-game aggregation correctly
  const statsByGame = new Map<string, StatEvent[]>();
  for (const s of stats) {
    if (!statsByGame.has(s.gameId)) statsByGame.set(s.gameId, []);
    statsByGame.get(s.gameId)!.push(s);
  }

  const lineupStats = new Map<string, LineupAggregates>();

  for (const gameStats of statsByGame.values()) {
    const sortedStats = [...gameStats].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });

    let currentLineup = new Set<string>();
    let lastClockTime = 600; // Default to start of P1
    let lastTeamScore = 0;
    let lastOppScore = 0;
    let currentPeriod = 1;
    const scores = { team: 0, opp: 0 };

    for (let i = 0; i < sortedStats.length; i++) {
      const s = sortedStats[i];
      if (s.deletedAt) continue;

      // Handle period transition
      if (s.period > currentPeriod) {
        if (currentLineup.size === 5) {
          recordLineupStint(
            lineupStats,
            getLineupKey(currentLineup),
            lastClockTime, // Time remaining in previous period
            scores.team - lastTeamScore,
            scores.opp - lastOppScore,
          );
        }
        lastClockTime = 600; // Reset for new period
        lastTeamScore = scores.team;
        lastOppScore = scores.opp;
        currentPeriod = s.period;
      }

      // Track score
      updateScores(s, scores);

      // When lineup changes, record stats for the previous lineup
      if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
        if (currentLineup.size === 5 && s.clockTime !== undefined) {
          recordLineupStint(
            lineupStats,
            getLineupKey(currentLineup),
            lastClockTime - s.clockTime,
            scores.team - lastTeamScore,
            scores.opp - lastOppScore,
          );
        }

        if (s.type === ACTION_TYPES.SUB_IN) currentLineup.add(s.playerId);
        else currentLineup.delete(s.playerId);

        lastClockTime = s.clockTime || 0;
        lastTeamScore = scores.team;
        lastOppScore = scores.opp;
      }
    }

    // Final stint for this game
    if (currentLineup.size === 5) {
      recordLineupStint(
        lineupStats,
        getLineupKey(currentLineup),
        lastClockTime,
        scores.team - lastTeamScore,
        scores.opp - lastOppScore,
      );
    }
  }

  return Array.from(lineupStats.values())
    .map((agg) => ({
      ...agg,
      netRating: agg.pointsFor - agg.pointsAgainst,
    }))
    .sort((a, b) => b.netRating - a.netRating);
};

/**
 * 🏀 CoachBoard: calculatePlayerStreaks
 *
 * WHY: Momentum is a key factor in basketball. Identifying players who are "Hot" (scoring)
 * or "Cold" (struggling) helps coaches make better rotation and play-calling decisions.
 *
 * LOGIC:
 * - HOT (🔥): Triggered by 3 consecutive field goal makes.
 * - COLD (❄️): Triggered by 3 consecutive field goal misses.
 * - Interruptions: Any Miss resets a Hot streak; any Make resets a Cold streak.
 * - Exclusions: Free throws are excluded to focus on field goal flow.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @param options - Optimization flags (e.g., skip sorting if data is already ordered).
 * @returns Map of player IDs to their current streak status ('HOT', 'COLD', or null).
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
