/**
 * @file analytics.ts
 * @description Entry point for advanced analytics and situational metrics.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";
import { calculateElapsedMinutes } from "../mathUtils";
import {
  isActive,
  isOpponentId,
  isFieldGoal,
  isFoulAction,
  calcPct,
  isFreeThrow,
  isScoringEvent,
} from "./aggregators";

export * from "./analytics/efficiency";
export * from "./analytics/proactive";
export * from "./analytics/coaching";
export * from "./analytics/advanced";

/**
 * 📊 Basketball Analytics: Ref Tightness
 * Measured as Fouls Per Minute (FPM) for both teams combined.
 */
export const calculateRefTightness = (
  stats: StatEvent[],
  period: number,
  clockSeconds: number,
  periodType: string = "QUARTERS",
): number => {
  const elapsedMinutes = calculateElapsedMinutes(
    period,
    clockSeconds,
    periodType,
  );

  if (elapsedMinutes < 0.1) return 0;

  const fouls = stats.filter((s) => isActive(s) && isFoulAction(s)).length;

  return fouls / elapsedMinutes;
};

/**
 * 🏀 Assistant Coach: Archetype Efficiency Logic
 * WHY: Coaches shouldn't just know who is scoring, but *how* to stop them.
 * Calculates Stop % specifically against opponent play types (PnR, ISO, etc.)
 */
export const calculateArchetypeEfficiency = (stats: StatEvent[]) => {
  const data: Record<string, { stops: number; total: number }> = {};

  for (const s of stats) {
    if (!isActive(s) || !isOpponentId(s.playerId) || !s.opponentPlayType)
      continue;

    const defenderId = s.primaryDefenderId;
    if (!defenderId) continue;

    const key = `${defenderId}|${s.opponentPlayType}`;
    if (!data[key]) data[key] = { stops: 0, total: 0 };

    data[key].total++;
    if (s.type === ACTION_TYPES.MISS || s.type === ACTION_TYPES.TURNOVER) {
      data[key].stops++;
    }
  }

  const result: Record<string, Record<string, number>> = {};
  for (const [key, val] of Object.entries(data)) {
    const [dId, playType] = key.split("|");
    if (!result[dId]) result[dId] = {};
    result[dId][playType] = Math.round(
      parseFloat(calcPct(val.stops, val.total)),
    );
  }

  return result;
};

export const calculateMatchupEfficiency = (
  stats: StatEvent[],
  matchups: Record<string, string>,
) => {
  const result: {
    teamPlayerId: string;
    teamPlayerJersey: string;
    oppPlayerId: string;
    oppPlayerJersey: string;
    stopPct: number;
    possessions: number;
  }[] = [];

  const data: Record<string, { stops: number; total: number }> = {};

  for (const s of stats) {
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const defenderId = s.primaryDefenderId || matchups[s.playerId];
    if (!defenderId) continue;

    const isFGA = isFieldGoal(s);
    const isFT = isScoringEvent(s) && isFreeThrow(s);
    const isTO = s.type === ACTION_TYPES.TURNOVER;

    if (!isFGA && !isFT && !isTO) continue;

    const key = `${defenderId}|${s.playerId}`;
    if (!data[key]) data[key] = { stops: 0, total: 0 };

    data[key].total++;
    if (s.type === ACTION_TYPES.MISS || isTO) {
      data[key].stops++;
    }
  }

  for (const [key, val] of Object.entries(data)) {
    const [tId, oId] = key.split("|");
    result.push({
      teamPlayerId: tId,
      teamPlayerJersey: "", // To be filled by UI
      oppPlayerId: oId,
      oppPlayerJersey: oId.includes(":") ? oId.split(":")[1] : "??",
      stopPct: Math.round(parseFloat(calcPct(val.stops, val.total))),
      possessions: val.total,
    });
  }

  return result;
};
