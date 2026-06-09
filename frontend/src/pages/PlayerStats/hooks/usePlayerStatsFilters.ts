import React from "react";
import dayjs from "dayjs";
import { calculatePlayerAggregates, buildHeatmapData } from "../../../utils/stats";
import type { Game, StatEvent } from "../../../db";
import type { GameWindow } from "../sections/PlayerStatsFilterBar";

type UsePlayerStatsFiltersArgs = {
  games: Game[];
  allStats: StatEvent[];
  teamIdParam: string | null;
};

const sortGamesDesc = (games: Game[]) =>
  [...games].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

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
    if (selectedGameWindow === "single") {
      const hasSelected = filteredGames.some((g) => g.id === selectedGameId);
      if (!hasSelected && filteredGames[0]) {
        setSelectedGameId(filteredGames[0].id);
      }
    }
  }, [selectedGameWindow, filteredGames, selectedGameId]);

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

  const aggregates = {
    min: agg?.min ?? 0,
    points: agg?.points ?? 0,
    rebounds: agg?.rebounds ?? 0,
    assists: agg?.assists ?? 0,
    steals: agg?.steals ?? 0,
    blocks: agg?.blocks ?? 0,
    turnovers: agg?.turnovers ?? 0,
    fgPct: Number.isFinite(agg?.fgPct) ? String(Math.round(agg.fgPct)) : "0",
  };

  const heatmapData = React.useMemo(
    () => buildHeatmapData(filteredStats.filter((s) => s.type === "MAKE" || s.type === "MISS")),
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
