/**
 * @file helpers.ts
 * @description Basic utility and helper functions for statistics engine.
 */

import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  BONUS_CONFIG,
} from "../../constants/stats";
import { StatEvent } from "../../db";
import { BaseStats, BonusStatus } from "./types";

/**
 * Standardized sorting for statistical events based on timestamp.
 */
export const sortStats = (stats: StatEvent[]): StatEvent[] => {
  const priorities: Record<string, number> = {
    [ACTION_TYPES.SUB_IN]: 1,
    [ACTION_TYPES.SUB_OUT]: 3,
  };

  return [...stats].sort((a, b) => {
    if (a.timestamp < b.timestamp) return -1;
    if (a.timestamp > b.timestamp) return 1;

    const pA = priorities[a.type] ?? 2;
    const pB = priorities[b.type] ?? 2;

    return pA - pB;
  });
};

/**
 * Fast prefix check guard for opponent ID identification in hot stat loops.
 *
 * WHY: Avoids calling .startsWith() on non-opponent IDs (which start with numbers/UUIDs or other prefixes),
 * saving CPU string inspection cycles across thousands of stat events per game.
 */
export const isOpponentId = (playerId: string): boolean => {
  if (!playerId) return false;
  if (playerId === SPECIAL_PLAYER_IDS.OPPONENT) return true;
  // ⚡ Bolt: Check first character ('O' = 79) before executing full startsWith string prefix check
  if (playerId.charCodeAt(0) !== 79) return false;
  return playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
};

/**
 * WHY: Guard against soft-deleted events in live stat feeds and database rollbacks.
 */
export const isActive = (stat: StatEvent): boolean => !stat.deletedAt;

/**
 * WHY: Determines whether an event contributes positive score to game totals.
 */
export const isScoringEvent = (stat: StatEvent): boolean =>
  stat.type === ACTION_TYPES.MAKE;

/**
 * Lookup Set for all foul action types (personal, technical, Class A/B).
 * WHY: Set lookup (O(1)) avoids repeated array includes/OR checks in aggregate loops.
 */
const FOUL_TYPES = new Set<string>([
  ACTION_TYPES.FOUL,
  ACTION_TYPES.FOUL_SHOOTING,
  ACTION_TYPES.FOUL_NON_SHOOTING,
  ACTION_TYPES.TECHNICAL_FOUL,
  ACTION_TYPES.TECHNICAL_FOUL_CLASS_A,
  ACTION_TYPES.TECHNICAL_FOUL_CLASS_B,
]);

/**
 * Checks if a statistical action is any form of foul.
 */
export const isFoulAction = (stat: StatEvent): boolean =>
  FOUL_TYPES.has(stat.type);

export const isFreeThrow = (stat: StatEvent): boolean => stat.points === 1;

export const isThreePointAttempt = (stat: StatEvent): boolean =>
  stat.points === 3;

export const isFieldGoal = (stat: StatEvent): boolean =>
  (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.MISS) &&
  !isFreeThrow(stat);

export const calcPct = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return "0.0";
  return (Math.round((numerator / denominator) * 1000) / 10).toFixed(1);
};

export const calculateFgPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

export const calculatePpp = (points: number, possessions: number): string => {
  if (possessions <= 0) return "0.00";
  return (points / possessions).toFixed(2);
};

export const calculatePossessions = (
  fgaOrParams:
    | number
    | { fga: number; fta: number; turnovers: number; offRebounds: number },
  fta: number = 0,
  to: number = 0,
  oreb: number = 0,
): number => {
  const {
    fga,
    fta: freeThrows,
    turnovers,
    offRebounds,
  } = typeof fgaOrParams === "object"
    ? fgaOrParams
    : { fga: fgaOrParams, fta, turnovers: to, offRebounds: oreb };

  return fga + 0.44 * freeThrows + turnovers - offRebounds;
};

export const calculateFtPct = (makes: number, attempts: number): string =>
  calcPct(makes, attempts);

export const calculateEfgPct = (
  makes: number,
  threePM: number,
  attempts: number,
): string => calcPct(makes + 0.5 * threePM, attempts);

export const calculateTsPct = (
  points: number,
  attempts: number,
  fta: number,
): string => calcPct(points, 2 * (attempts + 0.44 * fta));

export const getInitials = (name?: string | null): string => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

/**
 * Resolves a player's display name, handling opponent and team-level identifiers.
 */
