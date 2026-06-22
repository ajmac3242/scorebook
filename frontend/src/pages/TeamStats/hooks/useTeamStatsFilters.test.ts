import { renderHook, act } from "../../../test-utils";
import { describe, it, expect } from "vitest";
import { useTeamStatsFilters } from "./useTeamStatsFilters";

describe("useTeamStatsFilters", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    expect(result.current.activeTab).toBe("schedule");
    expect(result.current.statView).toBe("total");
    expect(result.current.scheduleView).toBe("upcoming");
    expect(result.current.sortConfig).toEqual({ key: "points", direction: "desc" });
  });

  it("handles standard sort logic", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    act(() => {
      result.current.handleSort("rebounds");
    });
    expect(result.current.sortConfig).toEqual({ key: "rebounds", direction: "desc" });

    act(() => {
      result.current.handleSort("rebounds");
    });
    expect(result.current.sortConfig).toEqual({ key: "rebounds", direction: "asc" });
  });

  it("handles lineup sort logic", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    act(() => {
      result.current.handleLineupSort("netRating");
    });
    expect(result.current.lineupSortConfig).toEqual({ key: "netRating", direction: "desc" });

    act(() => {
      result.current.handleLineupSort("netRating");
    });
    expect(result.current.lineupSortConfig).toEqual({ key: "netRating", direction: "asc" });
  });

  it("allows setting various filters", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    act(() => {
      result.current.setActiveTab("stats");
      result.current.setStatView("average");
      result.current.setGameCountFilter("5");
      result.current.setScheduleView("all");
    });

    expect(result.current.activeTab).toBe("stats");
    expect(result.current.statView).toBe("average");
    expect(result.current.gameCountFilter).toBe("5");
    expect(result.current.scheduleView).toBe("all");
  });
});
