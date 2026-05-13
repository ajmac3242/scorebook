import { StatEvent } from "../../../db";
import { isActive, isOpponentId, calcPct, isScoringEvent } from "../aggregators";
import {
  TalkingPoint,
  OpponentThreat,
  LineupAggregates,
  PracticeFocusArea,
  PlayerAggregates,
  DefensiveIntegrity,
} from "../types";

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

export const calculateDefensiveIntegrity = (
  stats: StatEvent[],
): DefensiveIntegrity[] => {
  const data: Record<string, { points: number; frequency: number }> = {};
  let totalPointsAllowed = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s) || !isScoringEvent(s)) continue;

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
    .map(([reason, metrics]) => ({
      reason,
      points: metrics.points,
      frequency: metrics.frequency,
      percentage: calcPct(metrics.points, totalPointsAllowed),
    }))
    .sort((a, b) => b.points - a.points);
};
