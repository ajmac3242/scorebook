/**
 * @file stats.ts (constants)
 * @description Defines constants for statistical acronyms and game action types.
 * These are shared across the UI and data aggregation logic.
 */

/**
 * Standardized acronyms for basketball statistics.
 */
export const STAT_ACRONYMS = {
  POINTS: "PTS",
  REBOUNDS: "REB",
  ASSISTS: "AST",
  STEALS: "STL",
  BLOCKS: "BLK",
  TURNOVERS: "TO",
  FIELD_GOALS_MADE: "FGM",
  FIELD_GOALS_ATTEMPTED: "FGA",
  FIELD_GOAL_PERCENTAGE: "FG%",
  FREE_THROWS_MADE: "FTM",
  FREE_THROWS_ATTEMPTED: "FTA",
  FREE_THROW_PERCENTAGE: "FT%",
  THREE_POINTERS_MADE: "3PM",
  THREE_POINTERS_ATTEMPTED: "3PA",
  THREE_POINTER_PERCENTAGE: "3P%",
  PERSONAL_FOULS: "PF",
  TECHNICAL_FOUL: "TF",
  MINUTES: "MIN",
};

/**
 * Shot quality tags.
 */
export const SHOT_QUALITY = {
  OPEN: "OPEN",
  CONTESTED: "CONTESTED",
};

/**
 * Supported game action types that can be recorded as events.
 */
export const ACTION_TYPES = {
  MAKE: "MAKE",
  MISS: "MISS",
  REBOUND: "REBOUND",
  OFF_REBOUND: "OFF_REBOUND",
  DEF_REBOUND: "DEF_REBOUND",
  ASSIST: "ASSIST",
  STEAL: "STEAL",
  TURNOVER: "TURNOVER",
  BLOCK: "BLOCK",
  FOUL: "FOUL",
  FOUL_SHOOTING: "FOUL_SHOOTING",
  FOUL_NON_SHOOTING: "FOUL_NON_SHOOTING",
  TECHNICAL_FOUL: "TECHNICAL_FOUL",
  TIMEOUT: "TIMEOUT",
  SUB_IN: "SUB_IN",
  SUB_OUT: "SUB_OUT",
  POSSESSION: "POSSESSION",
  MATCHUP: "MATCHUP",
  DEFLECTION: "DEFLECTION",
  FLOOR_DIVE: "FLOOR_DIVE",
  CHARGE_TAKEN: "CHARGE_TAKEN",
  GREAT_CONTEST: "GREAT_CONTEST",
};

/**
 * Opponent Play Types.
 */
export const PLAY_TYPES = {
  PNR: "PnR",
  ISO: "ISO",
  POST: "Post",
  TRANSITION: "Transition",
  OFF_SCREEN: "Off-Screen",
};

/**
 * Standardized IDs for special players.
 */
export const SPECIAL_PLAYER_IDS = {
  OPPONENT: "OPPONENT",
  TEAM_TIMEOUT: "TEAM_TIMEOUT",
  OUR_TEAM: "OUR_TEAM",
};

/**
 * Bonus status configuration based on foul counts and period type.
 */
export const BONUS_CONFIG: Record<
  string,
  { double: number; single: number; warning: number }
> = {
  QUARTERS: { double: 999, single: 5, warning: 4 },
  HALVES: { double: 10, single: 7, warning: 6 },
};
