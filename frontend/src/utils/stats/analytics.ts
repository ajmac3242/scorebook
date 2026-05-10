/**
 * @file analytics.ts
 * @description Advanced analytics and situational metrics.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent, Player } from "../../db";
import {
  formatClock,
  calculateElapsedMinutes,
  formatToOne,
} from "../mathUtils";
import {
  isActive,
  isOpponentId,
  isScoringEvent,
  isFieldGoal,
  isFoulAction,
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
  DefensiveIntegrity,
  SpecialtyExecution,
  GameAnalyticsContext,
  LineupAggregates,
  SparkPlugIndex,
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

/**
 * 🏀 Forge: Spark Plug Momentum Index
 * WHY: Identify players who trigger team-wide energy shifts via hustle.
 * Calculation: Weighs hustle stats (Dives, Charges, Contests) against
 * immediate subsequent 2-minute team scoring runs.
 */
export const calculateSparkPlugIndex = (
  stats: StatEvent[],
  periodLenMinutes: number = 10,
): SparkPlugIndex[] => {
  const result: Map<string, { hustle: number; momentum: number }> = new Map();
  const periodLenSecs = periodLenMinutes * 60;

  // 1. Identify all hustle events
  const hustleEvents = stats.filter(
    (s) =>
      !s.deletedAt &&
      [
        ACTION_TYPES.FLOOR_DIVE,
        ACTION_TYPES.CHARGE_TAKEN,
        ACTION_TYPES.GREAT_CONTEST,
      ].includes(s.type),
  );

  hustleEvents.forEach((h) => {
    const pId = h.playerId;
    if (!result.has(pId)) result.set(pId, { hustle: 0, momentum: 0 });
    const entry = result.get(pId)!;
    entry.hustle++;

    // 2. Look for team scoring in the next 2 minutes (120s)
    const hTime =
      (h.period - 1) * periodLenSecs + (periodLenSecs - (h.clockTime ?? 0));
    const endTime = hTime + 120;

    const runPoints = stats.reduce((acc, s) => {
      if (
        s.deletedAt ||
        s.type !== ACTION_TYPES.MAKE ||
        isOpponentId(s.playerId)
      )
        return acc;
      const sTime =
        (s.period - 1) * periodLenSecs + (periodLenSecs - (s.clockTime ?? 0));
      if (sTime > hTime && sTime <= endTime) {
        return acc + (s.points || 0);
      }
      return acc;
    }, 0);

    entry.momentum += runPoints;
  });

  return Array.from(result.entries())
    .map(([pId, val]) => ({
      playerId: pId,
      hustleStats: val.hustle,
      momentumScore: val.momentum,
      compositeIndex: Math.round(val.hustle * 2 + val.momentum / 2),
    }))
    .sort((a, b) => b.compositeIndex - a.compositeIndex);
};

/**
 * 🏀 Forge: Matchup Efficiency Logic
 * Calculates Stop % for specific player matchups.
 */
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

    const key = `${defenderId}|${s.playerId}`;
    if (!data[key]) data[key] = { stops: 0, total: 0 };

    if (
      isFieldGoal(s) ||
      (s.type === ACTION_TYPES.MAKE && s.points === 1) ||
      s.type === ACTION_TYPES.TURNOVER
    ) {
      data[key].total++;
      if (s.type === ACTION_TYPES.MISS || s.type === ACTION_TYPES.TURNOVER) {
        data[key].stops++;
      }
    }
  }

  for (const [key, val] of Object.entries(data)) {
    const [tId, oId] = key.split("|");
    result.push({
      teamPlayerId: tId,
      teamPlayerJersey: "", // To be filled by UI
      oppPlayerId: oId,
      oppPlayerJersey: oId.includes(":") ? oId.split(":")[1] : "??",
      stopPct: val.total > 0 ? Math.round((val.stops / val.total) * 100) : 0,
      possessions: val.total,
    });
  }

  return result;
};

