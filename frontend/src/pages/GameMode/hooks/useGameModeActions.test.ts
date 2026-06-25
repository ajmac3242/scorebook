import { renderHook, act } from "../../../test-utils";
import { useGameModeActions } from "./useGameModeActions";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { logger } from "../../../utils/logger";

vi.mock("../../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGameModeActions", () => {
  const setSnackbar = vi.fn();
  const setIsDialogOpen = vi.fn();
  const setStatType = vi.fn();
  const setPlayName = vi.fn();
  const setSituation = vi.fn();
  const setOpponentPlayType = vi.fn();
  const setIsEditing = vi.fn();
  const setEditingStatId = vi.fn();
  const setSelectedPlayerId = vi.fn();
  const setLastOpponentStatId = vi.fn();
  const setIsBreakdownDialogOpen = vi.fn();
  const setChainPrompt = vi.fn();
  const setIsFtWorkflowOpen = vi.fn();
  const setIsSavingStat = vi.fn();
  const setIsEnding = vi.fn();
  const setIsEndGameDialogOpen = vi.fn();
  const setIsSummaryDialogOpen = vi.fn();
  const setIsDeleting = vi.fn();
  const setIsDeleteDialogOpen = vi.fn();
  const setStatToDelete = vi.fn();
  const setIsSubDialogOpen = vi.fn();
  const setSubOutPlayerId = vi.fn();
  const setIsSavingSub = vi.fn();

  const defaultParams: any = {
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
    playName: "ISO",
    shotQuality: "GOOD",
    situation: "HALF_COURT",
    opponentPlayType: null,
    selectedX: 50,
    selectedY: 50,
    matchups: {},
    game: { activeDefensiveScheme: "MAN" },
    gameData: {
      recentStats: [],
      possessionStartClock: 600,
      possessionState: SPECIAL_PLAYER_IDS.OUR_TEAM,
      onCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
    },
    draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
    chainPrompt: null,
    statToDelete: null,
    isSavingSub: false,
    setSnackbar,
    setIsDialogOpen,
    setStatType,
    setPlayName,
    setSituation,
    setOpponentPlayType,
    setIsEditing,
    setEditingStatId,
    setSelectedPlayerId,
    setLastOpponentStatId,
    setIsBreakdownDialogOpen,
    setChainPrompt,
    setIsFtWorkflowOpen,
    setIsSavingStat,
    setIsEnding,
    setIsEndGameDialogOpen,
    setIsSummaryDialogOpen,
    setIsDeleting,
    setIsDeleteDialogOpen,
    setStatToDelete,
    setIsSubDialogOpen,
    setSubOutPlayerId,
    setIsSavingSub,
    statsMap: new Map(),
    team: { defaultFoulLimit: 5 },
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles handleSaveStat for a new stat", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.MAKE);
    expect(stats[0].playerId).toBe("p1");
    expect(setIsDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles handleSaveStat failure", async () => {
    vi.spyOn(mockDb.stats, "add").mockRejectedValueOnce(new Error("DB Error"));
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(logger.error).toHaveBeenCalled();
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "error" }),
    );
  });

  it("handles handleSaveStat early return if no gameId", async () => {
    const params = { ...defaultParams, gameId: null };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(setIsSavingStat).toHaveBeenCalledWith(false);
    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(0);
  });

  it("handles handleUndo", async () => {
    const stat: any = {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      period: 1,
      timestamp: new Date().toISOString(),
      synced: 1,
    };
    await mockDb.stats.add(stat);

    const params = {
      ...defaultParams,
      gameData: {
        ...defaultParams.gameData,
        recentStats: [stat],
      },
    };

    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleUndo();
    });

    const updatedStat = await mockDb.stats.get("s1");
    expect(updatedStat?.deletedAt).toBeDefined();
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Action undone" }),
    );
  });

  it("handles handleEndGame", async () => {
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
      synced: 1,
    } as any);
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleEndGame();
    });

    const game = await mockDb.games.get("g1");
    expect(game?.completed).toBe(1);
    expect(setIsSummaryDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles handleTogglePossession", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleTogglePossession();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.POSSESSION);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
  });

  it("handles handleTogglePossession with manual target", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleTogglePossession(SPECIAL_PLAYER_IDS.OUR_TEAM);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);
  });

  it("handles handleQuickSub", async () => {
    const params = {
      ...defaultParams,
      draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p6"]), // p5 out, p6 in
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleQuickSub();
    });

    const stats = await mockDb.stats.toArray();
    expect(
      stats.some((s) => s.type === ACTION_TYPES.SUB_OUT && s.playerId === "p5"),
    ).toBe(true);
    expect(
      stats.some((s) => s.type === ACTION_TYPES.SUB_IN && s.playerId === "p6"),
    ).toBe(true);
  });

  it("handles handleDeleteStat", async () => {
    await mockDb.stats.add({
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      period: 1,
      timestamp: new Date().toISOString(),
      synced: 1,
    } as any);
    const params = {
      ...defaultParams,
      statToDelete: "s1",
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleDeleteStat();
    });

    const stat = await mockDb.stats.get("s1");
    expect(stat?.deletedAt).toBeDefined();
    expect(setIsDeleteDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles handleOpponentTurnover", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleOpponentTurnover();
    });

    const stats = await mockDb.stats.toArray();
    expect(
      stats.some(
        (s) =>
          s.type === ACTION_TYPES.TURNOVER &&
          s.playerId === SPECIAL_PLAYER_IDS.OPPONENT,
      ),
    ).toBe(true);
    expect(
      stats.some(
        (s) =>
          s.type === ACTION_TYPES.POSSESSION &&
          s.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM,
      ),
    ).toBe(true);
  });

  it("handles handleChainAction", async () => {
    const originalStat = {
      id: "s1",
      gameId: "g1",
      type: ACTION_TYPES.MAKE,
      period: 1,
      clockTime: 600,
      timestamp: "2023-01-01T00:00:00Z",
    };
    const params = {
      ...defaultParams,
      chainPrompt: { type: "ASSIST", originalStat },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleChainAction("p2", ACTION_TYPES.ASSIST);
    });

    const stats = await mockDb.stats.toArray();
    expect(
      stats.some((s) => s.type === ACTION_TYPES.ASSIST && s.playerId === "p2"),
    ).toBe(true);
    expect(setChainPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ type: "HOCKEY_ASSIST" }),
    );
  });

  it("handles handleChainAction failure", async () => {
    vi.spyOn(mockDb.stats, "add").mockRejectedValueOnce(new Error("DB Error"));
    const originalStat = {
      id: "s1",
      gameId: "g1",
      type: ACTION_TYPES.MAKE,
      period: 1,
      clockTime: 600,
      timestamp: "2023-01-01T00:00:00Z",
    };
    const params = {
      ...defaultParams,
      chainPrompt: { type: "ASSIST", originalStat },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleChainAction("p2", ACTION_TYPES.ASSIST);
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("handles handleChainAction with REBOUND", async () => {
    const originalStat = {
      id: "s1",
      gameId: "g1",
      type: ACTION_TYPES.MISS,
      period: 1,
      clockTime: 600,
      timestamp: "2023-01-01T00:00:00Z",
    };
    const params = {
      ...defaultParams,
      chainPrompt: { type: "REBOUND", originalStat },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleChainAction("p1", ACTION_TYPES.REBOUND);
    });

    expect(setChainPrompt).toHaveBeenCalledWith(null);
  });

  it("handles handleQuickSub failure", async () => {
    vi.spyOn(mockDb.stats, "add").mockRejectedValueOnce(new Error("DB Error"));
    const params = {
      ...defaultParams,
      draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p6"]),
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleQuickSub();
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("handles handleTogglePossession failure", async () => {
    vi.spyOn(mockDb.stats, "add").mockRejectedValueOnce(new Error("DB Error"));
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleTogglePossession();
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("handles handleOpponentTurnover failure", async () => {
    vi.spyOn(mockDb.stats, "add").mockRejectedValueOnce(new Error("DB Error"));
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleOpponentTurnover();
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("handles handleFlipPossessionArrow", async () => {
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
      possessionArrow: "OUR_TEAM",
      synced: 1,
    } as any);
    const params = {
      ...defaultParams,
      game: { ...defaultParams.game, possessionArrow: "OUR_TEAM" },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleFlipPossessionArrow();
    });

    const game = await mockDb.games.get("g1");
    expect(game?.possessionArrow).toBe("OPPONENT");
  });

  it("handles handleSaveStat for HELD_BALL when arrow is OPPONENT", async () => {
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
      possessionArrow: "OPPONENT",
      synced: 1,
    } as any);
    const params = {
      ...defaultParams,
      game: { ...defaultParams.game, possessionArrow: "OPPONENT" },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.HELD_BALL);
    });

    const game = await mockDb.games.get("g1");
    expect(game?.possessionArrow).toBe("OUR_TEAM");
  });

  it("handles handleFlipPossessionArrow failure", async () => {
    vi.spyOn(mockDb.games, "update").mockRejectedValueOnce(
      new Error("DB Error"),
    );
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleFlipPossessionArrow();
    });

    expect(logger.error).toHaveBeenCalled();
  });

  it("handles handleSaveStat in OPPONENT tracking mode", async () => {
    const params = {
      ...defaultParams,
      trackingMode: "OPPONENT",
      selectedPlayerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(setLastOpponentStatId).toHaveBeenCalled();
    expect(setIsBreakdownDialogOpen).toHaveBeenCalledWith(true);
  });

  it("handles handleSaveStat for FOUL_SHOOTING", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL_SHOOTING);
    });

    expect(setIsFtWorkflowOpen).toHaveBeenCalledWith(true);
  });

  it("handles handleSaveStat for editing a stat with full fields", async () => {
    await mockDb.stats.add({
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      synced: 1,
    } as any);
    const params = {
      ...defaultParams,
      isEditing: true,
      editingStatId: "s1",
      selectedPlayerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
      points: 3,
      playName: "FASTBREAK",
      shotQuality: "OPEN",
      situation: "TRANSITION",
      opponentPlayType: "ISO",
      matchups: { [SPECIAL_PLAYER_IDS.OPPONENT + ":10"]: "p1" },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    const stat = await mockDb.stats.get("s1");
    expect(stat?.points).toBe(3);
    expect(stat?.playName).toBe("FASTBREAK");
    expect(stat?.shotQuality).toBe("OPEN");
    expect(stat?.situation).toBe("TRANSITION");
    expect(stat?.opponentPlayType).toBe("ISO");
    expect(stat?.primaryDefenderId).toBe("p1");
  });

  it("handles handleSaveStat with foul-out logic", async () => {
    const statsMap = new Map();
    statsMap.set("p1", { fouls: 4 });
    const params = {
      ...defaultParams,
      statsMap,
      team: { defaultFoulLimit: 5 },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL);
    });

    expect(setIsSubDialogOpen).toHaveBeenCalledWith(true);
    expect(setSubOutPlayerId).toHaveBeenCalledWith("p1");
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ severity: "warning" }),
    );
  });

  it("handles handleSaveStat for an opponent foul (no foul-out check)", async () => {
    const params = {
      ...defaultParams,
      selectedPlayerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL);
    });

    expect(setIsSubDialogOpen).not.toHaveBeenCalled();
  });

  it("handles handleUndo with no recent stats", async () => {
    const params = {
      ...defaultParams,
      gameData: { ...defaultParams.gameData, recentStats: [] },
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(mockDb.stats.update).not.toHaveBeenCalled();
  });

  it("handles handleTogglePossession in read-only mode", async () => {
    const params = {
      ...defaultParams,
      isReadOnly: true,
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleTogglePossession();
    });

    expect(mockDb.stats.add).not.toHaveBeenCalled();
  });

  it("handles handleFlipPossessionArrow in read-only mode", async () => {
    const params = {
      ...defaultParams,
      isReadOnly: true,
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleFlipPossessionArrow();
    });

    expect(mockDb.games.update).not.toHaveBeenCalled();
  });
});
