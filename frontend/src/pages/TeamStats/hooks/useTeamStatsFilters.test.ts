import { describe, it, expect } from "vitest";
import { renderHook, act } from "../../../test-utils";
import { useTeamStatsFilters } from "./useTeamStatsFilters";

describe("useTeamStatsFilters", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useTeamStatsFilters());
    expect(result.current.activeTab).toBe("schedule");
    expect(result.current.statView).toBe("total");
    expect(result.current.sortConfig.key).toBe("points");
  });

  it("handles sorting toggles", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    act(() => {
      result.current.handleSort("points");
    });
    expect(result.current.sortConfig.direction).toBe("asc");

    act(() => {
      result.current.handleSort("points");
    });
    expect(result.current.sortConfig.direction).toBe("desc");

    act(() => {
      result.current.handleSort("rebounds");
    });
    expect(result.current.sortConfig.key).toBe("rebounds");
    expect(result.current.sortConfig.direction).toBe("desc");
  });

  it("handles lineup sorting toggles", () => {
    const { result } = renderHook(() => useTeamStatsFilters());

    act(() => {
      result.current.handleLineupSort("seconds");
    });
    expect(result.current.lineupSortConfig.direction).toBe("asc");
  });
});