export const calculateOpponentThreats = (
  stats: StatEvent[],
  params?: {
    period: number;
    clockTime: number;
    scoreDiff: number;
    periodType: string;
  },
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
        isClutchThreat: false,
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

      const isClutch = params
        ? isClutchEvent(
            params.period,
            params.clockTime,
            params.scoreDiff,
            params.periodType,
          )
        : false;

      if (t.points >= 8 || t.consecutiveMakes >= 3 || t.straightPoints >= 6) {
        t.isHot = true;
      }

      if (isClutch && (t.isHot || t.points >= 10)) {
        t.isClutchThreat = true;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isFieldGoal(s)) {
        t.consecutiveMakes = 0;
      }
    }
  }

  return Array.from(threats.values()).filter(
    (t) => t.isHot || t.isClutchThreat,
  );
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

  if (elapsedMinutes <= 1) return 0;

  const fouls = stats.filter((s) => isActive(s) && isFoulAction(s)).length;

  return fouls / elapsedMinutes;
};

export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  if (Math.abs(scoreDiff) > 5) return false;

  const isOT = periodType === "QUARTERS" ? eventPeriod > 4 : eventPeriod > 2;
  const isFinal =
    periodType === "QUARTERS" ? eventPeriod === 4 : eventPeriod === 2;

  if (!isFinal && !isOT) return false;

  const regulationClutchTime = periodType === "QUARTERS" ? 240 : 120;
  const isClutchTime = isOT || clockTime <= regulationClutchTime;

  return isClutchTime;
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
  const bonusAlert = getBonusAlert(gameData.teamFoulStats.oppFouls, periodType);
  if (bonusAlert) alerts.push(bonusAlert);

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

  // 5. Ref-Identity Conflict Alert
  const isHighPressure =
    gameData.activeDefensiveScheme === "PRESS" ||
    gameData.activeDefensiveScheme === "DOUBLE";

  const elapsedMinutes = calculateElapsedMinutes(
    period,
    clockSeconds,
    periodType,
  );
  const fpm =
    elapsedMinutes > 1
      ? (gameData.teamFoulStats.teamFouls + gameData.teamFoulStats.oppFouls) /
        elapsedMinutes
      : 0;

  if (isHighPressure && fpm > 0.8) {
    alerts.push({
      id: "ref-conflict",
      type: "REF_CONFLICT",
      severity: "error",
      message: "⚠️ REF CONFLICT: Dial Back Pressure",
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

/**
 * 🏀 Assistant Coach: Defensive Integrity Report
 * WHY: Coaches need to know *why* a bucket was allowed to fix it in practice.
 */
export const calculateDefensiveIntegrity = (
  stats: StatEvent[],
): DefensiveIntegrity[] => {
  const data: Record<string, { points: number; frequency: number }> = {};
  let totalPointsAllowed = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp = isOpponentId(s.playerId);
    if (!isOpp) continue;

    totalPointsAllowed += s.points || 0;
    const reason = s.breakdownReason || "Other / Unattributed";

    if (!data[reason]) {
      data[reason] = { points: 0, frequency: 0 };
    }
    data[reason].points += s.points || 0;
    data[reason].frequency += 1;
  }

  return Object.entries(data)
    .map(([reason, d]) => ({
      reason,
      points: d.points,
      frequency: d.frequency,
      percentage:
        totalPointsAllowed > 0
          ? formatToOne((d.points / totalPointsAllowed) * 100)
          : "0.0",
    }))
    .sort((a, b) => b.points - a.points);
};

/**
 * 🏀 Assistant Coach: Specialty Execution Analytical Engine
 * WHY: Designing the perfect play is useless if you don't know if it works.
 */
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
      const possessions = calculatePossessions(
        s.attempts,
        s.fta,
        s.turnovers,
        0,
      );
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
            ? formatToOne((s.successes / possessions) * 100)
            : "0.0",
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
};

/**
 * Helper to determine if a bonus alert should be displayed.
 */
function getBonusAlert(
  oppFouls: number,
  periodType: string,
): HaltAlert | undefined {
  const bonusLimit = periodType === "QUARTERS" ? 5 : 7;

  if (oppFouls === bonusLimit - 1) {
    return {
      id: "bonus-approaching",
      type: "BONUS",
      severity: "info",
      message: `Opponent in Foul Trouble (${oppFouls}/${bonusLimit})`,
    };
  }

  if (oppFouls >= bonusLimit) {
    return {
      id: "in-bonus",
      type: "BONUS",
      severity: "warning",
      message: "BONUS ACTIVE: Attack the Rim",
    };
  }

  return undefined;
}
