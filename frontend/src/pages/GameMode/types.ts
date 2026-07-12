import { StatEvent } from "../../db";
import { PlayerAggregates } from "../../utils/stats";

export interface SortConfig {
  key: keyof PlayerAggregates;
  direction: "asc" | "desc";
}

export interface ChainPrompt {
  type: "REBOUND" | "ASSIST" | "HOCKEY_ASSIST";
  originalStat: Pick<StatEvent, "period" | "clockTime" | "timestamp">;
}

export interface PlaybookEfficiency {
  playName: string;
  points: number;
  attempts: number;
  ppp: string;
}

export interface OpponentStat {
  jersey: string;
  points: number;
  fgm: number;
  fga: number;
  turnovers: number;
  fouls: number;
  isHot?: boolean;
  isClutchThreat?: boolean;
}
