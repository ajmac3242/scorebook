/**
 * @file types.ts
 * @description Type definitions for the statistics engine.
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

export interface BonusStatus {
  label: string;
  isBonus: boolean;
  isDouble: boolean;
  color: string;
}

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

export interface PlayEfficiency {
  name: string;
  attempts: number;
  makes: number;
  points: number;
  ppp: string;
  efg: string;
}

export interface OpponentThreat {
  playerId: string;
  points: number;
  makes: number;
  consecutiveMakes: number;
  straightPoints: number;
  isHot: boolean;
}

export interface HaltAlert {
  id: string;
  type: "FOUL" | "BONUS" | "FATIGUE" | "CLUTCH";
  severity: "warning" | "error" | "info";
  message: string;
  playerId?: string;
  jerseyNumber?: string;
}

export interface TalkingPoint {
  type: "OFFENSE" | "DEFENSE" | "LINEUP";
  text: string;
  insight: string;
}

export interface PracticeFocusArea {
  metric: string;
  value: string;
  average: string;
  drill: string;
  description: string;
}

export interface GameAnalyticsContext {
  onCourtIds: Set<string>;
  teamFoulStats: {
    oppFouls: number;
    [key: string]: string | number | boolean | undefined;
  };
  stintDurations: Map<string, number>;
  currentScore: number;
  opponentScore: number;
}

export interface LineupAggregates {
  lineup: string[]; // Player IDs
  pointsFor: number;
  pointsAgainst: number;
  netRating: number;
  seconds: number;
  netRatingPer40: string;
}

export interface BaseStats {
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
