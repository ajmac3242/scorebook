import { renderHook, act } from "../../../test-utils";
import { useTeamActions } from "./useTeamActions";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
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
    const { result } = renderHook(() => useTeamActions(defaultProps));

    expect(result.current.editName).toBe("Lakers");
    expect(result.current.editLogoUrl).toBe("logo.png");
    expect(result.current.editColor).toBe("#FF0000");
  });

  it("handles handleUpdateTeamSettings", async () => {
    await mockDb.teams.add(mockTeam);
    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      result.current.setEditName("Updated Lakers");
    });

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    const updatedTeam = await mockDb.teams.get("t1");
    expect(updatedTeam?.name).toBe("Updated Lakers");
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith("Team settings updated.", "success");
  });

  it("handles handleDeleteTeam", async () => {
    await mockDb.teams.add(mockTeam);
    await mockDb.games.add({ id: "g1", teamId: "t1", opponent: "Bulls", synced: 1 });

    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    const deletedTeam = await mockDb.teams.get("t1");
    expect(deletedTeam?.deletedAt).toBeDefined();

    const deletedGame = await mockDb.games.get("g1");
    expect(deletedGame?.deletedAt).toBeDefined();

    expect(showSnackbar).toHaveBeenCalledWith("Team scheduled for deletion.", "success");
  });

  it("handles handleRestoreTeam", async () => {
    const deletedTeam = { ...mockTeam, deletedAt: "2023-01-01" };
    await mockDb.teams.add(deletedTeam);
    await mockDb.games.add({ id: "g1", teamId: "t1", opponent: "Bulls", deletedAt: "2023-01-01", synced: 1 });

    const { result } = renderHook(() => useTeamActions({ ...defaultProps, team: deletedTeam }));

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    const restoredTeam = await mockDb.teams.get("t1");
    expect(restoredTeam?.deletedAt).toBeUndefined();

    const restoredGame = await mockDb.games.get("g1");
    expect(restoredGame?.deletedAt).toBeUndefined();

    expect(showSnackbar).toHaveBeenCalledWith("Team restored.", "success");
  });

  it("handles handleAddGame", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

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

  it("handles stageRosterChange and handleSaveRoster", async () => {
    const player = { id: "p1", name: "LeBron", synced: 1 };
    await mockDb.players.add(player);

    const { result } = renderHook(() => useTeamActions({
        ...defaultProps,
        allPlayers: [player]
    }));

    await act(async () => {
      result.current.stageRosterChange("p1", false);
      result.current.stageJerseyUpdate("p1", "23");
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(1);
    expect(teamPlayers[0].playerId).toBe("p1");
    expect(teamPlayers[0].jerseyNumber).toBe("23");
  });
});
