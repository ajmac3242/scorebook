import { useMemo, useCallback } from "react";
import { type Player } from "../../db";
import {
  ACTION_TYPES,
  SPECIAL_PLAYER_IDS,
  SHOT_QUALITY,
} from "../../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  calculateLineupStats,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  generatePracticePrescription,
  calculateDefensiveIntegrity,
  calculateIndividualDefensiveBreakdown,
  calculateSituationalStats,
  calculateAssistNetwork,
  calculateShotROI,
  calculatePaintTouchStats,
} from "../../utils/stats";
import {
  calculateOnOffStats,
  calculateMatchupStats,
} from "../../utils/stats/impact";
import { getShotZone } from "../../utils/shotZones";
import type { GameStatsData } from "./useGameStatsData";

export interface ShotChartFilters {
  selectedPlayerId: number | string;
  selectedType: string;
  selectedQuality: string;
  selectedBreakdown: string;
  selectedPlay: string;
}

export interface GameStatsFilters {
  periodFilter: string;
  clutchFilter: boolean;
  shotChartFilters: ShotChartFilters;
  comparePeriod1: string;
  comparePeriod2: string;
  sortConfig: { key: string; direction: "asc" | "desc" };
}

export function useGameStatsAnalytics(
  data: GameStatsData,
  filters: GameStatsFilters,
) {
  const { game, team, teamSeasonStats, teamPlayers, players, allStats } = data;
  const {
    periodFilter,
    clutchFilter,
    shotChartFilters: {
      selectedPlayerId,
      selectedType,
      selectedQuality,
      selectedBreakdown,
      selectedPlay,
    },
    comparePeriod1,
    comparePeriod2,
    sortConfig,
  } = filters;

  const stats = useMemo(() => {
    if (periodFilter === "ALL") return allStats;
    return allStats.filter((s) => s.period === parseInt(periodFilter));
  }, [allStats, periodFilter]);

  const scoreFlowSortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (a.timestamp < b.timestamp) return -1;
      if (a.timestamp > b.timestamp) return 1;
      return 0;
    });
  }, [stats]);

  const shotChartJerseyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber ?? "");
    }
    return map;
  }, [teamPlayers]);

  const aggregatedStats = useMemo(() => {
    const teamPlayerIds = new Set<string | number>();
    for (let i = 0; i < teamPlayers.length; i++) {
      teamPlayerIds.add(teamPlayers[i].playerId);
    }
    const rosteredPlayers = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (teamPlayerIds.has(p.id!)) rosteredPlayers.push(p);
    }
    return calculatePlayerAggregates(
      rosteredPlayers,
      scoreFlowSortedStats,
      teamPlayers,
      "total",
      {
        isSorted: true,
        periodLength: game?.periodLength,
        clutchOnly: clutchFilter,
        periodType: team?.periodType,
        liveContext:
          game && !game.completed
            ? { clockTime: game.clockTime || 0, period: game.currentPeriod || 1 }
            : undefined,
      },
    );
  }, [players, scoreFlowSortedStats, teamPlayers, game, clutchFilter, team?.periodType]);

  const playerAggregates = useMemo(() => {
    return [...aggregatedStats].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as number | string;
      const bValue = b[sortConfig.key as keyof typeof b] as number | string;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [aggregatedStats, sortConfig]);

  const derivedStats = useMemo(() => {
    const filtered = [];
    const markers = [];
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const playerMatch = selectedPlayerId === "ALL" || s.playerId === selectedPlayerId;
      const typeMatch = selectedType === "ALL" || s.type === selectedType;
      const qualityMatch = selectedQuality === "ALL" || s.shotQuality === selectedQuality;
      const breakdownMatch = selectedBreakdown === "ALL" || s.breakdownReason === selectedBreakdown;
      const playMatch = selectedPlay === "ALL" || (s.playName && s.playName === selectedPlay);
      if (playerMatch && typeMatch && playMatch && qualityMatch && breakdownMatch) {
        filtered.push(s);
        if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
          markers.push({
            id: s.id,
            x: s.locationX || 0,
            y: s.locationY || 0,
            type: s.type as "MAKE" | "MISS",
            label:
              s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT
                ? shotChartJerseyMap.get(s.playerId)
                : undefined,
            playerId: s.playerId,
          });
        }
      }
    }
    return { filtered, markers };
  }, [stats, selectedPlayerId, selectedType, selectedQuality, selectedBreakdown, selectedPlay, shotChartJerseyMap]);

  const getHeatmapDataForPeriod = useCallback(
    (pFilter: string) => {
      const periodStats =
        pFilter === "ALL"
          ? allStats
          : allStats.filter((s) => s.period === parseInt(pFilter));
      const data: Record<string, { makes: number; attempts: number }> = {};
      for (let i = 0; i < periodStats.length; i++) {
        const s = periodStats[i];
        if (s.type !== ACTION_TYPES.MAKE && s.type !== ACTION_TYPES.MISS) continue;
        if (selectedPlayerId !== "ALL" && s.playerId !== selectedPlayerId) continue;
        if (selectedType !== "ALL" && s.type !== selectedType) continue;
        if (selectedQuality !== "ALL" && s.shotQuality !== selectedQuality) continue;
        if (selectedPlay !== "ALL" && s.playName !== selectedPlay) continue;
        const zone = getShotZone(s.locationX || 0, s.locationY || 0);
        if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
        data[zone].attempts++;
        if (s.type === ACTION_TYPES.MAKE) data[zone].makes++;
      }
      return data;
    },
    [allStats, selectedPlayerId, selectedType, selectedPlay, selectedQuality],
  );

  const heatmapData = useMemo(
    () => getHeatmapDataForPeriod(periodFilter),
    [getHeatmapDataForPeriod, periodFilter],
  );
  const heatmapData1 = useMemo(
    () => getHeatmapDataForPeriod(comparePeriod1),
    [getHeatmapDataForPeriod, comparePeriod1],
  );
  const heatmapData2 = useMemo(
    () => getHeatmapDataForPeriod(comparePeriod2),
    [getHeatmapDataForPeriod, comparePeriod2],
  );

  const scoreFlowData = useMemo(
    () => calculateScoreFlow(scoreFlowSortedStats, game?.periodLength),
    [scoreFlowSortedStats, game?.periodLength],
  );

  const oppData = useMemo(() => calculateOpponentAggregates(stats), [stats]);

  const teamData = useMemo(() => {
    let fga = 0, fta = 0, turnovers = 0, oreb = 0, points = 0;
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if (s.deletedAt || s.playerId === SPECIAL_PLAYER_IDS.OPPONENT) continue;
      if (s.type === ACTION_TYPES.MAKE) {
        points += s.points || 0;
        if (s.points === 1) fta++; else fga++;
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) fta++; else fga++;
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        turnovers++;
      } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
        oreb++;
      }
    }
    const possessions = calculatePossessions(fga, fta, turnovers, oreb);
    return { points, possessions, ppp: calculatePpp(points, possessions) };
  }, [stats]);

  const playEfficiency = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number; points: number }> = {};
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if ((s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) && s.playName) {
        if (!data[s.playName]) data[s.playName] = { makes: 0, attempts: 0, points: 0 };
        data[s.playName].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.playName].makes++;
          data[s.playName].points += s.points || 0;
        }
      }
    }
    return Object.entries(data).map(([name, st]) => ({
      name,
      ...st,
      efg: st.attempts > 0 ? ((st.points / st.attempts / 2) * 100).toFixed(1) : "0.0",
    }));
  }, [stats]);

  const processEfficiency = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number; points: number }> = {
      [SHOT_QUALITY.OPEN]: { makes: 0, attempts: 0, points: 0 },
      [SHOT_QUALITY.CONTESTED]: { makes: 0, attempts: 0, points: 0 },
    };
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if ((s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) && s.shotQuality && data[s.shotQuality]) {
        data[s.shotQuality].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.shotQuality].makes++;
          data[s.shotQuality].points += s.points || 0;
        }
      }
    }
    return Object.entries(data).map(([quality, st]) => ({
      quality,
      ...st,
      efg: st.attempts > 0 ? ((st.points / st.attempts / 2) * 100).toFixed(1) : "0.0",
    }));
  }, [stats]);

  const shotClockEfficiency = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number; points: number }> = {
      EARLY: { makes: 0, attempts: 0, points: 0 },
      MID: { makes: 0, attempts: 0, points: 0 },
      LATE: { makes: 0, attempts: 0, points: 0 },
    };
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      if ((s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) && s.shotClockPhase && data[s.shotClockPhase]) {
        data[s.shotClockPhase].attempts++;
        if (s.type === ACTION_TYPES.MAKE) {
          data[s.shotClockPhase].makes++;
          data[s.shotClockPhase].points += s.points || 0;
        }
      }
    }
    return Object.entries(data).map(([phase, st]) => ({
      phase,
      ...st,
      efg: st.attempts > 0 ? ((st.points / st.attempts / 2) * 100).toFixed(1) : "0.0",
    }));
  }, [stats]);

  const lineupStats = useMemo(
    () =>
      calculateLineupStats(scoreFlowSortedStats, {
        isSorted: true,
        periodLength: game?.periodLength,
        clutchOnly: clutchFilter,
        periodType: team?.periodType,
        liveContext:
          game && !game.completed
            ? { clockTime: game.clockTime || 0, period: game.currentPeriod || 1 }
            : undefined,
      }),
    [scoreFlowSortedStats, game, clutchFilter, team?.periodType],
  );

  const onOffStats = useMemo(
    () => calculateOnOffStats(scoreFlowSortedStats, players as { id: string; name: string }[]),
    [scoreFlowSortedStats, players],
  );

  const matchupStats = useMemo(
    () => calculateMatchupStats(scoreFlowSortedStats, players as { id: string; name: string }[], shotChartJerseyMap),
    [scoreFlowSortedStats, players, shotChartJerseyMap],
  );

  const defensiveStats = useMemo(
    () => calculateStopsAndKills(scoreFlowSortedStats),
    [scoreFlowSortedStats],
  );

  const defensiveIntegrity = useMemo(
    () => calculateDefensiveIntegrity(allStats),
    [allStats],
  );

  const individualDefensiveBreakdown = useMemo(
    () => calculateIndividualDefensiveBreakdown(allStats, players as Player[], shotChartJerseyMap),
    [allStats, players, shotChartJerseyMap],
  );

  const specialtyExecution = useMemo(
    () => calculateSituationalStats(allStats, teamData.ppp),
    [allStats, teamData.ppp],
  );

  const assistNetwork = useMemo(
    () => calculateAssistNetwork(scoreFlowSortedStats),
    [scoreFlowSortedStats],
  );

  const shotROI = useMemo(() => calculateShotROI(allStats), [allStats]);

  const paintTouchStats = useMemo(() => calculatePaintTouchStats(allStats), [allStats]);

  const opponentPlayTypeEfficiency = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number; points: number; fta: number; turnovers: number; threePM: number }> = {};
    for (let i = 0; i < allStats.length; i++) {
      const s = allStats[i];
      if (s.deletedAt || !s.opponentPlayType || !s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)) continue;
      if (!data[s.opponentPlayType]) {
        data[s.opponentPlayType] = { makes: 0, attempts: 0, points: 0, fta: 0, turnovers: 0, threePM: 0 };
      }
      const play = data[s.opponentPlayType];
      if (s.type === ACTION_TYPES.MAKE) {
        play.points += s.points || 0;
        if (s.points === 1) { play.fta++; } else { play.makes++; play.attempts++; if (s.points === 3) play.threePM++; }
      } else if (s.type === ACTION_TYPES.MISS) {
        if (s.points === 1) { play.fta++; } else { play.attempts++; }
      } else if (s.type === ACTION_TYPES.TURNOVER) {
        play.turnovers++;
      }
    }
    return Object.entries(data)
      .map(([type, s]) => {
        const possessions = calculatePossessions(s.attempts, s.fta, s.turnovers, 0);
        return {
          type,
          attempts: s.attempts,
          points: s.points,
          ppp: calculatePpp(s.points, possessions),
          efg: s.attempts > 0 ? (((s.makes + 0.5 * s.threePM) / s.attempts) * 100).toFixed(1) : "0.0",
        };
      })
      .sort((a, b) => b.attempts - a.attempts);
  }, [allStats]);

  const practiceFocusAreas = useMemo(() => {
    if (!teamSeasonStats || !teamData) return [];
    const ftAttempts = stats.filter(
      (s) => s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT && s.points === 1 &&
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS),
    ).length;
    const ftMakes = stats.filter(
      (s) => s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT && s.points === 1 && s.type === ACTION_TYPES.MAKE,
    ).length;
    const gameFtPct = ftAttempts > 0 ? (ftMakes / ftAttempts) * 100 : 0;
    const gameTurnoverRate =
      teamData.possessions > 0
        ? (stats.filter(
            (s) => s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT && s.type === ACTION_TYPES.TURNOVER,
          ).length / teamData.possessions) * 100
        : 0;
    const teamOreb = stats.filter(
      (s) => s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT && s.type === ACTION_TYPES.OFF_REBOUND,
    ).length;
    const oppDreb = stats.filter(
      (s) => s.playerId === SPECIAL_PLAYER_IDS.OPPONENT && s.type === ACTION_TYPES.DEF_REBOUND,
    ).length;
    const gameOrebPct = teamOreb + oppDreb > 0 ? (teamOreb / (teamOreb + oppDreb)) * 100 : 0;
    return generatePracticePrescription({
      gameStats: playerAggregates,
      teamStats: {
        ftPct: gameFtPct.toFixed(1),
        turnoverRate: gameTurnoverRate.toFixed(1),
        orebPct: gameOrebPct.toFixed(1),
      },
      seasonAverages: {
        ftPct: teamSeasonStats.ftPct || "70.0",
        turnoverRate: teamSeasonStats.turnoverRate || "15.0",
        orebPct: teamSeasonStats.orebPct || "25.0",
      },
    });
  }, [teamSeasonStats, teamData, stats, playerAggregates]);

  const maxPeriod = team?.periodType === "HALVES" ? 2 : 4;
  const periods = useMemo(() => {
    const list = ["ALL"];
    for (let i = 1; i <= maxPeriod; i++) list.push(i.toString());
    const otPeriodsSet = new Set<number>();
    for (let i = 0; i < allStats.length; i++) {
      const p = allStats[i].period;
      if (p > maxPeriod) otPeriodsSet.add(p);
    }
    const otPeriods = Array.from(otPeriodsSet).sort((a, b) => a - b);
    for (let i = 0; i < otPeriods.length; i++) list.push(otPeriods[i].toString());
    return list;
  }, [maxPeriod, allStats]);

  return {
    stats,
    scoreFlowSortedStats,
    shotChartJerseyMap,
    aggregatedStats,
    playerAggregates,
    shotChartMarkers: derivedStats.markers,
    heatmapData,
    heatmapData1,
    heatmapData2,
    scoreFlowData,
    oppData,
    teamData,
    playEfficiency,
    processEfficiency,
    shotClockEfficiency,
    lineupStats,
    onOffStats,
    matchupStats,
    defensiveStats,
    defensiveIntegrity,
    individualDefensiveBreakdown,
    specialtyExecution,
    assistNetwork,
    shotROI,
    paintTouchStats,
    opponentPlayTypeEfficiency,
    practiceFocusAreas,
    periods,
    maxPeriod,
  };
}

export type GameStatsAnalytics = ReturnType<typeof useGameStatsAnalytics>;
