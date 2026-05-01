import { TeamAggregates, MatchupStats, OpponentAggregates, ScoreFlowPoint, BonusStatus, PlayerAggregates, PlayerStint, PlayEfficiency, SchemeEfficiency, OpponentThreat, ScoringRun, OpponentTendency, LineupAggregates, OnOffImpact, ClutchPlay, OfficiatingStats, PaceAnalytics } from "./types";

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
} from "../../constants/stats";
import { StatEvent, TeamPlayer, Player, Game } from "../../db";
import { getShotZone } from "../shotZones";
import {
  roundToOne,
  formatToOne,
  determineResult,
  formatClock,
} from "../mathUtils";

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
export const isScoringEvent = (stat: StatEvent): boolean => stat.type === ACTION_TYPES.MAKE;

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
  (isScoringEvent(stat) || stat.type === ACTION_TYPES.MISS) &&
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
      : 0;

  const diffEnd = lastClockTime - finalClock;
  for (let j = 0; j < activePlayersArray.length; j++) {
    const pAgg = activePlayersArray[j];
    const clutchSecs = getClutchSeconds(
      currentPeriod,
      lastClockTime,
      finalClock,
      lastScoreDiff,
      periodType,
    );
    pAgg.min += clutchOnly ? clutchSecs : diffEnd;
  }

  // Finalize totals, percentages, and averages
  const playerAggregates: PlayerAggregates[] = [];
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
      player.makes = roundToOne(player.makes / gp);
      player.attempts = roundToOne(player.attempts / gp);
      player.threePM = roundToOne(player.threePM / gp);
      player.threePA = roundToOne(player.threePA / gp);
      player.ftm = roundToOne(player.ftm / gp);
      player.fta = roundToOne(player.fta / gp);
      player.fouls = roundToOne(player.fouls / gp);
      player.min = roundToOne(player.min / (60 * gp)); // Convert to avg mins
      player.plusMinus = roundToOne(player.plusMinus / gp);
    } else {
      player.min = roundToOne(player.min / 60); // Total mins
    }
    playerAggregates.push(player);
  }
  return playerAggregates;
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
  const activeStints = new Map<
    string,
    { startClock: number; period: number }
  >();

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
    const endClock =
      liveCtx && liveCtx.period === info.period ? liveCtx.clockTime : 0;
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
  viewType: "total" | "average" = "total",
): Map<string, OpponentAggregates> => {
  const result = new Map<string, OpponentAggregates>();
  const gameIdsMap = new Map<string, Set<string>>();

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const pId = s.playerId;
    let agg = result.get(pId);
    if (!agg) {
      agg = initOpponentAggregates();
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
  const isAverage = viewType === "average";
  for (const [pId, agg] of result.entries()) {
    const possessions = calculatePossessionsForAgg(agg);
    agg.possessions = Math.round(possessions);
    agg.ppp = calculatePpp(agg.points, possessions);
    agg.fgPct = calculateFgPct(agg.makes, agg.attempts);
    agg.efgPct = calculateEfgPct(agg.makes, agg.threePM, agg.attempts);
    agg.threePPct = calculateFgPct(agg.threePM, agg.threePA);
    agg.toPct = calcPct(agg.turnovers, possessions);
    agg.orbPct = "0.0"; // Individual ORB% requires context of all game missed shots
    agg.ftRate = calcPct(agg.ftm, agg.attempts);

    if (isAverage) {
      const gp = gameIdsMap.get(pId)?.size || 1;
      agg.points = roundToOne(agg.points / gp);
      agg.makes = roundToOne(agg.makes / gp);
      agg.attempts = roundToOne(agg.attempts / gp);
      agg.rebounds = roundToOne(agg.rebounds / gp);
      agg.offRebounds = roundToOne(agg.offRebounds / gp);
      agg.defRebounds = roundToOne(agg.defRebounds / gp);
      agg.assists = roundToOne(agg.assists / gp);
      agg.blocks = roundToOne(agg.blocks / gp);
      agg.steals = roundToOne(agg.steals / gp);
      agg.turnovers = roundToOne(agg.turnovers / gp);
      agg.fouls = roundToOne(agg.fouls / gp);
      agg.fta = roundToOne(agg.fta / gp);
      agg.ftm = roundToOne(agg.ftm / gp);
      agg.threePM = roundToOne(agg.threePM / gp);
      agg.threePA = roundToOne(agg.threePA / gp);
      agg.possessions = roundToOne(agg.possessions / gp);
    }
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

    let play = data[s.playName];
    if (!play) {
      play = initPlayEfficiencyAgg();
      data[s.playName] = play;
    }
    if (s.type === ACTION_TYPES.MAKE) {
      play.points += s.points || 0;
      if (s.points === 1) {
        play.fta++;
      } else {
        play.makes++;
        play.attempts++;
        if (isThreePointAttempt(s)) {
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
      const possessions = calculatePossessionsForAgg(s);
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
    const possessions = calculatePossessionsForAgg(s);
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
    let t = threats.get(pId);
    if (!t) {
      t = initOpponentThreat(pId);
      threats.set(pId, t);
    }
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
  let lastMakeEvent: StatEvent | null = null; // ⚡ Bolt: Track last make for O(N) runs

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s) || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp = isOpponentId(s.playerId);
    const team = isOpp ? "OPPONENT" : "TEAM";
    const points = s.points || 0;

    if (currentRunTeam === team) {
      currentRunPoints += points;
      lastMakeEvent = s;
    } else {
      // If previous run was significant, record it
      if (currentRunTeam && currentRunPoints >= 8 && runStartEvent && lastMakeEvent) {
        runs.push({
          team: currentRunTeam,
          points: currentRunPoints,
          period: runStartEvent.period,
          startClock: runStartEvent.clockTime || 0,
          endClock: lastMakeEvent.clockTime || 0,
          startTime: formatClock(runStartEvent.clockTime || 0),
          endTime: formatClock(lastMakeEvent.clockTime || 0),
        });
      }
      // Start new run
      currentRunTeam = team;
      currentRunPoints = points;
      runStartEvent = s;
      lastMakeEvent = s;
    }
  }

  // Final check
  if (currentRunTeam && currentRunPoints >= 8 && runStartEvent && lastMakeEvent) {
    runs.push({
      team: currentRunTeam,
      points: currentRunPoints,
      period: runStartEvent.period,
      startClock: runStartEvent.clockTime || 0,
      endClock: lastMakeEvent.clockTime || 0,
      startTime: formatClock(runStartEvent.clockTime || 0),
      endTime: formatClock(lastMakeEvent.clockTime || 0),
    });
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
    const dX = svgX - 250;
    const dY = svgY - 140;
    const distSq = dX * dX + dY * dY;
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
 * STATE TRANSITIONS:
 * - inOpponentPossession: Set to TRUE on opponent MISS; reset to FALSE on any score,
 *   turnover, or defensive rebound. This ensures a single stop per possession.
 * - isOurPossession: Toggled on turnovers, scores, and rebounds. Used to filter
 *   offensive fouls which do not break a defensive stop streak.
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
    if (!isOpp && (isScoringEvent(s) || s.type === ACTION_TYPES.TURNOVER)) {
      isOurPossession = false;
    }

    if (isDefensiveRebound(s)) {
      isOurPossession = !isOpp;
    }

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
    else if (inOpponentPossession && !isOpp && isDefensiveRebound(s)) {
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
): TeamAggregates => {
  return calculateTeamAggregates(games, allStats, true);
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

  const team = {
    pts: 0,
    reb: 0,
    ast: 0,
    fga: 0,
    fta: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
    makes: 0,
    threePM: 0,
    ftm: 0,
  };
  const opp = {
    pts: 0,
    fga: 0,
    fta: 0,
    to: 0,
    oreb: 0,
    dreb: 0,
    makes: 0,
    threePM: 0,
    ftm: 0,
  };

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
    const target = isOpponent ? opp : team;

    if (isScoringEvent(stat)) {
      if (isOpponent) totals.opp += pts;
      else totals.team += pts;

      target.pts += pts;
      if (isFreeThrow(stat)) {
        target.ftm++;
      } else {
        target.makes++;
        if (isThreePointAttempt(stat)) target.threePM++;
      }
    }

    updatePossessionCounters(stat, target);

    if (isDefensiveRebound(stat)) {
      target.dreb++;
    }

    if (!isOpponent) {
      if (isRebound(stat)) {
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
    turnovers: team.to,
    assists: team.ast,
    offRebounds: team.oreb,
    points: team.pts,
  };
};

/**
 * Calculates aggregated statistics for the opponent in a single game.
 *
 * @param {StatEvent[]} stats - List of statistical events for the game.
 * @returns {OpponentAggregates} Opponent statistical summary.
 */
/**
 * ⚡ Bolt: Consolidated opponent aggregates and tendencies into a single pass.
 */
export const calculateOpponentSummary = (
  stats: StatEvent[],
): OpponentAggregates & { tendency: OpponentTendency } => {
  const agg = initOpponentAggregates();
  let paintAttempts = 0;
  let totalFieldGoalAttempts = 0;
  let catchAndShootAttempts = 0;
  let offDribbleAttempts = 0;
  let totalTaggedAttempts = 0;

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat) || !isOpponentId(stat.playerId)) continue;

    applyActionToAggregate(agg, stat);

    // Tendency logic
    if (
      (isScoringEvent(stat) || stat.type === ACTION_TYPES.MISS) &&
      !isFreeThrow(stat)
    ) {
      totalFieldGoalAttempts++;
      if (
        detectShotValueFromCoords(stat.locationX || 0, stat.locationY || 0) === 2
      ) {
        const zone = getShotZone(stat.locationX || 0, stat.locationY || 0);
        if (zone === "PAINT") paintAttempts++;
      }

      if (stat.shotType === "CATCH") {
        catchAndShootAttempts++;
        totalTaggedAttempts++;
      } else if (stat.shotType === "DRIB") {
        offDribbleAttempts++;
        totalTaggedAttempts++;
      }
    }
  }

  const possessions = calculatePossessionsForAgg(agg);

  return {
    ...agg,
    fgPct: calculateFgPct(agg.makes, agg.attempts),
    min: 0,
    plusMinus: 0,
    ppp: calculatePpp(agg.points, possessions),
    possessions: Math.round(possessions),
    efgPct: calculateEfgPct(agg.makes, agg.threePM, agg.attempts),
    toPct: calcPct(agg.turnovers, possessions),
    orbPct: "0.0",
    ftRate: calcPct(agg.ftm, agg.attempts),
    threePPct: calculateFgPct(agg.threePM, agg.threePA),
    tendency: {
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
    },
  };
};

export const calculateOpponentAggregates = (
  stats: StatEvent[],
): OpponentAggregates => {
  return calculateOpponentSummary(stats);
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

    if (isSubstitution(stat)) {
      if (stat.type === ACTION_TYPES.SUB_IN) {
        currentLineup.add(stat.playerId);
      } else {
        currentLineup.delete(stat.playerId);
      }
      cachedLineup = Array.from(currentLineup);
    }

    // Capture point if it's a significant event for the chart
    if (isScoringEvent(stat) || stat.type === ACTION_TYPES.TIMEOUT) {
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
      if (isScoringEvent(stat)) {
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
/**
 * Helper to determine if a period is regulation-final or overtime.
 * @param period - The game period.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
const getClutchPeriodInfo = (period: number, periodType: string) => {
  const isQuarters = periodType === "QUARTERS";
  return {
    isOT: isQuarters ? period > 4 : period > 2,
    isFinal: isQuarters ? period === 4 : period === 2,
    regClutchTime: isQuarters ? 240 : 120,
  };
};

export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  const { isOT, isFinal, regClutchTime } = getClutchPeriodInfo(
    eventPeriod,
    periodType,
  );

  if (!(isFinal || isOT)) return false;
  if (Math.abs(scoreDiff) > 5) return false;

  return isOT || clockTime <= regClutchTime;
};

/**
 * 🔍 Scout: Calculates how many seconds of an interval [startClock, endClock]
 * are considered "clutch time".
 *
 * METHODOLOGY: For efficiency, we clamp the start and end clocks of an interval
 * to the regulation clutch threshold (e.g., 240s). The difference between these
 * clamped values represents the duration of that interval that occurred
 * within the clutch window.
 *
 * @param period - Game period.
 * @param startClock - Seconds remaining at start of interval.
 * @param endClock - Seconds remaining at end of interval.
 * @param scoreDiff - Point spread at start of interval.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
export const getClutchSeconds = (
  period: number,
  startClock: number,
  endClock: number,
  scoreDiff: number,
  periodType: string,
): number => {
  if (Math.abs(scoreDiff) > 5) return 0;
  const { isOT, isFinal, regClutchTime } = getClutchPeriodInfo(
    period,
    periodType,
  );
  if (isOT) return Math.max(0, startClock - endClock);
  if (!isFinal) return 0;

  const s = Math.min(startClock, regClutchTime);
  const e = Math.min(endClock, regClutchTime);
  return Math.max(0, s - e);
};

/**
 * Determines if a statistical event occurred within the specified game period.
 *
 * WHY: In 'HALVES' mode (NCAA), the 2nd half (period 2) typically includes all
 * overtime periods (3+) for high-level reporting. In 'QUARTERS' mode, periods
 * are usually kept distinct unless viewing a full-game summary.
 *
 * @param eventPeriod - The period recorded on the event.
 * @param currentPeriod - The current game period being viewed.
 * @param periodType - 'QUARTERS' or 'HALVES'.
 */
export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  const isFinal =
    periodType === "QUARTERS" ? currentPeriod === 4 : currentPeriod === 2;
  return isFinal ? eventPeriod >= currentPeriod : eventPeriod === currentPeriod;
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
  efgPct: string;
  toPct: string;
  fga: number;
  fgm: number;
  threePM: number;
  fta: number;
  turnovers: number;
  oreb: number;
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
  isOpponentDefender?: boolean;
  fga?: number;
  fta?: number;
  to?: number;
  oreb?: number;
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
  fga: number,
  fgm: number,
  threePM: number,
  fta: number,
  turnovers: number,
  oreb: number,
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
      efgPct: "0.0",
      toPct: "0.0",
      fga: 0,
      fgm: 0,
      threePM: 0,
      fta: 0,
      turnovers: 0,
      oreb: 0,
    };
    lineupStats.set(key, agg);
  }
  agg.seconds += seconds;
  agg.pointsFor += ptsFor;
  agg.pointsAgainst += ptsAgainst;
  agg.fga += fga;
  agg.fgm += fgm;
  agg.threePM += threePM;
  agg.fta += fta;
  agg.turnovers += turnovers;
  agg.oreb += oreb;
};

/**
 * Records full minutes for periods where no events occurred but a lineup remained on court.
 */
const recordSkippedPeriods = (
  lineupStats: Map<string, LineupAggregates>,
  lineupKey: string,
  startPeriod: number,
  endPeriod: number,
  lastScoreDiff: number,
  periodType: string,
  options: {
    periodLength?: number;
    overtimeLength?: number;
    clutchOnly?: boolean;
  },
) => {
  for (let p = startPeriod; p < endPeriod; p++) {
    const pLen = getPeriodLen(p, options);
    const skipClutchSecs = getClutchSeconds(
      p,
      pLen,
      0,
      lastScoreDiff,
      periodType,
    );
    recordLineupStint(
      lineupStats,
      lineupKey,
      options.clutchOnly ? skipClutchSecs : pLen,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  }
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

  let pendingDuration = 0;
  let pendingPtsFor = 0;
  let pendingPtsAgainst = 0;
  let pendingFga = 0;
  let pendingFgm = 0;
  let pendingThreePM = 0;
  let pendingFta = 0;
  let pendingTurnovers = 0;
  let pendingOreb = 0;

  const flushPending = () => {
    if (
      pendingDuration === 0 &&
      pendingPtsFor === 0 &&
      pendingPtsAgainst === 0 &&
      pendingFga === 0 &&
      pendingFgm === 0 &&
      pendingThreePM === 0 &&
      pendingFta === 0 &&
      pendingTurnovers === 0 &&
      pendingOreb === 0
    )
      return;
    if (currentLineup.size === 5) {
      if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
      recordLineupStint(
        lineupStats,
        cachedLineupKey,
        pendingDuration,
        pendingPtsFor,
        pendingPtsAgainst,
        pendingFga,
        pendingFgm,
        pendingThreePM,
        pendingFta,
        pendingTurnovers,
        pendingOreb,
      );
    }
    pendingDuration = 0;
    pendingPtsFor = 0;
    pendingPtsAgainst = 0;
    pendingFga = 0;
    pendingFgm = 0;
    pendingThreePM = 0;
    pendingFta = 0;
    pendingTurnovers = 0;
    pendingOreb = 0;
  };

  const periodType = options.periodType || "QUARTERS";

  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    if (!isActive(s)) continue;

    // ⚡ Bolt: Handle multi-game aggregation by detecting game context changes in-stream.
    if (currentGameId !== null && s.gameId !== currentGameId) {
      if (currentLineup.size === 5) {
        const clutchSec = getClutchSeconds(currentPeriod, lastClockTime, 0, lastScoreDiff, periodType);
        pendingDuration += options.clutchOnly ? clutchSec : lastClockTime;
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
      }
      flushPending();
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
        const clutchSec = getClutchSeconds(currentPeriod, lastClockTime, 0, lastScoreDiff, periodType);
        pendingDuration += options.clutchOnly ? clutchSec : lastClockTime;
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
        flushPending();

        // 🔍 Scout: Handle full minutes for skipped periods
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordSkippedPeriods(
          lineupStats,
          cachedLineupKey,
          currentPeriod + 1,
          s.period,
          lastScoreDiff,
          periodType,
          options,
        );
      } else {
        flushPending();
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
        periodType,
      );
      if (!options.clutchOnly || clutchSecs > 0) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        pendingDuration += options.clutchOnly ? clutchSecs : (lastClockTime - s.clockTime);
        pendingPtsFor += scores.team - lastTeamScore;
        pendingPtsAgainst += scores.opp - lastOppScore;
      }
      lastClockTime = s.clockTime;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
    }

    // ⚡ Bolt: Use domain helpers for scoring and opponent identification.
    if (s.type === ACTION_TYPES.MAKE) {
      const pts = s.points || 0;
      if (isOpponentId(s.playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
        // Track lineup-level metrics
        if (isFreeThrow(s)) {
          pendingFta++;
        } else {
          pendingFga++;
          pendingFgm++;
          if (pts === 3) pendingThreePM++;
        }
      }
      lastScoreDiff = scores.team - scores.opp;
    } else if (!isOpponentId(s.playerId)) {
      if (s.type === ACTION_TYPES.MISS) {
        if (isFreeThrow(s)) {
          pendingFta++;
        } else {
          pendingFga++;
          if (isThreePointAttempt(s)) pendingThreePM += 0; // Just for clarity
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        pendingTurnovers++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        pendingOreb++;
      }
    }

    // When lineup changes
    if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
      flushPending();
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
      periodType,
    );
    pendingDuration += options.clutchOnly ? clutchSecs : Math.max(0, lastClockTime - finalClock);
    pendingPtsFor += scores.team - lastTeamScore;
    pendingPtsAgainst += scores.opp - lastOppScore;
    flushPending();
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

    const lineupPossessions = calculatePossessionsForAgg({ attempts: agg.fga, fta: agg.fta, turnovers: agg.turnovers, oreb: agg.oreb });
    return {
      ...agg,
      netRating: net,
      netRatingPer40: netRatingPer40Str,
      efgPct: calculateEfgPct(agg.fgm, agg.threePM, agg.fga),
      toPct: calcPct(agg.turnovers, lineupPossessions),
      sortValue,
    };
  });

  return result
    .sort((a, b) =>
      sortDir === "desc"
        ? b.sortValue - a.sortValue
        : a.sortValue - b.sortValue,
    )
    .map(({ sortValue: _sortValue, ...rest }) => rest);
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

    const type = s.type;

    if (type === ACTION_TYPES.MATCHUP) {
      // ⚡ Bolt: Correctly manage bidirectional mapping when reassignment occurs.
      // 1. If this opponent was previously guarded by someone else, remove that old link.
      const oldOurId = currentMatchups.get(s.playerId);
      if (oldOurId) reverseMatchups.delete(oldOurId);

      if (s.relatedPlayerId) {
        // 2. If our player was previously guarding a different opponent, remove that old link.
        const oldOppId = reverseMatchups.get(s.relatedPlayerId);
        if (oldOppId) currentMatchups.delete(oldOppId);

        currentMatchups.set(s.playerId, s.relatedPlayerId);
        reverseMatchups.set(s.relatedPlayerId, s.playerId);
      } else {
        currentMatchups.delete(s.playerId);
      }
      continue;
    }

    // Direction 1: Our defender guarding Opponent
    const ourDefenderId =
      currentMatchups.get(s.playerId) ||
      currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);

    // Direction 2: Opponent defender guarding Us
    // ⚡ Bolt: Use reverseMatchups Map for O(1) lookup instead of iterating currentMatchups.
    const oppDefenderId = reverseMatchups.get(s.playerId);

    // 🔍 Scout: Helper to get or create matchup stats record
    const getM = (ourId: string, oppId: string, isOppDef: boolean) => {
      const key = `${ourId}:${oppId}:${isOppDef}`;
      let m = results.get(key);
      if (!m) {
        m = {
          ourPlayerId: ourId,
          opponentPlayerId: oppId,
          pointsAllowed: 0,
          stops: 0,
          possessions: 0,
          stopPct: "0.0",
          isOpponentDefender: isOppDef,
          fga: 0, fta: 0, to: 0, oreb: 0
        };
        results.set(key, m);
      }
      return m;
    };

    // SCORING
    if (isScoringEvent(s)) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
        inOpponentPossession = false;
        inOurPossession = false;
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.pointsAllowed += s.points || 0;
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
        inOurPossession = false;
        inOpponentPossession = false;
      }
      continue;
    }

    // POSSESSION ENDERS (STOPS/TURNOVERS)
    if (type === ACTION_TYPES.TURNOVER) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
        inOpponentPossession = false;
        inOurPossession = false;
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.stops++;
          m.to = (m.to || 0) + 1;
        }
        inOurPossession = false;
        inOpponentPossession = false;
      }
      inOpponentPossession = false;
      inOurPossession = false;
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isOpp) {
        inOpponentPossession = true;
        opponentPossessionPlayerId = s.playerId;
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      } else {
        inOurPossession = true;
        ourPossessionPlayerId = s.playerId;
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          if (isFreeThrow(s)) m.fta = (m.fta || 0) + 1;
          else m.fga = (m.fga || 0) + 1;
        }
      }
    } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
      if (isOpp) {
        if (ourDefenderId) {
          const m = getM(ourDefenderId, s.playerId, false);
          m.oreb = (m.oreb || 0) + 1;
        }
      } else {
        if (oppDefenderId) {
          const m = getM(s.playerId, oppDefenderId, true);
          m.oreb = (m.oreb || 0) + 1;
        }
      }
    } else if (isDefensiveRebound(s)) {
      if (isOpp) {
        if (inOurPossession && ourPossessionPlayerId) {
          let odId: string | undefined;
          for (const [oid, ourid] of currentMatchups.entries()) {
            if (ourid === ourPossessionPlayerId) {
              odId = oid;
              break;
            }
          }
          if (odId) {
            const m = getM(ourPossessionPlayerId, odId, true);
            m.stops++;
          }
        }
        inOurPossession = false;
      } else {
        if (inOpponentPossession && opponentPossessionPlayerId) {
          const defId =
            currentMatchups.get(opponentPossessionPlayerId) ||
            currentMatchups.get(SPECIAL_PLAYER_IDS.OPPONENT);
          if (defId) {
            const m = getM(defId, opponentPossessionPlayerId, false);
            m.stops++;
          }
        }
        inOpponentPossession = false;
      }
    }
  }

  // Finalize stop percentages
  return Array.from(results.values()).map((m) => {
    const possessions = calculatePossessions(m.fga || 0, m.fta || 0, m.to || 0, m.oreb || 0);
    return {
      ...m,
      possessions,
      stopPct: possessions > 0 ? ((m.stops / possessions) * 100).toFixed(1) : "0.0",
    };
  });
};

