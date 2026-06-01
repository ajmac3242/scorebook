import { useState } from "react";

export type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

export const useTeamStatsFilters = () => {
  const [activeTab, setActiveTab] = useState<"schedule" | "stats" | "lineups" | "roster">("schedule");
  const [statView, setStatView] = useState<"total" | "average">("total");
  const [gameCountFilter, setGameCountFilter] = useState<string>("all");
  const [scheduleView, setScheduleView] = useState<"upcoming" | "all">("upcoming");

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "points",
    direction: "desc",
  });
  const [lineupSortConfig, setLineupSortConfig] = useState<SortConfig>({
    key: "seconds",
    direction: "desc",
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handleLineupSort = (key: string) => {
    setLineupSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  return {
    activeTab,
    setActiveTab,
    statView,
    setStatView,
    gameCountFilter,
    setGameCountFilter,
    scheduleView,
    setScheduleView,
    sortConfig,
    setSortConfig,
    handleSort,
    lineupSortConfig,
    setLineupSortConfig,
    handleLineupSort,
  };
};
