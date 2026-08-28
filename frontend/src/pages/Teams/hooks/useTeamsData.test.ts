import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTeamsData } from "./useTeamsData";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";
import type { Team, Game, StatEvent } from "../../../db";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useTeamsData", () => {
  const showSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles empty or undefined teams list gracefully", () => {
    const teams: Team[] = [];
    const { result } = renderHook(() => useTeamsData({ teams, showSnackbar }));

    expect(result.current.teamAggregatesMap).toEqual({});
  });

  it("handles undefined teams input gracefully", () => {
    const { result } = renderHook(() =>
      useTeamsData({ teams: undefined as any, showSnackbar }),
    );

    expect(result.current.teamAggregatesMap).toEqual({});
  });

  it("computes team aggregates for teams with games and stats", () => {
    const teams: Team[] = [
      { id: "team-1", name: "Eagles", isFavorite: 1, periodType: "QUARTERS" },
      { id: "team-2", name: "Hawks", isFavorite: 0, periodType: "QUARTERS" },
    ];

    const games: Game[] = [
      {
        id: "game-1",
        teamId: "team-1",
        opponent: "Rivals",
        date: "2024-01-01",
        location: "Home",
        completed: 1,
      },
    ];

    const stats: StatEvent[] = [
      {
        id: "stat-1",
        gameId: "game-1",
        playerId: "p1",
        type: "MAKE",
        points: 2,
        period: 1,
        timestamp: "100",
        clockTime: 600,
      },
    ];

    mockDb.games.data = games as (Game & Record<string, unknown>)[];
    mockDb.stats.data = stats as (StatEvent & Record<string, unknown>)[];

    const { result } = renderHook(
      ({ teamsList }) => useTeamsData({ teams: teamsList, showSnackbar }),
      { initialProps: { teamsList: teams } },
    );

    expect(result.current.teamAggregatesMap["team-1"]).toBeDefined();
    expect(result.current.teamAggregatesMap["team-1"].gamesPlayed).toBe(1);
    expect(result.current.teamAggregatesMap["team-2"]).toBeDefined();
    expect(result.current.teamAggregatesMap["team-2"].gamesPlayed).toBe(0);
  });

  it("toggles favorite state on when target team is not currently default", async () => {
    const teams: Team[] = [
      { id: "team-1", name: "Eagles", isFavorite: 1, periodType: "QUARTERS" },
      { id: "team-2", name: "Hawks", isFavorite: 0, periodType: "QUARTERS" },
    ];

    mockDb.teams.data = [...teams] as (Team & Record<string, unknown>)[];

    const { result } = renderHook(
      ({ teamsList }) => useTeamsData({ teams: teamsList, showSnackbar }),
      { initialProps: { teamsList: teams } },
    );

    const fakeEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.handleToggleDefault("team-2", 0, fakeEvent);
    });

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    const team1 = mockDb.teams.data.find((t) => t.id === "team-1");
    const team2 = mockDb.teams.data.find((t) => t.id === "team-2");

    expect(team1?.isFavorite).toBe(0);
    expect(team1?.synced).toBe(0);
    expect(team2?.isFavorite).toBe(1);
    expect(team2?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("toggles favorite state off when target team is currently default", async () => {
    const teams: Team[] = [
      { id: "team-1", name: "Eagles", isFavorite: 1, periodType: "QUARTERS" },
    ];

    mockDb.teams.data = [...teams] as (Team & Record<string, unknown>)[];

    const { result } = renderHook(
      ({ teamsList }) => useTeamsData({ teams: teamsList, showSnackbar }),
      { initialProps: { teamsList: teams } },
    );

    const fakeEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.handleToggleDefault("team-1", 1, fakeEvent);
    });

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    const team1 = mockDb.teams.data.find((t) => t.id === "team-1");
    expect(team1?.isFavorite).toBe(0);
    expect(team1?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles errors during favorite toggle and displays error snackbar", async () => {
    const teams: Team[] = [
      { id: "team-1", name: "Eagles", isFavorite: 0, periodType: "QUARTERS" },
    ];

    mockDb.teams.data = [...teams] as (Team & Record<string, unknown>)[];
    vi.spyOn(mockDb.teams, "update").mockRejectedValueOnce(
      new Error("Database write error"),
    );

    const { result } = renderHook(
      ({ teamsList }) => useTeamsData({ teams: teamsList, showSnackbar }),
      { initialProps: { teamsList: teams } },
    );

    const fakeEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    await act(async () => {
      await result.current.handleToggleDefault("team-1", 0, fakeEvent);
    });

    expect(showSnackbar).toHaveBeenCalledWith(
      "Could not update default team",
      "error",
    );
  });
});
