import { useState, useMemo, useEffect, useCallback } from "react";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS, SHOT_QUALITY } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  calculateLineupStats,
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
} from "../utils/stats";
import { getShotZone } from "../utils/shotZones";
import dayjs from "dayjs";
import { StatEvent } from "../types/stat";
import { Player } from "../types/player";
import { Team } from "../types/team";
import { TeamPlayer } from "../types/teamPlayer";

export const useGameStats = (gameId: string | undefined) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedQuality, setSelectedQuality] = useState<string>("ALL");
  const [selectedPlay, setSelectedPlay] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod1, setComparePeriod1] = useState<string>("1");
  const [comparePeriod2, setComparePeriod2] = useState<string>("2");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">("markers");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const game = useLiveQuery(
    () => (gameId !== undefined ? db.games.get(gameId as string) : Promise.resolve(undefined)),
    [gameId]
  );

  const team = useLiveQuery(
    () => (game?.teamId ? db.teams.get(game.teamId) : Promise.resolve(undefined)),
    [game?.teamId]
  );

  const teamPlayersResult = useLiveQuery(
    () => (game?.teamId ? db.teamPlayers.where("teamId").equals(game.teamId).toArray() : Promise.resolve([])),
    [game?.teamId]
  );
  const teamPlayers = useMemo(() => teamPlayersResult || [], [teamPlayersResult]);

  const playerIds = useMemo(() => teamPlayers.map((tp) => tp.playerId.toString()), [teamPlayers]);

  const playersResult = useLiveQuery(
    () => db.players.where("id").anyOf(playerIds).toArray(),
    [playerIds]
  );
  const players = useMemo(() => playersResult || [], [playersResult]);

  const allStatsResult = useLiveQuery(
    () => (gameId !== undefined ? db.stats.where("gameId").equals(gameId).toArray() : Promise.resolve([])),
    [gameId]
  );
  const allStats = useMemo(() => (Array.isArray(allStatsResult) ? allStatsResult : []), [allStatsResult]);

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

  const aggregatedStats = useMemo(() => {
    const teamPlayerIds = new Set<string | number>();
    for (let i = 0; i < teamPlayers.length; i++) {
      teamPlayerIds.add(teamPlayers[i].playerId);
    }

    const rosteredPlayers = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (teamPlayerIds.has(p.id!)) {
        rosteredPlayers.push(p);
      }
    }
    return calculatePlayerAggregates(rosteredPlayers, scoreFlowSortedStats, teamPlayers, "total", {
      isSorted: true,
      periodLength: game?.periodLength,
      clutchOnly: clutchFilter,
      periodType: team?.periodType,
      liveContext:
        game && !game.completed
          ? {
              clockTime: game.clockTime || 0,
              period: game.currentPeriod || 1,
            }
          : undefined,
    });
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

  const shotChartJerseyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < teamPlayers.length; i++) {
      map.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber ?? "");
    }
    return map;
  }, [teamPlayers]);

  const derivedStats = useMemo(() => {
    const filtered = [];
    const markers = [];
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const playerMatch = selectedPlayerId === "ALL" || s.playerId === selectedPlayerId;
      const typeMatch = selectedType === "ALL" || s.type === selectedType;
      const qualityMatch = selectedQuality === "ALL" || s.shotQuality === selectedQuality;
      const playMatch = selectedPlay === "ALL" || (s.playName && s.playName === selectedPlay);
      if (playerMatch && typeMatch && playMatch && qualityMatch) {
        filtered.push(s);
        if (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS) {
          markers.push({
            id: s.id,
            x: s.locationX || 0,
            y: s.locationY || 0,
            type: s.type as "MAKE" | "MISS",
            label: s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT ? shotChartJerseyMap.get(s.playerId) : undefined,
            playerId: s.playerId,
          });
        }
      }
    }
    return { filtered, markers };
  }, [stats, selectedPlayerId, selectedType, selectedQuality, selectedPlay, shotChartJerseyMap]);

  const getHeatmapDataForPeriod = useCallback(
    (pFilter: string) => {
      const periodStats = pFilter === "ALL" ? allStats : allStats.filter((s) => s.period === parseInt(pFilter));

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
    [allStats, selectedPlayerId, selectedType, selectedPlay, selectedQuality]
  );

  const heatmapData = useMemo(() => getHeatmapDataForPeriod(periodFilter), [getHeatmapDataForPeriod, periodFilter]);
  const heatmapData1 = useMemo(() => getHeatmapDataForPeriod(comparePeriod1), [getHeatmapDataForPeriod, comparePeriod1]);
  const heatmapData2 = useMemo(() => getHeatmapDataForPeriod(comparePeriod2), [getHeatmapDataForPeriod, comparePeriod2]);

  const scoreFlowData = useMemo(() => {
    return calculateScoreFlow(scoreFlowSortedStats, game?.periodLength);
  }, [scoreFlowSortedStats, game?.periodLength]);

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
      } else if (s.type === ACTION_TYPES.TURNOVER) turnovers++;
      else if (s.type === ACTION_TYPES.OFF_REBOUND) oreb++;
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
    return Object.entries(data).map(([name, stats]) => ({
      name,
      ...stats,
      efg: stats.attempts > 0 ? ((stats.points / stats.attempts / 2) * 100).toFixed(1) : "0.0",
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
    return Object.entries(data).map(([quality, stats]) => ({
      quality,
      ...stats,
      efg: stats.attempts > 0 ? ((stats.points / stats.attempts / 2) * 100).toFixed(1) : "0.0",
    }));
  }, [stats]);

  const lineupStats = useMemo(() => {
    return calculateLineupStats(scoreFlowSortedStats, {
      isSorted: true,
      periodLength: game?.periodLength,
      clutchOnly: clutchFilter,
      periodType: team?.periodType,
      liveContext: game && !game.completed ? { clockTime: game.clockTime || 0, period: game.currentPeriod || 1 } : undefined,
    });
  }, [scoreFlowSortedStats, game, clutchFilter, team?.periodType]);

  const defensiveStats = useMemo(() => calculateStopsAndKills(scoreFlowSortedStats), [scoreFlowSortedStats]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const periodLabel = team?.periodType === "HALVES" ? "Half" : "Quarter";
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
    game,
    team,
    players,
    teamPlayers,
    allStats,
    stats,
    playerAggregates,
    shotChartJerseyMap,
    shotChartMarkers: derivedStats.markers,
    heatmapData,
    heatmapData1,
    heatmapData2,
    scoreFlowData,
    oppData,
    teamData,
    playEfficiency,
    processEfficiency,
    lineupStats,
    defensiveStats,
    selectedPlayerId, setSelectedPlayerId,
    selectedType, setSelectedType,
    selectedQuality, setSelectedQuality,
    selectedPlay, setSelectedPlay,
    periodFilter, setPeriodFilter,
    clutchFilter, setClutchFilter,
    compareMode, setCompareMode,
    comparePeriod1, setComparePeriod1,
    comparePeriod2, setComparePeriod2,
    shotChartView, setShotChartView,
    sortConfig, handleSort,
    periodLabel,
    periods
  };
};