export const getPlayerDisplayName = (
  playerId: string,
  playerNamesMap: Map<string | number, string>,
  gameOpponent?: string,
  teamName?: string,
): string => {
  if (playerId === SPECIAL_PLAYER_IDS.OPPONENT) {
    return gameOpponent || "Opponent";
  }
  if (playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
    const jersey = playerId.split(":")[1];
    return `${gameOpponent || "Opponent"} #${jersey}`;
  }
  if (
    playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
    playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
  ) {
    return teamName || "Our Team";
  }
  return playerNamesMap.get(playerId) || "Unknown Player";
};

export const getBonusStatus = (
  fouls: number,
  periodType: string,
  bonusThreshold?: number,
  doubleBonusThreshold?: number,
): BonusStatus => {
  const config = BONUS_CONFIG[periodType] || BONUS_CONFIG.QUARTERS;
  const single = bonusThreshold ?? config.single;
  const double = doubleBonusThreshold ?? config.double;

  if (fouls >= double) {
    return {
      label: "DBL BONUS",
      isBonus: true,
      isDouble: true,
      color: "error.main",
    };
  }

  if (fouls >= single) {
    return {
      label: "BONUS",
      isBonus: true,
      isDouble: false,
      color: "error.main",
    };
  }

  return {
    label: "",
    isBonus: false,
    isDouble: false,
    color: fouls === single - 1 ? "warning.main" : "default",
  };
};

export const updateScores = (
  stat: StatEvent,
  scores: { team: number; opp: number },
) => {
  if (isScoringEvent(stat) || stat.type === ACTION_TYPES.SYSTEM_ADJUSTMENT) {
    const points = stat.points || 0;
    const key = isOpponentId(stat.playerId) ? "opp" : "team";
    scores[key] += points;
  }
};

export const applyActionToAggregate = (agg: BaseStats, stat: StatEvent) => {
  const isMake = stat.type === ACTION_TYPES.MAKE;

  switch (stat.type) {
    case ACTION_TYPES.SYSTEM_ADJUSTMENT:
      agg.points += stat.points || 0;
      break;
    case ACTION_TYPES.REMOVE_FOUL:
      agg.fouls = Math.max(0, agg.fouls - 1);
      break;
    case ACTION_TYPES.MAKE:
    case ACTION_TYPES.MISS:
      if (isFreeThrow(stat)) {
        if (isMake) {
          agg.points += stat.points || 0;
          if (agg.ftm !== undefined) agg.ftm++;
        }
        if (agg.fta !== undefined) agg.fta++;
      } else {
        agg.attempts++;
        if (isMake) {
          agg.points += stat.points || 0;
          agg.makes++;
        }
        if (isThreePointAttempt(stat)) {
          if (agg.threePA !== undefined) agg.threePA++;
          if (isMake && agg.threePM !== undefined) agg.threePM++;
        }
      }
      break;
    case ACTION_TYPES.REBOUND:
    case ACTION_TYPES.OFF_REBOUND:
    case ACTION_TYPES.DEF_REBOUND:
      agg.rebounds++;
      if (stat.type === ACTION_TYPES.OFF_REBOUND) agg.offRebounds++;
      if (stat.type === ACTION_TYPES.DEF_REBOUND) agg.defRebounds++;
      break;
    case ACTION_TYPES.BLOCK:
      agg.blocks++;
      break;
    case ACTION_TYPES.ASSIST:
      agg.assists++;
      break;
    case ACTION_TYPES.HOCKEY_ASSIST:
      if (agg.hockeyAssists !== undefined) agg.hockeyAssists++;
      break;
    case ACTION_TYPES.STEAL:
      agg.steals++;
      break;
    case ACTION_TYPES.TURNOVER:
      agg.turnovers++;
      break;
    default:
      if (
        isFoulAction(stat) &&
        stat.type !== ACTION_TYPES.TECHNICAL_FOUL_CLASS_B
      ) {
        agg.fouls++;
      }
      break;
  }
};

export const isEventInPeriod = (
  eventPeriod: number,
  currentPeriod: number,
  periodType: string,
): boolean => {
  const isHalves = periodType === "HALVES";
  const regularEndPeriod = isHalves ? 2 : 4;

  if (currentPeriod <= regularEndPeriod) {
    return eventPeriod === currentPeriod;
  }

  return eventPeriod >= regularEndPeriod && eventPeriod <= currentPeriod;
};
