import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTeamActions } from "./useTeamActions";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";

// Mock dependencies
vi.mock("../../../db", () => ({
  db: {
    teams: {
      update: vi.fn(),
    },
    games: {
      add: vi.fn(),
      update: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    opponents: {
      add: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      first: vi.fn(),
    },
    teamPlayers: {
      add: vi.fn(),
      delete: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      first: vi.fn(),
      update: vi.fn(),
    },
    open: vi.fn(),
  },
}));

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

describe("useTeamActions", () => {
  const mockShowSnackbar = vi.fn();
  const defaultProps = {
    teamId: "t1",
    team: {
      id: "t1",
      name: "My Team",
      periodType: "QUARTERS" as const,
      defaultPeriodLength: 10,
    } as any,
    allPlayers: [{ id: "p1", name: "Player 1", avatarColor: "blue" } as any],
    teamPlayers: [],
    showSnackbar: mockShowSnackbar,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates team settings correctly", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleUpdateTeamSettings();
    });

    expect(db.teams.update).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        name: "My Team",
        synced: 0,
      }),
    );
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      "Team settings updated.",
      "success",
    );
  });

  it("handles team deletion", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteTeam();
    });

    expect(db.teams.update).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        deletedAt: expect.any(String),
      }),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      "Team scheduled for deletion.",
      "success",
    );
  });

  it("handles team restoration", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    await act(async () => {
      await result.current.handleRestoreTeam();
    });

    expect(db.teams.update).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        deletedAt: undefined,
      }),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith("Team restored.", "success");
  });

  it("adds a game correctly", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setNewOpponent("Opponent X");
    });

    await act(async () => {
      await result.current.handleAddGame();
    });

    expect(db.games.add).toHaveBeenCalledWith(
      expect.objectContaining({
        opponent: "Opponent X",
        teamId: "t1",
      }),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith("Game created.", "success");
  });

  it("manages roster changes (stage and save)", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.stageRosterChange("p1", false); // Add p1
      result.current.stageJerseyUpdate("p1", "99");
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    expect(db.teamPlayers.add).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: "p1",
        jerseyNumber: "99",
      }),
    );
    expect(mockShowSnackbar).toHaveBeenCalledWith("Roster updated.", "success");
  });

  it("removes players from roster", async () => {
    const teamPlayers = [{ id: "tp1", playerId: "p1", teamId: "t1" }] as any;
    const props = { ...defaultProps, teamPlayers };
    const { result } = renderHook(() => useTeamActions(props));

    act(() => {
      result.current.stageRosterChange("p1", true); // Remove p1
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    expect(db.teamPlayers.delete).toHaveBeenCalled();
  });

  it("handles cancel roster changes", async () => {
    const { result } = renderHook(() => useTeamActions(defaultProps));

    act(() => {
      result.current.setOpenRosterDialog(true);
      result.current.stageRosterChange("p1", false);
    });

    act(() => {
      result.current.handleCancelRoster();
    });

    expect(result.current.openRosterDialog).toBe(false);
    expect(result.current.pendingRosterChanges).toEqual({});
  });

  it("handles division by zero or missing team in add game", async () => {
    const props = { ...defaultProps, team: undefined };
    const { result } = renderHook(() => useTeamActions(props));

    act(() => {
      result.current.resetGameForm();
    });

    expect(result.current.newPeriodLength).toBe(10); // default
  });

  it("updates existing player jersey in roster", async () => {
    const teamPlayers = [
      { id: "tp1", playerId: "p1", teamId: "t1", jerseyNumber: "10" },
    ] as any;
    const props = { ...defaultProps, teamPlayers };
    const { result } = renderHook(() => useTeamActions(props));

    vi.mocked(db.teamPlayers.first).mockResolvedValue({ id: "tp1" } as any);

    act(() => {
      result.current.stageJerseyUpdate("p1", "11");
    });

    await act(async () => {
      await result.current.handleSaveRoster();
    });

    expect(db.teamPlayers.update).toHaveBeenCalledWith(
      "tp1",
      expect.objectContaining({
        jerseyNumber: "11",
      }),
    );
  });
});
