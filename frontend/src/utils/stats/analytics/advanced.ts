import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";
import {
  formatClock,
  calculateElapsedSeconds,
} from "../../mathUtils";
import { getShotZone, XPTS_TABLE } from "../../shotZones";
import { SHOT_QUALITY } from "../../../constants/stats";
import {
  isActive,
  isOpponentId,
  calculatePossessions,
  calculatePpp,
  calculateEfgPct,
  isFieldGoal,
} from "../aggregators";
import {
  SparkPlugIndex,
  ScoreFlowPoint,
  AssistNetwork,
  AssistNetworkNode,
  AssistEdge,
} from "../types";

export const calculateSparkPlugIndex = (
  stats: StatEvent[],
  periodLenMinutes: number = 10,
): SparkPlugIndex[] => {
  const result: Map<string, { hustle: number; momentum: number }> = new Map();
  const periodLenSecs = periodLenMinutes * 60;

  const activeStats = stats.filter((s) => !s.deletedAt);
  const scoringEvents = activeStats
    .filter((s) => s.type === ACTION_TYPES.MAKE && !isOpponentId(s.playerId))
    .map((s) => ({
      points: s.points || 0,
      time: calculateElapsedSeconds(s.period, s.clockTime ?? 0, periodLenSecs),
    }));

  const hustleEvents = activeStats.filter((s) =>
    [
      ACTION_TYPES.FLOOR_DIVE,
      ACTION_TYPES.CHARGE_TAKEN,
      ACTION_TYPES.GREAT_CONTEST,
    ].includes(s.type),
  );

  for (let i = 0; i < hustleEvents.length; i++) {
    const h = hustleEvents[i];
    const pId = h.playerId;
    if (!result.has(pId)) result.set(pId, { hustle: 0, momentum: 0 });
    const entry = result.get(pId)!;
    entry.hustle++;

    const hTime = calculateElapsedSeconds(
      h.period,
      h.clockTime ?? 0,
      periodLenSecs,
    );
    const endTime = hTime + 120;

    for (let j = 0; j < scoringEvents.length; j++) {
      const s = scoringEvents[j];
      if (s.time > hTime && s.time <= endTime) {
        entry.momentum += s.points;
      }
    }
  }

  return Array.from(result.entries())
    .map(([pId, val]) => ({
      playerId: pId,
      hustleStats: val.hustle,
      momentumScore: val.momentum,
      compositeIndex: Math.round(val.hustle * 2 + val.momentum / 2),
    }))
    .sort((a, b) => b.compositeIndex - a.compositeIndex);
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

  const teamAgg = { fga: 0, fta: 0, to: 0, oreb: 0 };
  const oppAgg = { fga: 0, fta: 0, to: 0, oreb: 0 };
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
      if (isOpp) oppAgg.fga++;
      else teamAgg.fga++;
    } else if (
      stat.points === 1 &&
      (type === ACTION_TYPES.MAKE || type === ACTION_TYPES.MISS)
    ) {
      if (isOpp) oppAgg.fta++;
      else teamAgg.fta++;
    } else if (type === ACTION_TYPES.TURNOVER) {
      if (isOpp) oppAgg.to++;
      else teamAgg.to++;
    } else if (type === ACTION_TYPES.OFF_REBOUND) {
      if (isOpp) oppAgg.oreb++;
      else teamAgg.oreb++;
    }

    if (stat.type === ACTION_TYPES.SUB_IN) {
      currentLineup.add(stat.playerId);
    } else if (stat.type === ACTION_TYPES.SUB_OUT) {
      currentLineup.delete(stat.playerId);
    }

    if (stat.type === ACTION_TYPES.MAKE || stat.type === ACTION_TYPES.TIMEOUT) {
      const period = stat.period || 1;
      const clockTime = stat.clockTime ?? periodLenSecs;
      const elapsedSeconds = calculateElapsedSeconds(
        period,
        clockTime,
        periodLenSecs,
      );

      const teamPoss = calculatePossessions({
        fga: teamAgg.fga,
        fta: teamAgg.fta,
        turnovers: teamAgg.to,
        offRebounds: teamAgg.oreb,
      });
      const oppPoss = calculatePossessions({
        fga: oppAgg.fga,
        fta: oppAgg.fta,
        turnovers: oppAgg.to,
        offRebounds: oppAgg.oreb,
      });

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

export const calculateXPts = (stat: StatEvent): number => {
  if (
    !isActive(stat) ||
    (stat.type !== ACTION_TYPES.MAKE && stat.type !== ACTION_TYPES.MISS)
  )
    return 0;
  if (stat.points === 1) return 0.75; // FT average

  const zone = getShotZone(stat.locationX || 0, stat.locationY || 0);
  const quality =
    (stat.shotQuality as keyof typeof SHOT_QUALITY) || SHOT_QUALITY.CONTESTED;

  return XPTS_TABLE[zone]?.[quality as "OPEN" | "CONTESTED"] || 0;
};

export const calculateShotROI = (stats: StatEvent[]) => {
  let totalPoints = 0;
  let totalXPts = 0;
  let count = 0;

  for (const s of stats) {
    if (
      !isActive(s) ||
      (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS)
    )
      continue;
    if (isOpponentId(s.playerId)) continue;

    if (s.type === ACTION_TYPES.MAKE) {
      totalPoints += s.points || 0;
    }
    totalXPts += calculateXPts(s);
    count++;
  }

  const roi = totalXPts > 0 ? totalPoints / totalXPts - 1.0 : 0;
  const avgXPtsPerPoss = count > 0 ? totalXPts / count : 0;

  return {
    roi: roi.toFixed(2),
    avgXPts: avgXPtsPerPoss.toFixed(2),
    totalXPts: totalXPts.toFixed(1),
    totalPoints,
  };
};

export const calculatePaintTouchStats = (stats: StatEvent[]) => {
  let paintTouches = 0;
  let pointsAfterPaintTouch = 0;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (
      !isActive(s) ||
      s.type !== ACTION_TYPES.PAINT_TOUCH ||
      isOpponentId(s.playerId)
    )
      continue;

    paintTouches++;

    const touchTime = s.clockTime ?? 0;
    const period = s.period;

    for (let j = i + 1; j < stats.length; j++) {
      const next = stats[j];
      if (!isActive(next) || next.period !== period) break;
      if (
        next.type === ACTION_TYPES.POSSESSION ||
        next.type === ACTION_TYPES.TURNOVER
      )
        break;

      const timeDiff = touchTime - (next.clockTime ?? 0);
      if (timeDiff > 15) break;

      if (next.type === ACTION_TYPES.MAKE && !isOpponentId(next.playerId)) {
        pointsAfterPaintTouch += next.points || 0;
        break;
      }
    }
  }

  return {
    total: paintTouches,
    pppt:
      paintTouches > 0
        ? (pointsAfterPaintTouch / paintTouches).toFixed(2)
        : "0.00",
  };
};

