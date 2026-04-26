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
import { getShotZone } from "./shotZones";
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
  efgPct?: string;
  toPct?: string;
  orbPct?: string;
  ftRate?: string;
  dreb: number;
}

/**
 * Helper to determine the length of a period in seconds.
 * Accounts for shorter overtime periods.
 * @param {number} period - The period number.
 * @param {object} options - Options containing regulation and overtime lengths.
 * @param {number} [options.periodLength] - Regulation period length in minutes.
 * @param {number} [options.overtimeLength] - Overtime period length in minutes.
 * @param {string} [options.periodType] - The format of the game (QUARTERS or HALVES).
 */
const getPeriodLen = (
  period: number,
  options: { periodLength?: number; overtimeLength?: number; periodType?: string },
): number => {
  const regLen = options.periodLength ? options.periodLength * 60 : 600;
  const otLen = options.overtimeLength ? options.overtimeLength * 60 : 300;
  const isOT = options.periodType === "HALVES" ? period > 2 : period > 4;
  return isOT ? otLen : regLen;
};

/**
 * Interface for matchup-based statistics.
 */
export interface MatchupStats {
  ourPlayerId: string;
  opponentPlayerId: string;
  pointsAllowed: number;
  stops: number;
  possessions: number;
  stopPct: string;
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
  efgPct?: string;
  toPct?: string;
  orbPct?: string;
  ftRate?: string;
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
export const calcPct = (numerator: number, denominator: number): string => {
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
 * @param {object} counters - The counters to update.
 * @param {number} counters.fga - Field goal attempts.
 * @param {number} counters.fta - Free throw attempts.
 * @param {number} counters.to - Turnovers.
 * @param {number} counters.oreb - Offensive rebounds.
 */
const updatePossessionCounters = (
  stat: StatEvent,
  counters: {
    fga: number;
    fta: number;
    to: number;
    oreb: number;
  },
) => {
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
 * WHY: Calculating minutes played (MIN) and plus-minus in a multi-period,
 * multi-game context requires tracking the *intervals* between events.
 * This function uses a "clock-interval" approach where it credits active
 * players with minutes for the time elapsed between the current and
 * previous event. This ensures accuracy even when events are sparse
 * or periods end abruptly.
 *
 * @param {Player[]} players - List of player objects.
 * @param {StatEvent[]} stats - List of statistical events to process.
 * @param {TeamPlayer[]} teamPlayers - (Optional) Team roster for jersey numbers.
 * @param {"total" | "average"} viewType - (Optional) Type of calculation, defaults to "total".
 * @param {object} [options] - Aggregation options.
 * @param {boolean} [options.isSorted] - Whether the input stats are already sorted.
 * @param {number} [options.periodLength] - Regulation period length in minutes.
 * @param {number} [options.overtimeLength] - Overtime period length in minutes.
 * @param {object} [options.liveContext] - Current game state for live minutes.
 * @param {number} options.liveContext.clockTime - Remaining seconds in the period.
 * @param {number} options.liveContext.period - The current period.
 * @param {boolean} [options.clutchOnly] - Whether to only include clutch-time stats.
 * @param {string} [options.periodType] - The format of the game (QUARTERS or HALVES).
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
    overtimeLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
  } = {},
): PlayerAggregates[] => {
  const statsMap = initializeStatsMap(players, teamPlayers);

  // Track player stints for MIN and plus-minus
  const activeStints = new Map<
    string,
    {
      startClock: number;
      startScoreDiff: number;
      lastGameId: string;
      lastPeriod: number;
    }
  >();
  // ⚡ Bolt: Use pre-sorted stats or sort them if needed.
  const sortedStats = options.isSorted ? stats : sortStats(stats);

  const scores = { team: 0, opp: 0 };
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  let lastClockTime = getPeriodLen(1, options);
  let lastScoreDiff = 0;
  const activePlayers = new Set<string>();

  // ⚡ Bolt: Cache last gameId per player to avoid redundant Set.add overhead.
  const lastGameIdMap = new Map<string, string>();

  // Accumulate statistics from event stream
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    // ⚡ Bolt: Inline isActive check to reduce function call overhead in hot loop.
    if (stat.deletedAt) continue;

    const { playerId, type, clockTime, period, gameId } = stat;

    // Handle new game context
    if (gameId !== currentGameId) {
      // Record final minutes for previous game
      for (const pId of activePlayers) {
        const clutchSecs = getClutchSeconds(
          currentPeriod,
          lastClockTime,
          0,
          lastScoreDiff,
          options.periodType || "QUARTERS",
        );
        const pAgg = statsMap.get(pId);
        if (pAgg) pAgg.min += options.clutchOnly ? clutchSecs : lastClockTime;
      }
      activePlayers.clear();
      lastGameIdMap.clear();
      scores.team = 0;
      scores.opp = 0;
      currentPeriod = 1;
      currentGameId = gameId;
      lastClockTime = getPeriodLen(1, options);
      lastScoreDiff = 0;
    }

    // 🏀 CoachBoard: Handle period transitions for active stints
    if (period && period > currentPeriod) {
      for (const pId of activePlayers) {
        const clutchSecs = getClutchSeconds(
          currentPeriod,
          lastClockTime,
          0,
          lastScoreDiff,
          options.periodType || "QUARTERS",
        );
        const pAgg = statsMap.get(pId);
        if (pAgg) pAgg.min += options.clutchOnly ? clutchSecs : lastClockTime;

        // 🔍 Scout: Handle full minutes for skipped periods
        for (let p = currentPeriod + 1; p < period; p++) {
          if (pAgg) {
            const skipClutchSecs = getClutchSeconds(
              p,
              getPeriodLen(p, options),
              0,
              lastScoreDiff,
              options.periodType || "QUARTERS",
            );
            pAgg.min += options.clutchOnly ? skipClutchSecs : getPeriodLen(p, options);
          }
        }
      }
      currentPeriod = period;
      lastClockTime = getPeriodLen(period, options);
    }

    // Accumulate minutes for interval since last event
    if (clockTime !== undefined) {
      const clutchSecs = getClutchSeconds(
        period,
        lastClockTime,
        clockTime,
        lastScoreDiff,
        options.periodType || "QUARTERS",
      );
      for (const pId of activePlayers) {
        const pAgg = statsMap.get(pId);
        if (pAgg) {
          pAgg.min += options.clutchOnly ? clutchSecs : (lastClockTime - clockTime);
        }
      }
      lastClockTime = clockTime;
    }

    // Determine if current event is clutch
    const isClutch =
      !options.clutchOnly ||
      (clockTime !== undefined &&
        isClutchEvent(
          period,
          clockTime,
          scores.team - scores.opp,
          options.periodType || "QUARTERS",
        ));

    // Update plus-minus and scores
    if (type === ACTION_TYPES.MAKE) {
      const pts = stat.points || 0;
      const isOpp = isOpponentId(playerId);
      const diffChange = isOpp ? -pts : pts;

      if (isClutch) {
        for (const pId of activePlayers) {
          const pAgg = statsMap.get(pId);
          if (pAgg) pAgg.plusMinus += diffChange;
        }
      }

      if (isOpp) scores.opp += pts; else scores.team += pts;
      lastScoreDiff = scores.team - scores.opp;
    }

    // ⚡ Bolt: Cache statsMap lookups to avoid redundant Map access in the hot loop.
    const player = statsMap.get(playerId);
    if (player && isClutch) {
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

    // Handle Sub-In/Sub-Out
    if (type === ACTION_TYPES.SUB_IN) {
      activePlayers.add(playerId);
    } else if (type === ACTION_TYPES.SUB_OUT) {
      activePlayers.delete(playerId);
    }
  }

  // Handle players still on court at end of game
  const liveCtx = options.liveContext;
  const finalClock =
    liveCtx && sortedStats[sortedStats.length - 1]?.gameId === currentGameId
      ? liveCtx.clockTime
      : 0;

  for (const pId of activePlayers) {
    const clutchSecs = getClutchSeconds(
      currentPeriod,
      lastClockTime,
      finalClock,
      lastScoreDiff,
      options.periodType || "QUARTERS",
    );
    const pAgg = statsMap.get(pId);
    if (pAgg) pAgg.min += options.clutchOnly ? clutchSecs : (lastClockTime - finalClock);
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
 * Interface for a player's stint on the court.
 */
export interface PlayerStint {
  playerId: string;
  period: number;
  startClock: number; // Seconds remaining in period at start of stint
  endClock: number; // Seconds remaining in period at end of stint
}

/**
 * 🏀 CoachBoard: calculatePlayerStintTimeline
 *
 * WHY: Visualizing when players were on the court helps identify rotation
 * patterns and fatigue.
 *
 * @param {StatEvent[]} stats - Chronological list of statistical events for a SINGLE game.
 * @param {object} [options] - Configuration for period length and live context.
 * @param {number} [options.periodLength] - Regulation period length in minutes.
 * @param {number} [options.overtimeLength] - Overtime period length in minutes.
 * @param {string} [options.periodType] - The format of the game (QUARTERS or HALVES).
 * @param {object} [options.liveContext] - Current game state for live tracking.
 * @param {number} options.liveContext.clockTime - Remaining seconds in the period.
 * @param {number} options.liveContext.period - The current period.
 * @returns {PlayerStint[]} Array of stint records for all tracked players.
 */
export const calculatePlayerStintTimeline = (
  stats: StatEvent[],
  options: {
    periodLength?: number;
    overtimeLength?: number;
    periodType?: string;
    liveContext?: { clockTime: number; period: number };
  } = {},
): PlayerStint[] => {
  const sorted = sortStats(stats);
  const stints: PlayerStint[] = [];
  const activeStints = new Map<string, { startClock: number; period: number }>();

  let currentPeriod = 1;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    const { playerId, type, clockTime, period } = s;

    // Handle period boundaries for active players
    if (period > currentPeriod) {
      for (const [pId, info] of activeStints.entries()) {
        // End stint at 0:00 of the period it started in (or subsequent ones)
        // For simplicity, we create one stint record per period the player is on for.
        stints.push({
          playerId: pId,
          period: currentPeriod,
          startClock: info.startClock,
          endClock: 0,
        });

        // 🔍 Scout: Handle full minutes for skipped periods
        for (let p = currentPeriod + 1; p < period; p++) {
          stints.push({
            playerId: pId,
            period: p,
            startClock: getPeriodLen(p, options),
            endClock: 0,
          });
        }

        // Reset info for the current period
        info.startClock = getPeriodLen(period, options);
        info.period = period;
      }
      currentPeriod = period;
    }

    if (type === ACTION_TYPES.SUB_IN && clockTime !== undefined) {
      activeStints.set(playerId, { startClock: clockTime, period });
    } else if (type === ACTION_TYPES.SUB_OUT && clockTime !== undefined) {
      const info = activeStints.get(playerId);
      if (info) {
        stints.push({
          playerId,
          period,
          startClock: info.startClock,
          endClock: clockTime,
        });
        activeStints.delete(playerId);
      }
    }
  }

  // Handle players still on court
  const liveCtx = options.liveContext;
  for (const [pId, info] of activeStints.entries()) {
    const endClock = liveCtx && liveCtx.period === info.period ? liveCtx.clockTime : 0;
    stints.push({
      playerId: pId,
      period: info.period,
      startClock: info.startClock,
      endClock,
    });
  }

  return stints;
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
    agg.efgPct = calculateEfgPct(agg.makes, agg.threePM, agg.attempts);
    agg.toPct = calcPct(agg.turnovers, possessions);
    agg.orbPct = "0.0"; // Individual ORB% requires context of all game missed shots
    agg.ftRate = calcPct(agg.ftm, agg.attempts);
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
      oreb: number;
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
        oreb: 0,
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
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      play.oreb = (play.oreb || 0) + 1;
    }
  }

