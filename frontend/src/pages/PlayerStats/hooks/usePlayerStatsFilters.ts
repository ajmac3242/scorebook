import React from "react";
import dayjs from "dayjs";
import { calculatePlayerAggregates } from "../../../utils/stats";
import type { Game, StatEvent } from "../../../db";
import type { GameWindow } from "../sections/PlayerStatsFilterBar";

type UsePlayerStatsFiltersArgs = {
  games: Game[];
  allStats: StatEvent[];
  teamIdParam: string | null;
};

const sortGamesDesc = (games: Game[]) =>
  [...games].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

const buildHeatmap = (stats: StatEvent[]) => {
  const buckets: Record<string, { makes: number; attempts: number }> = {};
  stats.forEach((s) => {
    if ((s.type !== "MAKE" && s.type !== "MISS") || s.locationX == null || s.locationY == null) {
      return;
    }
    const x = Math.round(Number(s.locationX) / 10) * 10;
    const y = Math.round(Number(s.locationY) / 10) * 10;
    const key = `${x}-${y}`;
    if (!buckets[key]) buckets[key] = { makes: 0, attempts: 0 };
    buckets[key].attempts += 1;
    if (s.type === "MAKE") buckets[key].makes += 1;
  });
  return buckets;
};

const usePlayerStatsFilters = ({ games, allStats }: UsePlayerStatsFiltersArgs) => {
  const [selectedGameWindow, setSelectedGameWindow] = React.useState<GameWindow>("all");
  const [selectedGameId, setSelectedGameId] = React.useState<string | null>(null);

  const filteredGames = React.useMemo(() => {
    const sorted = sortGamesDesc(games);
    if (selectedGameWindow === "last5") return sorted.slice(0, 5);
    if (selectedGameWindow === "last10") return sorted.slice(0, 10);
    if (selectedGameWindow === "single" && selectedGameId) {
      return sorted.filter((g) => g.id === selectedGameId);
    }
    return sorted;
  }, [games, selectedGameWindow, selectedGameId]);

  React.useEffect(() => {
    if (selectedGameWindow === "single" && selectedGameId && !games.some((g) => g.id === selectedGameId)) {
      setSelectedGameId(null);
    }
  }, [selectedGameWindow, selectedGameId, games]);

  const filteredGameIds = React.useMemo(
    () => new Set(filteredGames.map((g) => g.id)),
    [filteredGames],
  );

  const filteredStats = React.useMemo(
    () => allStats.filter((s) => filteredGameIds.has(s.gameId)),
    [allStats, filteredGameIds],
  );

  const agg = React.useMemo(
    () => calculatePlayerAggregates([], filteredStats, [], "total", {})[0],
    [filteredStats],
  );

  const fgPctValue = Number(agg?.fgPct ?? 0);
  const aggregates = {
    min: agg?.min ?? 0,
    points: agg?.points ?? 0,
    rebounds: agg?.rebounds ?? 0,
    assists: agg?.assists ?? 0,
    steals: agg?.steals ?? 0,
    blocks: agg?.blocks ?? 0,
    turnovers: agg?.turnovers ?? 0,
    fgPct: Number.isFinite(fgPctValue) ? String(Math.round(fgPctValue)) : "0",
  };

  const heatmapData = React.useMemo(
    () => buildHeatmap(filteredStats),
    [filteredStats],
  );

  return {
    selectedGameId,
    setSelectedGameId,
    selectedGameWindow,
    setSelectedGameWindow,
    filteredGames,
    filteredStats,
    aggregates,
    heatmapData,
  };
};

export { usePlayerStatsFilters };
