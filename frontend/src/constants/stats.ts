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
  MINUTES: "MIN",
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
  TIMEOUT: "TIMEOUT",
  SUB_IN: "SUB_IN",
  SUB_OUT: "SUB_OUT",
  POSSESSION: "POSSESSION",
};

/**
 * Standardized IDs for special players.
 */
export const SPECIAL_PLAYER_IDS = {
  OPPONENT: "OPPONENT",
  TEAM_TIMEOUT: "TEAM_TIMEOUT",
  OUR_TEAM: "OUR_TEAM",
};
