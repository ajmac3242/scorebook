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
  TalkingPoint,
  PracticeFocusArea,
  GameAnalyticsContext,
  LineupAggregates,
} from "./types";

/**
 * 🏀 Assistant Coach: Tactical Goal Status Calculation
 * Evaluates live KPIs against user-defined goals.
 */
export const calculateTacticalGoalStatus = (params: {
  stats: StatEvent[];
  goals: { metric: string; threshold: number; direction: "above" | "below" }[];
}) => {
  const { stats, goals } = params;

  // ⚡ Bolt: Single pass to get team totals for KPIs
  let fga = 0,
    fta = 0,
    to = 0,
    oreb = 0,
    pts = 0;
  let oppFga = 0,
    oppThreePM = 0,
    oppMakes = 0;
  let oppDreb = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    const isOpp = isOpponentId(s.playerId);

    if (isOpp) {
      if (isFieldGoal(s)) {
        oppFga++;
        if (s.type === ACTION_TYPES.MAKE) {
          oppMakes++;
          if (s.points === 3) oppThreePM++;
        }
      } else if (s.type === ACTION_TYPES.DEF_REBOUND) {
        oppDreb++;
      }
    } else {
      if (s.type === ACTION_TYPES.MAKE) {
        pts += s.points || 0;
        if (s.points !== 1) fga++;
        else fta++;
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points !== 1) fga++;
        else fta++;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        to++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        oreb++;
      }
    }
  }

  const possessions = calculatePossessions(fga, fta, to, oreb);
  const ppp = calculatePpp(pts, possessions);
  const toRate =
    possessions > 0 ? ((to / possessions) * 100).toFixed(1) : "0.0";
  const orebPct =
    oreb + oppDreb > 0 ? ((oreb / (oreb + oppDreb)) * 100).toFixed(1) : "0.0";
  const oppEfg = calculateEfgPct(oppMakes, oppThreePM, oppFga);

  const kpis: Record<string, string> = {
    "OREB%": orebPct,
    "TO Rate": toRate,
    "Opp eFG%": oppEfg,
    PPP: ppp,
  };

  return goals.map((goal) => {
    const currentVal = parseFloat(kpis[goal.metric] || "0");
    const isMet =
      goal.direction === "above"
        ? currentVal >= goal.threshold
        : currentVal <= goal.threshold;

    return {
      ...goal,
      currentValue: currentVal,
      isMet,
    };
  });
};

/**
 * 🏀 Assistant Coach: Opponent Archetype Recognition
 * Analyzes shot distribution to identify defensive focus areas.
 */
export const analyzeOpponentArchetype = (stats: StatEvent[]) => {
  let rimAttempts = 0;
  let threeAttempts = 0;
  let totalAttempts = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (
      !isActive(s) ||
      !isOpponentId(s.playerId) ||
      (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS) ||
      s.points === 1
    )
      continue;

    totalAttempts++;
    if (s.points === 3) {
      threeAttempts++;
    } else {
      const dist = Math.sqrt(
        Math.pow((s.locationX || 0) * 5 - 250, 2) +
          Math.pow((s.locationY || 0) * 4.7 - 140, 2),
      );
      if (dist <= 100) rimAttempts++;
    }
  }

  if (totalAttempts < 5) return "Scouting...";

  const rimRate = rimAttempts / totalAttempts;
  const threeRate = threeAttempts / totalAttempts;

  if (rimRate > 0.45)
    return { type: "Rim-Heavy Slashing", suggestion: "Pack the paint / Zone" };
  if (threeRate > 0.4)
    return {
      type: "Long-Range Marksmen",
      suggestion: "Stay home / No help off shooters",
    };
  if (rimRate < 0.2 && threeRate < 0.2)
    return {
      type: "Mid-Range Specialists",
      suggestion: "Hand in face / Contest all",
    };
  return {
    type: "Balanced Attack",
    suggestion: "Stay disciplined on rotations",
  };
};

/**
 * 🏀 Assistant Coach: Predictive Fatigue Decay Modeler
 * WHY: Correlates live stint duration with a drop in performance.
 */
