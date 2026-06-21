import { renderHook } from "@testing-library/react";
import { useGameAggregates } from "./useGameAggregates";
import { ACTION_TYPES } from "../../../constants/stats";

describe("useGameAggregates", () => {
  const mockStats = [
    { id: "s1", playerId: "p1", type: ACTION_TYPES.MAKE, points: 2, period: 1, timestamp: "2024-06-21T10:00:00Z", locationX: 50, locationY: 50 },
    { id: "s2", playerId: "p1", type: ACTION_TYPES.MISS, points: 2, period: 1, timestamp: "2024-06-21T10:01:00Z", locationX: 20, locationY: 20 },
    { id: "s3", playerId: "p1", type: ACTION_TYPES.MAKE, points: 3, period: 2, timestamp: "2024-06-21T10:05:00Z", locationX: 10, locationY: 10 },
  ] as any[];

  const mockRawData = {
    allStats: mockStats,
    game: { id: "g1", periodLength: 10, completed: 1 },
    team: { id: "t1", periodType: "QUARTERS" },
    teamPlayers: [{ playerId: "p1", jerseyNumber: "30" }],
    players: [{ id: "p1", name: "Steph" }],
    teamSeasonStats: { ftPct: "80.0", turnoverRate: "10.0", orebPct: "30.0" }
  } as any;

  const mockFilters = {
    periodFilter: "ALL",
    clutchFilter: false,
    selectedPlayerId: "ALL",
    selectedType: "ALL",
    selectedQuality: "ALL",
    selectedBreakdown: "ALL",
    selectedPlay: "ALL",
    sortConfig: { key: "points", direction: "desc" },
    comparePeriod1: "1",
    comparePeriod2: "2"
  } as any;

  it("filters stats by period", () => {
    const { result } = renderHook(() => useGameAggregates({
      rawData: mockRawData,
      filters: { ...mockFilters, periodFilter: "1" }
    }));

    expect(result.current.stats).toHaveLength(2);
    expect(result.current.stats.every(s => s.period === 1)).toBe(true);
  });

  it("calculates basic team data", () => {
    const { result } = renderHook(() => useGameAggregates({
      rawData: mockRawData,
      filters: mockFilters
    }));

    expect(result.current.teamData.points).toBe(5);
    // 2 FGA (one make, one miss), 0 FTA, 0 TO, 0 OREB -> ~2 possessions (simplified)
    expect(result.current.teamData.possessions).toBeGreaterThan(0);
  });

  it("generates shot chart markers", () => {
    const { result } = renderHook(() => useGameAggregates({
        rawData: mockRawData,
        filters: mockFilters
    }));

    expect(result.current.shotChartMarkers).toHaveLength(3); // s1, s2, s3
    expect(result.current.shotChartMarkers[0].label).toBe("30");
  });

  it("calculates heatmap data for compare periods", () => {
    const { result } = renderHook(() => useGameAggregates({
        rawData: mockRawData,
        filters: mockFilters
    }));

    expect(result.current.heatmapData1).toBeDefined();
    expect(result.current.heatmapData2).toBeDefined();
  });

  it("filters derived stats by player", () => {
    const { result } = renderHook(() => useGameAggregates({
        rawData: mockRawData,
        filters: { ...mockFilters, selectedPlayerId: "p1" }
    }));

    expect(result.current.shotChartMarkers.every(m => m.playerId === "p1")).toBe(true);
  });
});
