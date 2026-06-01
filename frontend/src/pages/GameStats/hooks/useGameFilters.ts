import { useState, useCallback } from "react";

export function useGameFilters() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"standard" | "impact">("standard");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedQuality, setSelectedQuality] = useState<string>("ALL");
  const [selectedBreakdown, setSelectedBreakdown] = useState<string>("ALL");
  const [selectedPlay, setSelectedPlay] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [clutchFilter, setClutchFilter] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePeriod1, setComparePeriod1] = useState<string>("1");
  const [comparePeriod2, setComparePeriod2] = useState<string>("2");
  const [shotChartView, setShotChartView] = useState<"markers" | "heatmap">(
    "markers",
  );

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  }, []);

  return {
    expandedSection,
    setExpandedSection,
    activeTab,
    setActiveTab,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedType,
    setSelectedType,
    selectedQuality,
    setSelectedQuality,
    selectedBreakdown,
    setSelectedBreakdown,
    selectedPlay,
    setSelectedPlay,
    periodFilter,
    setPeriodFilter,
    clutchFilter,
    setClutchFilter,
    compareMode,
    setCompareMode,
    comparePeriod1,
    setComparePeriod1,
    comparePeriod2,
    setComparePeriod2,
    shotChartView,
    setShotChartView,
    sortConfig,
    setSortConfig,
    handleSort,
  };
}

export type GameFilters = ReturnType<typeof useGameFilters>;
