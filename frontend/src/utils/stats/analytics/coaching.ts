import { StatEvent } from "../../../db";
import { ACTION_TYPES } from "../../../constants/stats";
import {
  isActive,
  isOpponentId,
  calcPct,
  isScoringEvent,
} from "../aggregators";
import {
  TalkingPoint,
  OpponentThreat,
  LineupAggregates,
  PracticeFocusArea,
  PlayerAggregates,
  DefensiveIntegrity,
  NeuralLoadData,
  PredictabilityData,
  VerbalVelocityData,
} from "../types";

/**
 * Calculates Neural Load for the active unit.
 * Tactical complexity has a hidden mental cost. Tracking "Neural-Load"
 * identifies the "Mental Red-Line" where execution errors surge.
 */
export const calculateNeuralLoad = (
  stats: StatEvent[],
  onCourtIds: Set<string>,
  periodSeconds: number,
): NeuralLoadData => {
  const playerLoads: Record<string, number> = {};
  onCourtIds.forEach((id) => (playerLoads[id] = 0));

  let lastScheme: string | undefined;
  let lastPlay: string | undefined;
  const recentSwitches: number[] = []; // Timestamps in seconds from start of game (approx)

  stats.forEach((s) => {
    if (!isActive(s)) return;

    let isSwitch = false;
    if (s.defensiveScheme && s.defensiveScheme !== lastScheme) {
      isSwitch = true;
      lastScheme = s.defensiveScheme;
    }
    if (s.playName && s.playName !== lastPlay) {
      isSwitch = true;
      lastPlay = s.playName;
    }

    if (isSwitch) {
      const timeInSecs =
        (s.period - 1) * periodSeconds + (periodSeconds - (s.clockTime || 0));
      recentSwitches.push(timeInSecs);

      // Add load to players on court (approximate)
      // In a real app we'd track who was on court at that exact timestamp
      onCourtIds.forEach((id) => {
        playerLoads[id] = Math.min(100, (playerLoads[id] || 0) + 15);
      });
    }

    // Passive decay - this is simplified as we don't have a tick loop here
    // In a real implementation, we'd calculate decay based on time deltas between events
  });

  // Calculate SPM over the last 5 minutes (300s)
  const lastEvent = stats[stats.length - 1];
  const nowInSecs = lastEvent
    ? (lastEvent.period - 1) * periodSeconds +
      (periodSeconds - (lastEvent.clockTime || 0))
    : 0;

  const windowSwitches = recentSwitches.filter(
    (t) => t > nowInSecs - 300,
  ).length;
  const unitSpm = windowSwitches / 5;

  return { playerLoads, unitSpm };
};

/**
 * Calculates Predictability Score for our active play-calling.
 * Monitoring tactical patterns to avoid becoming "Scoutable".
 */
export const calculatePredictabilityScore = (
  stats: StatEvent[],
): PredictabilityData => {
  const recentPlays = stats
    .filter((s) => s.playName && !isOpponentId(s.playerId))
    .slice(-10)
    .map((s) => s.playName!);

  if (recentPlays.length < 3) return { score: 0 };

  const counts: Record<string, number> = {};
  recentPlays.forEach((p) => (counts[p] = (counts[p] || 0) + 1));

  const maxFreq = Math.max(...Object.values(counts));
  const mostFrequentPlay = Object.entries(counts).find(
    ([_, c]) => c === maxFreq,
  )?.[0];

  // Score 0-100 based on max frequency in 10 plays
  // If same play called 5/10 times, score is 50. 8/10 is 80.
  const score = (maxFreq / recentPlays.length) * 100;

  return {
    score: Math.round(score),
    pattern: score > 50 ? mostFrequentPlay : undefined,
  };
};

/**
 * Calculates Verbal Velocity (communication latency).
 * Measuring the speed of defensive vocal response (Switch/Help calls).
 */
export const calculateVerbalVelocity = (
  stats: StatEvent[],
): VerbalVelocityData => {
  const latencies: number[] = [];

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.type === ACTION_TYPES.VOCAL_ENGAGEMENT) {
      // Look back for the most recent opponent action within 5 seconds
      const vocalTime = new Date(s.timestamp).getTime();
      for (let j = i - 1; j >= 0; j--) {
        const prev = stats[j];
        if (isOpponentId(prev.playerId)) {
          const latency =
            (vocalTime - new Date(prev.timestamp).getTime()) / 1000;
          if (latency > 0 && latency < 5) {
            latencies.push(latency);
          }
          break; // Only compare to the most recent opponent action
        }
      }
    }
  }

  const avgLatency =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  return { latency: Math.round(avgLatency * 100) / 100 };
};

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
