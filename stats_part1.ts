/**
 * @file stats.ts
 * @description Utility functions for calculating basketball statistics (averages, totals, records).
 * Processes StatEvent records into player and team level aggregates.
 */

import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
  ANALYTICAL_BASELINES,
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
  turnovers: number;
  assists: number;
  offRebounds: number;
  points: number;
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
  options: {
    periodLength?: number;
    overtimeLength?: number;
    periodType?: string;
  },
): number => {
  const isOT = options.periodType === "HALVES" ? period > 2 : period > 4;
  const mins = isOT
    ? options.overtimeLength ?? 5
    : options.periodLength ?? 10;
  return mins * 60;
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
  isOpponentDefender?: boolean;
  fga?: number;
  fta?: number;
  to?: number;
  oreb?: number;
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
  threePPct?: string;
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
export const isOpponentId = (playerId: string | null): boolean => {
  if (!playerId) return false;
  // ⚡ Bolt: Quick check on the first character ('O' for OPPONENT) before
  // full string comparison to accelerate the frequent team-player ID lookups.
  if (playerId[0] !== "O") return false;
  return (
    playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
    playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
  );
};

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
 * Determines if a statistical event is a rebound.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a rebound.
 */
export const isRebound = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.REBOUND ||
  stat.type === ACTION_TYPES.OFF_REBOUND ||
  stat.type === ACTION_TYPES.DEF_REBOUND;

/**
 * Determines if a statistical event is a defensive rebound.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a defensive rebound.
 */
export const isDefensiveRebound = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.DEF_REBOUND || stat.type === ACTION_TYPES.REBOUND;

/**
 * Determines if a statistical event is a substitution.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a substitution.
 */
export const isSubstitution = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.SUB_IN || stat.type === ACTION_TYPES.SUB_OUT;

/**
 * Determines if a statistical event is a free throw attempt.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a 1-point attempt.
 */
export const isFreeThrow = (stat: StatEvent): boolean => stat.points === 1;

/**
 * Determines if a statistical event is a 3-point attempt.
 * @param {StatEvent} stat - The event to check.
 * @returns {boolean} True if it is a 3-point attempt.
 */
export const isThreePointAttempt = (stat: StatEvent): boolean =>
  stat.points === 3;

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
 * Calculates possessions for a statistical aggregate record.
 * @param agg - An object containing attempts, fta, turnovers, and offensive rebounds.
 * @param agg.attempts - Field goal attempts.
 * @param agg.fta - Free throw attempts.
 * @param agg.turnovers - Turnovers.
 * @param agg.offRebounds - Optional offensive rebounds.
 * @param agg.oreb - Optional offensive rebounds (alternative key).
 */
export const calculatePossessionsForAgg = (agg: {
  attempts: number;
  fta: number;
  turnovers: number;
  offRebounds?: number;
  oreb?: number;
}): number => {
  return calculatePossessions(
    agg.attempts,
    agg.fta,
    agg.turnovers,
    agg.offRebounds ?? agg.oreb ?? 0,
  );
};

/**
 * Initializes a new opponent aggregate record.
 */
const initOpponentAggregates = (): OpponentAggregates => ({
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
});

/**
 * Initializes a new opponent threat record.
 */
const initOpponentThreat = (playerId: string): OpponentThreat => ({
  playerId,
  points: 0,
  makes: 0,
  consecutiveMakes: 0,
  straightPoints: 0,
  isHot: false,
});

/**
 * Initializes a new play efficiency record.
 */
const initPlayEfficiencyAgg = () => ({
  makes: 0,
  attempts: 0,
  points: 0,
  fta: 0,
  turnovers: 0,
  threePM: 0,
  oreb: 0,
});

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
  // ⚡ Bolt: Use a single-pass loop instead of multiple regex/array allocations.
  if (!name) return "";
  const s = name.trim();
  let result = "";
  let inWord = false;
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (/\S/.test(char)) {
      if (!inWord) {
        result += char.toUpperCase();
        if (result.length === 2) break;
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }
  return result;
};

/**
 * 🏀 CoachBoard: calculateTargetAttackStats
 * Why: Automates the identification of defensive mismatches to drive play-calling.
 * Highlights which opponent player is allowing the highest PPP and suggests a primary attacker.
 */
export interface TargetAttack {
  targetOpponentId: string;
  pppAllowed: string;
  suggestedAttackerId: string;
  reason: string;
}

/**
 * ⚡ Bolt: Optimized calculateTargetAttackStats using a two-pass approach for mathematical correctness.
 */
export const calculateTargetAttackStats = (
  matchups: MatchupStats[],
  playerStats: PlayerAggregates[],
): TargetAttack | null => {
  const defenderStats = new Map<string, { points: number; possessions: number }>();

  // Pass 1: Aggregate points and possessions
  for (let i = 0; i < matchups.length; i++) {
    const m = matchups[i];
    if (!m.isOpponentDefender) continue;

    const stats = defenderStats.get(m.opponentPlayerId) || {
      points: 0,
      possessions: 0,
    };
    stats.points += m.pointsAllowed;
    stats.possessions += m.possessions;
    defenderStats.set(m.opponentPlayerId, stats);
  }

  // Pass 2: Identify defender with highest final PPP
  let worstDefenderId = "";
  let highestPpp = -1;

  for (const [id, stats] of defenderStats.entries()) {
    const ppp = stats.possessions > 0 ? stats.points / stats.possessions : 0;
    if (ppp > highestPpp) {
      highestPpp = ppp;
      worstDefenderId = id;
    }
  }

  if (!worstDefenderId || highestPpp === 0) return null;

  // Find our best attacker (highest eFG% with > 0 attempts)
  const bestAttacker = [...playerStats]
    .filter((p) => p.attempts > 0 && !isOpponentId(p.id.toString()))
    .sort((a, b) => parseFloat(b.efgPct) - parseFloat(a.efgPct))[0];

  if (!bestAttacker) return null;

  return {
    targetOpponentId: worstDefenderId,
    pppAllowed: highestPpp.toFixed(2),
    suggestedAttackerId: bestAttacker.id.toString(),
    reason: `Opponent defender allowing ${highestPpp.toFixed(2)} PPP. ${bestAttacker.name} is our most efficient attacker (${bestAttacker.efgPct}% eFG).`,
  };
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
        if (isThreePointAttempt(stat)) {
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
        if (isThreePointAttempt(stat)) {
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
    default:
      if (isFoulAction(stat)) {
        agg.fouls++;
      }
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

  // ⚡ Bolt: Use pre-sorted stats or sort them if needed.
  const sortedStats = options.isSorted ? stats : sortStats(stats);

  const scores = { team: 0, opp: 0 };
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  let lastClockTime = getPeriodLen(1, options);
  let lastScoreDiff = 0;

  const activePlayers = new Map<string, PlayerAggregates>();
  // ⚡ Bolt: Maintain a local array for high-performance iteration in the hot loop.
  let activePlayersArray: PlayerAggregates[] = [];

  const periodType = options.periodType || "QUARTERS";
  const clutchOnly = !!options.clutchOnly;

  // ⚡ Bolt: Cache last gameId per player to avoid redundant Set.add overhead.
  const lastGameIdMap = new Map<string, string>();

  // Accumulate statistics from event stream
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    if (!isActive(stat)) continue;

    const { playerId, type, clockTime, period, gameId } = stat;

    // Handle new game context
    if (gameId !== currentGameId) {
      // Record final minutes for previous game
      for (let j = 0; j < activePlayersArray.length; j++) {
        const pAgg = activePlayersArray[j];
        const clutchSecs = getClutchSeconds(
          currentPeriod,
          lastClockTime,
          0,
          lastScoreDiff,
          periodType,
        );
        pAgg.min += clutchOnly ? clutchSecs : lastClockTime;
      }
      activePlayers.clear();
      activePlayersArray = [];
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
      const clutchSecs = getClutchSeconds(
        currentPeriod,
        lastClockTime,
        0,
        lastScoreDiff,
        periodType,
      );

      // Pre-calculate full minutes for skipped periods
      let skippedMins = 0;
      for (let p = currentPeriod + 1; p < period; p++) {
        const pLen = getPeriodLen(p, options);
        skippedMins += clutchOnly ? getClutchSeconds(p, pLen, 0, lastScoreDiff, periodType) : pLen;
      }

      const increment = (clutchOnly ? clutchSecs : lastClockTime) + skippedMins;
      for (let j = 0; j < activePlayersArray.length; j++) {
        activePlayersArray[j].min += increment;
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
        periodType,
      );
      const diff = lastClockTime - clockTime;
      const increment = clutchOnly ? clutchSecs : diff;
      for (let j = 0; j < activePlayersArray.length; j++) {
        activePlayersArray[j].min += increment;
      }
      lastClockTime = clockTime;
    }

    // Determine if current event is clutch
    const isClutch =
      !clutchOnly ||
      (clockTime !== undefined &&
        isClutchEvent(
          period,
          clockTime,
          scores.team - scores.opp,
          periodType,
        ));

    // Update plus-minus and scores
    if (type === ACTION_TYPES.MAKE) {
      const pts = stat.points || 0;
      const isOpp = isOpponentId(playerId);
      const diffChange = isOpp ? -pts : pts;

      if (isClutch) {
        for (let j = 0; j < activePlayersArray.length; j++) {
          activePlayersArray[j].plusMinus += diffChange;
        }
      }

      if (isOpp) scores.opp += pts;
      else scores.team += pts;
      lastScoreDiff = scores.team - scores.opp;
    }

    // ⚡ Bolt: Cache statsMap lookups to avoid redundant Map access in the hot loop.
    const player = statsMap.get(playerId);
    if (player && isClutch) {
      // Only call Set.add if gameId has changed for this player to skip internal Set logic.
      if (lastGameIdMap.get(playerId) !== gameId) {
        player.gamesPlayed.add(gameId);
        lastGameIdMap.set(playerId, gameId);
      }

      applyActionToAggregate(player, stat);
    }

    // Handle Sub-In/Sub-Out
    if (type === ACTION_TYPES.SUB_IN) {
      const p = statsMap.get(playerId);
      if (p && !activePlayers.has(playerId)) {
        activePlayers.set(playerId, p);
        activePlayersArray.push(p);
      }
    } else if (type === ACTION_TYPES.SUB_OUT) {
      if (activePlayers.has(playerId)) {
        activePlayers.delete(playerId);
        activePlayersArray = Array.from(activePlayers.values());
      }
    }
  }

  // Handle players still on court at end of game
  const liveCtx = options.liveContext;
  const finalClock =
    liveCtx && sortedStats[sortedStats.length - 1]?.gameId === currentGameId
      ? liveCtx.clockTime
