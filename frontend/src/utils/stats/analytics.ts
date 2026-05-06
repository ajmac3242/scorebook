/**
 * @file analytics.ts
 * @description Advanced analytics and situational metrics.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent, Player } from "../../db";
import { formatClock } from "../mathUtils";
import {
  isActive,
  isOpponentId,
  isScoringEvent,
  isFieldGoal,
  calculatePossessions,
  calculatePpp,
  calculateEfgPct,
  applyActionToAggregate,
  calculateFgPct,
} from "./aggregators";
import {
  OpponentAggregates,
  PlayEfficiency,
  OpponentThreat,
  ScoreFlowPoint,
  PlayerAggregates,
  HaltAlert,
} from "./types";

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
      agg = {
        points: 0,
        makes: 0,
        attempts: 0,
        fgPct: "0.0",
        rebounds: 0,
        offRebounds: 0,
        defRebounds: 0,
        assists: 0,
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
      };
      result.set(pId, agg);
    }

    applyActionToAggregate(agg, s);
  }

  for (const agg of result.values()) {
    const possessions = calculatePossessions(
      agg.attempts,
      agg.fta,
      agg.turnovers,
      agg.offRebounds,
    );
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
      const possessions = calculatePossessions(
        s.attempts,
        s.fta,
        s.turnovers,
        0,
      );
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

export const calculateOpponentThreats = (
  stats: StatEvent[],
): OpponentThreat[] => {
  const threats = new Map<string, OpponentThreat>();
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      threats.clear();
    }

    const isOpp = isOpponentId(s.playerId);

    if (!isOpp && isScoringEvent(s)) {
      for (const t of threats.values()) {
        t.straightPoints = 0;
      }
      continue;
    }

    if (!isOpp) continue;

    const pId = s.playerId;
    if (!threats.has(pId)) {
      threats.set(pId, {
        playerId: pId,
        points: 0,
        makes: 0,
        consecutiveMakes: 0,
        straightPoints: 0,
        isHot: false,
      });
    }

    const t = threats.get(pId)!;
    if (s.type === ACTION_TYPES.MAKE) {
      t.points += s.points || 0;
      t.straightPoints += s.points || 0;
      if (isFieldGoal(s)) {
        t.makes++;
        t.consecutiveMakes++;
      }
      if (t.points >= 8 || t.consecutiveMakes >= 3 || t.straightPoints >= 6) {
        t.isHot = true;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isFieldGoal(s)) {
        t.consecutiveMakes = 0;
      }
    }
  }

  return Array.from(threats.values()).filter((t) => t.isHot);
};

export const calculateScoreFlow = (
  stats: StatEvent[],
  periodLengthMinutes: number = 10,
): ScoreFlowPoint[] => {
  const scores = { team: 0, opp: 0 };
  const result: ScoreFlowPoint[] = [
    { time: "00:00", Team: 0, Opponent: 0, Spread: 0 },
  ];
  const periodLenSecs = periodLengthMinutes * 60;

  const team = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const opp = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const currentLineup = new Set<string>();

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    if (!isActive(stat)) continue;

    const isOpp = isOpponentId(stat.playerId);
    const pts = stat.points || 0;

    if (stat.type === ACTION_TYPES.MAKE) {
      if (isOpp) scores.opp += pts;
      else scores.team += pts;
    }

    const { type } = stat;
    if (isFieldGoal(stat)) {
      if (isOpp) opp.fga++;
      else team.fga++;
    } else if (
      stat.points === 1 &&
      (type === ACTION_TYPES.MAKE || type === ACTION_TYPES.MISS)
    ) {
      if (isOpp) opp.fta++;
      else team.fta++;
    } else if (type === ACTION_TYPES.TURNOVER) {
      if (isOpp) opp.to++;
      else team.to++;
    } else if (type === ACTION_TYPES.OFF_REBOUND) {
      if (isOpp) opp.oreb++;
      else team.oreb++;
    }

    if (stat.type === ACTION_TYPES.SUB_IN) {
      currentLineup.add(stat.playerId);
    } else if (stat.type === ACTION_TYPES.SUB_OUT) {
      currentLineup.delete(stat.playerId);
    }

    if (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.TIMEOUT) {
      const period = stat.period || 1;
      const clockTime = stat.clockTime ?? periodLenSecs;
      const elapsedSeconds =
        (period - 1) * periodLenSecs + (periodLenSecs - clockTime);

      const teamPoss = calculatePossessions(
        team.fga,
        team.fta,
        team.to,
        team.oreb,
      );
      const oppPoss = calculatePossessions(opp.fga, opp.fta, opp.to, opp.oreb);

      let eventLabel = stat.type;
      if (stat.type === ACTION_TYPES.MAKE) {
        eventLabel = `${pts}PT MAKE`;
      }

      result.push({
        time: formatClock(elapsedSeconds),
        Team: scores.team,
        Opponent: scores.opp,
        Spread: scores.team - scores.opp,
        event: eventLabel,
        lineup: Array.from(currentLineup),
        teamPpp: calculatePpp(scores.team, teamPoss),
        oppPpp: calculatePpp(scores.opp, oppPoss),
      });
    }
  }
  return result;
};

export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  const isOT = periodType === "QUARTERS" ? eventPeriod > 4 : eventPeriod > 2;
  const isFinal =
    periodType === "QUARTERS" ? eventPeriod === 4 : eventPeriod === 2;

  const isClutchScore = Math.abs(scoreDiff) <= 5;
  const regulationClutchTime = periodType === "QUARTERS" ? 240 : 120;
  const isClutchTime = isOT || clockTime <= regulationClutchTime;

  return (isFinal || isOT) && isClutchTime && isClutchScore;
};

export const calculateHaltAlerts = (params: {
  players: Player[];
  statsMap: Map<string, PlayerAggregates>;
  gameData: any;
  period: number;
  clockSeconds: number;
  periodType: string;
  maxStintDuration: number;
  jerseyMap: Map<string, string | undefined>;
}): HaltAlert[] => {
  const alerts: HaltAlert[] = [];
  const {
    players,
    statsMap,
    gameData,
    period,
    clockSeconds,
    periodType,
    maxStintDuration,
    jerseyMap,
  } = params;

  // 1. Star Player Foul Warning
  players.forEach((p) => {
    if (p.isStar === 1 && gameData.onCourtIds.has(p.id)) {
      const fouls = statsMap.get(p.id!)?.fouls || 0;
      let trigger = false;
      if (period === 1 && fouls >= 2) trigger = true;
      if (period === 2 && fouls >= 3) trigger = true;
      if (fouls >= 4) trigger = true;

      if (trigger) {
        alerts.push({
          id: `foul-${p.id}`,
          type: "FOUL",
          severity: fouls >= 4 ? "error" : "warning",
          message: `Star Foul Trouble: #${jerseyMap.get(p.id!)} (${fouls} PF)`,
          playerId: p.id,
          jerseyNumber: jerseyMap.get(p.id!),
        });
      }
    }
  });

  // 2. Bonus Approaching Alert
  const oppFouls = gameData.teamFoulStats.oppFouls;
  const bonusLimit = periodType === "QUARTERS" ? 5 : 7;
  if (oppFouls === bonusLimit - 1) {
    alerts.push({
      id: "bonus-approaching",
      type: "BONUS",
      severity: "info",
      message: "Opponent in Foul Trouble (4/5)",
    });
  } else if (oppFouls >= bonusLimit) {
    alerts.push({
      id: "in-bonus",
      type: "BONUS",
      severity: "warning",
      message: "BONUS ACTIVE: Attack the Rim",
    });
  }

  // 3. Time to Sub fatigue alerts
  gameData.onCourtIds.forEach((pId: string) => {
    const duration = gameData.stintDurations.get(pId) || 0;
    if (duration > maxStintDuration * 60) {
      alerts.push({
        id: `fatigue-${pId}`,
        type: "FATIGUE",
        severity: "warning",
        message: `Fatigue Alert: #${jerseyMap.get(pId)} (${Math.floor(duration / 60)}m)`,
        playerId: pId,
        jerseyNumber: jerseyMap.get(pId),
      });
    }
  });

  // 4. Clutch Mode Alert
  const isClutch = isClutchEvent(
    period,
    clockSeconds,
    gameData.currentScore - gameData.opponentScore,
    periodType,
  );
  if (isClutch) {
    alerts.push({
      id: "clutch-mode",
      type: "CLUTCH",
      severity: "error",
      message: "🔥 CLUTCH MODE ACTIVE",
    });
  }

  return alerts;
};
