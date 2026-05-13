import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";
import {
  isActive,
  isOpponentId,
  calculatePossessions,
  calculatePpp,
  calculateEfgPct,
  applyActionToAggregate,
  calculateFgPct,
} from "../aggregators";
import {
  OpponentAggregates,
  PlayEfficiency,
  SpecialtyExecution,
} from "../types";

const createEmptyOpponentAggregates = (): OpponentAggregates => ({
  points: 0,
  makes: 0,
  attempts: 0,
  fgPct: "0.0",
  rebounds: 0,
  offRebounds: 0,
  defRebounds: 0,
  assists: 0,
  hockeyAssists: 0,
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

export const calculateOpponentScoutingStats = (
  stats: StatEvent[],
): Map<string, OpponentAggregates> => {
  const result = new Map<string, OpponentAggregates>();

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const pId = s.playerId;
    let agg = result.get(pId);
    if (!agg) {
      agg = createEmptyOpponentAggregates();
      result.set(pId, agg);
    }

    applyActionToAggregate(agg, s);
  }

  for (const agg of result.values()) {
    const possessions =
      agg.attempts + 0.44 * agg.fta + agg.turnovers - agg.offRebounds;
    agg.possessions = Math.round(possessions);
    agg.ppp = calculatePpp(agg.points, possessions);
    agg.fgPct = calculateFgPct(agg.makes, agg.attempts);
  }

  return result;
};

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
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.playName) continue;

    if (!data[s.playName]) {
      data[s.playName] = {
        makes: 0,
        attempts: 0,
        points: 0,
        fta: 0,
        turnovers: 0,
        threePM: 0,
      };
    }

    const play = data[s.playName];
    if (s.type === ACTION_TYPES.MAKE) {
      play.points += s.points || 0;
      if (s.points === 1) {
        play.fta++;
      } else {
        play.makes++;
        play.attempts++;
        if (s.points === 3) {
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
    }
  }

  return Object.entries(data)
    .map(([name, s]) => {
      const possessions = calculatePossessions({
        fga: s.attempts,
        fta: s.fta,
        turnovers: s.turnovers,
        offRebounds: 0,
      });
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

export const calculateSituationalStats = (
  stats: StatEvent[],
  teamPpp: string = "0.00",
): SpecialtyExecution[] => {
  const data: Record<
    string,
    {
      makes: number;
      attempts: number;
      points: number;
      fta: number;
      turnovers: number;
      threePM: number;
      successes: number;
    }
  > = {};

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !s.situation || isOpponentId(s.playerId)) continue;

    if (!data[s.situation]) {
      data[s.situation] = {
        makes: 0,
        attempts: 0,
        points: 0,
        fta: 0,
        turnovers: 0,
        threePM: 0,
        successes: 0,
      };
    }

    const play = data[s.situation];
    if (s.type === ACTION_TYPES.MAKE) {
      play.points += s.points || 0;
      play.successes++;
      if (s.points === 1) {
        play.fta++;
      } else {
        play.makes++;
        play.attempts++;
        if (s.points === 3) {
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
    } else if (s.type === ACTION_TYPES.FOUL_SHOOTING) {
      play.successes++;
    }
  }

  return Object.entries(data)
    .map(([situation, s]) => {
      const possessions = calculatePossessions({
        fga: s.attempts,
        fta: s.fta,
        turnovers: s.turnovers,
        offRebounds: 0,
      });
      const situationalPpp = calculatePpp(s.points, possessions);
      return {
        situation,
        attempts: s.attempts,
        points: s.points,
        ppp: situationalPpp,
        efg: calculateEfgPct(s.makes, s.threePM, s.attempts),
        delta: (parseFloat(situationalPpp) - parseFloat(teamPpp)).toFixed(2),
        successRate:
          possessions > 0
            ? (Math.round((s.successes / possessions) * 1000) / 10).toFixed(1)
            : "0.0",
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
};