/**
 * 🏀 Assistant Coach: calculateTimeoutRecommendation
 * WHY: Helps high-stress situational decision making.
 */
export const calculateTimeoutRecommendation = (params: {
  opponentRun: string | null;
  teamFoulTrouble: boolean;
  clutchMode: boolean;
  timeoutsRemaining: number;
  isClockRunning: boolean;
  scoreSpread: number;
  clockSeconds: number;
  period: number;
}): { recommendation: string | null; urgency: "LOW" | "MEDIUM" | "HIGH" } => {
  const {
    opponentRun,
    teamFoulTrouble,
    clutchMode,
    timeoutsRemaining,
    isClockRunning,
    scoreSpread,
    clockSeconds,
    period,
  } = params;

  if (timeoutsRemaining <= 0) return { recommendation: null, urgency: "LOW" };

  // 1. High Urgency: Opponent is on a major run and clock is running
  if (opponentRun) {
    const runPoints = parseInt(opponentRun.split("-")[0]);
    if (runPoints >= 10) {
      return { recommendation: "STOP THE RUN: Opponent is on a " + opponentRun + " run.", urgency: "HIGH" };
    }
    if (runPoints >= 6) {
      return { recommendation: "MOMENTUM SHIFT: Opponent is on a " + opponentRun + " run.", urgency: "MEDIUM" };
    }
  }

  // 2. Foul Trouble Alert
  if (teamFoulTrouble && !clutchMode && period < 4) {
    return { recommendation: "PERSONNEL: Star player in foul trouble. Consider sub or timeout to adjust.", urgency: "MEDIUM" };
  }

  // 3. Late Game Clutch Situation
  if (clutchMode && clockSeconds < 60 && !isClockRunning && Math.abs(scoreSpread) <= 3) {
    return { recommendation: "STRATEGIC: Final minute, tight game. Use timeout to advance ball or set play.", urgency: "HIGH" };
  }

  return { recommendation: null, urgency: "LOW" };
};

