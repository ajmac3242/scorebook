import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useTeamActions } from "./useTeamActions";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useTeamActions", () => {
  const showSnackbar = vi.fn();
  const mockTeam = {
    id: "team1",
    name: "Warriors",
    periodType: "QUARTERS",
    defaultPeriodLength: 12,
    defaultTimeoutLimit: 3,
    defaultFoulLimit: 6,
  } as any;

  const defaultProps = {
    teamId: "team1",
    team: mockTeam,
    allPlayers: [],
    teamPlayers: [],
    showSnackbar,
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("initializes state from team", () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    expect(result.current.editName).toBe("Warriors");
    expect(result.current.editPeriodLength).toBe(12);
  });

  it("updates team settings successfully", async () => {
    await mockDb.teams.add(mockTeam);
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setEditName("New Name");
    });

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    const updated = await mockDb.teams.get("team1");
    expect(updated?.name).toBe("New Name");
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith("Team settings updated.", "success");
    expect(result.current.openSettingsDialog).toBe(false);
  });

  it("handles team deletion", async () => {
    await mockDb.teams.add(mockTeam);
    await mockDb.games.add({ id: "game1", teamId: "team1" } as any);

    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    const deletedTeam = await mockDb.teams.get("team1");
    expect(deletedTeam?.deletedAt).toBeDefined();

    const deletedGame = await mockDb.games.get("game1");
    expect(deletedGame?.deletedAt).toBeDefined();

    expect(showSnackbar).toHaveBeenCalledWith("Team scheduled for deletion.", "success");
  });

  it("handles team restoration", async () => {
    await mockDb.teams.add({ ...mockTeam, deletedAt: "2024-01-01" });
    await mockDb.games.add({ id: "game1", teamId: "team1", deletedAt: "2024-01-01" } as any);

    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    const restoredTeam = await mockDb.teams.get("team1");
    expect(restoredTeam?.deletedAt).toBeUndefined();

    const restoredGame = await mockDb.games.get("game1");
    expect(restoredGame?.deletedAt).toBeUndefined();

    expect(showSnackbar).toHaveBeenCalledWith("Team restored.", "success");
  });

  it("adds a new game successfully", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setNewOpponent("Lakers");
      result.current.setNewDate("2024-06-21");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    const games = await mockDb.games.toArray();
    expect(games.some(g => g.opponent === "Lakers")).toBe(true);
    expect(showSnackbar).toHaveBeenCalledWith("Game created.", "success");
  });

  it("stages and saves roster changes", async () => {
    const player = { id: "p1", name: "Stephen Curry" } as any;
    const propsWithPlayers = {
      ...defaultProps,
      allPlayers: [player],
      teamPlayers: [],
    };

    const { result } = renderHook(() => useTeamActions(propsWithPlayers));

    act(() => {
      result.current.stageRosterChange("p1", false); // Add
      result.current.stageJerseyUpdate("p1", "30");
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(1);
    expect(teamPlayers[0].playerId).toBe("p1");
    expect(teamPlayers[0].jerseyNumber).toBe("30");
    expect(showSnackbar).toHaveBeenCalledWith("Roster updated.", "success");
  });

  it("removes players from roster", async () => {
    const player = { id: "p1", name: "Stephen Curry" } as any;
    const teamPlayer = { teamId: "team1", playerId: "p1" } as any;
    await mockDb.teamPlayers.add(teamPlayer);

    const propsWithPlayers = {
      ...defaultProps,
      allPlayers: [player],
      teamPlayers: [teamPlayer],
    };

    const { result } = renderHook(() => useTeamActions(propsWithPlayers));

    act(() => {
      result.current.stageRosterChange("p1", true); // Remove
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(0);
    expect(showSnackbar).toHaveBeenCalledWith("Roster updated.", "success");
  });

  it("handles cancelling roster changes", () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.stageRosterChange("p1", false);
      result.current.handleCancelRoster();
    });

    expect(result.current.openRosterDialog).toBe(false);
    expect(Object.keys(result.current.pendingRosterChanges)).toHaveLength(0);
  });
});