interface AssistNodeData {
  assists: number;
  assistedMakes: number;
  points: number;
  threePM: number;
}

const updateAssistNode = (
  map: Map<string, AssistNodeData>,
  playerId: string,
  isPasser: boolean,
  points: number,
) => {
  let node = map.get(playerId);
  if (!node) {
    node = { assists: 0, assistedMakes: 0, points: 0, threePM: 0 };
    map.set(playerId, node);
  }
  if (isPasser) node.assists++;
  else node.assistedMakes++;
  node.points += points;
  if (points === 3) node.threePM++;
};

export const calculateAssistNetwork = (stats: StatEvent[]): AssistNetwork => {
  const nodesMap = new Map<string, AssistNodeData>();
  const edgesMap = new Map<
    string,
    { count: number; points: number; threePM: number }
  >();

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (
      !isActive(s) ||
      s.type !== ACTION_TYPES.MAKE ||
      isOpponentId(s.playerId)
    )
      continue;

    const assist = stats.find(
      (a) =>
        isActive(a) &&
        a.type === ACTION_TYPES.ASSIST &&
        a.timestamp === s.timestamp &&
        a.playerId !== s.playerId,
    );

    if (assist) {
      const passerId = assist.playerId;
      const finisherId = s.playerId;
      const points = s.points || 0;

      updateAssistNode(nodesMap, passerId, true, points);
      updateAssistNode(nodesMap, finisherId, false, points);

      const edgeKey = `${passerId}->${finisherId}`;
      let edge = edgesMap.get(edgeKey);
      if (!edge) {
        edge = { count: 0, points: 0, threePM: 0 };
        edgesMap.set(edgeKey, edge);
      }
      edge.count++;
      edge.points += points;
      if (points === 3) edge.threePM++;
    }
  }

  const nodes: AssistNetworkNode[] = Array.from(nodesMap.entries()).map(
    ([playerId, val]) => ({
      playerId,
      assists: val.assists,
      assistedMakes: val.assistedMakes,
      pointsGenerated: val.points,
      efg: calculateEfgPct(
        val.assistedMakes || val.assists,
        val.threePM,
        val.assistedMakes || val.assists,
      ),
    }),
  );

  const edges: AssistEdge[] = Array.from(edgesMap.entries()).map(
    ([key, val]) => {
      const [passerId, finisherId] = key.split("->");
      return {
        passerId,
        finisherId,
        count: val.count,
        points: val.points,
        efg: calculateEfgPct(val.count, val.threePM, val.count),
      };
    },
  );

  const sortedByAssists = [...nodes].sort((a, b) => b.assists - a.assists);
  const sortedByMakes = [...nodes].sort(
    (a, b) => b.assistedMakes - a.assistedMakes,
  );

  return {
    nodes,
    edges,
    primaryPlaymakerId: sortedByAssists[0]?.playerId || null,
    primaryFinisherId: sortedByMakes[0]?.playerId || null,
  };
};
