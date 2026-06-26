import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "../../../test-utils";
import { usePlayerStatsFilters } from "./usePlayerStatsFilters";

describe("usePlayerStatsFilters", () => {
  const games = [
    { id: "g1", date: "2024-01-01", teamId: "t1" },
    { id: "g2", date: "2024-01-02", teamId: "t1" },
  ] as any;

  const allStats = [
    {
      playerId: "p1",
      gameId: "g1",
      type: "MAKE",
      points: 2,
      locationX: 10,
      locationY: 10,
    },
    {
      playerId: "p1",
      gameId: "g2",
      type: "MISS",
      points: 0,
      locationX: 20,
      locationY: 20,
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters games and stats correctly", async () => {
    const { result } = renderHook(() =>
      usePlayerStatsFilters({
        games,
        allStats,
        teamIdParam: null,
      }),
    );

    expect(result.current.filteredGames).toHaveLength(2);
    expect(result.current.filteredStats).toHaveLength(2);
    expect(result.current.heatmapData["10-10"]).toBeDefined();
  });

  it("handles last5 window", async () => {
    const manyGames = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i}`,
      date: `2024-01-${10 + i}`,
    })) as any;

    const { result } = renderHook(() =>
      usePlayerStatsFilters({
        games: manyGames,
        allStats: [],
        teamIdParam: null,
      }),
    );

    await act(async () => {
      result.current.setSelectedGameWindow("last5");
    });

    await waitFor(() => {
      expect(result.current.filteredGames).toHaveLength(5);
    });
  });

  it("handles single game selection", async () => {
    const { result } = renderHook(() =>
      usePlayerStatsFilters({
        games,
        allStats,
        teamIdParam: null,
      }),
    );

    await act(async () => {
      result.current.setSelectedGameWindow("single");
      result.current.setSelectedGameId("g1");
    });

    await waitFor(() => {
      expect(result.current.filteredGames).toHaveLength(1);
      expect(result.current.filteredGames[0].id).toBe("g1");
    });
  });
});