  return Object.entries(data)
    .map(([name, s]) => {
      const possessions = calculatePossessions(
        s.attempts,
        s.fta,
        s.turnovers,
        s.oreb || 0,
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
 * Interface for defensive scheme efficiency.
 */
export interface SchemeEfficiency {
  scheme: string;
  possessions: number;
  pointsAllowed: number;
  ppp: string;
}

/**
 * 🏀 Playbook: calculateSchemeEfficiency
 * Tracks Points Allowed per Possession for each defensive scheme.
 *
 * @param stats - Chronological list of statistical events for the game.
 * @returns Array of efficiency metrics per scheme.
 */
export const calculateSchemeEfficiency = (
  stats: StatEvent[],
): SchemeEfficiency[] => {
  const data: Record<
    string,
    {
      points: number;
      attempts: number;
      fta: number;
      turnovers: number;
      oreb: number;
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.defensiveScheme || !isOpponentId(s.playerId))
      continue;

    if (!data[s.defensiveScheme]) {
      data[s.defensiveScheme] = {
        points: 0,
        attempts: 0,
        fta: 0,
        turnovers: 0,
        oreb: 0,
      };
    }

    const scheme = data[s.defensiveScheme];
    if (s.type === ACTION_TYPES.MAKE) {
      scheme.points += s.points || 0;
      if (s.points === 1) {
        scheme.fta++;
      } else {
        scheme.attempts++;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) {
        scheme.fta++;
      } else {
        scheme.attempts++;
      }
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      scheme.turnovers++;
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      scheme.oreb++;
    }
  }

  return Object.entries(data).map(([scheme, s]) => {
    const possessions = calculatePossessions(
      s.attempts,
      s.fta,
      s.turnovers,
      s.oreb,
    );
    return {
      scheme,
      possessions,
      pointsAllowed: s.points,
      ppp: calculatePpp(s.points, possessions),
    };
  });
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
 * Interface for a scoring run.
 */
export interface ScoringRun {
  team: "TEAM" | "OPPONENT";
  points: number;
  startClock: number;
  endClock: number;
  period: number;
  startTime: string; // Clock formatted
  endTime: string;
}

/**
 * 🏀 CoachBoard: calculateScoringRuns
 *
 * WHY: Scoring runs (e.g., 8-0) are high-impact game moments. Visualizing
 * them helps coaches see which lineups were on the floor during momentum shifts.
 *
 * @param stats - Chronological list of events for a SINGLE game.
 * @returns Array of scoring runs >= 8 points.
 */
export const calculateScoringRuns = (stats: StatEvent[]): ScoringRun[] => {
  const sorted = sortStats(stats);
  const runs: ScoringRun[] = [];

  let currentRunTeam: "TEAM" | "OPPONENT" | null = null;
  let currentRunPoints = 0;
  let runStartEvent: StatEvent | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s) || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp = isOpponentId(s.playerId);
    const team = isOpp ? "OPPONENT" : "TEAM";
    const points = s.points || 0;

    if (currentRunTeam === team) {
      currentRunPoints += points;
    } else {
      // If previous run was significant, record it
      if (currentRunTeam && currentRunPoints >= 8 && runStartEvent) {
        const lastMake = sorted
          .slice(0, i)
          .reverse()
          .find((es) => isActive(es) && es.type === ACTION_TYPES.MAKE);
        if (lastMake) {
          runs.push({
            team: currentRunTeam,
            points: currentRunPoints,
            period: runStartEvent.period,
            startClock: runStartEvent.clockTime || 0,
            endClock: lastMake.clockTime || 0,
            startTime: formatClock(runStartEvent.clockTime || 0),
            endTime: formatClock(lastMake.clockTime || 0),
          });
        }
      }
      // Start new run
      currentRunTeam = team;
      currentRunPoints = points;
      runStartEvent = s;
    }
  }

  // Final check
  if (currentRunTeam && currentRunPoints >= 8 && runStartEvent) {
    const lastMake = sorted
      .slice()
      .reverse()
      .find((es) => isActive(es) && es.type === ACTION_TYPES.MAKE);
    if (lastMake) {
      runs.push({
        team: currentRunTeam,
        points: currentRunPoints,
        period: runStartEvent.period,
        startClock: runStartEvent.clockTime || 0,
        endClock: lastMake.clockTime || 0,
        startTime: formatClock(runStartEvent.clockTime || 0),
        endTime: formatClock(lastMake.clockTime || 0),
      });
    }
  }

  return runs;
};

/**
 * Interface for opponent tendencies.
 */
export interface OpponentTendency {
  paintPct: string;
  catchAndShootPct: string;
  offDribblePct: string;
}

/**
 * 🏀 CoachBoard: calculateOpponentTendencies
 *
 * WHY: Identifying how an opponent scores allows for real-time defensive adjustments.
 *
 * @param stats - Chronological list of events for the game.
 * @returns Object containing tendency percentages.
 */
export const calculateOpponentTendencies = (
  stats: StatEvent[],
): OpponentTendency => {
  let paintAttempts = 0;
  let totalFieldGoalAttempts = 0;
  let catchAndShootAttempts = 0;
  let offDribbleAttempts = 0;
  let totalTaggedAttempts = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;
    if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS) continue;
    if (isFreeThrow(s)) continue;

    totalFieldGoalAttempts++;
    if (detectShotValueFromCoords(s.locationX || 0, s.locationY || 0) === 2) {
      // Simplistic paint check - in a real app we would check the exact zone
      const zone = getShotZone(s.locationX || 0, s.locationY || 0);
      if (zone === "PAINT") paintAttempts++;
    }

    if (s.shotType === "CATCH") {
      catchAndShootAttempts++;
      totalTaggedAttempts++;
    } else if (s.shotType === "DRIB") {
      offDribbleAttempts++;
      totalTaggedAttempts++;
    }
  }