/**
 * 🏀 Assistant Coach: generatePlayerNarrative
 * WHY: Converts raw data into actionable feedback for players.
 */
export const generatePlayerNarrative = (
  playerStats: PlayerAggregates,
): { strength: string; growth: string } | null => {
  if (playerStats.min < 0.1) return null;

  const strengths = [];
  const growths = [];

  // Efficiency
  if (parseFloat(playerStats.threePPct) > 40 && playerStats.threePA >= 3) {
    strengths.push("Elite efficiency from the 3PT line (" + playerStats.threePPct + "%)");
  } else if (parseFloat(playerStats.fgPct) > 55 && playerStats.attempts >= 5) {
    strengths.push("Strong interior finishing and shot selection");
  }

  // Playmaking
  if (playerStats.assists >= 4) {
    strengths.push("Excellent floor vision and playmaking");
  } else if (playerStats.assists > 0 && playerStats.turnovers === 0) {
    strengths.push("Perfect ball security with zero turnovers");
  }

  // Defense
  if (playerStats.steals + playerStats.blocks >= 3) {
    strengths.push("High-impact defensive presence and disruptor");
  }

  // Growth Areas
  if (playerStats.turnovers >= 3) {
    growths.push("High turnover rate on drives - focus on ball security");
  }
  if (parseFloat(playerStats.ftPct) < 60 && playerStats.fta >= 2) {
    growths.push("Struggled at the free throw line (" + playerStats.ftPct + "%)");
  }
  if (playerStats.fouls >= 4) {
    growths.push("Foul trouble limited your defensive aggressiveness");
  }
  if (parseFloat(playerStats.threePPct) < 20 && playerStats.threePA >= 4) {
    growths.push("Poor 3PT shooting - look for higher quality looks");
  }

  // Fallbacks
  const strength = strengths.length > 0 ? strengths[0] : "Maintained consistent effort on both ends";
  const growth = growths.length > 0 ? growths[0] : "Focus on maintaining this level of play into the next game";

  return { strength, growth };
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
 * SECURITY & INTEGRITY: The accuracy of this optimization relies on the
 * consistency of the event stream. Since 'Total' is global, any stat event
 * that is NOT attributed to a player while they are on the court will
 * automatically be attributed to their 'OFF' state. This is mathematically
 * robust even if players are not subbed in/out perfectly.
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
  const results = new Map<
    string,
    {
      onPtsFor: number;
      onPtsAgn: number;
      onTeamFga: number;
      onTeamFta: number;
      onTeamTo: number;
      onTeamOreb: number;
      onOppFga: number;
      onOppFta: number;
      onOppTo: number;
      onOppOreb: number;
      offPtsFor: number;
      offPtsAgn: number;
      offTeamFga: number;
      offTeamFta: number;
      offTeamTo: number;
      offTeamOreb: number;
      offOppFga: number;
      offOppFta: number;
      offOppTo: number;
      offOppOreb: number;
    }
  >();

  type OnOffStats = {
    onPtsFor: number; onPtsAgn: number;
    onTeamFga: number; onTeamFta: number; onTeamTo: number; onTeamOreb: number;
    onOppFga: number; onOppFta: number; onOppTo: number; onOppOreb: number;
    offPtsFor: number; offPtsAgn: number;
    offTeamFga: number; offTeamFta: number; offTeamTo: number; offTeamOreb: number;
    offOppFga: number; offOppFta: number; offOppTo: number; offOppOreb: number;
    activeGames: Set<string>;
  };

  // Initialize
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p.id) continue;
    results.set(p.id.toString(), {
      onPtsFor: 0,
      onPtsAgn: 0,
      onTeamFga: 0,
      onTeamFta: 0,
      onTeamTo: 0,
      onTeamOreb: 0,
      onOppFga: 0,
      onOppFta: 0,
      onOppTo: 0,
      onOppOreb: 0,
      offPtsFor: 0,
      offPtsAgn: 0,
      offTeamFga: 0,
      offTeamFta: 0,
      offTeamTo: 0,
      offTeamOreb: 0,
      offOppFga: 0,
      offOppFta: 0,
      offOppTo: 0,
      offOppOreb: 0,
      activeGames: new Set<string>(),
    });
  }

  const activeAggs = new Map<string, OnOffStats>();
  // ⚡ Bolt: Maintain a local array for high-performance iteration in the hot loop.
  let activeAggsArray: OnOffStats[] = [];

  let currentGameId: string | null = null;
  const allGameIds = new Set<string>();

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
  const gameTotalsMap = new Map<string, {
    ptsFor: number;
    ptsAgn: number;
    teamFga: number;
    teamFta: number;
    teamTo: number;
    teamOreb: number;
    oppFga: number;
    oppFta: number;
    oppTo: number;
    oppOreb: number;
  }>();

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      allGameIds.add(currentGameId);
      activeAggs.clear();
      activeAggsArray = [];
      gameTotalsMap.set(currentGameId, {
        ptsFor: 0,
        ptsAgn: 0,
        teamFga: 0,
        teamFta: 0,
        teamTo: 0,
        teamOreb: 0,
        oppFga: 0,
        oppFta: 0,
        oppTo: 0,
        oppOreb: 0,
      });
    }

    const currentTotals = gameTotalsMap.get(currentGameId)!;

    if (s.type === ACTION_TYPES.SUB_IN) {
      const agg = results.get(s.playerId);
      if (agg && !activeAggs.has(s.playerId)) {
        activeAggs.set(s.playerId, agg);
        activeAggsArray.push(agg);
        agg.activeGames.add(currentGameId);
      }
      continue;
    } else if (s.type === ACTION_TYPES.SUB_OUT) {
      if (activeAggs.has(s.playerId)) {
        activeAggs.delete(s.playerId);
        activeAggsArray = Array.from(activeAggs.values());
      }
      continue;
    }

    const isOpp = isOpponentId(s.playerId);
    const pts = s.points || 0;

    // Update global totals
    if (s.type === ACTION_TYPES.MAKE) {
      if (isOpp) currentTotals.ptsAgn += pts;
      else currentTotals.ptsFor += pts;
    }

    if (isOpp) {
      if (isFieldGoal(s)) currentTotals.oppFga++;
      else if (isFreeThrow(s)) currentTotals.oppFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) currentTotals.oppTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) currentTotals.oppOreb++;
    } else {
      if (isFieldGoal(s)) currentTotals.teamFga++;
      else if (isFreeThrow(s)) currentTotals.teamFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) currentTotals.teamTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) currentTotals.teamOreb++;
    }

    // Update ON stats for active players
    // ⚡ Bolt: Use loop inversion and a standard for loop on the activeAggsArray
    // to determine the target field once per event, minimizing branching in the hot inner loop.
    if (s.type === ACTION_TYPES.MAKE) {
      if (isOpp) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onPtsAgn += pts;
        }
      } else {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onPtsFor += pts;
        }
      }
    }

    if (isOpp) {
      if (isFieldGoal(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppFga++;
        }
      } else if (isFreeThrow(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppFta++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppTo++;
        }
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onOppOreb++;
        }
      }
    } else {
      if (isFieldGoal(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamFga++;
        }
      } else if (isFreeThrow(s)) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamFta++;
        }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamTo++;
        }
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        for (let j = 0; j < activeAggsArray.length; j++) {
          activeAggsArray[j].onTeamOreb++;
        }
      }
    }
  }

  return Array.from(results.entries()).map(([pId, agg]) => {
    // 🔍 Scout: Aggregate totals only from games where the player was active.
    // However, if we only have one game in the stream, we include it even if
    // no SUB_IN was recorded (assuming the player was on the roster).
    // For multi-game streams, we strictly use activeGames to prevent skew.
    const eligibleTotals = {
      ptsFor: 0, ptsAgn: 0, teamFga: 0, teamFta: 0, teamTo: 0, teamOreb: 0,
      oppFga: 0, oppFta: 0, oppTo: 0, oppOreb: 0
    };

    const gamesToInclude = (allGameIds.size <= 1) ? allGameIds : agg.activeGames;

    for (const gId of gamesToInclude) {
      const gTot = gameTotalsMap.get(gId);
      if (gTot) {
        eligibleTotals.ptsFor += gTot.ptsFor;
        eligibleTotals.ptsAgn += gTot.ptsAgn;
        eligibleTotals.teamFga += gTot.teamFga;
        eligibleTotals.teamFta += gTot.teamFta;
        eligibleTotals.teamTo += gTot.teamTo;
        eligibleTotals.teamOreb += gTot.teamOreb;
        eligibleTotals.oppFga += gTot.oppFga;
        eligibleTotals.oppFta += gTot.oppFta;
        eligibleTotals.oppTo += gTot.oppTo;
        eligibleTotals.oppOreb += gTot.oppOreb;
      }
    }

    // ⚡ Bolt: Derive OFF stats: Eligible Total - ON
    const offPtsFor = eligibleTotals.ptsFor - agg.onPtsFor;
    const offPtsAgn = eligibleTotals.ptsAgn - agg.onPtsAgn;
    const offTeamFga = eligibleTotals.teamFga - agg.onTeamFga;
    const offTeamFta = eligibleTotals.teamFta - agg.onTeamFta;
    const offTeamTo = eligibleTotals.teamTo - agg.onTeamTo;
    const offTeamOreb = eligibleTotals.teamOreb - agg.onTeamOreb;
    const offOppFga = eligibleTotals.oppFga - agg.onOppFga;
    const offOppFta = eligibleTotals.oppFta - agg.onOppFta;
    const offOppTo = eligibleTotals.oppTo - agg.onOppTo;
    const offOppOreb = eligibleTotals.oppOreb - agg.onOppOreb;

    const onTeamPoss = calculatePossessions(
      agg.onTeamFga,
      agg.onTeamFta,
      agg.onTeamTo,
      agg.onTeamOreb,
    );
    const onOppPoss = calculatePossessions(
      agg.onOppFga,
      agg.onOppFta,
      agg.onOppTo,
      agg.onOppOreb,
    );
    const offTeamPoss = calculatePossessions(
      offTeamFga,
      offTeamFta,
      offTeamTo,
      offTeamOreb,
    );
    const offOppPoss = calculatePossessions(
      offOppFga,
      offOppFta,
      offOppTo,
      offOppOreb,
    );

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
      netDifferential: (onNet - offNet).toFixed(1),
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

/**
 * 🏀 Assistant Coach: Analytical Models
 */

export interface ClutchPlay {
  playName: string;
  ppp: number;
  efg: number;
  frequency: number;
  targetMismatches: string[];
}

export const calculateClutchPlaybookRanking = (
  stats: StatEvent[],
  _clutchThresholdSeconds = 240, // Final 4 mins
  matchups: MatchupStats[] = [],
): ClutchPlay[] => {
  const sorted = sortStats(stats);
  const playStats = new Map<string, { points: number; attempts: number; makes: number; frequency: number }>();

  // Identify the weakest active defenders
  const weakDefenders = matchups
    .filter(m => m.isOpponentDefender && m.possessions >= 3 && parseFloat(m.stopPct) < 35)
    .map(m => m.opponentPlayerId);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s) || !s.playName) continue;

    let data = playStats.get(s.playName);
    if (!data) {
      data = { points: 0, attempts: 0, makes: 0, frequency: 0 };
      playStats.set(s.playName, data);
    }

    data.frequency++;
    if (isFieldGoal(s)) {
      data.attempts++;
      data.points += s.points;
      if (s.type === ACTION_TYPES.MAKE) data.makes++;
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      data.attempts++; // TO counts as a failed possession
    }
  }

  return Array.from(playStats.entries())
    .map(([playName, data]) => {
      const ppp = data.attempts > 0 ? data.points / data.attempts : 0;
      const efg = data.attempts > 0 ? (data.makes + 0.5 * (data.makes)) / data.attempts : 0; // Simplified
      return {
        playName,
        ppp,
        efg,
        frequency: data.frequency,
        targetMismatches: weakDefenders
      };
    })
    .sort((a, b) => b.ppp - a.ppp)
    .slice(0, 3);
};

