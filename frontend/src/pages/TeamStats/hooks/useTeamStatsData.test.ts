import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useTeamStatsData } from "./useTeamStatsData";
import { mockDb } from "../../../dbMock";

describe("useTeamStatsData", () => {
  const defaultProps = {
    teamId: "team1",
    gameCountFilter: "all",
    scheduleView: "all" as const,
    statView: "total" as const,
  };

  beforeEach(() => {
    mockDb.reset();
  });

  it("fetches team data correctly", async () => {
    const mockTeam = { id: "team1", name: "Warriors" } as any;
    await mockDb.teams.add(mockTeam);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));

    await waitFor(() => {
      expect(result.current.team?.name).toBe("Warriors");
    });
  });

  it("filters and sorts games for schedule", async () => {
    const mockGames = [
      { id: "g1", teamId: "team1", date: "2024-06-20", location: "Home", completed: 1 },
      { id: "g2", teamId: "team1", date: "2024-06-21", location: "Away", completed: 0 },
      { id: "g3", teamId: "team1", date: "2024-06-19", location: "Home", completed: 1, deletedAt: "now" },
    ] as any[];
    await mockDb.games.bulkPut(mockGames);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));

    await waitFor(() => {
      // Should include non-deleted games
      expect(result.current.filteredSchedule).toHaveLength(2);
      // Should be sorted by date (ascending)
      expect(result.current.filteredSchedule[0].id).toBe("g1");
      expect(result.current.filteredSchedule[1].id).toBe("g2");
    });
  });

  it("filters game IDs based on gameCountFilter", async () => {
    const mockGames = [
        { id: "g1", teamId: "team1", date: "2024-06-22", completed: 1 },
        { id: "g2", teamId: "team1", date: "2024-06-21", completed: 1 },
        { id: "g3", teamId: "team1", date: "2024-06-20", completed: 1 },
    ] as any[];
    await mockDb.games.bulkPut(mockGames);

    const { result } = renderHook(() => useTeamStatsData({ ...defaultProps, gameCountFilter: "2" }));

    await waitFor(() => {
      expect(result.current.gameIds).toHaveLength(2);
      expect(result.current.gameIds).toContain("g1");
      expect(result.current.gameIds).toContain("g2");
    });
  });

  it("calculates sorted roster by jersey number", async () => {
    const mockPlayers = [
        { id: "p1", name: "Player A" },
        { id: "p2", name: "Player B" },
        { id: "p3", name: "Player C" },
    ] as any[];
    const mockTeamPlayers = [
        { teamId: "team1", playerId: "p1", jerseyNumber: "30" },
        { teamId: "team1", playerId: "p2", jerseyNumber: "11" },
        { teamId: "team1", playerId: "p3", jerseyNumber: "23" },
    ] as any[];

    await mockDb.players.bulkPut(mockPlayers);
    await mockDb.teamPlayers.bulkPut(mockTeamPlayers);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));

    await waitFor(() => {
      expect(result.current.sortedRoster).toHaveLength(3);
      expect(result.current.sortedRoster[0].id).toBe("p2"); // #11
      expect(result.current.sortedRoster[1].id).toBe("p3"); // #23
      expect(result.current.sortedRoster[2].id).toBe("p1"); // #30
    });
  });

  it("handles team deletion status", async () => {
    const deletedAt = new Date().toISOString();
    const mockTeam = { id: "team1", name: "Warriors", deletedAt } as any;
    await mockDb.teams.add(mockTeam);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));

    await waitFor(() => {
        expect(result.current.isDeleted).toBe(true);
    });
  });
});

import { act } from "@testing-library/react";
