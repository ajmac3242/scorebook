import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useGameFilters } from "./useGameFilters";

describe("useGameFilters", () => {
  it("initializes with default state values", () => {
    const { result } = renderHook(() => useGameFilters());

    expect(result.current.expandedSection).toBeNull();
    expect(result.current.activeTab).toBe("standard");
    expect(result.current.selectedPlayerId).toBe("ALL");
    expect(result.current.selectedType).toBe("ALL");
    expect(result.current.selectedQuality).toBe("ALL");
    expect(result.current.selectedBreakdown).toBe("ALL");
    expect(result.current.selectedPlay).toBe("ALL");
    expect(result.current.periodFilter).toBe("ALL");
    expect(result.current.clutchFilter).toBe(false);
    expect(result.current.compareMode).toBe(false);
    expect(result.current.comparePeriod1).toBe("1");
    expect(result.current.comparePeriod2).toBe("2");
    expect(result.current.shotChartView).toBe("markers");
    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "desc",
    });
  });

  it("updates individual filter state setters correctly", () => {
    const { result } = renderHook(() => useGameFilters());

    act(() => {
      result.current.setExpandedSection("box-score");
      result.current.setActiveTab("impact");
      result.current.setSelectedPlayerId(23);
      result.current.setSelectedType("MAKE");
      result.current.setSelectedQuality("OPEN");
      result.current.setSelectedBreakdown("Missed Rotation");
      result.current.setSelectedPlay("PnR");
      result.current.setPeriodFilter("1");
      result.current.setClutchFilter(true);
      result.current.setCompareMode(true);
      result.current.setComparePeriod1("3");
      result.current.setComparePeriod2("4");
      result.current.setShotChartView("heatmap");
    });

    expect(result.current.expandedSection).toBe("box-score");
    expect(result.current.activeTab).toBe("impact");
    expect(result.current.selectedPlayerId).toBe(23);
    expect(result.current.selectedType).toBe("MAKE");
    expect(result.current.selectedQuality).toBe("OPEN");
    expect(result.current.selectedBreakdown).toBe("Missed Rotation");
    expect(result.current.selectedPlay).toBe("PnR");
    expect(result.current.periodFilter).toBe("1");
    expect(result.current.clutchFilter).toBe(true);
    expect(result.current.compareMode).toBe(true);
    expect(result.current.comparePeriod1).toBe("3");
    expect(result.current.comparePeriod2).toBe("4");
    expect(result.current.shotChartView).toBe("heatmap");
  });

  it("handles sorting direction toggles and new key resets", () => {
    const { result } = renderHook(() => useGameFilters());

    // Initially sort key is 'points', direction 'desc'
    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "desc",
    });

    // Toggle same key ('points'): should change direction to 'asc'
    act(() => {
      result.current.handleSort("points");
    });

    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "asc",
    });

    // Toggle same key ('points') again: should change direction back to 'desc'
    act(() => {
      result.current.handleSort("points");
    });

    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "desc",
    });

    // Handle sort with a new key ('rebounds'): should set key to 'rebounds' and default direction to 'desc'
    act(() => {
      result.current.handleSort("rebounds");
    });

    expect(result.current.sortConfig).toEqual({
      key: "rebounds",
      direction: "desc",
    });
  });
});
