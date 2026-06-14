import { renderHook, act } from "../../../../test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTeamActions } from "../useTeamActions";
import { mockDb } from "../../../../dbMock";
import { syncService } from "../../../../utils/syncService";
import { logger } from "../../../../utils/logger";

vi.mock("../../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("useTeamActions", () => {
  const showSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  const teamId = "team-1";
  const team = { id: teamId, name: "Our Team", periodType: "QUARTERS" } as any;
  const players = [
    { id: "p1", name: "Player 1", avatarColor: "red" },
    { id: "p2", name: "Player 2", avatarColor: "blue" },
  ] as any[];
  const teamPlayers = [
    { id: "tp1", teamId, playerId: "p1", name: "Player 1", jerseyNumber: "10" },
  ] as any[];

  const defaultProps = {
    teamId,
    team,
    allPlayers: players,
    teamPlayers,
    showSnackbar,
  };

  it("updates team settings", async () => {
    await act(async () => {
      await mockDb.teams.add(team);
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setEditName("Updated Team Name");
    });

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    const updatedTeam = await mockDb.teams.get(teamId);
    expect(updatedTeam?.name).toBe("Updated Team Name");
    expect(updatedTeam?.synced).toBe(0);
    expect(showSnackbar).toHaveBeenCalledWith("Team settings updated.", "success");
    expect(result.current.openSettingsDialog).toBe(false);
  });

  it("schedules team and game deletion", async () => {
    await act(async () => {
      await mockDb.teams.add(team);
      await mockDb.games.add({ id: "g1", teamId, opponent: "Opp 1" });
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    const updatedTeam = await mockDb.teams.get(teamId);
    expect(updatedTeam?.deletedAt).toBeDefined();

    const updatedGame = await mockDb.games.get("g1");
    expect(updatedGame?.deletedAt).toBeDefined();
    expect(updatedGame?.synced).toBe(0);

    expect(showSnackbar).toHaveBeenCalledWith("Team scheduled for deletion.", "success");
  });

  it("restores team and games", async () => {
    const deletedAt = new Date().toISOString();
    await act(async () => {
      await mockDb.teams.add({ ...team, deletedAt });
      await mockDb.games.add({ id: "g1", teamId, opponent: "Opp 1", deletedAt });
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    const updatedTeam = await mockDb.teams.get(teamId);
    expect(updatedTeam?.deletedAt).toBeUndefined();

    const updatedGame = await mockDb.games.get("g1");
    expect(updatedGame?.deletedAt).toBeUndefined();
  });

  it("adds a new game and creates opponent if not exists", async () => {
    await act(async () => {
      await mockDb.teams.add(team);
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setNewOpponent("New Opponent");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    const games = await mockDb.games.toArray();
    expect(games).toHaveLength(1);
    expect(games[0].opponent).toBe("New Opponent");
    expect(games[0].synced).toBe(0);

    const opponents = await mockDb.opponents.toArray();
    expect(opponents).toHaveLength(1);
    expect(opponents[0].name).toBe("New Opponent");
    expect(opponents[0].synced).toBe(0);
  });

  it("manages roster changes (add and remove)", async () => {
    await act(async () => {
      await mockDb.teams.add(team);
      await mockDb.teamPlayers.add(teamPlayers[0]);
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    // Stage adding p2
    act(() => {
      result.current.stageRosterChange("p2", false);
      result.current.stageJerseyUpdate("p2", "20");
    });

    // Stage removing p1
    act(() => {
      result.current.stageRosterChange("p1", true);
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const currentTeamPlayers = await mockDb.teamPlayers.toArray();
    expect(currentTeamPlayers).toHaveLength(1);
    expect(currentTeamPlayers[0].playerId).toBe("p2");
    expect(currentTeamPlayers[0].jerseyNumber).toBe("20");
    expect(currentTeamPlayers[0].synced).toBe(0);
  });

  it("updates jersey number for existing player", async () => {
    await act(async () => {
      await mockDb.teams.add(team);
      await mockDb.teamPlayers.add(teamPlayers[0]);
    });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.stageJerseyUpdate("p1", "99");
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const updatedPlayer = await mockDb.teamPlayers.where("[teamId+playerId]").equals([teamId, "p1"]).first();
    expect(updatedPlayer?.jerseyNumber).toBe("99");
    expect(updatedPlayer?.synced).toBe(0);
  });

  it("logs error on update failure", async () => {
    vi.spyOn(mockDb.teams, "update").mockRejectedValue(new Error("Update failed"));
    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to update team settings:", expect.any(Error));
    expect(showSnackbar).toHaveBeenCalledWith("Unable to update team settings.", "error");
  });
});
