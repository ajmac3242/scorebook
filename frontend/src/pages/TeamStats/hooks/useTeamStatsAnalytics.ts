import { useMemo } from "react";
import { calculateLineupStats } from "../../../utils/stats";
import { StatEvent } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats/types";
import { SortConfig } from "./useTeamStatsFilters";

type UseTeamStatsAnalyticsProps = {
  aggregatedStats: PlayerAggregates[];
  allStats: StatEvent[];
  sortConfig: SortConfig;
  lineupSortConfig: SortConfig;
};

export const useTeamStatsAnalytics = ({
  aggregatedStats,
  allStats,
  sortConfig,
  lineupSortConfig,
}: UseTeamStatsAnalyticsProps) => {
  const playerStats = useMemo(() => {
    return [...aggregatedStats].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as number | string;
      const bValue = b[sortConfig.key as keyof typeof b] as number | string;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [aggregatedStats, sortConfig]);

  const lineupStats = useMemo(
    () => calculateLineupStats(allStats, lineupSortConfig),
    [allStats, lineupSortConfig],
  );

  return {
    playerStats,
    lineupStats,
  };
};
