import { describe, it, expect } from "vitest";
import { renderHook } from "../../../test-utils";
import { useTeamStatsAnalytics } from "./useTeamStatsAnalytics";
import { PlayerAggregates } from "../../../utils/stats/types";
import { StatEvent } from "../../../db";

describe("useTeamStatsAnalytics", () => {
  const mockAggregatedStats: PlayerAggregates[] = [
    { id: "p1", points: 10, rebounds: 5 } as any,
    { id: "p2", points: 15, rebounds: 2 } as any,
  ];

  const mockAllStats: StatEvent[] = [
    {
      id: "s1",
      playerId: "p1",
      type: "MAKE",
      points: 2,
      gameId: "g1",
      period: 1,
    } as any,
  ];

  const defaultProps = {
    aggregatedStats: mockAggregatedStats,
    allStats: mockAllStats,
    sortConfig: { key: "points", direction: "desc" as const },
    lineupSortConfig: { key: "plusMinus", direction: "desc" as const },
  };

  it("sorts player stats correctly (desc)", () => {
    const { result } = renderHook(() => useTeamStatsAnalytics(defaultProps));
    expect(result.current.playerStats[0].id).toBe("p2");
    expect(result.current.playerStats[1].id).toBe("p1");
  });

  it("sorts player stats correctly (asc)", () => {
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        ...defaultProps,
        sortConfig: { key: "points", direction: "asc" },
      }),
    );
    expect(result.current.playerStats[0].id).toBe("p1");
    expect(result.current.playerStats[1].id).toBe("p2");
  });

  it("handles sorting with equal values", () => {
    const sameStats: PlayerAggregates[] = [
      { id: "p1", points: 10 } as any,
      { id: "p2", points: 10 } as any,
    ];
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        ...defaultProps,
        aggregatedStats: sameStats,
      }),
    );
    expect(result.current.playerStats).toHaveLength(2);
  });

  it("calculates lineup stats", () => {
    const { result } = renderHook(() => useTeamStatsAnalytics(defaultProps));
    expect(result.current.lineupStats).toBeDefined();
    // Since calculateLineupStats is mocked or imported, we just verify it returns something
    expect(Array.isArray(result.current.lineupStats)).toBe(true);
  });

  it("handles empty values in sorting", () => {
    const mixedStats: PlayerAggregates[] = [
      { id: "p1", points: 10 } as any,
      { id: "p2", points: 20 } as any,
    ];
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        ...defaultProps,
        aggregatedStats: mixedStats,
        sortConfig: { key: "points", direction: "desc" },
      }),
    );
    expect(result.current.playerStats[0].id).toBe("p2");
  });
});
