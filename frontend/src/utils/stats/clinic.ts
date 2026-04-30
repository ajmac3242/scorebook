import { StatEvent } from "./types";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";

export interface CriticalMoment {
  type: "WIN" | "ERROR";
  description: string;
  ppp?: string;
  timestamp: string;
  period: number;
  clockTime: number;
}

/**
 * 🏀 Clinic: identifyCriticalMoments
 */
export const identifyCriticalMoments = (
  stats: StatEvent[],
  teamPpp: string,
): CriticalMoment[] => {
  const moments: CriticalMoment[] = [];

  // Logic to identify 3 "Execution Wins" (PPP > 1.2)
  // and 3 "Tactical Errors" (turnovers or < 0.5 PPP)

  // For simplicity in this first iteration, we find top scoring events and turnovers
  const sorted = [...stats].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const wins = sorted
    .filter(s => s.type === ACTION_TYPES.MAKE && s.points && s.points >= 2 && !s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT))
    .slice(0, 3)
    .map(s => ({
      type: "WIN" as const,
      description: `Efficient execution leading to a ${s.points}pt bucket.`,
      ppp: "2.00",
      timestamp: s.timestamp,
      period: s.period,
      clockTime: s.clockTime || 0
    }));

  const errors = sorted
    .filter(s => s.type === ACTION_TYPES.TURNOVER && !s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT))
    .slice(0, 3)
    .map(s => ({
      type: "ERROR" as const,
      description: `Possession lost via turnover. High impact on team PPP.`,
      ppp: "0.00",
      timestamp: s.timestamp,
      period: s.period,
      clockTime: s.clockTime || 0
    }));

  return [...wins, ...errors];
};