export const calculateFatigueDecay = (
  stintSeconds: number,
  maxStintMinutes: number,
) => {
  const maxSecs = maxStintMinutes * 60;
  if (stintSeconds < maxSecs * 0.75) return 100; // Fresh

  // Decay begins at 75% of max stint
  const decayStart = maxSecs * 0.75;
  const decayRange = maxSecs * 0.5; // Over-extended by 50%
  const elapsedInDecay = Math.max(0, stintSeconds - decayStart);

  // Linear decay to 60% efficiency
  const efficiency = Math.max(60, 100 - (elapsedInDecay / decayRange) * 40);
  return Math.round(efficiency);
};

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
  gameData: GameAnalyticsContext;
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

  // 3. Time to Sub fatigue alerts (with Proactive Sub Alerts)
  gameData.onCourtIds.forEach((pId: string) => {
    const duration = gameData.stintDurations.get(pId) || 0;
    const maxSecs = maxStintDuration * 60;

    if (duration > maxSecs) {
      alerts.push({
        id: `fatigue-${pId}`,
        type: "FATIGUE",
        severity: "error",
        message: `RED LINE: #${jerseyMap.get(pId)} over-extended (${Math.floor(duration / 60)}m)`,
        playerId: pId,
        jerseyNumber: jerseyMap.get(pId),
      });
    } else if (duration > maxSecs - 120) {
      // 2 minute warning
      alerts.push({
        id: `proactive-sub-${pId}`,
        type: "FATIGUE",
        severity: "warning",
        message: `Proactive Sub: #${jerseyMap.get(pId)} near red-line`,
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

/**
 * 🏀 Assistant Coach: Executive Halftime Talking Points Generator
 * WHY: Halftime is only 10 minutes. Coaches need automated synthesis of complex data
 * into 3 punchy, actionable directives for the locker room.
 */
export const generateHalftimeTalkingPoints = (params: {
  teamPpp: string;
  seasonPpp: string;
  opponentThreats: OpponentThreat[];
  topLineups: LineupAggregates[];
  jerseyMap: Map<string, string | undefined>;
}): TalkingPoint[] => {
  const points: TalkingPoint[] = [];
  const { teamPpp, seasonPpp, opponentThreats, topLineups, jerseyMap } = params;

  const pppDiff = parseFloat(teamPpp) - parseFloat(seasonPpp);

  // 1. Offensive Insight
  if (pppDiff < -0.1) {
    points.push({
      type: "OFFENSE",
      text: "Efficiency is down; stop settling.",
      insight: `eFG% is low because too many possessions are ending in contested shots. Move the ball to find Open shots (current PPP: ${teamPpp} vs Season: ${seasonPpp}).`,
    });
  } else {
    points.push({
      type: "OFFENSE",
      text: "Maintain offensive pressure.",
      insight: `The offense is clicking at ${teamPpp} PPP. Continue attacking the rim and playing through the hot hand.`,
    });
  }

  // 2. Defensive Insight
  if (opponentThreats.length > 0) {
    const mainThreat = opponentThreats.sort((a, b) => b.points - a.points)[0];
    const jersey = mainThreat.playerId.includes(":")
      ? mainThreat.playerId.split(":")[1]
      : "??";
    points.push({
      type: "DEFENSE",
      text: `Neutralize Opponent #${jersey}.`,
      insight: `Opponent #${jersey} has ${mainThreat.points} points and is finding easy looks. We need to tighten the matchup or double on the catch.`,
    });
  } else {
    points.push({
      type: "DEFENSE",
      text: "Solid defensive discipline.",
      insight:
        "No single opponent is dominating. Stay focused on rotations and boxing out to limit second-chance points.",
    });
  }

  // 3. Lineup Insight
  if (topLineups.length > 0) {
    const best = topLineups[0];
    const jerseys = best.lineup
      .map((id) => jerseyMap.get(id) || "??")
      .join(",");
    points.push({
      type: "LINEUP",
      text: `Utilize Lineup [${jerseys}].`,
      insight: `This unit is +${best.netRating} this half. Consider starting the 3rd with them to establish momentum.`,
    });
  } else {
    points.push({
      type: "LINEUP",
      text: "Rotation adjustments needed.",
      insight:
        "No lineup has established a clear advantage. Look to shorten the rotation in the second half to your most reliable performers.",
    });
  }

  return points;
};

/**
 * 🔨 Forge: Integrated Practice Prescription Engine
 * WHY: The best coaches use game data to plan the next practice. This closes the loop
 * by suggesting specific drills based on the team statistical failures.
 */
export const generatePracticePrescription = (params: {
  gameStats: PlayerAggregates[];
  teamStats: { ftPct: string; turnoverRate: string; orebPct: string };
  seasonAverages: { ftPct: string; turnoverRate: string; orebPct: string };
}): PracticeFocusArea[] => {
  const focusAreas: PracticeFocusArea[] = [];
  const { teamStats, seasonAverages } = params;

  // FT% Check
  if (parseFloat(teamStats.ftPct) < parseFloat(seasonAverages.ftPct) - 10) {
    focusAreas.push({
      metric: "Free Throw %",
      value: `${teamStats.ftPct}%`,
      average: `${seasonAverages.ftPct}%`,
      drill: "Pressure Free Throws",
      description:
        "Run a full-court sprint between every two free throws. Must make 10 in a row to finish.",
    });
  }

  // Turnover Check
  if (
    parseFloat(teamStats.turnoverRate) >
    parseFloat(seasonAverages.turnoverRate) + 5
  ) {
    focusAreas.push({
      metric: "Turnover Rate",
      value: `${teamStats.turnoverRate}%`,
      average: `${seasonAverages.turnoverRate}%`,
      drill: "3-on-2 Transition Continuous",
      description:
        "High-speed transition drill focusing on ball security and decision-making under pressure.",
    });
  }

  // Offensive Rebounding Check
  if (parseFloat(teamStats.orebPct) < parseFloat(seasonAverages.orebPct) - 5) {
    focusAreas.push({
      metric: "Offensive Rebound %",
      value: `${teamStats.orebPct}%`,
      average: `${seasonAverages.orebPct}%`,
      drill: "Find the Body / War Drill",
      description:
        "Physical rebounding drill emphasizing box-outs and aggressive pursuit of the ball.",
    });
  }

  return focusAreas;
};
