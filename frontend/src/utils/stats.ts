/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
} from "../constants/stats";
import { StatEvent, TeamPlayer, Player, Game } from "../db";
import {
  roundToOne,
  formatToOne,
  determineResult,
  formatClock,
} from "./mathUtils";

/**
 * Standardized sorting for statistical events based on timestamp.
 * Includes a secondary sort for simultaneous events (SUB_IN > others > SUB_OUT).
 * @param {StatEvent[]} stats - The list of events to sort.
 * @returns {StatEvent[]} A new sorted array of events.
 */
export const sortStats = (stats: StatEvent[]): StatEvent[] => {
  return [...stats].sort((a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;

    // ⚡ Bolt: Inline priority logic for simultaneous events.
    // Replaces object lookups with direct conditional logic to eliminate property
    // access overhead in the hot sort loop.
    let pA = 2;
    if (a.type === ACTION_TYPES.SUB_IN) pA = 1;
    else if (a.type === ACTION_TYPES.SUB_OUT) pA = 3;

    let pB = 2;
    if (b.type === ACTION_TYPES.SUB_IN) pB = 1;
    else if (b.type === ACTION_TYPES.SUB_OUT) pB = 3;

    return pA - pB;
  });
};

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
  ppp: string;
  possessions: number;
  oppPpp: string;
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
  fta: number;
  ftm: number;
  threePM: number;
  threePA: number;
  min: number; // in seconds
  plusMinus: number;
  ppp: string;
  possessions: number;
}

/**
 * Interface for score flow data points.
 */
export interface ScoreFlowPoint {
  time: string;
  Team: number;
  Opponent: number;
  Spread: number;
  event?: string;
  lineup?: string[];
  teamPpp?: string;
  oppPpp?: string;
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
  threePA: number;
  ftm: number;
  fta: number;
  fgPct: string;
  threePPct: string;
  ftPct: string;
  efgPct: string;
  tsPct: string;
  plusMinus: number;
  min: number;
  fouls: number;
}

/**
 * Determines if a player ID belongs to an opponent.
 * @param {string} playerId - The player ID.
 * @returns {boolean} True if the ID is for an opponent.
 */
export const isOpponentId = (playerId: string): boolean =>
  playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
  playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

/**
 * Determines if a statistical event is active (not deleted).
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if active.
 */
export const isActive = (stat: StatEvent): boolean => !stat.deletedAt;

/**
 * Determines if a statistical event is a scoring event (MAKE).
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a MAKE action.
 */
export const isScoringEvent = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.MAKE;

/**
 * Determines if a statistical event is a foul action.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a foul.
 */
export const isFoulAction = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.FOUL ||
  stat.type === ACTION_TYPES.FOUL_SHOOTING ||
  stat.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
  stat.type === ACTION_TYPES.TECHNICAL_FOUL;

/**
 * Determines if a statistical event is a free throw attempt.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a 1-point attempt.
 */
export const isFreeThrow = (stat: StatEvent): boolean => stat.points === 1;

/**
 * Determines if a statistical event is a field goal attempt (MAKE or MISS, excluding free throws).
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a field goal attempt.
 */
export const isFieldGoal = (stat: StatEvent): boolean =>
  (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.MISS) &&
  !isFreeThrow(stat);

/**
 * Generic percentage calculator for basketball stats.
 * @param {number} numerator - The count (makes, points, etc).
 * @param {number} denominator - The total attempts or possessions.
 * @returns {string} Formatted percentage.
 */
const calcPct = (numerator: number, denominator: number): string => {
  // ⚡ Bolt: Early returns for zero denominators and zero numerators.
  // Skips floating point division and string formatting logic.
  if (denominator <= 0) return "0.0";
  if (numerator <= 0) return "0.0";
  return formatToOne((numerator / denominator) * 100);
};

/**
 * Calculates Field Goal Percentage.
 * @param {number} makes - Field goals made.
 * @param {number} attempts - Field goals attempted.
 * @returns {string} Formatted percentage.
 */
export const calculateFgPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

/**
 * Calculates Points Per Possession (PPP).
 * @param {number} points - Total points.
 * @param {number} possessions - Total possessions.
 * @returns {string} Formatted PPP.
 */
export const calculatePpp = (points: number, possessions: number): string => {
  if (possessions <= 0) return "0.00";
  return (points / possessions).toFixed(2);
};

/**
 * Calculates possessions based on the formula: FGA + 0.44 * FTA + TO - OREB.
 * @param {number} fga - Field Goal Attempts.
 * @param {number} fta - Free Throw Attempts.
 * @param {number} to - Turnovers.
 * @param {number} oreb - Offensive Rebounds.
 * @returns {number} Estimated possessions.
 */
export const calculatePossessions = (
  fga: number,
  fta: number,
  to: number,
  oreb: number,
): number => {
  return fga + 0.44 * fta + to - oreb;
};

/**
 * Calculates Free Throw Percentage.
 * @param {number} makes - Free throws made.
 * @param {number} attempts - Free throws attempted.
 * @returns {string} Formatted percentage.
 */
