import { renderHook, act } from "../../../test-utils";
import { vi } from "vitest";
import { useGameModeActions } from "./useGameModeActions";
import { mockDb } from "../../../dbMock";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

describe("useGameModeActions", () => {
  const mockParams = {
    gameId: "game1",
    period: 1,
    clockSeconds: 600,
    isReadOnly: false,
    trackingMode: "TEAM",
    isEditing: false,
    editingStatId: null,
    selectedPlayerId: "p1",
    statType: ACTION_TYPES.MAKE,
    points: 2,
    playName: "PnR",
    shotQuality: "OPEN",
    situation: "ATO",
    opponentPlayType: null,
    selectedX: 50,
    selectedY: 50,
    matchups: {},
    game: { possessionArrow: "OUR_TEAM" as const },
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
    setSnackbar: vi.fn(),
    setIsDialogOpen: vi.fn(),
    setStatType: vi.fn(),
    setPlayName: vi.fn(),
    setSituation: vi.fn(),
    setOpponentPlayType: vi.fn(),
    setIsEditing: vi.fn(),
    setEditingStatId: vi.fn(),
    setSelectedPlayerId: vi.fn(),
    setLastOpponentStatId: vi.fn(),
    setIsBreakdownDialogOpen: vi.fn(),
    setChainPrompt: vi.fn(),
    setIsFtWorkflowOpen: vi.fn(),
    setIsSavingStat: vi.fn(),
    setIsEnding: vi.fn(),
    setIsEndGameDialogOpen: vi.fn(),
    setIsSummaryDialogOpen: vi.fn(),
    setIsDeleting: vi.fn(),
    setIsDeleteDialogOpen: vi.fn(),
    setStatToDelete: vi.fn(),
    setIsSubDialogOpen: vi.fn(),
    setSubOutPlayerId: vi.fn(),
    setIsSavingSub: vi.fn(),
    statsMap: new Map(),
    team: { defaultFoulLimit: 5 },
  } as any;

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles undoing the last action", async () => {
    const lastStat = { id: "s1", type: ACTION_TYPES.MAKE };
    const paramsWithStat = {
      ...mockParams,
      gameData: { ...mockParams.gameData, recentStats: [lastStat] },
    };

    const { result } = renderHook(() => useGameModeActions(paramsWithStat));

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(mockDb.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      deletedAt: expect.any(String),
    }));
    expect(mockParams.setSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: "Action undone",
      severity: "success",
    }));
  });

  it("handles ending the game", async () => {
    await mockDb.games.add({ id: "game1", teamId: "team1" } as any);
    const { result } = renderHook(() => useGameModeActions(mockParams));

    await act(async () => {
      await result.current.handleEndGame();
    });

    const game = await mockDb.games.get("game1");
    expect(game?.completed).toBe(1);
    expect(mockParams.setIsSummaryDialogOpen).toHaveBeenCalledWith(true);
    expect(mockParams.setSnackbar).toHaveBeenCalledWith(expect.objectContaining({
      message: "Game finalized successfully!",
    }));
  });

  it("saves a new stat", async () => {
    const { result } = renderHook(() => useGameModeActions(mockParams));

    await act(async () => {
      await result.current.handleSaveStat();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].playerId).toBe("p1");
    expect(stats[0].type).toBe(ACTION_TYPES.MAKE);
    expect(mockParams.setIsDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles possession toggle", async () => {
    const { result } = renderHook(() => useGameModeActions(mockParams));

    await act(async () => {
      await result.current.handleTogglePossession();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.some(s => s.type === ACTION_TYPES.POSSESSION && s.playerId === SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
  });

  it("handles quick substitution", async () => {
    const paramsWithDraft = {
        ...mockParams,
        draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p6"]), // p5 out, p6 in
    };
    const { result } = renderHook(() => useGameModeActions(paramsWithDraft));

    await act(async () => {
        await result.current.handleQuickSub();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.some(s => s.type === ACTION_TYPES.SUB_OUT && s.playerId === "p5")).toBe(true);
    expect(stats.some(s => s.type === ACTION_TYPES.SUB_IN && s.playerId === "p6")).toBe(true);
  });

  it("handles possession arrow flip", async () => {
    await mockDb.games.add({ id: "game1", possessionArrow: "OUR_TEAM" } as any);
    const { result } = renderHook(() => useGameModeActions(mockParams));

    await act(async () => {
        await result.current.handleFlipPossessionArrow();
    });

    const game = await mockDb.games.get("game1");
    expect(game?.possessionArrow).toBe("OPPONENT");
  });

  it("handles stat deletion", async () => {
    const { result } = renderHook(() =>
      useGameModeActions({ ...mockParams, statToDelete: "s1" }),
    );

    await act(async () => {
      await result.current.handleDeleteStat();
    });

    expect(mockDb.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
        deletedAt: expect.any(String),
    }));
    expect(mockParams.setIsDeleteDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles opponent turnover", async () => {
    const { result } = renderHook(() => useGameModeActions(mockParams));

    await act(async () => {
        await result.current.handleOpponentTurnover();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.some(s => s.type === ACTION_TYPES.TURNOVER && s.playerId === SPECIAL_PLAYER_IDS.OPPONENT)).toBe(true);
    expect(mockParams.setSnackbar).toHaveBeenCalledWith(expect.objectContaining({
        message: "Opponent turnover recorded",
    }));
  });

  it("handles chained actions", async () => {
    const originalStat = { id: "s1", period: 1, clockTime: 500, timestamp: "time" } as any;
    const { result } = renderHook(() =>
        useGameModeActions({ ...mockParams, chainPrompt: { type: "ASSIST", originalStat } })
    );

    await act(async () => {
        await result.current.handleChainAction("p2", ACTION_TYPES.ASSIST);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.some(s => s.type === ACTION_TYPES.ASSIST && s.playerId === "p2")).toBe(true);
    expect(mockParams.setChainPrompt).toHaveBeenCalledWith(expect.objectContaining({
        type: ACTION_TYPES.HOCKEY_ASSIST,
    }));
  });

  it("handles editing an existing stat", async () => {
    const { result } = renderHook(() => useGameModeActions({
      ...mockParams,
      isEditing: true,
      editingStatId: "s1",
    }));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(mockDb.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      type: ACTION_TYPES.MAKE,
      points: 2,
    }));
  });

  it("triggers foul-out workflow", async () => {
    const { result } = renderHook(() => useGameModeActions({
      ...mockParams,
      selectedPlayerId: "p1",
      statsMap: new Map([["p1", { fouls: 4 }]]),
      team: { defaultFoulLimit: 5 },
    }));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL);
    });

    expect(mockParams.setSubOutPlayerId).toHaveBeenCalledWith("p1");
    expect(mockParams.setIsSubDialogOpen).toHaveBeenCalledWith(true);
  });

  it("toggles possession arrow on held ball", async () => {
    const { result } = renderHook(() => useGameModeActions({
        ...mockParams,
        game: { ...mockParams.game, possessionArrow: "OUR_TEAM" },
    }));

    await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.HELD_BALL);
    });

    expect(mockDb.games.update).toHaveBeenCalledWith("game1", expect.objectContaining({
        possessionArrow: "OPPONENT",
    }));
  });

  it("calculates shot clock phase: LATE", async () => {
    const { result } = renderHook(() => useGameModeActions({
        ...mockParams,
        gameData: { ...mockParams.gameData, possessionStartClock: 600 },
        clockSeconds: 570, // 30s elapsed
    }));

    await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(mockDb.stats.add).toHaveBeenCalledWith(expect.objectContaining({
        shotClockPhase: "LATE",
    }));
  });

  it("calculates shot clock phase: MID", async () => {
    const { result } = renderHook(() => useGameModeActions({
        ...mockParams,
        gameData: { ...mockParams.gameData, possessionStartClock: 600 },
        clockSeconds: 585, // 15s elapsed
    }));

    await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(mockDb.stats.add).toHaveBeenCalledWith(expect.objectContaining({
        shotClockPhase: "MID",
    }));
  });

  it("assigns primary defender for opponent makes", async () => {
    const { result } = renderHook(() => useGameModeActions({
        ...mockParams,
        selectedPlayerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
        matchups: { [SPECIAL_PLAYER_IDS.OPPONENT + ":10"]: "p1" },
    }));

    await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
    });

    expect(mockDb.stats.add).toHaveBeenCalledWith(expect.objectContaining({
        primaryDefenderId: "p1",
    }));
  });
});
