import {
  renderHookWithProviders as renderHook,
  act,
} from "../../../test-utils";
import { useTeamActions } from "./useTeamActions";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("useTeamActions", () => {
  const showSnackbar = vi.fn();
  const mockTeam = {
    id: "t1",
    name: "Lakers",
    logoUrl: "logo.png",
    primaryColor: "#FF0000",
    periodType: "QUARTERS" as const,
    defaultPeriodLength: 12,
    defaultOvertimeLength: 5,
    defaultTimeoutLimit: 7,
    defaultFoulLimit: 6,
    maxStintDuration: 8,
    foulWarningThresholds: { "1": 4 },
    playbook: ["P1"],
    synced: 1,
  };

  const defaultProps = {
    teamId: "t1",
    team: mockTeam,
    allPlayers: [],
    teamPlayers: [],
    showSnackbar,
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("initializes state from team prop", () => {
    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    expect(result.current.editName).toBe("Lakers");
    expect(result.current.editLogoUrl).toBe("logo.png");
    expect(result.current.editColor).toBe("#FF0000");
  });

  it("handles undefined team on initialization gracefully", () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          team: undefined,
        }),
      { withAuth: false },
    );

    // Should fall back to default values
    expect(result.current.editName).toBe("");
    expect(result.current.editLogoUrl).toBe("");
  });

  it("handles handleUpdateTeamSettings success", async () => {
    await mockDb.teams.add(mockTeam);
    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.setEditName("Updated Lakers");
    });

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    const updatedTeam = await mockDb.teams.get("t1");
    expect(updatedTeam?.name).toBe("Updated Lakers");
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith(
      "Team settings updated.",
      "success",
    );
  });

  it("handles handleUpdateTeamSettings error catch path", async () => {
    // Cause an error by not having the team in DB or mocking DB error
    vi.spyOn(mockDb.teams, "update").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update team settings:",
      expect.any(Error),
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      "Unable to update team settings.",
      "error",
    );
  });

  it("returns early from handleUpdateTeamSettings if teamId is not defined", async () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          teamId: undefined,
        }),
      { withAuth: false },
    );

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("handles handleDeleteTeam success", async () => {
    await mockDb.teams.add(mockTeam);
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      opponent: "Bulls",
      date: "2023-01-01",
      location: "Home",
      synced: 1,
    } as any);

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    const deletedTeam = await mockDb.teams.get("t1");
    expect(deletedTeam?.deletedAt).toBeDefined();

    const deletedGame = await mockDb.games.get("g1");
    expect(deletedGame?.deletedAt).toBeDefined();

    expect(showSnackbar).toHaveBeenCalledWith(
      "Team scheduled for deletion.",
      "success",
    );
  });

  it("returns early from handleDeleteTeam if teamId or team is undefined", async () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          team: undefined,
        }),
      { withAuth: false },
    );

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("handles handleDeleteTeam error catch path", async () => {
    vi.spyOn(mockDb.teams, "update").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to delete team:",
      expect.any(Error),
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      "Unable to delete team.",
      "error",
    );
  });

  it("handles handleRestoreTeam success", async () => {
    const deletedTeam = { ...mockTeam, deletedAt: "2023-01-01" };
    await mockDb.teams.add(deletedTeam);
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      opponent: "Bulls",
      date: "2023-01-01",
      location: "Home",
      deletedAt: "2023-01-01",
      synced: 1,
    } as any);

    const { result } = renderHook(() =>
      useTeamActions({ ...defaultProps, team: deletedTeam }),
    );

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    const restoredTeam = await mockDb.teams.get("t1");
    expect(restoredTeam?.deletedAt).toBeUndefined();

    const restoredGame = await mockDb.games.get("g1");
    expect(restoredGame?.deletedAt).toBeUndefined();

    expect(showSnackbar).toHaveBeenCalledWith("Team restored.", "success");
  });

  it("returns early from handleRestoreTeam if teamId or team is undefined", async () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          team: undefined,
        }),
      { withAuth: false },
    );

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("handles handleRestoreTeam error catch path", async () => {
    vi.spyOn(mockDb.teams, "update").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to restore team:",
      expect.any(Error),
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      "Unable to restore team.",
      "error",
    );
  });

  it("returns early from handleAddGame if teamId or opponent is missing", async () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          teamId: undefined,
        }),
      { withAuth: false },
    );

    await act(async () => {
      await result.current.handleAddGame();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("handles handleAddGame success with new opponent creation", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.setNewOpponent("Warriors");
      result.current.setNewDate("2023-12-25");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    const games = await mockDb.games.toArray();
    expect(games).toHaveLength(1);
    expect(games[0].opponent).toBe("Warriors");

    const opponents = await mockDb.opponents.toArray();
    expect(opponents).toHaveLength(1);
    expect(opponents[0].name).toBe("Warriors");
  });

  it("handles handleAddGame success with existing opponent reuse", async () => {
    await mockDb.opponents.add({
      id: "opp-existing",
      name: "Warriors",
      logoUrl: "warriors.png",
      roster: [],
      synced: 1,
    });

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.setNewOpponent("Warriors");
      result.current.setNewDate("2023-12-25");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    const games = await mockDb.games.toArray();
    expect(games).toHaveLength(1);
    expect(games[0].opponentId).toBe("opp-existing");
  });

  it("handles handleAddGame error catch path", async () => {
    vi.spyOn(mockDb.games, "add").mockRejectedValueOnce(new Error("DB Error"));

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.setNewOpponent("Warriors");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to add game:",
      expect.any(Error),
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      "Unable to create game.",
      "error",
    );
  });

  it("returns early from handleSaveRoster if teamId is not defined", async () => {
    const { result } = renderHook(
      () =>
        useTeamActions({
          ...defaultProps,
          teamId: undefined,
        }),
      { withAuth: false },
    );

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it("handles stageRosterChange and handleSaveRoster with additions, updates, and removals", async () => {
    const player1 = { id: "p1", name: "LeBron", synced: 1 };
    const player2 = { id: "p2", name: "Davis", synced: 1 };
    await mockDb.players.add(player1);
    await mockDb.players.add(player2);

    // Pre-populate teamPlayer with player2 to test removal and jersey updates
    const existingTeamPlayer = {
      id: "tp-davis",
      teamId: "t1",
      playerId: "p2",
      name: "Davis",
      jerseyNumber: "3",
      synced: 1,
    };
    await mockDb.teamPlayers.add(existingTeamPlayer);

    const { result } = renderHook(() =>
      useTeamActions({
        ...defaultProps,
        allPlayers: [player1, player2],
        teamPlayers: [existingTeamPlayer],
      }),
    );

    // Roster actions:
    // 1. Add p1 with jersey 23
    // 2. Remove p2 (Davis)
    await act(async () => {
      result.current.stageRosterChange("p1", false);
      result.current.stageJerseyUpdate("p1", "23");

      result.current.stageRosterChange("p2", true);
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const teamPlayers = await mockDb.teamPlayers.toArray();
    // Only p1 should be in the roster now, p2 removed
    expect(teamPlayers).toHaveLength(1);
    expect(teamPlayers[0].playerId).toBe("p1");
    expect(teamPlayers[0].jerseyNumber).toBe("23");
  });

  it("handles handleSaveRoster update of existing player's jersey number", async () => {
    const player = { id: "p1", name: "LeBron", synced: 1 };
    const existingTeamPlayer = {
      id: "tp-lebron",
      teamId: "t1",
      playerId: "p1",
      name: "LeBron",
      jerseyNumber: "23",
      synced: 1,
    };
    await mockDb.players.add(player);
    await mockDb.teamPlayers.add(existingTeamPlayer);

    const { result } = renderHook(() =>
      useTeamActions({
        ...defaultProps,
        allPlayers: [player],
        teamPlayers: [existingTeamPlayer],
      }),
    );

    await act(async () => {
      result.current.stageJerseyUpdate("p1", "6"); // Update LeBron's jersey from 23 to 6
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(1);
    expect(teamPlayers[0].playerId).toBe("p1");
    expect(teamPlayers[0].jerseyNumber).toBe("6"); // Assert it updated
  });

  it("handles handleSaveRoster error catch path", async () => {
    vi.spyOn(mockDb.teamPlayers, "add").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.stageRosterChange("p1", false);
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to save roster changes:",
      expect.any(Error),
    );
    expect(showSnackbar).toHaveBeenCalledWith(
      "Unable to save roster changes.",
      "error",
    );
  });

  it("handles handleCancelRoster and resets all roster state", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps), {
      withAuth: false,
    });

    await act(async () => {
      result.current.setOpenRosterDialog(true);
      result.current.stageRosterChange("p1", false);
      result.current.stageJerseyUpdate("p1", "23");
      result.current.setRosterSearchTerm("LeBron");
    });

    expect(result.current.openRosterDialog).toBe(true);
    expect(result.current.rosterSearchTerm).toBe("LeBron");

    await act(async () => {
      result.current.handleCancelRoster();
    });

    expect(result.current.openRosterDialog).toBe(false);
    expect(result.current.pendingRosterChanges).toEqual({});
    expect(result.current.localJerseyNumbers).toEqual({});
    expect(result.current.rosterSearchTerm).toBe("");
  });
});
