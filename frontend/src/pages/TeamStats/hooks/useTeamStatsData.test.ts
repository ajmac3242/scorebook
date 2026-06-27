import { renderHook, waitFor } from "@testing-library/react";
import { useTeamStatsData } from "./useTeamStatsData";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("useTeamStatsData", () => {
  beforeEach(() => {
    mockDb.reset();
    (window as any).isTesting = true;
  });

  const defaultProps = {
    teamId: "t1",
    gameCountFilter: "all",
    scheduleView: "all" as const,
    statView: "total" as const,
  };

  it("loads basic team data", async () => {
    await mockDb.teams.add({ id: "t1", name: "Team 1" } as any);
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.team?.name).toBe("Team 1"));
  });

  it("calculates aggregates correctly", async () => {
    await mockDb.teams.add({ id: "t1", name: "Team 1" } as any);
    await mockDb.players.add({ id: "p1", name: "Player 1" } as any);
    await mockDb.teamPlayers.add({ teamId: "t1", playerId: "p1", jerseyNumber: "10" } as any);
    await mockDb.games.add({ id: "g1", teamId: "t1", completed: 1, date: "2023-01-01" } as any);
    await mockDb.stats.add({ id: "s1", gameId: "g1", playerId: "p1", type: "MAKE", points: 2, timestamp: "1", period: 1 } as any);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.teamAggregates.ppg).toBe("2.0"));
    expect(result.current.aggregatedStats).toHaveLength(1);
  });

  it("handles deleted state and timeLeft", async () => {
    await mockDb.teams.add({ id: "t1", name: "D", deletedAt: "2023-01-01T00:00:00Z" } as any);
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.isDeleted).toBe(true));
    expect(result.current.timeLeft).toBeDefined();
  });

  it("sorts roster", async () => {
    await mockDb.teams.add({ id: "t1", name: "T" } as any);
    await mockDb.players.add({ id: "p1", name: "P" } as any);
    await mockDb.teamPlayers.add({ teamId: "t1", playerId: "p1", jerseyNumber: "00" } as any);
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.sortedRoster).toHaveLength(1));
  });

  it("handles location fetch error", async () => {
    const original = mockDb.games.toArray;
    mockDb.games.toArray = vi.fn().mockRejectedValue(new Error("err"));
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.allRecentLocations).toEqual([]));
    mockDb.games.toArray = original;
  });
});
