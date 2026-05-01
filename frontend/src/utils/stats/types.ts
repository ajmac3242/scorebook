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

export interface MatchupStats {
  ourPlayerId: string;
  oppPlayerId: string;
  possessions: number;
  pointsAllowed: number;
  pppAllowed: string;
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
  min: number;
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

export interface TargetAttack {
  targetOpponentId: string;
  pppAllowed: string;
  suggestedAttackerId: string;
  reason: string;
}

export interface PlayerStint {
  playerId: string;
  start: number;
  end: number;
  period: number;
  plusMinus: number;
}

export interface PlayEfficiency {
  playType: string;
  makes: number;
  attempts: number;
  points: number;
  ppp: string;
  efg: string;
}

export interface SchemeEfficiency {
  scheme: string;
  possessions: number;
  pointsAllowed: number;
  pppAllowed: string;
}

export interface OpponentThreat {
  playerId: string;
  points: number;
  makes: number;
  consecutiveMakes: number;
  straightPoints: number;
  isHot: boolean;
}

export interface ScoringRun {
  team: "TEAM" | "OPPONENT";
  points: number;
  startClock: number;
  endClock: number;
  period: number;
}

export interface OpponentTendency {
  playerId: string;
  drivePct: string;
  catchAndShootPct: string;
  postUpPct: string;
  preferredSide: "LEFT" | "RIGHT" | "CENTER";
}

export interface LineupAggregates {
  lineup: string[];
  possessions: number;
  pointsFor: number;
  pointsAgn: number;
  plusMinus: number;
  ppp: string;
  oppPpp: string;
  min: number;
}

export interface OnOffImpact {
  playerId: string;
  playerName: string;
  onPpp: string;
  offPpp: string;
  netImpact: string;
}

export interface ClutchPlay {
  playType: string;
  ppp: string;
  frequency: string;
}

export interface OfficiatingStats {
  tightness: "LOW" | "MEDIUM" | "HIGH";
  foulsPerMinute: string;
  disparity: number;
}

export interface PaceAnalytics {
  pace: number;
  transitionFrequency: string;
  halfCourtPpp: string;
}
