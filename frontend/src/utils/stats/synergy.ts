import { StatEvent } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";
import { sortStats, isActive, isOpponentId, getPeriodLen } from "./core";
import { calculatePossessions } from "../stats";

export interface SynergyUnit {
  lineup: string[];
  size: number;
  seconds: number;
  pointsFor: number;
  pointsAgainst: number;
  defensiveStops: number;
  possessions: number;
  dRtg: string;
  netRating: string;
}

/**
 * 🏀 Assistant Coach: calculateSynergyStats
 * Why: Analyzes 2-player and 3-player unit performance to find defensive synergy.
 * Coaches need to know which combinations anchor the defense effectively.
 */
export const calculateSynergyStats = (
  stats: StatEvent[],
  unitSize: 2 | 3,
  options: {
    periodLength?: number;
    overtimeLength?: number;
    periodType?: string;
  } = {}
): SynergyUnit[] => {
  const sorted = sortStats(stats);
  const unitStats = new Map<string, {
    seconds: number;
    pointsFor: number;
    pointsAgainst: number;
    fga: number;
    fta: number;
    to: number;
    oreb: number;
    stops: number;
  }>();

  let currentLineup = new Set<string>();
  let lastClockTime = getPeriodLen(1, options);
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  const scores = { team: 0, opp: 0 };
  let lastTeamScore = 0;
  let lastOppScore = 0;

  // Track possession state for stops
  let inOpponentPossession = false;

  const getCombinations = (players: string[], size: number): string[][] => {
    const results: string[][] = [];
    const f = (start: number, prev: string[]) => {
      if (prev.length === size) {
        results.push(prev);
        return;
      }
      for (let i = start; i < players.length; i++) {
        f(i + 1, [...prev, players[i]]);
      }
    };
    f(0, []);
    return results;
  };

  const recordStint = (duration: number, ptsFor: number, ptsAgn: number, fga: number, fta: number, to: number, oreb: number, stops: number) => {
    if (currentLineup.size < unitSize) return;
    const players = Array.from(currentLineup).sort();
    const combos = getCombinations(players, unitSize);

    for (const combo of combos) {
      const key = combo.join(",");
      let agg = unitStats.get(key);
      if (!agg) {
        agg = { seconds: 0, pointsFor: 0, pointsAgainst: 0, fga: 0, fta: 0, to: 0, oreb: 0, stops: 0 };
        unitStats.set(key, agg);
      }
      agg.seconds += duration;
      agg.pointsFor += ptsFor;
      agg.pointsAgainst += ptsAgn;
      agg.fga += fga;
      agg.fta += fta;
      agg.to += to;
      agg.oreb += oreb;
      agg.stops += stops;
    }
  };

  let pendingDuration = 0;
  let pendingPtsFor = 0;
  let pendingPtsAgainst = 0;
  let pendingFga = 0;
  let pendingFta = 0;
  let pendingTo = 0;
  let pendingOreb = 0;
  let pendingStops = 0;

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      recordStint(pendingDuration, pendingPtsFor, pendingPtsAgainst, pendingFga, pendingFta, pendingTo, pendingOreb, pendingStops);
      currentGameId = s.gameId;
      currentLineup.clear();
      lastClockTime = getPeriodLen(1, options);
      currentPeriod = 1;
      scores.team = 0;
      scores.opp = 0;
      lastTeamScore = 0;
      lastOppScore = 0;
      pendingDuration = 0; pendingPtsFor = 0; pendingPtsAgainst = 0;
      pendingFga = 0; pendingFta = 0; pendingTo = 0; pendingOreb = 0; pendingStops = 0;
    }

    if (s.period > currentPeriod) {
      recordStint(lastClockTime, scores.team - lastTeamScore, scores.opp - lastOppScore, pendingFga, pendingFta, pendingTo, pendingOreb, pendingStops);
      lastClockTime = getPeriodLen(s.period, options);
      currentPeriod = s.period;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
      pendingFga = 0; pendingFta = 0; pendingTo = 0; pendingOreb = 0; pendingStops = 0;
    }

    if (s.clockTime !== undefined) {
      const diff = lastClockTime - s.clockTime;
      pendingDuration += diff;
      lastClockTime = s.clockTime;
    }

    const isOpp = isOpponentId(s.playerId);
    if (s.type === ACTION_TYPES.MAKE) {
      const pts = s.points || 0;
      if (isOpp) {
        scores.opp += pts;
        pendingPtsAgainst += pts;
        inOpponentPossession = false;
      } else {
        scores.team += pts;
        pendingPtsFor += pts;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isOpp) {
        inOpponentPossession = true;
      }
    } else if (s.type === ACTION_TYPES.TURNOVER) {
      if (isOpp) {
        pendingStops++;
        pendingTo++;
        inOpponentPossession = false;
      }
    } else if (s.type === ACTION_TYPES.DEF_REBOUND) {
      if (!isOpp && inOpponentPossession) {
        pendingStops++;
        inOpponentPossession = false;
      }
    }

    if (isOpp) {
      if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) pendingFta++;
        else pendingFga++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        pendingOreb++;
      }
    }

    if (s.type === ACTION_TYPES.SUB_IN) {
      if (!isOpp) {
        recordStint(pendingDuration, pendingPtsFor, pendingPtsAgainst, pendingFga, pendingFta, pendingTo, pendingOreb, pendingStops);
        currentLineup.add(s.playerId);
        pendingDuration = 0; pendingPtsFor = 0; pendingPtsAgainst = 0;
        pendingFga = 0; pendingFta = 0; pendingTo = 0; pendingOreb = 0; pendingStops = 0;
      }
    } else if (s.type === ACTION_TYPES.SUB_OUT) {
      if (!isOpp) {
        recordStint(pendingDuration, pendingPtsFor, pendingPtsAgainst, pendingFga, pendingFta, pendingTo, pendingOreb, pendingStops);
        currentLineup.delete(s.playerId);
        pendingDuration = 0; pendingPtsFor = 0; pendingPtsAgainst = 0;
        pendingFga = 0; pendingFta = 0; pendingTo = 0; pendingOreb = 0; pendingStops = 0;
      }
    }
  }

  // Final stint
  recordStint(pendingDuration, pendingPtsFor, pendingPtsAgainst, pendingFga, pendingFta, pendingTo, pendingOreb, pendingStops);

  return Array.from(unitStats.entries()).map(([key, agg]) => {
    const possessions = calculatePossessions(agg.fga, agg.fta, agg.to, agg.oreb);
    const dRtg = possessions > 0 ? (agg.pointsAgainst / possessions) * 100 : 0;
    const oRtg = possessions > 0 ? (agg.pointsFor / possessions) * 100 : 0;

    return {
      lineup: key.split(","),
      size: unitSize,
      seconds: agg.seconds,
      pointsFor: agg.pointsFor,
      pointsAgainst: agg.pointsAgainst,
      defensiveStops: agg.stops,
      possessions: Math.round(possessions),
      dRtg: dRtg.toFixed(1),
      netRating: (oRtg - dRtg).toFixed(1),
    };
  });
};