  return {
    paintPct:
      totalFieldGoalAttempts > 0
        ? ((paintAttempts / totalFieldGoalAttempts) * 100).toFixed(1)
        : "0.0",
    catchAndShootPct:
      totalTaggedAttempts > 0
        ? ((catchAndShootAttempts / totalTaggedAttempts) * 100).toFixed(1)
        : "0.0",
    offDribblePct:
      totalTaggedAttempts > 0
        ? ((offDribbleAttempts / totalTaggedAttempts) * 100).toFixed(1)
        : "0.0",
  };
};

/**
 * Detects shot value (2 or 3) from coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 * Center of the arc is at (250, 140) with a radius of 220.
 */
export const detectShotValueFromCoords = (x: number, y: number): number => {
  const svgX = x * 5;
  const svgY = y * 4.7;
  if (svgY <= 140) {
    if (svgX <= 30 || svgX >= 470) return 3;
  } else {
    // ⚡ Bolt: Use squared distance to avoid expensive Math.sqrt() calls.
    const distSq = Math.pow(svgX - 250, 2) + Math.pow(svgY - 140, 2);
    if (distSq >= 48400) return 3; // 220^2 = 48400
  }
  return 2;
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
 * IMPLEMENTATION NOTE: This function employs a state-machine approach to process
 * the event stream in a single linear pass (O(N)). It accurately identifies
 * possession terminators (scores, turnovers, rebounds) to determine when a
 * stop is earned. This avoids the complexity and performance overhead of
 * nested "look-ahead" loops while robustly handling edge cases like multiple
 * misses within a single possession.
 *
 * TERMINATORS:
 * - STOP: Earned on Opponent Turnover or Opponent Miss followed by Team Defensive Rebound.
 * - RESET: Streak breaks on Opponent Score or Team Defensive/Technical Foul.
 * - CONTINUE: Possession continues on Opponent Offensive Rebound.
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
   *
   * STATE VARIABLES:
   * - inOpponentPossession: Tracks if the opponent is currently in an active
   *   possession where they have already missed a shot. This prevents awarding
   *   multiple stops for multiple misses in the same possession.
   * - isOurPossession: Tracks which team currently holds the ball. This is
   *   critical for distinguishing between offensive and defensive fouls, as
   *   only defensive fouls (committed while opponent has ball) break the streak.
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
    if (isFoulAction(s)) {
      if (!isOpp) {
        // 🔍 Scout: Only reset streak if we are on defense (or if it's a technical foul)
        // Offensive fouls do not break a defensive stop streak.
        if (!isOurPossession || s.type === ACTION_TYPES.TECHNICAL_FOUL) {
          currentStreak = 0;
        }
      } else {
        // 🔍 Scout: Opponent offensive fouls (committed while they are in possession)
        // are effectively turnovers and count as stops.
        if (!isOurPossession && s.type !== ACTION_TYPES.TECHNICAL_FOUL) {
          totalStops++;
          currentStreak++;
          inOpponentPossession = false;
          isOurPossession = true;
        }
      }
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

  const team = { pts: 0, reb: 0, ast: 0, fga: 0, fta: 0, to: 0, oreb: 0, dreb: 0, makes: 0, threePM: 0, ftm: 0 };
  const opp = { pts: 0, fga: 0, fta: 0, to: 0, oreb: 0, dreb: 0, makes: 0, threePM: 0, ftm: 0 };

  // ⚡ Bolt: One-slot cache for game totals lookup.
  // WHY: Events are usually grouped by gameId. Caching the last lookup
  // avoids redundant Map.get() calls in the hot event loop.
  let lastGameId: string | null = null;
  let cachedTotals: { team: number; opp: number } | undefined;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const gameId = stat.gameId;
    let totals: { team: number; opp: number } | undefined;

    if (gameId === lastGameId) {
      totals = cachedTotals;
    } else {
      totals = gameTotals.get(gameId);
      lastGameId = gameId;
      cachedTotals = totals;
    }
    if (!totals) continue;

    const isOpponent = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    if (stat.type === ACTION_TYPES.MAKE) {
      if (isOpponent) {
        totals.opp += pts;
        opp.pts += pts;
        if (isFreeThrow(stat)) {
          opp.ftm++;
        } else {
          opp.makes++;
          if (stat.points === 3) opp.threePM++;
        }
      } else {
        totals.team += pts;
        team.pts += pts;
        if (isFreeThrow(stat)) {
          team.ftm++;
        } else {
          team.makes++;
          if (stat.points === 3) team.threePM++;
        }
      }
    }

    updatePossessionCounters(stat, isOpponent ? opp : team);

    if (isOpponent) {
      if (stat.type === ACTION_TYPES.DEF_REBOUND || stat.type === ACTION_TYPES.REBOUND) {
        opp.dreb++;
      }
    } else {
      if (stat.type === ACTION_TYPES.DEF_REBOUND || stat.type === ACTION_TYPES.REBOUND) {
        team.dreb++;
      }
      if (
        stat.type === ACTION_TYPES.OFF_REBOUND ||
        stat.type === ACTION_TYPES.REBOUND ||
        stat.type === ACTION_TYPES.DEF_REBOUND
      ) {
        team.reb++;
      } else if (stat.type === ACTION_TYPES.ASSIST) {
        team.ast++;
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
    team.fga,
    team.fta,
    team.to,
    team.oreb,
  );
  const totalOppPossessions = calculatePossessions(
    opp.fga,
    opp.fta,
    opp.to,
    opp.oreb,
  );

  return {
    ppg: formatToOne(team.pts / gp),
    rpg: formatToOne(team.reb / gp),
    apg: formatToOne(team.ast / gp),
    oppg: formatToOne(opp.pts / gp),
    record: draws > 0 ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`,
    totalGames: targetCount,
    ppp: calculatePpp(team.pts, totalPossessions),
    possessions: Math.round(totalPossessions),
    oppPpp: calculatePpp(opp.pts, totalOppPossessions),
    efgPct: calculateEfgPct(team.makes, team.threePM || 0, team.fga),
    toPct: calcPct(team.to, totalPossessions),
    orbPct: calcPct(team.oreb, team.oreb + opp.dreb),
    ftRate: calcPct(team.ftm || 0, team.fga),
    dreb: team.dreb,
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
    efgPct: calculateEfgPct(agg.makes, agg.threePM, agg.attempts),
    toPct: calcPct(agg.turnovers, possessions),
    orbPct: "0.0", // Individual opponent ORB% not supported without team context
    ftRate: calcPct(agg.ftm, agg.attempts),
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
  const team = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const opp = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const currentLineup = new Set<string>();
  // ⚡ Bolt: Cached lineup array avoids redundant Array.from calls in the hot loop.
  let cachedLineup: string[] = [];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const isOpp = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    // Track scores
    updateScores(stat, scores);

    // Track possessions
    updatePossessionCounters(stat, isOpp ? opp : team);

    if (stat.type === ACTION_TYPES.SUB_IN) {
      currentLineup.add(stat.playerId);
      cachedLineup = Array.from(currentLineup);
    } else if (stat.type === ACTION_TYPES.SUB_OUT) {
      currentLineup.delete(stat.playerId);
      cachedLineup = Array.from(currentLineup);
    }

    // Capture point if it's a significant event for the chart
    if (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.TIMEOUT) {
      const period = stat.period || 1;
      const clockTime = stat.clockTime ?? periodLenSecs;
      const elapsedSeconds =
        (period - 1) * periodLenSecs + (periodLenSecs - clockTime);

      const teamPoss = calculatePossessions(
        team.fga,
        team.fta,
        team.to,
        team.oreb,
      );
      const oppPoss = calculatePossessions(opp.fga, opp.fta, opp.to, opp.oreb);

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
        lineup: cachedLineup,
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

/**
 * 🔍 Scout: Calculates how many seconds of an interval [startClock, endClock]
 * are considered "clutch time".
 */
export const getClutchSeconds = (
  period: number,
  startClock: number,
  endClock: number,
  scoreDiff: number,
  periodType: string,
): number => {
  if (Math.abs(scoreDiff) > 5) return 0;
  const isOT = periodType === "QUARTERS" ? period > 4 : period > 2;
  const isFinal = periodType === "QUARTERS" ? period === 4 : period === 2;
  if (isOT) return Math.max(0, startClock - endClock);
  if (!isFinal) return 0;

  const regClutchTime = periodType === "QUARTERS" ? 240 : 120;
  const s = Math.min(startClock, regClutchTime);
  const e = Math.min(endClock, regClutchTime);
  return Math.max(0, s - e);
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

  // Period 2 in HALVES includes all subsequent periods (OTs)
  if (currentPeriod === 2) {
    return eventPeriod >= 2;
  }

  return eventPeriod === currentPeriod;
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
 * Interface for matchup-based statistics.
 */
export interface MatchupStats {
  ourPlayerId: string;
  opponentPlayerId: string;
  pointsAllowed: number;
  stops: number;
  possessions: number;
  stopPct: string;
}

/**
 * Interface for On/Off impact metrics.
 */
export interface OnOffImpact {
  playerId: string;
  onPointsFor: number;
  onPointsAgainst: number;
  onPossessions: number;
  onOffensiveRating: string;
  onDefensiveRating: string;
  onNetRating: string;
  offPointsFor: number;
  offPointsAgainst: number;
  offPossessions: number;
  offOffensiveRating: string;
  offDefensiveRating: string;
  offNetRating: string;
  netDifferential: string;
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
    overtimeLength?: number;
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

  let currentLineup = new Set<string>();
  // PERFORMANCE: cachedLineupKey avoids expensive Set->Array->Sort->Join operations
  // on every event. The key is only recalculated when a substitution occurs.
  let cachedLineupKey: string | null = null;
  let lastClockTime = getPeriodLen(1, options);
  let lastScoreDiff = 0;
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
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        const clutchSecs = getClutchSeconds(
          currentPeriod,
          lastClockTime,
          0,
          lastScoreDiff,
          options.periodType || "QUARTERS",
        );
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          options.clutchOnly ? clutchSecs : lastClockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }
      currentLineup.clear();
      cachedLineupKey = null;
      lastClockTime = getPeriodLen(1, options);
      lastScoreDiff = 0;
      lastTeamScore = 0;
      lastOppScore = 0;
      currentPeriod = 1;
      scores.team = 0;
      scores.opp = 0;
    }
    currentGameId = s.gameId;

    // Handle period transition
    if (s.period > currentPeriod) {
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        const clutchSecs = getClutchSeconds(
          currentPeriod,
          lastClockTime,
          0,
          lastScoreDiff,
          options.periodType || "QUARTERS",
        );
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          options.clutchOnly ? clutchSecs : lastClockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );

        // 🔍 Scout: Handle full minutes for skipped periods
        for (let p = currentPeriod + 1; p < s.period; p++) {
          const skipClutchSecs = getClutchSeconds(
            p,
            getPeriodLen(p, options),
            0,
            lastScoreDiff,
            options.periodType || "QUARTERS",
          );
          recordLineupStint(
            lineupStats,
            cachedLineupKey,
            options.clutchOnly ? skipClutchSecs : getPeriodLen(p, options),
            0,
            0,
          );
        }
      }
      lastClockTime = getPeriodLen(s.period, options);
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
      currentPeriod = s.period;
    }

    // Accumulate interval stats
    if (s.clockTime !== undefined && currentLineup.size === 5) {
      const clutchSecs = getClutchSeconds(
        s.period,
        lastClockTime,
        s.clockTime,
        lastScoreDiff,
        options.periodType || "QUARTERS",
      );
      if (!options.clutchOnly || clutchSecs > 0) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          options.clutchOnly ? clutchSecs : (lastClockTime - s.clockTime),
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }
      lastClockTime = s.clockTime;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
    }

    // Determine if current event is clutch
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
      lastScoreDiff = scores.team - scores.opp;
    }

    // When lineup changes
    if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
      if (s.type === ACTION_TYPES.SUB_IN) currentLineup.add(s.playerId);
      else currentLineup.delete(s.playerId);
      cachedLineupKey = null;
    }
  }

  // Final stint
  if (currentGameId !== null && currentLineup.size === 5) {
    const liveCtx = options.liveContext;
    const finalClock =
      liveCtx && currentGameId === sortedStats[sortedStats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    const clutchSecs = getClutchSeconds(
      currentPeriod,
      lastClockTime,
      finalClock,
      lastScoreDiff,
      options.periodType || "QUARTERS",
    );
    if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
    recordLineupStint(
      lineupStats,
      cachedLineupKey,
      options.clutchOnly ? clutchSecs : Math.max(0, lastClockTime - finalClock),
      scores.team - lastTeamScore,
      scores.opp - lastOppScore,
    );
  }

  const sortKey = (options.key || "netRating") as keyof LineupAggregates;
  const sortDir = options.direction || "desc";

  const result = Array.from(lineupStats.values()).map((agg) => {
    const net = agg.pointsFor - agg.pointsAgainst;
    const mins = agg.seconds / 60;
    const netRatingPer40Str = mins > 0 ? ((net / mins) * 40).toFixed(1) : "0.0";

    // ⚡ Bolt: Pre-calculate numeric sort value to avoid expensive calculations
    // and parseFloat calls in the hot .sort() comparator ($O(N log N)$).
    let sortValue: number;
    if (sortKey === "netRatingPer40") {
      sortValue = mins > 0 ? (net / mins) * 40 : 0;
    } else if (sortKey === "netRating") {
      sortValue = net;
    } else {
      const val = agg[sortKey];
      sortValue = typeof val === "number" ? val : 0;
    }

    return {
      ...agg,
      netRating: net,
      netRatingPer40: netRatingPer40Str,
      sortValue,
    };
  });

  return result
    .sort((a, b) =>
      sortDir === "desc" ? b.sortValue - a.sortValue : a.sortValue - b.sortValue,
    )
    .map(({ sortValue, ...rest }) => rest);
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
/**
 * 🏀 CoachBoard: calculateMatchupStats
 *
 * WHY: Tracks defensive performance by correlating opponent scoring and turnovers
 * with the assigned primary defender.
 *
 * @param stats - Chronological list of statistical events.
 * @returns Array of matchup statistics.
 */
export const calculateMatchupStats = (stats: StatEvent[]): MatchupStats[] => {
  const sorted = sortStats(stats);
  const currentMatchups = new Map<string, string>(); // Opponent ID -> Our Player ID
  const results = new Map<string, MatchupStats>(); // "ourId:oppId" -> stats

  let inOpponentPossession = false;
  let opponentPossessionPlayerId: string | null = null;
  let currentGameId: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentMatchups.clear();
      inOpponentPossession = false;
    }

    const isOpp = isOpponentId(s.playerId);
    const type = s.type;

    if (type === ACTION_TYPES.MATCHUP) {
      if (s.relatedPlayerId) {
        currentMatchups.set(s.playerId, s.relatedPlayerId);
      } else {
        currentMatchups.delete(s.playerId);
      }
      continue;
    }

    const defenderId =
      currentMatchups.get(s.playerId) ||
      currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);

    if (isOpp && isScoringEvent(s)) {
      if (defenderId) {
        const key = `${defenderId}:${s.playerId}`;
        let m = results.get(key);
        if (!m) {
          m = {
            ourPlayerId: defenderId,
            opponentPlayerId: s.playerId,
            pointsAllowed: 0,
            stops: 0,
            possessions: 0,
            stopPct: "0.0",
          };
          results.set(key, m);
        }
        m.pointsAllowed += s.points || 0;
        m.possessions++;
      }
      inOpponentPossession = false;
      continue;
    }

    // Stop logic
    if (isOpp && s.type === ACTION_TYPES.TURNOVER) {
      if (defenderId) {
        const key = `${defenderId}:${s.playerId}`;
        let m = results.get(key);
        if (!m) {
          m = {
            ourPlayerId: defenderId,
            opponentPlayerId: s.playerId,
            pointsAllowed: 0,
            stops: 0,
            possessions: 0,
            stopPct: "0.0",
          };
          results.set(key, m);
        }
        m.stops++;
        m.possessions++;
      }
      inOpponentPossession = false;
    } else if (isOpp && s.type === ACTION_TYPES.MISS) {
      inOpponentPossession = true;
      opponentPossessionPlayerId = s.playerId;
    } else if (
      inOpponentPossession &&
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    ) {
      const oppId = opponentPossessionPlayerId!;
      const defId =
        currentMatchups.get(oppId) ||
        currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);
      if (defId) {
        const key = `${defId}:${oppId}`;
        let m = results.get(key);
        if (!m) {
          m = {
            ourPlayerId: defId,
            opponentPlayerId: oppId,
            pointsAllowed: 0,
            stops: 0,
            possessions: 0,
            stopPct: "0.0",
          };
          results.set(key, m);
        }
        m.stops++;
        m.possessions++;
      }
      inOpponentPossession = false;
    } else if (
      inOpponentPossession &&
      isOpp &&
      s.type === ACTION_TYPES.OFF_REBOUND
    ) {
      // Possession continues
    }
  }

  // Finalize stop percentages
  return Array.from(results.values()).map((m) => ({
    ...m,
    stopPct: m.possessions > 0 ? ((m.stops / m.possessions) * 100).toFixed(1) : "0.0",
  }));
};

/**
 * 🏀 CoachBoard: calculateOnOffStats
 *
 * WHY: Measures a player's impact by comparing team performance when they
 * are on the court versus on the bench.
 *
 * METHODOLOGY:
 * Uses the "OFF-as-Difference" optimization. Instead of checking every player
 * for every event (O(N*P)), we track global totals once and subtract a player's
 * "ON" stats from the "Total" to derive their "OFF" performance.
 *
 * @param players - List of players.
 * @param stats - Chronological list of statistical events.
 * @returns Array of On/Off impact statistics.
 */
export const calculateOnOffStats = (
  players: Player[],
  stats: StatEvent[],
): OnOffImpact[] => {
  const sorted = sortStats(stats);
  const results = new Map<string, {
    onPtsFor: number; onPtsAgn: number;
    onTeamFga: number; onTeamFta: number; onTeamTo: number; onTeamOreb: number;
    onOppFga: number; onOppFta: number; onOppTo: number; onOppOreb: number;
    offPtsFor: number; offPtsAgn: number;
    offTeamFga: number; offTeamFta: number; offTeamTo: number; offTeamOreb: number;
    offOppFga: number; offOppFta: number; offOppTo: number; offOppOreb: number;
  }>();

  // Initialize
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p.id) continue;
    results.set(p.id.toString(), {
      onPtsFor: 0, onPtsAgn: 0,
      onTeamFga: 0, onTeamFta: 0, onTeamTo: 0, onTeamOreb: 0,
      onOppFga: 0, onOppFta: 0, onOppTo: 0, onOppOreb: 0,
      offPtsFor: 0, offPtsAgn: 0,
      offTeamFga: 0, offTeamFta: 0, offTeamTo: 0, offTeamOreb: 0,
      offOppFga: 0, offOppFta: 0, offOppTo: 0, offOppOreb: 0
    });
  }

  const activePlayers = new Set<string>();
  let currentGameId: string | null = null;

  // ⚡ Bolt: $O(N+P)$ Optimization via "OFF-as-Difference"
  //
  // WHY: A naive "OFF" calculation would require checking every player against
  // every event ($O(N \times P)$). Instead, we track global totals for all events
  // in the game once. Any stat for a player while they are "OFF" the court is
  // mathematically equivalent to (Total Game Stat - Player ON Stat).
  //
  // PERFORMANCE: This reduces complexity to a single pass through events ($O(N)$)
  // plus a single pass through players ($O(P)$), ensuring rapid calculation
  // even for large multi-game datasets or rosters.
  const totals = {
    ptsFor: 0, ptsAgn: 0,
    teamFga: 0, teamFta: 0, teamTo: 0, teamOreb: 0,
    oppFga: 0, oppFta: 0, oppTo: 0, oppOreb: 0
  };

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      activePlayers.clear();
    }

    if (s.type === ACTION_TYPES.SUB_IN) {
      activePlayers.add(s.playerId);
      continue;
    } else if (s.type === ACTION_TYPES.SUB_OUT) {
      activePlayers.delete(s.playerId);
      continue;
    }

    const isOpp = isOpponentId(s.playerId);
    const pts = s.points || 0;

    // Update global totals
    if (s.type === ACTION_TYPES.MAKE) {
      if (isOpp) totals.ptsAgn += pts;
      else totals.ptsFor += pts;
    }

    if (isOpp) {
      if (isFieldGoal(s)) totals.oppFga++;
      else if (isFreeThrow(s)) totals.oppFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) totals.oppTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) totals.oppOreb++;
    } else {
      if (isFieldGoal(s)) totals.teamFga++;
      else if (isFreeThrow(s)) totals.teamFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) totals.teamTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) totals.teamOreb++;
    }

    // Update ON stats for active players
    for (const pId of activePlayers) {
      const agg = results.get(pId);
      if (!agg) continue;

      if (s.type === ACTION_TYPES.MAKE) {
        if (isOpp) agg.onPtsAgn += pts;
        else agg.onPtsFor += pts;
      }
      if (isOpp) {
        if (isFieldGoal(s)) agg.onOppFga++;
        else if (isFreeThrow(s)) agg.onOppFta++;
        else if (s.type === ACTION_TYPES.TURNOVER) agg.onOppTo++;
        else if (s.type === ACTION_TYPES.OFF_REBOUND) agg.onOppOreb++;
      } else {
        if (isFieldGoal(s)) agg.onTeamFga++;
        else if (isFreeThrow(s)) agg.onTeamFta++;
        else if (s.type === ACTION_TYPES.TURNOVER) agg.onTeamTo++;
        else if (s.type === ACTION_TYPES.OFF_REBOUND) agg.onTeamOreb++;
      }
    }
  }

  return Array.from(results.entries()).map(([pId, agg]) => {
    // ⚡ Bolt: Derive OFF stats: Total - ON
    // This is mathematically guaranteed to be accurate and significantly
    // faster than tracking OFF state during the event loop.
    const offPtsFor = totals.ptsFor - agg.onPtsFor;
    const offPtsAgn = totals.ptsAgn - agg.onPtsAgn;
    const offTeamFga = totals.teamFga - agg.onTeamFga;
    const offTeamFta = totals.teamFta - agg.onTeamFta;
    const offTeamTo = totals.teamTo - agg.onTeamTo;
    const offTeamOreb = totals.teamOreb - agg.onTeamOreb;
    const offOppFga = totals.oppFga - agg.onOppFga;
    const offOppFta = totals.oppFta - agg.onOppFta;
    const offOppTo = totals.oppTo - agg.onOppTo;
    const offOppOreb = totals.oppOreb - agg.onOppOreb;

    const onTeamPoss = agg.onTeamFga + 0.44 * agg.onTeamFta + agg.onTeamTo - agg.onTeamOreb;
    const onOppPoss = agg.onOppFga + 0.44 * agg.onOppFta + agg.onOppTo - agg.onOppOreb;
    const offTeamPoss = offTeamFga + 0.44 * offTeamFta + offTeamTo - offTeamOreb;
    const offOppPoss = offOppFga + 0.44 * offOppFta + offOppTo - offOppOreb;

    const onORtg = onTeamPoss > 0 ? (agg.onPtsFor / onTeamPoss) * 100 : 0;
    const onDRtg = onOppPoss > 0 ? (agg.onPtsAgn / onOppPoss) * 100 : 0;
    const offORtg = offTeamPoss > 0 ? (agg.offPtsFor / offTeamPoss) * 100 : 0;
    const offDRtg = offOppPoss > 0 ? (agg.offPtsAgn / offOppPoss) * 100 : 0;

    const onNet = onORtg - onDRtg;
    const offNet = offORtg - offDRtg;

    return {
      playerId: pId,
      onPointsFor: agg.onPtsFor,
      onPointsAgainst: agg.onPtsAgn,
      onPossessions: Math.round(onTeamPoss),
      onOffensiveRating: onORtg.toFixed(1),
      onDefensiveRating: onDRtg.toFixed(1),
      onNetRating: onNet.toFixed(1),
      offPointsFor: offPtsFor,
      offPointsAgainst: offPtsAgn,
      offPossessions: Math.round(offTeamPoss),
      offOffensiveRating: offORtg.toFixed(1),
      offDefensiveRating: offDRtg.toFixed(1),
      offNetRating: offNet.toFixed(1),
      netDifferential: (onNet - offNet).toFixed(1)
    };
  });
};

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

      // ⚡ Bolt: Efficiently track the last 3 field goal attempts.
      // WHY: history.shift() is O(N). For a fixed-size buffer of 3,
      // manual shifting or circular indexing is faster and avoids re-indexing.
      const action = isScoringEvent(s) ? "MAKE" : "MISS";
      if (history.length < 3) {
        history.push(action);
      } else {
        history[0] = history[1];
        history[1] = history[2];
        history[2] = action;
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