export interface OfficiatingStats {
  teamFouls: number;
  oppFouls: number;
  teamFoulPct: number;
  oppFoulPct: number;
  fpm: number;
  tightness: "LOW" | "NORMAL" | "HIGH";
}

export const calculateOfficiatingStats = (
  stats: StatEvent[],
  totalMinutes: number
): OfficiatingStats => {
  const teamFouls = stats.filter(s => isActive(s) && !isOpponentId(s.playerId) && s.type === ACTION_TYPES.FOUL).length;
  const oppFouls = stats.filter(s => isActive(s) && isOpponentId(s.playerId) && s.type === ACTION_TYPES.FOUL).length;
  const totalFouls = teamFouls + oppFouls;

  const fpm = totalMinutes > 0 ? totalFouls / totalMinutes : 0;
  const baseline = ANALYTICAL_BASELINES.BASELINE_FPM;

  let tightness: "LOW" | "NORMAL" | "HIGH" = "NORMAL";
  if (fpm > baseline * 1.3) tightness = "HIGH";
  else if (fpm < baseline * 0.7) tightness = "LOW";

  return {
    teamFouls,
    oppFouls,
    teamFoulPct: totalFouls > 0 ? (teamFouls / totalFouls) * 100 : 50,
    oppFoulPct: totalFouls > 0 ? (oppFouls / totalFouls) * 100 : 50,
    fpm,
    tightness
  };
};

