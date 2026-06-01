import { useMemo, useState } from "react";
import { type StatEvent, type Game, type Player, type Team } from "../../../db";
import { getShotZone } from "../../../utils/shotZones";
import { calculatePlayerAggregates } from "../../../utils/stats";

type UsePlayerStatsFiltersProps = {
  allStats: StatEvent[];
  games: Game[];
  gameIdSet: Set<string | undefined>;
  player: Player | undefined;
  currentTeam: Team | undefined;
};

export const usePlayerStatsFilters = ({
  allStats,
  games,
  gameIdSet,
  player,
  currentTeam,
}: UsePlayerStatsFiltersProps) => {
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );

  const filteredStats = useMemo(() => {
    const stats = allStats as StatEvent[];
    const result: StatEvent[] = [];

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      if (selectedGameId !== "" && stat.gameId !== selectedGameId) continue;
      if (selectedType !== "" && stat.type !== selectedType) continue;
      if (selectedGameId === "" && !gameIdSet.has(stat.gameId)) continue;
      result.push(stat);
    }

    return result;
  }, [allStats, selectedGameId, selectedType, gameIdSet]);

  const aggregates = useMemo(() => {
    const activeGame = games.find(
      (game) => game.id === selectedGameId && !game.completed,
    );

    const result = calculatePlayerAggregates(
      [player].filter((p): p is NonNullable<typeof p> => p !== undefined),
      filteredStats,
      [],
      "total",
      {
        periodLength: activeGame?.periodLength,
        clutchOnly: clutchFilter,
        periodType: currentTeam?.periodType || "QUARTERS",
        liveContext: activeGame
          ? {
              clockTime: activeGame.clockTime || 0,
              period: activeGame.currentPeriod || 1,
            }
          : undefined,
      },
    );

    return (
      result[0] || {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        turnovers: 0,
        blocks: 0,
        offRebounds: 0,
        defRebounds: 0,
        fgPct: "0.0",
        efgPct: "0.0",
        plusMinus: 0,
        min: 0,
        makes: 0,
        attempts: 0,
      }
    );
  }, [player, filteredStats, games, selectedGameId, clutchFilter, currentTeam]);

  const heatmapData = useMemo(() => {
    const data: Record<string, { makes: number; attempts: number }> = {};

    for (let i = 0; i < filteredStats.length; i++) {
      const stat = filteredStats[i];
      if (stat.type !== "MAKE" && stat.type !== "MISS") continue;

      const zone = getShotZone(stat.locationX || 0, stat.locationY || 0);
      if (!data[zone]) data[zone] = { makes: 0, attempts: 0 };
      data[zone].attempts++;
      if (stat.type === "MAKE") data[zone].makes++;
    }

    return data;
  }, [filteredStats]);

  return {
    selectedGameId,
    setSelectedGameId,
    selectedType,
    setSelectedType,
    clutchFilter,
    setClutchFilter,
    shotChartView,
    setShotChartView,
    filteredStats,
    aggregates,
    heatmapData,
  };
};
