import { renderHook, waitFor } from "../../../test-utils";
import { useTeamsData } from "./useTeamsData";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncService } from "../../../utils/syncService";
import { useMemo } from "react";
import type { Team } from "../../../db";

// Mock syncService
vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

describe("useTeamsData", () => {
  const mockShowSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    mockShowSnackbar.mockClear();
    vi.mocked(syncService.pushUpdates).mockClear();
    (window as any).isTesting = true;
  });

  it("returns empty team aggregates when no teams or stats exist", async () => {
    const { result } = renderHook(() => {
      const teams = useMemo<Team[]>(() => [], []);
      return useTeamsData({ teams, showSnackbar: mockShowSnackbar });
    });

    await waitFor(() => {
      expect(result.current.teamAggregatesMap).toEqual({});
    });
  });

  it("correctly aggregates stats by team", async () => {
    const { result } = renderHook(() => {
      const teams = useMemo<Team[]>(() => [
        { id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" },
        { id: "team-2", name: "Celtics", isFavorite: 0, periodType: "QUARTERS" },
      ], []);
      return useTeamsData({ teams, showSnackbar: mockShowSnackbar });
    });

    await mockDb.teams.add({ id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" });
    await mockDb.teams.add({ id: "team-2", name: "Celtics", isFavorite: 0, periodType: "QUARTERS" });

    // Add a completed game for Lakers
    await mockDb.games.add({
      id: "game-1",
      teamId: "team-1",
      completed: 1,
      date: "2023-01-01",
    } as any);

    // Add a stats event for that game
    await mockDb.stats.add({
      id: "stat-1",
      gameId: "game-1",
      playerId: "p1",
      type: "MAKE",
      points: 2,
      timestamp: "1",
      period: 1,
    } as any);

    await waitFor(() => {
      expect(result.current.teamAggregatesMap["team-1"]).toBeDefined();
      expect(result.current.teamAggregatesMap["team-1"].gamesPlayed).toBe(1);
      expect(result.current.teamAggregatesMap["team-1"].ppg).toBe("2.0");
    });

    expect(result.current.teamAggregatesMap["team-2"]).toBeDefined();
    expect(result.current.teamAggregatesMap["team-2"].gamesPlayed).toBe(0);
  });

  it("handles handleToggleDefault when setting a new favorite", async () => {
    const { result } = renderHook(() => {
      const teams = useMemo<Team[]>(() => [
        { id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" },
        { id: "team-2", name: "Celtics", isFavorite: 1, periodType: "QUARTERS" },
      ], []);
      return useTeamsData({ teams, showSnackbar: mockShowSnackbar });
    });

    await mockDb.teams.add({ id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" });
    await mockDb.teams.add({ id: "team-2", name: "Celtics", isFavorite: 1, periodType: "QUARTERS" });

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as any;

    await result.current.handleToggleDefault("team-1", 0, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "team-1");
      const t2 = mockDb.teams.data.find((t: any) => t.id === "team-2");
      expect(t1?.isFavorite).toBe(1);
      expect(t2?.isFavorite).toBe(0);
      expect(t1?.synced).toBe(0);
      expect(t2?.synced).toBe(0);
    });

    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles handleToggleDefault when removing favorite", async () => {
    const { result } = renderHook(() => {
      const teams = useMemo<Team[]>(() => [
        { id: "team-1", name: "Lakers", isFavorite: 1, periodType: "QUARTERS" }
      ], []);
      return useTeamsData({ teams, showSnackbar: mockShowSnackbar });
    });

    await mockDb.teams.add({ id: "team-1", name: "Lakers", isFavorite: 1, periodType: "QUARTERS" });

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as any;

    await result.current.handleToggleDefault("team-1", 1, mockEvent);

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "team-1");
      expect(t1?.isFavorite).toBe(0);
      expect(t1?.synced).toBe(0);
    });

    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("displays error snackbar when favorite toggle fails", async () => {
    const { result } = renderHook(() => {
      const teams = useMemo<Team[]>(() => [
        { id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" }
      ], []);
      return useTeamsData({ teams, showSnackbar: mockShowSnackbar });
    });

    await mockDb.teams.add({ id: "team-1", name: "Lakers", isFavorite: 0, periodType: "QUARTERS" });

    // Force error in pushUpdates
    vi.mocked(syncService.pushUpdates).mockRejectedValueOnce(
      new Error("Push failed"),
    );

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as any;

    await result.current.handleToggleDefault("team-1", 0, mockEvent);

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        "Could not update default team",
        "error",
      );
    });
  });
});
