import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "../../../../test-utils";
import { useTeamStatsAnalytics } from "../useTeamStatsAnalytics";
import { mockDb } from "../../../../dbMock";

describe("useTeamStatsAnalytics", () => {
  const mockAggregatedStats = [
    { playerId: "p1", name: "Player A", points: 10, gamesPlayed: 2 },
    { playerId: "p2", name: "Player B", points: 20, gamesPlayed: 1 },
    { playerId: "p3", name: "Player C", points: 15, gamesPlayed: 3 },
  ] as any;

  const mockAllStats = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: "PTS",
      points: 2,
      timestamp: "2026-06-01T10:00:00Z",
    },
    {
      id: "s2",
      gameId: "g1",
      playerId: "p2",
      type: "PTS",
      points: 3,
      timestamp: "2026-06-01T10:01:00Z",
    },
  ] as any;

  beforeEach(() => {
    mockDb.reset();
  });

  it("sorts player stats in ascending order", () => {
    const sortConfig = { key: "points", direction: "asc" as const };
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        aggregatedStats: mockAggregatedStats,
        allStats: mockAllStats,
        sortConfig,
        lineupSortConfig: { key: "points", direction: "desc" },
      }),
    );

    expect(result.current.playerStats[0].name).toBe("Player A"); // 10
    expect(result.current.playerStats[1].name).toBe("Player C"); // 15
    expect(result.current.playerStats[2].name).toBe("Player B"); // 20
  });

  it("sorts player stats in descending order", () => {
    const sortConfig = { key: "points", direction: "desc" as const };
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        aggregatedStats: mockAggregatedStats,
        allStats: mockAllStats,
        sortConfig,
        lineupSortConfig: { key: "points", direction: "desc" },
      }),
    );

    expect(result.current.playerStats[0].name).toBe("Player B"); // 20
    expect(result.current.playerStats[1].name).toBe("Player C"); // 15
    expect(result.current.playerStats[2].name).toBe("Player A"); // 10
  });

  it("returns lineup stats", () => {
    const { result } = renderHook(() =>
      useTeamStatsAnalytics({
        aggregatedStats: mockAggregatedStats,
        allStats: mockAllStats,
        sortConfig: { key: "name", direction: "asc" },
        lineupSortConfig: { key: "points", direction: "desc" },
      }),
    );

    // calculateLineupStats is a complex util, we just verify it returns something
    expect(result.current.lineupStats).toBeDefined();
    expect(Array.isArray(result.current.lineupStats)).toBe(true);
  });
});
