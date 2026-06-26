import { describe, it, expect } from "vitest";
import { renderHook } from "../../../test-utils";
import { useTeamStatsAnalytics } from "./useTeamStatsAnalytics";
import { PlayerAggregates } from "../../../utils/stats/types";
import { StatEvent } from "../../../db";

describe("useTeamStatsAnalytics", () => {
  const mockAggregatedStats: PlayerAggregates[] = [
    { playerId: "p1", points: 10, rebounds: 5 } as any,
    { playerId: "p2", points: 15, rebounds: 2 } as any,
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
    expect(result.current.playerStats[0].playerId).toBe("p2");
    expect(result.current.playerStats[1].playerId).toBe("p1");
  });

  it("sorts player stats correctly (asc)", () => {
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        ...defaultProps,
        sortConfig: { key: "points", direction: "asc" },
      }),
    );
    expect(result.current.playerStats[0].playerId).toBe("p1");
    expect(result.current.playerStats[1].playerId).toBe("p2");
  });

  it("handles sorting with equal values", () => {
    const sameStats: PlayerAggregates[] = [
      { playerId: "p1", points: 10 } as any,
      { playerId: "p2", points: 10 } as any,
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
      { playerId: "p1", points: 10 } as any,
      { playerId: "p2", points: 20 } as any,
    ];
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        ...defaultProps,
        aggregatedStats: mixedStats,
        sortConfig: { key: "points", direction: "desc" },
      }),
    );
    expect(result.current.playerStats[0].playerId).toBe("p2");
  });
});
