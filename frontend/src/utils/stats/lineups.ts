/**
 * @file lineups.ts
 * @description Lineup efficiency and stint tracking.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent, Player, TeamPlayer } from "../../db";
import { roundToOne } from "../mathUtils";
import {
  isOpponentId,
  sortStats,
  initializeStatsMap,
  isFreeThrow,
} from "./aggregators";
import { isClutchEvent } from "./analytics";
import { LineupAggregates, PlayerAggregates } from "./types";

const handleStintEnd = (
  playerAgg: PlayerAggregates | undefined,
  stint: { startClock: number; startScoreDiff: number },
  currentScores: { team: number; opp: number },
  endClock: number,
) => {
  if (playerAgg) {
    playerAgg.min += Math.max(0, stint.startClock - endClock);
    playerAgg.plusMinus +=
      currentScores.team - currentScores.opp - stint.startScoreDiff;
  }
};

export const calculatePlayerAggregates = (
  players: Player[],
  stats: StatEvent[],
  teamPlayers: TeamPlayer[] = [],
  viewType: "total" | "average" = "total",
  options: {
    isSorted?: boolean;
    periodLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
  } = {},
): PlayerAggregates[] => {
  const statsMap = initializeStatsMap(players, teamPlayers);
  const periodLen = options.periodLength ? options.periodLength * 60 : 600;

  const activeStints = new Map<
    string,
    { startClock: number; startScoreDiff: number; lastGameId: string }
  >();
  const sortedStats = options.isSorted ? stats : sortStats(stats);

  const scores = { team: 0, opp: 0 };
  let currentPeriod = 1;
  let currentGameId: string | null = null;

  const lastGameIdMap = new Map<string, string>();

  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    if (stat.deletedAt) continue;

    const { playerId, type, clockTime, period, gameId } = stat;

    if (options.clutchOnly && clockTime !== undefined) {
      const isClutch = isClutchEvent(
        period,
        clockTime,
        scores.team - scores.opp,
        options.periodType || "QUARTERS",
      );
      if (!isClutch) {
        if (type === ACTION_TYPES.MAKE) {
          const pts = stat.points || 0;
          if (isOpponentId(playerId)) scores.opp += pts;
          else scores.team += pts;
        }
        if (type === ACTION_TYPES.SUB_IN) {
          activeStints.set(playerId, {
            startClock: clockTime,
            startScoreDiff: scores.team - scores.opp,
            lastGameId: gameId,
          });
        } else if (type === ACTION_TYPES.SUB_OUT) {
          activeStints.delete(playerId);
        }
        continue;
      }
    }

    if (gameId !== currentGameId) {
      for (const [pId, stint] of activeStints.entries()) {
        handleStintEnd(statsMap.get(pId), stint, scores, 0);
      }
      activeStints.clear();
      lastGameIdMap.clear();
      scores.team = 0;
      scores.opp = 0;
      currentPeriod = 1;
      currentGameId = gameId;
    }

    if (period && period > currentPeriod) {
      const skippedPeriods = period - currentPeriod - 1;
      for (const [pId, stint] of activeStints.entries()) {
        handleStintEnd(statsMap.get(pId), stint, scores, 0);

        if (skippedPeriods > 0) {
          const pAgg = statsMap.get(pId);
          if (pAgg) pAgg.min += skippedPeriods * periodLen;
        }

        stint.startClock = periodLen;
        stint.startScoreDiff = scores.team - scores.opp;
      }
      currentPeriod = period;
    }

    if (type === ACTION_TYPES.MAKE) {
      const pts = stat.points || 0;
      if (isOpponentId(playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
      }
    }

    const player = statsMap.get(playerId);
    if (player) {
      if (lastGameIdMap.get(playerId) !== gameId) {
        player.gamesPlayed.add(gameId);
        lastGameIdMap.set(playerId, gameId);
      }

      switch (type) {
        case ACTION_TYPES.MAKE:
          player.points += stat.points || 0;
          if (isFreeThrow(stat)) {
            player.ftm++;
            player.fta++;
          } else {
            player.makes++;
            player.attempts++;
            if (stat.points === 3) {
              player.threePM++;
              player.threePA++;
            }
          }
          break;
        case ACTION_TYPES.MISS:
          if (isFreeThrow(stat)) {
            player.fta++;
          } else {
            player.attempts++;
            if (stat.points === 3) {
              player.threePA++;
            }
          }
          break;
        case ACTION_TYPES.REBOUND:
          player.rebounds++;
          break;
        case ACTION_TYPES.OFF_REBOUND:
          player.offRebounds++;
          player.rebounds++;
          break;
        case ACTION_TYPES.DEF_REBOUND:
          player.defRebounds++;
          player.rebounds++;
          break;
        case ACTION_TYPES.BLOCK:
          player.blocks++;
          break;
        case ACTION_TYPES.ASSIST:
          player.assists++;
          break;
        case ACTION_TYPES.HOCKEY_ASSIST:
          player.hockeyAssists++;
          break;
        case ACTION_TYPES.STEAL:
          player.steals++;
          break;
        case ACTION_TYPES.TURNOVER:
          player.turnovers++;
          break;
        case ACTION_TYPES.FOUL:
        case ACTION_TYPES.FOUL_SHOOTING:
        case ACTION_TYPES.FOUL_NON_SHOOTING:
        case ACTION_TYPES.TECHNICAL_FOUL:
          player.fouls++;
          break;
      }
    }

    if (type === ACTION_TYPES.SUB_IN && clockTime !== undefined) {
      activeStints.set(playerId, {
        startClock: clockTime,
        startScoreDiff: scores.team - scores.opp,
        lastGameId: gameId,
      });
    } else if (type === ACTION_TYPES.SUB_OUT && clockTime !== undefined) {
      const stint = activeStints.get(playerId);
      if (stint) {
        handleStintEnd(player, stint, scores, clockTime);
        activeStints.delete(playerId);
      }
    }
  }

  const liveCtx = options.liveContext;
  for (const [pId, stint] of activeStints.entries()) {
    const endClock =
      liveCtx && stint.lastGameId === stats[stats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    handleStintEnd(statsMap.get(pId), stint, scores, endClock);
  }

  const result: PlayerAggregates[] = [];
  const isAverage = viewType === "average";
  for (const player of statsMap.values()) {
    const gpActual = player.gamesPlayed.size;
    const gp = gpActual || 1;
    player.gp = gpActual;
    player.fgPct =
      player.attempts > 0
        ? ((player.makes / player.attempts) * 100).toFixed(1)
        : "0.0";
    player.threePPct =
      player.threePA > 0
        ? ((player.threePM / player.threePA) * 100).toFixed(1)
        : "0.0";
    player.ftPct =
      player.fta > 0 ? ((player.ftm / player.fta) * 100).toFixed(1) : "0.0";
    player.efgPct =
      player.attempts > 0
        ? (
            ((player.makes + 0.5 * player.threePM) / player.attempts) *
            100
          ).toFixed(1)
        : "0.0";
    player.tsPct =
      player.attempts + 0.44 * player.fta > 0
        ? (
            (player.points / (2 * (player.attempts + 0.44 * player.fta))) *
            100
          ).toFixed(1)
        : "0.0";

    if (isAverage) {
      player.points = roundToOne(player.points / gp);
      player.rebounds = roundToOne(player.rebounds / gp);
      player.assists = roundToOne(player.assists / gp);
      player.hockeyAssists = roundToOne(player.hockeyAssists / gp);
      player.steals = roundToOne(player.steals / gp);
      player.turnovers = roundToOne(player.turnovers / gp);
      player.blocks = roundToOne(player.blocks / gp);
      player.offRebounds = roundToOne(player.offRebounds / gp);
      player.defRebounds = roundToOne(player.defRebounds / gp);
      player.fouls = roundToOne(player.fouls / gp);
      player.min = roundToOne(player.min / (60 * gp));
      player.plusMinus = roundToOne(player.plusMinus / gp);
    } else {
      player.min = roundToOne(player.min / 60);
    }
    result.push(player);
  }
  return result;
};

const getLineupKey = (players: Set<string> | string[]): string =>
  Array.from(players).sort().join(",");

const recordLineupStint = (
  lineupStats: Map<string, LineupAggregates>,
  key: string,
  seconds: number,
  ptsFor: number,
  ptsAgainst: number,
) => {
  let agg = lineupStats.get(key);
  if (!agg) {
    agg = {
      lineup: key.split(","),
      pointsFor: 0,
      pointsAgainst: 0,
      netRating: 0,
      seconds: 0,
      netRatingPer40: "0.0",
    };
    lineupStats.set(key, agg);
  }
  agg.seconds += seconds;
  agg.pointsFor += ptsFor;
  agg.pointsAgainst += ptsAgainst;
};

export const calculateLineupStats = (
  stats: StatEvent[],
  options: {
    isSorted?: boolean;
    periodLength?: number;
    liveContext?: { clockTime: number; period: number };
    clutchOnly?: boolean;
    periodType?: string;
    key?: string;
    direction?: "asc" | "desc";
  } = {},
): LineupAggregates[] => {
  const sortedStats = options.isSorted ? stats : sortStats(stats);
  const lineupStats = new Map<string, LineupAggregates>();
  const periodLen = options.periodLength ? options.periodLength * 60 : 600;

  let currentLineup = new Set<string>();
  let cachedLineupKey: string | null = null;
  let lastClockTime = periodLen;
  let lastTeamScore = 0;
  let lastOppScore = 0;
  let currentPeriod = 1;
  let currentGameId: string | null = null;
  const scores = { team: 0, opp: 0 };

  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    if (s.deletedAt) continue;

    if (currentGameId !== null && s.gameId !== currentGameId) {
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }
      currentLineup.clear();
      cachedLineupKey = null;

      lastClockTime = periodLen;
      lastTeamScore = 0;
      lastOppScore = 0;
      currentPeriod = 1;
      scores.team = 0;
      scores.opp = 0;
    }
    currentGameId = s.gameId;

    if (s.period > currentPeriod) {
      if (currentLineup.size === 5) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );

        const skippedPeriods = s.period - currentPeriod - 1;
        if (skippedPeriods > 0) {
          recordLineupStint(
            lineupStats,
            cachedLineupKey,
            skippedPeriods * periodLen,
            0,
            0,
          );
        }
      }
      lastClockTime = periodLen;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
      currentPeriod = s.period;
    }

    const isClutch =
      !options.clutchOnly ||
      (s.clockTime !== undefined &&
        isClutchEvent(
          s.period,
          s.clockTime,
          scores.team - scores.opp,
          options.periodType || "QUARTERS",
        ));

    if (s.type === ACTION_TYPES.MAKE) {
      const pts = s.points || 0;
      if (isOpponentId(s.playerId)) {
        scores.opp += pts;
      } else {
        scores.team += pts;
      }
    }

    if (s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT) {
      if (currentLineup.size === 5 && s.clockTime !== undefined && isClutch) {
        if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
        recordLineupStint(
          lineupStats,
          cachedLineupKey,
          lastClockTime - s.clockTime,
          scores.team - lastTeamScore,
          scores.opp - lastOppScore,
        );
      }

      if (s.type === ACTION_TYPES.SUB_IN) currentLineup.add(s.playerId);
      else currentLineup.delete(s.playerId);
      cachedLineupKey = null;

      lastClockTime = s.clockTime || 0;
      lastTeamScore = scores.team;
      lastOppScore = scores.opp;
    }
  }

  if (currentGameId !== null && currentLineup.size === 5) {
    const liveCtx = options.liveContext;
    const endClock =
      liveCtx && currentGameId === sortedStats[sortedStats.length - 1]?.gameId
        ? liveCtx.clockTime
        : 0;
    if (!cachedLineupKey) cachedLineupKey = getLineupKey(currentLineup);
    recordLineupStint(
      lineupStats,
      cachedLineupKey,
      Math.max(0, lastClockTime - endClock),
      scores.team - lastTeamScore,
      scores.opp - lastOppScore,
    );
  }

  const result = Array.from(lineupStats.values()).map((agg) => {
    const net = agg.pointsFor - agg.pointsAgainst;
    const mins = agg.seconds / 60;
    return {
      ...agg,
      netRating: net,
      netRatingPer40: mins > 0 ? ((net / mins) * 40).toFixed(1) : "0.0",
    };
  });

  const sortKey = options.key || "netRating";
  const sortDir = options.direction || "desc";

  return result.sort((a, b) => {
    const aValue = a[sortKey as keyof typeof a];
    const bValue = b[sortKey as keyof typeof b];

    if (typeof aValue === "string" && typeof bValue === "string") {
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      return sortDir === "desc" ? bNum - aNum : aNum - bNum;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDir === "desc" ? bValue - aValue : aValue - bValue;
    }

    return 0;
  });
};
