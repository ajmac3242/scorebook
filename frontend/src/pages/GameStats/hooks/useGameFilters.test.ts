import { renderHook, act } from "../../../test-utils";
import { describe, it, expect } from "vitest";
import { useGameFilters } from "./useGameFilters";

describe("useGameFilters", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useGameFilters());

    expect(result.current.selectedPlayerId).toBe("ALL");
    expect(result.current.activeTab).toBe("standard");
    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "desc",
    });
  });

  it("handles sorting logic", () => {
    const { result } = renderHook(() => useGameFilters());

    act(() => {
      result.current.handleSort("rebounds");
    });
    expect(result.current.sortConfig).toEqual({
      key: "rebounds",
      direction: "desc",
    });

    act(() => {
      result.current.handleSort("rebounds");
    });
    expect(result.current.sortConfig).toEqual({
      key: "rebounds",
      direction: "asc",
    });

    act(() => {
      result.current.handleSort("points");
    });
    expect(result.current.sortConfig).toEqual({
      key: "points",
      direction: "desc",
    });
  });

  it("allows setting various filters", () => {
    const { result } = renderHook(() => useGameFilters());

    act(() => {
      result.current.setActiveTab("impact");
      result.current.setSelectedPlayerId("p1");
      result.current.setPeriodFilter("1");
      result.current.setClutchFilter(true);
      result.current.setCompareMode(true);
      result.current.setShotChartView("heatmap");
    });

    expect(result.current.activeTab).toBe("impact");
    expect(result.current.selectedPlayerId).toBe("p1");
    expect(result.current.periodFilter).toBe("1");
    expect(result.current.clutchFilter).toBe(true);
    expect(result.current.compareMode).toBe(true);
    expect(result.current.shotChartView).toBe("heatmap");
  });
});
