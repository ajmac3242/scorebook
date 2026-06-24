import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameModeActions } from "./useGameModeActions";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

// Mock dependencies
vi.mock("../../../db", () => ({
  db: {
    stats: {
      update: vi.fn(),
      add: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
    games: {
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

describe("useGameModeActions", () => {
  const mockSetSnackbar = vi.fn();
  const mockSetIsDialogOpen = vi.fn();
  const mockSetStatType = vi.fn();
  const mockSetPlayName = vi.fn();
  const mockSetSituation = vi.fn();
  const mockSetOpponentPlayType = vi.fn();
  const mockSetIsEditing = vi.fn();
  const mockSetEditingStatId = vi.fn();
  const mockSetSelectedPlayerId = vi.fn();
  const mockSetLastOpponentStatId = vi.fn();
  const mockSetIsBreakdownDialogOpen = vi.fn();
  const mockSetChainPrompt = vi.fn();
  const mockSetIsFtWorkflowOpen = vi.fn();
  const mockSetIsSavingStat = vi.fn();
  const mockSetIsEnding = vi.fn();
  const mockSetIsEndGameDialogOpen = vi.fn();
  const mockSetIsSummaryDialogOpen = vi.fn();
  const mockSetIsDeleting = vi.fn();
  const mockSetIsDeleteDialogOpen = vi.fn();
  const mockSetStatToDelete = vi.fn();
  const mockSetIsSubDialogOpen = vi.fn();
  const mockSetSubOutPlayerId = vi.fn();
  const mockSetIsSavingSub = vi.fn();

  const defaultParams = {
    gameId: "g1",
    period: 1,
    clockSeconds: 600,
    isReadOnly: false,
    trackingMode: "TEAM",
    isEditing: false,
    editingStatId: null,
    selectedPlayerId: "p1",
    statType: ACTION_TYPES.MAKE,
    points: 2,
    playName: "Isolation",
    shotQuality: "OPEN",
    situation: null,
    opponentPlayType: null,
    selectedX: 100,
    selectedY: 200,
    matchups: {},
    game: { foulLimit: 5, possessionArrow: "OUR_TEAM" as const },
    gameData: {
      recentStats: [{ id: "s1", type: ACTION_TYPES.MAKE } as any],
      possessionStartClock: 600,
      possessionState: SPECIAL_PLAYER_IDS.OUR_TEAM,
      onCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
    },
    draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
    chainPrompt: null,
    statToDelete: null,
    isSavingSub: false,
    setSnackbar: mockSetSnackbar,
    setIsDialogOpen: mockSetIsDialogOpen,
    setStatType: mockSetStatType,
    setPlayName: mockSetPlayName,
    setSituation: mockSetSituation,
    setOpponentPlayType: mockSetOpponentPlayType,
    setIsEditing: mockSetIsEditing,
    setEditingStatId: mockSetEditingStatId,
    setSelectedPlayerId: mockSetSelectedPlayerId,
    setLastOpponentStatId: mockSetLastOpponentStatId,
    setIsBreakdownDialogOpen: mockSetIsBreakdownDialogOpen,
    setChainPrompt: mockSetChainPrompt,
    setIsFtWorkflowOpen: mockSetIsFtWorkflowOpen,
    setIsSavingStat: mockSetIsSavingStat,
    setIsEnding: mockSetIsEnding,
    setIsEndGameDialogOpen: mockSetIsEndGameDialogOpen,
    setIsSummaryDialogOpen: mockSetIsSummaryDialogOpen,
    setIsDeleting: mockSetIsDeleting,
    setIsDeleteDialogOpen: mockSetIsDeleteDialogOpen,
    setStatToDelete: mockSetStatToDelete,
    setIsSubDialogOpen: mockSetIsSubDialogOpen,
    setSubOutPlayerId: mockSetSubOutPlayerId,
    setIsSavingSub: mockSetIsSavingSub,
    statsMap: new Map([["p1", { fouls: 0 } as any]]),
    team: { defaultFoulLimit: 5 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles undo correctly", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleUndo();
    });

    expect(db.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      deletedAt: expect.any(String),
      synced: 0,
    }));
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: "Action undone",
      severity: "success",
    }));
  });

  it("handles saving a new stat", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleSaveStat();
    });

    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
    }));
    expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: "Action recorded",
      severity: "success",
    }));
  });

  it("handles editing an existing stat", async () => {
    const params = {
      ...defaultParams,
      isEditing: true,
      editingStatId: "s1",
    };
    const { result } = renderHook(() => useGameModeActions(params));
    await act(async () => {
      await result.current.handleSaveStat();
    });

    expect(db.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      type: ACTION_TYPES.MAKE,
      points: 2,
    }));
    expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: "Action updated",
    }));
  });

  it("enforces foul-out disqualification", async () => {
    const statsMap = new Map([["p1", { fouls: 4 } as any]]);
    const params = {
      ...defaultParams,
      statsMap,
      statType: ACTION_TYPES.FOUL,
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL);
    });

    expect(mockSetSubOutPlayerId).toHaveBeenCalledWith("p1");
    expect(mockSetIsSubDialogOpen).toHaveBeenCalledWith(true);
    expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("PLAYER FOULED OUT"),
    }));
  });

  it("handles flipping the possession arrow", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleFlipPossessionArrow();
    });

    expect(db.games.update).toHaveBeenCalledWith("g1", {
      possessionArrow: "OPPONENT",
      synced: 0,
    });
  });

  it("handles quick substitution", async () => {
    const draftOnCourtIds = new Set(["p1", "p2", "p3", "p4", "p6"]); // p5 out, p6 in
    const params = {
      ...defaultParams,
      draftOnCourtIds,
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleQuickSub();
    });

    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      playerId: "p5",
      type: ACTION_TYPES.SUB_OUT,
    }));
    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      playerId: "p6",
      type: ACTION_TYPES.SUB_IN,
    }));
  });

  it("handles handleEndGame correctly", async () => {
    const stats: any[] = [{ gameId: "g1", points: 2, playerId: "p1", type: ACTION_TYPES.MAKE }];
    vi.mocked(db.stats.toArray).mockResolvedValue(stats);

    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleEndGame();
    });

    expect(db.games.update).toHaveBeenCalledWith("g1", expect.objectContaining({
      completed: 1,
      teamScore: 2,
    }));
    expect(mockSetIsEndGameDialogOpen).toHaveBeenCalledWith(false);
    expect(mockSetIsSummaryDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles handleDeleteStat correctly", async () => {
    const params = {
      ...defaultParams,
      statToDelete: "s1",
    };
    const { result } = renderHook(() => useGameModeActions(params));
    await act(async () => {
      await result.current.handleDeleteStat();
    });

    expect(db.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      deletedAt: expect.any(String),
    }));
    expect(mockSetIsDeleteDialogOpen).toHaveBeenCalledWith(false);
    expect(mockSetStatToDelete).toHaveBeenCalledWith(null);
  });

  it("handles handleTogglePossession correctly", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleTogglePossession();
    });

    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      type: ACTION_TYPES.POSSESSION,
      playerId: SPECIAL_PLAYER_IDS.OPPONENT,
    }));
  });

  it("handles handleOpponentTurnover correctly", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleOpponentTurnover();
    });

    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      type: ACTION_TYPES.TURNOVER,
      playerId: SPECIAL_PLAYER_IDS.OPPONENT,
    }));
    // Also triggers possession change
    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      type: ACTION_TYPES.POSSESSION,
      playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
    }));
  });

  it("handles handleChainAction correctly", async () => {
    const chainPrompt = {
      type: "ASSIST" as const,
      originalStat: { gameId: "g1", period: 1, clockTime: 600, timestamp: "t1" } as any,
    };
    const params = {
      ...defaultParams,
      chainPrompt,
    };
    const { result } = renderHook(() => useGameModeActions(params));
    await act(async () => {
      await result.current.handleChainAction("p2", ACTION_TYPES.ASSIST);
    });

    expect(db.stats.add).toHaveBeenCalledWith(expect.objectContaining({
      playerId: "p2",
      type: ACTION_TYPES.ASSIST,
    }));
    expect(mockSetChainPrompt).toHaveBeenCalledWith(expect.objectContaining({
      type: "HOCKEY_ASSIST",
    }));
  });

  it("handles chain prompt for miss (rebound)", async () => {
    const params = {
      ...defaultParams,
      statType: ACTION_TYPES.MISS,
    };
    const { result } = renderHook(() => useGameModeActions(params));
    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MISS);
    });

    expect(mockSetChainPrompt).toHaveBeenCalledWith(expect.objectContaining({
      type: "REBOUND",
    }));
  });

  it("handles OPPONENT tracking mode specifics", async () => {
    const params = {
      ...defaultParams,
      trackingMode: "OPPONENT",
      selectedPlayerId: "OPPONENT:10",
      statType: ACTION_TYPES.MAKE,
    };
    const { result } = renderHook(() => useGameModeActions(params));
    await act(async () => {
      await result.current.handleSaveStat();
    });

    expect(mockSetLastOpponentStatId).toHaveBeenCalled();
    expect(mockSetIsBreakdownDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles FOUL_SHOOTING and opens FT workflow", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL_SHOOTING);
    });

    expect(mockSetIsFtWorkflowOpen).toHaveBeenCalledWith(true);
  });

  it("handles HELD_BALL and flips possession arrow", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));
    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.HELD_BALL);
    });

    expect(db.games.update).toHaveBeenCalledWith("g1", expect.objectContaining({
      possessionArrow: "OPPONENT",
    }));
  });
});