export const calculateFtPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

/**
 * Calculates Effective Field Goal Percentage.
 * @param {number} makes - Field goals made.
 * @param {number} threePM - Three pointers made.
 * @param {number} attempts - Field goals attempted.
 * @returns {string} Formatted percentage.
 */
export const calculateEfgPct = (
  makes: number,
  threePM: number,
  attempts: number,
): string => calcPct(makes + 0.5 * threePM, attempts);

/**
 * Calculates True Shooting Percentage (TS%).
 *
 * WHY: TS% is a measure of shooting efficiency that takes into account 2PT field
 * goals, 3PT field goals, and free throws.
 * The 0.44 coefficient is a standard statistical constant used to estimate the
 * number of possessions ended by free throw attempts, accounting for and-ones,
 * technical fouls, and 3-shot fouls.
 *
 * @param {number} points - Total points.
 * @param {number} attempts - Field goals attempted.
 * @param {number} fta - Free throw attempts.
 * @returns {string} Formatted percentage.
 */
export const calculateTsPct = (
  points: number,
  attempts: number,
  fta: number,
): string => calcPct(points, 2 * (attempts + 0.44 * fta));

/**
 * Returns the initials of a name (max 2 characters).
 * @param {string} name - The full name.
 * @returns {string} The uppercase initials.
 */
export const getInitials = (name: string | undefined | null): string => {
  return (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0]?.toUpperCase())
    .join("");
};

/**
 * Standardized logic for recording the end of a player's stint.
 * @param {PlayerAggregates | undefined} playerAgg - The player aggregate record.
 * @param {{ startClock: number; startScoreDiff: number }} stint - Stint data.
 * @param {{ team: number; opp: number }} currentScores - Current game scores.
 * @param {number} endClock - The clock time when the stint ended.
 */