export interface PaceAnalytics {
  pace: number;
  tempoDelta: number;
  paceShift: boolean;
}

export const calculatePaceAnalytics = (
  possessions: number,
  period: number,
  clockSeconds: number,
  periodLength: number,
  targetPace: number,
  allStats: StatEvent[]
): PaceAnalytics => {
  const safePeriodLength = periodLength || 10;
  const safeClockSeconds = clockSeconds || 0;
  const elapsedMinutes = Math.max(0.1, (period - 1) * safePeriodLength + (safePeriodLength - safeClockSeconds / 60));
  const currentPace = (possessions / 2 / elapsedMinutes) * 40;

  // Pace Shift Detection: Compare current period pace to overall pace
  let paceShift = false;
  if (period >= 1) {
    const currentPeriodStats = allStats.filter(s => s.period === period);
    let pFga = 0, pFta = 0, pTo = 0, pOreb = 0;
    for (let i = 0; i < currentPeriodStats.length; i++) {
      const s = currentPeriodStats[i];
      if (!isActive(s)) continue;
      if (isFieldGoal(s)) pFga++;
      else if (isFreeThrow(s)) pFta++;
      else if (s.type === ACTION_TYPES.TURNOVER) pTo++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) pOreb++;
    }
    const currentPeriodPossessions = calculatePossessions(pFga, pFta, pTo, pOreb) / 2;
    const elapsedPeriodMins = Math.max(0.1, safePeriodLength - safeClockSeconds / 60);
    const periodPace = (currentPeriodPossessions / elapsedPeriodMins) * 40;

    if (currentPace > 0 && Math.abs(periodPace - currentPace) / currentPace > 0.15) {
      paceShift = true;
    }
  }

  return {
    pace: currentPace || 0,
    tempoDelta: (currentPace || 0) - targetPace,
    paceShift
  };
};