const handleStintEnd = (
  playerAgg: PlayerAggregates | undefined,
  stint: { startClock: number; startScoreDiff: number },
  currentScores: { team: number; opp: number },
  endClock: number,
) => {
  // ⚡ Bolt: Accepts playerAgg directly to skip redundant Map lookups in the hot loop.
  if (playerAgg) {
    playerAgg.min += Math.max(0, stint.startClock - endClock);
    playerAgg.plusMinus +=
      currentScores.team - currentScores.opp - stint.startScoreDiff;
  }
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
  const config = BONUS_CONFIG[periodType] || BONUS_CONFIG.QUARTERS;

  if (fouls >= config.double) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: true,
      color: "error.main",
    };
  }
  if (fouls >= config.single) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: false,
      color: "error.main",
    };
  }
  if (fouls === config.warning) {
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
 * Updates possession-related counters (FGA, FTA, TO, OREB) for a team or opponent.
 * @param {StatEvent} stat - The event to process.
 * @param {boolean} isOpponent - Whether the event belongs to the opponent.
 * @param {object} counters - The counters to update.
 */
const updatePossessionCounters = (
  stat: StatEvent,
  counters: {
    fga: number;
    fta: number;
    to: number;
    oreb: number;
  },
): { fga: number; fta: number; to: number; oreb: number } => {
  const { type } = stat;

  if (isFieldGoal(stat)) {
    counters.fga++;
  } else if (isFreeThrow(stat)) {
    counters.fta++;
  } else if (type === ACTION_TYPES.TURNOVER) {
    counters.to++;
  } else if (type === ACTION_TYPES.OFF_REBOUND) {
    counters.oreb++;
  }

  return counters;
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
  if (isScoringEvent(stat)) {
    const points = stat.points || 0;
    if (isOpponentId(stat.playerId)) {
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
  threePA?: number;
  ftm?: number;
  fta?: number;
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
      if (isFreeThrow(stat)) {
        if (agg.ftm !== undefined) agg.ftm++;
        if (agg.fta !== undefined) agg.fta++;
      } else {
        agg.makes++;
        agg.attempts++;
        if (stat.points === 3) {
          if (agg.threePM !== undefined) agg.threePM++;
          if (agg.threePA !== undefined) agg.threePA++;
        }
      }
      break;
    case ACTION_TYPES.MISS:
      if (isFreeThrow(stat)) {
        if (agg.fta !== undefined) agg.fta++;
      } else {
        agg.attempts++;
        if (stat.points === 3) {
          if (agg.threePA !== undefined) agg.threePA++;
        }
      }
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
    case ACTION_TYPES.FOUL_SHOOTING:
    case ACTION_TYPES.FOUL_NON_SHOOTING:
    case ACTION_TYPES.TECHNICAL_FOUL:
      agg.fouls++;
      break;
  }
};

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
      gamesPlayed: new Set<string | number>(),
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
      threePA: 0,
      ftm: 0,
      fta: 0,
      fgPct: "0.0",
      threePPct: "0.0",
      ftPct: "0.0",
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
  options: {
    isSorted?: boolean;
    periodLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
  } = {},
): PlayerAggregates[] => {
  const statsMap = initializeStatsMap(players, teamPlayers);
  const periodLen = options.periodLength ? options.periodLength * 60 : 600;

  // Track player stints for MIN and plus-minus
  const activeStints = new Map<
    string,
    { startClock: number; startScoreDiff: number; lastGameId: string }
  >();
  // ⚡ Bolt: Use pre-sorted stats or sort them if needed.
  const sortedStats = options.isSorted ? stats : sortStats(stats);

  const scores = { team: 0, opp: 0 };
  let currentPeriod = 1;
  let currentGameId: string | null = null;

  // ⚡ Bolt: Cache last gameId per player to avoid redundant Set.add overhead.
  const lastGameIdMap = new Map<string, string>();

  // Accumulate statistics from event stream
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    // ⚡ Bolt: Inline isActive check to reduce function call overhead in hot loop.
    if (stat.deletedAt) continue;

    const { playerId, type, clockTime, period, gameId } = stat;

    // 🏀 CoachBoard: Clutch Filter
    if (options.clutchOnly && clockTime !== undefined) {
      const isClutch = isClutchEvent(
        period,
        clockTime,
        scores.team - scores.opp,
        options.periodType || "QUARTERS",
      );
      if (!isClutch) {
        // We still need to update scores and lineups to maintain state
        if (type === ACTION_TYPES.MAKE) {
          const pts = stat.points || 0;
          if (isOpponentId(playerId)) scores.opp += pts;
          else scores.team += pts;
        }
        if (type === ACTION_TYPES.SUB_IN) {
          activeStints.set(playerId, {
            startClock: clockTime,
            startScoreDiff: scores.team - scores.opp,
            lastGameId: gameId,
          });
        } else if (type === ACTION_TYPES.SUB_OUT) {
          activeStints.delete(playerId);
        }
        continue;
      }
    }

    // Handle new game context
    if (gameId !== currentGameId) {
      // Close all active stints for the previous game
      for (const [pId, stint] of activeStints.entries()) {
        handleStintEnd(statsMap.get(pId), stint, scores, 0);
      }
      activeStints.clear();
      lastGameIdMap.clear();
      scores.team = 0;
      scores.opp = 0;
      currentPeriod = 1;
      currentGameId = gameId;
    }

    // 🏀 CoachBoard: Handle period transitions for active stints
    // Why: Ensures minutes played and plus-minus are calculated correctly
    // even if a player stays on the court across period boundaries.
    if (period && period > currentPeriod) {
      const skippedPeriods = period - currentPeriod - 1;
      for (const [pId, stint] of activeStints.entries()) {
        // Finish stint for the previous period (assumed to end at 0:00)
        handleStintEnd(statsMap.get(pId), stint, scores, 0);

        // 🔍 Scout: Handle full minutes for skipped periods
        if (skippedPeriods > 0) {
          const pAgg = statsMap.get(pId);
          if (pAgg) pAgg.min += skippedPeriods * periodLen;
        }

        // Start new stint for the current period (assumed to start at full period)
        stint.startClock = periodLen;
        stint.startScoreDiff = scores.team - scores.opp;
      }
      currentPeriod = period;
    }

    // ⚡ Bolt: Use domain helpers for scoring and opponent identification.
    if (type === ACTION_TYPES.MAKE) {
      const pts = stat.points || 0;
      if (isOpponentId(playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
      }
    }

    // ⚡ Bolt: Cache statsMap lookups to avoid redundant Map access in the hot loop.
    const player = statsMap.get(playerId);
    if (player) {
      // ⚡ Bolt: Inline processStatEvent and applyActionToAggregate to minimize overhead.
      // Only call Set.add if gameId has changed for this player to skip internal Set logic.
      if (lastGameIdMap.get(playerId) !== gameId) {
        player.gamesPlayed.add(gameId);
        lastGameIdMap.set(playerId, gameId);
      }

      switch (type) {
        case ACTION_TYPES.MAKE:
          player.points += stat.points || 0;
          if (isFreeThrow(stat)) {
            player.ftm++;
            player.fta++;
          } else {
            player.makes++;
            player.attempts++;
            if (stat.points === 3) {
              player.threePM++;
              player.threePA++;
            }
          }
          break;
        case ACTION_TYPES.MISS:
          if (isFreeThrow(stat)) {
            player.fta++;
          } else {
            player.attempts++;
            if (stat.points === 3) {
              player.threePA++;
            }
          }
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
        case ACTION_TYPES.FOUL_SHOOTING:
        case ACTION_TYPES.FOUL_NON_SHOOTING:
        case ACTION_TYPES.TECHNICAL_FOUL:
          player.fouls++;
          break;
      }
    }

    // Handle Sub-In/Sub-Out for MIN and Plus-Minus
    if (type === ACTION_TYPES.SUB_IN && clockTime !== undefined) {
      activeStints.set(playerId, {
        startClock: clockTime,
        startScoreDiff: scores.team - scores.opp,
        lastGameId: gameId,
      });
    } else if (type === ACTION_TYPES.SUB_OUT && clockTime !== undefined) {
      // ⚡ Bolt: activeStints lookup cached.
      const stint = activeStints.get(playerId);
      if (stint) {
        handleStintEnd(player, stint, scores, clockTime);
        activeStints.delete(playerId);
      }
    }
  }

  // Handle players still on court at end of game
  const liveCtx = options.liveContext;
  for (const [pId, stint] of activeStints.entries()) {
    // 🏀 CoachBoard: Accurate Live Minutes
    // Why: If we have liveContext, stint ends at current clockTime.
    // Otherwise, assume they played until the buzzer (0:00).
    const endClock =
      liveCtx && stint.lastGameId === stats[stats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    handleStintEnd(statsMap.get(pId), stint, scores, endClock);
  }

  // Finalize totals, percentages, and averages
  const result: PlayerAggregates[] = [];
  const isAverage = viewType === "average";
  for (const player of statsMap.values()) {
    const gpActual = player.gamesPlayed.size;
    const gp = gpActual || 1;
    player.gp = gpActual;
    player.fgPct = calculateFgPct(player.makes, player.attempts);
    player.threePPct = calculateFgPct(player.threePM, player.threePA);
    player.ftPct = calculateFtPct(player.ftm, player.fta);
    player.efgPct = calculateEfgPct(
      player.makes,
      player.threePM,
      player.attempts,
    );
    player.tsPct = calculateTsPct(player.points, player.attempts, player.fta);

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
 * 🏀 CoachBoard: calculateOpponentScoutingStats
 * Why: Aggregates statistics for opponent players identified by persistent IDs across games.
 * Supports scouting analysis for recurring opponents.
 *
 * @param stats - List of statistical events across multiple games.
 * @returns Map of persistent player IDs to aggregated stats.
 */
export const calculateOpponentScoutingStats = (
  stats: StatEvent[],
): Map<string, OpponentAggregates> => {
  const result = new Map<string, OpponentAggregates>();
  const gameIdsMap = new Map<string, Set<string>>();

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const pId = s.playerId;
    let agg = result.get(pId);
    if (!agg) {
      agg = {
        points: 0,
        makes: 0,
        attempts: 0,
        fgPct: "0.0",
        rebounds: 0,
        offRebounds: 0,
        defRebounds: 0,
        assists: 0,
        blocks: 0,
        steals: 0,
        turnovers: 0,
        fouls: 0,
        fta: 0,
        ftm: 0,
        threePM: 0,
        threePA: 0,
        min: 0,
        plusMinus: 0,
        ppp: "0.00",
        possessions: 0,
      };
      result.set(pId, agg);
    }

    applyActionToAggregate(agg, s);

    // Track games played for this player
    let gSet = gameIdsMap.get(pId);
    if (!gSet) {
      gSet = new Set<string>();
      gameIdsMap.set(pId, gSet);
    }
    gSet.add(s.gameId);
  }

  // Finalize PPP and percentages
  for (const agg of result.values()) {
    const possessions = calculatePossessions(
      agg.attempts,
      agg.fta,
      agg.turnovers,
      agg.offRebounds,
    );
    agg.possessions = Math.round(possessions);
    agg.ppp = calculatePpp(agg.points, possessions);
    agg.fgPct = calculateFgPct(agg.makes, agg.attempts);
  }

  return result;
};

/**
 * 🏀 CoachBoard: calculatePlayEfficiency
 * Why: Analyzes offensive sets to determine which plays are yielding the best results.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of play efficiency metrics.
 */
export interface PlayEfficiency {
  name: string;
  attempts: number;
  makes: number;
  points: number;
  ppp: string;
  efg: string;
}

export const calculatePlayEfficiency = (
  stats: StatEvent[],
): PlayEfficiency[] => {
  const data: Record<
    string,
    {
      makes: number;
      attempts: number;
      points: number;
      fta: number;
      turnovers: number;
      threePM: number;
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.playName) continue;

    if (!data[s.playName]) {
      data[s.playName] = {
        makes: 0,
        attempts: 0,
        points: 0,
        fta: 0,
        turnovers: 0,
        threePM: 0,
      };
    }

    const play = data[s.playName];
    if (s.type === ACTION_TYPES.MAKE) {
      play.points += s.points || 0;
      if (s.points === 1) {
        play.fta++;
      } else {
        play.makes++;
        play.attempts++;
        if (s.points === 3) {
          play.threePM++;
        }
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) {
        play.fta++;
      } else {
        play.attempts++;
      }
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      play.turnovers++;
    }
  }

  return Object.entries(data)
    .map(([name, s]) => {
      const possessions = calculatePossessions(
        s.attempts,
        s.fta,
        s.turnovers,
        0,
      );
      return {
        name,
        attempts: s.attempts,
        makes: s.makes,
        points: s.points,
        ppp: calculatePpp(s.points, possessions),
        efg: calculateEfgPct(s.makes, s.threePM, s.attempts),
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
};

/**
 * 🏀 CoachBoard: calculateOpponentThreats
 *
 * WHY: Identifies opponent players who are scoring significantly or on a streak.
 * This allows the coach to make defensive adjustments before the game slips away.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of threat objects for the opponent.
 */
export interface OpponentThreat {
  playerId: string;
  points: number;
  makes: number;
  consecutiveMakes: number;
  straightPoints: number;
  isHot: boolean;
}

/**
 * 🏀 CoachBoard: calculateOpponentThreats
 *
 * WHY: Identifies opponent players who are scoring significantly or on a streak.
 * tracks "straight points" (points scored by an opponent while our team has 0 points
 * in that same window) to alert for unchecked threats.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of threat objects for the opponent.
 */
export const calculateOpponentThreats = (
  stats: StatEvent[],
): OpponentThreat[] => {
  const threats = new Map<string, OpponentThreat>();
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    // Reset threats on game change
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      threats.clear();
    }

    const isOpp = isOpponentId(s.playerId);

    // If our team scores, reset all current straight points counters
    if (!isOpp && isScoringEvent(s)) {
      for (const t of threats.values()) {
        t.straightPoints = 0;
      }
      continue;
    }

    if (!isOpp) continue;

    const pId = s.playerId;
    if (!threats.has(pId)) {
      threats.set(pId, {
        playerId: pId,
        points: 0,
        makes: 0,
        consecutiveMakes: 0,
        straightPoints: 0,
        isHot: false,
      });
    }

    const t = threats.get(pId)!;
    if (s.type === ACTION_TYPES.MAKE) {
      t.points += s.points || 0;
      t.straightPoints += s.points || 0;
      if (isFieldGoal(s)) {
        t.makes++;
        t.consecutiveMakes++;
      }
      // Hot if: 8+ total points, 3+ consecutive makes, or 6+ straight points
      if (t.points >= 8 || t.consecutiveMakes >= 3 || t.straightPoints >= 6) {
        t.isHot = true;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isFieldGoal(s)) {
        t.consecutiveMakes = 0;
      }
    }
  }

  return Array.from(threats.values()).filter((t) => t.isHot);
};

/**
 * 🏀 CoachBoard: calculateStopsAndKills
 *
 * WHY: Defensive momentum is often measured in "Stops" (defensive possessions
 * without an opponent score) and "Kills" (3 consecutive stops).
 * This metric helps motivate defensive intensity and identifies defensive runs.
 *
 * DEFINITIONS:
 * - A STOP occurs when a defensive possession ends without an opponent score
 *   (e.g., opponent turnover or opponent miss followed by a defensive rebound).
 * - A KILL is a sequence of 3 consecutive STOPS.
 *
 * IMPLEMENTATION NOTE: The logic uses a look-ahead loop when a MISS is detected
 * to determine if the possession ended in a stop (DEF_REBOUND) or continued
 * (OFF_REBOUND). This look-ahead prevents "double-counting" stops in a single
 * possession sequence (e.g., MISS -> MISS -> DEF_REBOUND is only 1 stop).
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for the game.
 * @returns {object} Object containing total stops, kills, and current stop streak.
 */
export const calculateStopsAndKills = (stats: StatEvent[]) => {
  let totalStops = 0;
  let totalKills = 0;
  let currentStreak = 0;

  /**
   * ⚡ Bolt: State-machine approach for possession tracking.
   * Replaces the O(N^2) look-ahead loop with a single O(N) pass.
   *
   * WHY: Previous implementations used nested loops to look ahead for rebounds after a miss.
   * This state-machine approach is more efficient (O(N)) and handles edge cases like
   * multiple misses in a single possession or gameId changes without complex index management.
   *
   * State tracks if we are currently in an opponent possession and if they have missed.
   */
  let inOpponentPossession = false;
  let isOurPossession = false;
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    // Handle gameId changes
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = false;
    }

    const isOpp = isOpponentId(s.playerId);

    // If opponent scores, the streak is broken immediately.
    if (isOpp && isScoringEvent(s)) {
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = true; // Ball goes to us after they score
      continue;
    }

    // Track possession changes to distinguish offensive/defensive fouls
    if (!isOpp && isScoringEvent(s)) isOurPossession = false;
    if (!isOpp && s.type === ACTION_TYPES.TURNOVER) isOurPossession = false;
    if (
      isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = false;
    if (
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = true;

    // 🏀 CoachBoard: Foul Reset logic
    if (!isOpp && isFoulAction(s)) {
      // 🔍 Scout: Only reset streak if we are on defense (or if it's a technical foul)
      // Offensive fouls do not break a defensive stop streak.
      if (!isOurPossession || s.type === ACTION_TYPES.TECHNICAL_FOUL) {
        currentStreak = 0;
      }
      // Note: A foul resets the streak but possession might continue (e.g. non-shooting foul).
      continue;
    }

    // A Stop is earned on an Opponent Turnover.
    if (isOpp && s.type === ACTION_TYPES.TURNOVER) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    }
    // Opponent Miss triggers the "potential stop" state.
    else if (isOpp && s.type === ACTION_TYPES.MISS) {
      inOpponentPossession = true;
    }
    // If we get a defensive rebound while opponent was in possession after a miss -> Stop!
    else if (
      inOpponentPossession &&
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    ) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    }
    // If opponent gets an offensive rebound, the possession continues.
    else if (
      inOpponentPossession &&
      isOpp &&
      s.type === ACTION_TYPES.OFF_REBOUND
    ) {
      // Keep inOpponentPossession = true
    }
    // Any other action by our team (except rebound handled above) or change in game state
    // that implies a change in possession without a score/rebound/TO is not a stop.
    // However, to keep it simple and robust, we mostly care about the terminators.

    // Check for "Kill" (3 consecutive stops)
    if (currentStreak >= 3) {
      totalKills++;
      currentStreak = 0; // Reset streak for the next set of 3
    }
  }

  return { totalStops, totalKills, currentStreak };
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
/**
 * 🏀 CoachBoard: calculateTeamSeasonAverages
 * Why: Computes historical averages for a team to provide context for live performance.
 */
export const calculateTeamSeasonAverages = (
  games: Game[],
  allStats: StatEvent[],
): { ppp: string } => {
  const teamAgg = calculateTeamAggregates(games, allStats, true);
  return { ppp: teamAgg.ppp };
};

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
  let totalFga = 0;
  let totalFta = 0;
  let totalTo = 0;
  let totalOreb = 0;

  // Track opponent possessions for Defensive PPP (oppPpp)
  let oppFga = 0;
  let oppFta = 0;
  let oppTo = 0;
  let oppOreb = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const totals = gameTotals.get(stat.gameId);
    if (!totals) continue;

    // ⚡ Bolt: Use domain helpers for scoring and opponent identification.
    const type = stat.type;
    const pId = stat.playerId;
    const isOpponent = isOpponentId(pId);

    const pts = stat.points || 0;
    if (type === ACTION_TYPES.MAKE) {
      if (isOpponent) {
        totals.opp += pts;
        totalOppPoints += pts;
      } else {
        totals.team += pts;
        totalPoints += pts;
      }
    }

    if (isOpponent) {
      const updated = updatePossessionCounters(stat, {
        fga: oppFga,
        fta: oppFta,
        to: oppTo,
        oreb: oppOreb,
      });
      oppFga = updated.fga;
      oppFta = updated.fta;
      oppTo = updated.to;
      oppOreb = updated.oreb;
    } else {
      const updated = updatePossessionCounters(stat, {
        fga: totalFga,
        fta: totalFta,
        to: totalTo,
        oreb: totalOreb,
      });
      totalFga = updated.fga;
      totalFta = updated.fta;
      totalTo = updated.to;
      totalOreb = updated.oreb;
    }

    if (!isOpponent) {
      if (type === ACTION_TYPES.OFF_REBOUND || type === ACTION_TYPES.REBOUND || type === ACTION_TYPES.DEF_REBOUND) {
        totalRebounds++;
      } else if (type === ACTION_TYPES.ASSIST) {
        totalAssists++;
      }
    }
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  // ⚡ Bolt: Iterate over map values directly to improve iteration performance.
  for (const totals of gameTotals.values()) {
    if (totals.team > totals.opp) wins++;
    else if (totals.team < totals.opp) losses++;
    else draws++;
  }

  const gp = targetCount || 1;
  const totalPossessions = calculatePossessions(
    totalFga,
    totalFta,
    totalTo,
    totalOreb,
  );
  const totalOppPossessions = calculatePossessions(
    oppFga,
    oppFta,
    oppTo,
    oppOreb,
  );

  return {
    ppg: formatToOne(totalPoints / gp),
    rpg: formatToOne(totalRebounds / gp),
    apg: formatToOne(totalAssists / gp),
    oppg: formatToOne(totalOppPoints / gp),
    record: draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`,
    totalGames: targetCount,
    ppp: calculatePpp(totalPoints, totalPossessions),
    possessions: Math.round(totalPossessions),
    oppPpp: calculatePpp(totalOppPoints, totalOppPossessions),
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
    fta: 0,
    ftm: 0,
    threePM: 0,
    threePA: 0,
  };

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat) || !isOpponentId(stat.playerId)) continue;

    applyActionToAggregate(agg, stat);
  }

  const possessions = calculatePossessions(
    agg.attempts,
    agg.fta,
    agg.turnovers,
    agg.offRebounds,
  );

  return {
    ...agg,
    fgPct: calculateFgPct(agg.makes, agg.attempts),
    min: 0,
    plusMinus: 0,
    ppp: calculatePpp(agg.points, possessions),
    possessions: Math.round(possessions),
  };
};

/**
 * Calculates the score flow data for a game based on chronological events.
 * Uses game clock time (period and clockTime) for accurate timeline positioning.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events.
 * @param {number} periodLengthMinutes - Length of each period in minutes.
 * @returns {ScoreFlowPoint[]} Array of data points for score flow visualization.
 */
export const calculateScoreFlow = (
  stats: StatEvent[],
  periodLengthMinutes: number = 10,
): ScoreFlowPoint[] => {
  const scores = { team: 0, opp: 0 };
  const result: ScoreFlowPoint[] = [
    { time: "00:00", Team: 0, Opponent: 0, Spread: 0 },
  ];
  const periodLenSecs = periodLengthMinutes * 60;

  // Running stats for PPP
  let teamFga = 0,
    teamFta = 0,
    teamTo = 0,
    teamOreb = 0;
  let oppFga = 0,
    oppFta = 0,
    oppTo = 0,
    oppOreb = 0;
  const currentLineup = new Set<string>();

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const isOpp = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    // Track scores
    if (stat.type === ACTION_TYPES.MAKE) {
      if (isOpp) scores.opp += pts;
      else scores.team += pts;
    }

    // Track possessions
    if (isOpp) {
      const updated = updatePossessionCounters(stat, {
        fga: oppFga,
        fta: oppFta,
        to: oppTo,
        oreb: oppOreb,
      });
      oppFga = updated.fga;
      oppFta = updated.fta;
      oppTo = updated.to;
      oppOreb = updated.oreb;
    } else {
      const updated = updatePossessionCounters(stat, {
        fga: teamFga,
        fta: teamFta,
        to: teamTo,
        oreb: teamOreb,
      });
      teamFga = updated.fga;
      teamFta = updated.fta;
      teamTo = updated.to;
      teamOreb = updated.oreb;
    }

    if (stat.type === ACTION_TYPES.SUB_IN) {
      currentLineup.add(stat.playerId);
    } else if (stat.type === ACTION_TYPES.SUB_OUT) {
      currentLineup.delete(stat.playerId);
    }

    // Capture point if it's a significant event for the chart
    if (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.TIMEOUT) {
      const period = stat.period || 1;
      const clockTime = stat.clockTime ?? periodLenSecs;
      const elapsedSeconds =
        (period - 1) * periodLenSecs + (periodLenSecs - clockTime);

      const teamPoss = calculatePossessions(teamFga, teamFta, teamTo, teamOreb);
      const oppPoss = calculatePossessions(oppFga, oppFta, oppTo, oppOreb);

      let eventLabel = stat.type;
      if (stat.type === ACTION_TYPES.MAKE) {
        eventLabel = `${pts}PT MAKE`;
      }

      result.push({
        time: formatClock(elapsedSeconds),
        Team: scores.team,
        Opponent: scores.opp,
        Spread: scores.team - scores.opp,
        event: eventLabel,
        lineup: Array.from(currentLineup),
        teamPpp: calculatePpp(scores.team, teamPoss),
        oppPpp: calculatePpp(scores.opp, oppPoss),
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
/**
 * 🏀 CoachBoard: isClutchEvent
 * Why: Defines "Clutch Time" as the final 4 minutes of a game when the score is within 5 points.
 *
 * @param eventPeriod - Period of the event.
 * @param clockTime - Seconds remaining in the period.
 * @param scoreDiff - Absolute difference between team and opponent scores.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 * @returns True if the event occurred in a clutch situation.
 */
export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  const isOT = periodType === "QUARTERS" ? eventPeriod > 4 : eventPeriod > 2;
  const isFinal =
    periodType === "QUARTERS" ? eventPeriod === 4 : eventPeriod === 2;

  const isClutchScore = Math.abs(scoreDiff) <= 5;
  const regulationClutchTime = periodType === "QUARTERS" ? 240 : 120;
  const isClutchTime = isOT || clockTime <= regulationClutchTime;

  return (isFinal || isOT) && isClutchTime && isClutchScore;
};

export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  if (periodType === "QUARTERS") {
    // 🔍 Scout: Overtime periods (5+) are typically grouped with P4 for bonus/team fouls.
    if (currentPeriod === 4) {
      return eventPeriod >= 4;
    }
    return eventPeriod === currentPeriod;
  }

  // HALVES logic
  if (currentPeriod === 1) {
    return eventPeriod === 1;
  }

  // Period 2+ in HALVES includes all subsequent periods (OTs)
  return eventPeriod >= 2;
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
  const scores = { team: 0, opp: 0 };
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    // ⚡ Bolt: Skip deleted events to ensure accuracy and reduce unnecessary processing.
    if (!isActive(stat)) continue;

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
  netRatingPer40: string;
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
      netRatingPer40: "0.0",
    };
    lineupStats.set(key, agg);
  }
  agg.seconds += seconds;
  agg.pointsFor += ptsFor;
  agg.pointsAgainst += ptsAgainst;
};

export const calculateLineupStats = (
  stats: StatEvent[],
  options: {
    isSorted?: boolean;
    periodLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
    key?: string;
    direction?: "asc" | "desc";
  } = {},
): LineupAggregates[] => {
  // ⚡ Bolt: Process events in a single pass to avoid grouping overhead.
  const sortedStats = options.isSorted ? stats : sortStats(stats);
  const lineupStats = new Map<string, LineupAggregates>();
  const periodLen = options.periodLength ? options.periodLength * 60 : 600;

  let currentLineup = new Set<string>();
  // PERFORMANCE: cachedLineupKey avoids expensive Set->Array->Sort->Join operations
  // on every event. The key is only recalculated when a substitution occurs.
  let cachedLineupKey: string | null = null;
  let lastClockTime = periodLen;
  let lastTeamScore = 0;
  let lastOppScore = 0;
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  const scores = { team: 0, opp: 0 };

  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    // ⚡ Bolt: Inline isActive check to reduce function call overhead in hot loop.
    if (s.deletedAt) continue;

    // ⚡ Bolt: Handle multi-game aggregation by detecting game context changes in-stream.
    if (currentGameId !== null && s.gameId !== currentGameId) {
      // 🏀 Boundary Logic: Close the stint for the previous game.
      // WHY: Plus/Minus and minutes should not bleed across different games.
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime, // Assume played until buzzer (0:00)
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }
      currentLineup.clear();
      cachedLineupKey = null; // Invalidate lineup key cache

      lastClockTime = periodLen;
      lastTeamScore = 0;
      lastOppScore = 0;
      currentPeriod = 1;
      scores.team = 0;
      scores.opp = 0;
    }
    currentGameId = s.gameId;

    // Handle period transition
    if (s.period > currentPeriod) {
      // 🏀 Boundary Logic: Close stint for the previous period.
      // WHY: We record the stats accumulated during the period that just ended.
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime, // Time remaining in previous period (usually ends at 0:00)
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );

        // 🔍 Scout: Handle full minutes for skipped periods
        const skippedPeriods = s.period - currentPeriod - 1;
        if (skippedPeriods > 0) {
          recordLineupStint(
            lineupStats,
            cachedLineupKey,
            skippedPeriods * periodLen,
            0,
            0,
          );
        }
      }
      lastClockTime = periodLen;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
      currentPeriod = s.period;
    }

    const isClutch =
      !options.clutchOnly ||
      (s.clockTime !== undefined &&
        isClutchEvent(
          s.period,
          s.clockTime,
          scores.team - scores.opp,
          options.periodType || "QUARTERS",
        ));

    // ⚡ Bolt: Use domain helpers for scoring and opponent identification.
    if (s.type === ACTION_TYPES.MAKE) {
      const pts = s.points || 0;
      if (isOpponentId(s.playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
      }
    }

    // When lineup changes, record stats for the previous lineup
    if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
      if (currentLineup.size === 5 && s.clockTime !== undefined && isClutch) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime - s.clockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }

      if (s.type === ACTION_TYPES.SUB_IN) currentLineup.add(s.playerId);
      else currentLineup.delete(s.playerId);
      cachedLineupKey = null; // Invalidate lineup key cache

      lastClockTime = s.clockTime || 0;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
    }
  }

  // Final stint
  if (currentGameId !== null && currentLineup.size === 5) {
    const liveCtx = options.liveContext;
    const endClock =
      liveCtx && currentGameId === sortedStats[sortedStats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
    recordLineupStint(
      lineupStats,
      cachedLineupKey,
      Math.max(0, lastClockTime - endClock),
      scores.team - lastTeamScore,
      scores.opp - lastOppScore,
    );
  }

  const result = Array.from(lineupStats.values()).map((agg) => {
    const net = agg.pointsFor - agg.pointsAgainst;
    const mins = agg.seconds / 60;
    return {
      ...agg,
      netRating: net,
      netRatingPer40: mins > 0 ? ((net / mins) * 40).toFixed(1) : "0.0",
    };
  });

  const sortKey = options.key || "netRating";
  const sortDir = options.direction || "desc";

  return result.sort((a, b) => {
    const aValue = a[sortKey as keyof typeof a];
    const bValue = b[sortKey as keyof typeof b];

    if (typeof aValue === "string" && typeof bValue === "string") {
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      return sortDir === "desc" ? bNum - aNum : aNum - bNum;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDir === "desc" ? bValue - aValue : aValue - bValue;
    }

    return 0;
  });
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
 * @param options - Optimization flags.
 * @param options.isSorted - Skip sorting if data is already ordered.
 * @returns Map of player IDs to their current streak status ('HOT', 'COLD', or null).
 */
export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  // ⚡ Bolt: Track streaks for all players in a single pass.
  //
  // WHY: Identifying momentum shifts in real-time requires tracking recent performance.
  // By using a Map with a fixed-size buffer (last 3 FGA), we get O(N) performance
  // while keeping memory usage constant regardless of game length.
  //
  // Optimization: Track only the last three actions per player using a fixed-size buffer
  // to reduce memory churn and avoid large array allocations for long games.
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();
  let currentGameId: string | null = null;

  const sorted = options.isSorted ? stats : sortStats(stats);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    // Reset streaks on game change
    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      playerStreaks.clear();
    }

    // We only track streaks for field goal attempts
    if (isScoringEvent(s) || s.type === ACTION_TYPES.MISS) {
      // Skip free throws (points === 1) for field goal streaks
      if (s.points === 1) continue;

      const pId = s.playerId;
      let history = playerStreaks.get(pId);
      if (!history) {
        history = [];
        playerStreaks.set(pId, history);
      }

      history.push(isScoringEvent(s) ? "MAKE" : "MISS");
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
