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
  const setFtShooterId = vi.fn();
  const setFtAttempts = vi.fn();
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
  const setIsClockRunning = vi.fn();

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
    game: { opponent: "Panthers", activeDefensiveScheme: "MAN" },
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
    setFtShooterId,
    setFtAttempts,
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
    setIsClockRunning,
    statsMap: new Map(),
    team: { name: "Eagles", defaultFoulLimit: 5 },
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

  it("pauses the clock when a foul is recorded", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL);
    });

    expect(setIsClockRunning).toHaveBeenCalledWith(false);
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Clock Paused for Whistle.",
        severity: "info",
      }),
    );
  });

  it("pauses the clock and records a timeout", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleTimeout();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.TIMEOUT);
    expect(setIsClockRunning).toHaveBeenCalledWith(false);
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Clock Paused for Whistle.",
        severity: "info",
      }),
    );
  });

  it("handles handleDirectScoreOverride for team score adjustment", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleDirectScoreOverride("TEAM", 2);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.SYSTEM_ADJUSTMENT);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);
    expect(stats[0].points).toBe(2);
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Score adjusted for Eagles (+2 pts)",
        severity: "success",
      }),
    );
  });

  it("handles handleDirectScoreOverride for opponent score deduction", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleDirectScoreOverride("OPPONENT", -1);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.SYSTEM_ADJUSTMENT);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
    expect(stats[0].points).toBe(-1);
    expect(setSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Score adjusted for Panthers (-1 pts)",
        severity: "success",
      }),
    );
  });

  it("ignores handleDirectScoreOverride when pointsDelta is 0 or readOnly", async () => {
    const params = { ...defaultParams, isReadOnly: true };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleDirectScoreOverride("TEAM", 0);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(0);
  });

  describe("handleDirectFoulOverride", () => {
    it("adds FOUL event for opponent team when delta is +1", async () => {
      const { result } = renderHook(() => useGameModeActions(defaultParams));

      await act(async () => {
        await result.current.handleDirectFoulOverride("OPPONENT", 1);
      });

      const stats = await mockDb.stats.toArray();
      expect(stats).toHaveLength(1);
      expect(stats[0].type).toBe(ACTION_TYPES.FOUL);
      expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Foul count adjusted for Panthers (+1)",
          severity: "success",
        }),
      );
    });

    it("adds REMOVE_FOUL event for opponent team when delta is -1 and fouls > 0", async () => {
      const params = {
        ...defaultParams,
        gameData: {
          ...defaultParams.gameData,
          teamFoulStats: { oppFouls: 2, teamFouls: 1 },
        },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleDirectFoulOverride("OPPONENT", -1);
      });

      const stats = await mockDb.stats.toArray();
      expect(stats).toHaveLength(1);
      expect(stats[0].type).toBe(ACTION_TYPES.REMOVE_FOUL);
      expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Foul count adjusted for Panthers (-1)",
          severity: "success",
        }),
      );
    });

    it("blocks foul deduction and shows warning when current fouls are 0", async () => {
      const params = {
        ...defaultParams,
        gameData: {
          ...defaultParams.gameData,
          teamFoulStats: { oppFouls: 0, teamFouls: 0 },
        },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleDirectFoulOverride("OPPONENT", -1);
      });

      const stats = await mockDb.stats.toArray();
      expect(stats).toHaveLength(0);
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Panthers team fouls cannot be negative",
          severity: "warning",
        }),
      );
    });

    it("ignores handleDirectFoulOverride when readOnly or delta is 0", async () => {
      const params = { ...defaultParams, isReadOnly: true };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleDirectFoulOverride("TEAM", 1);
      });

      const stats = await mockDb.stats.toArray();
      expect(stats).toHaveLength(0);
    });
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

  it("handles handleSaveStat for FOUL_SHOOTING in TEAM mode", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL_SHOOTING);
    });

    expect(setIsFtWorkflowOpen).toHaveBeenCalledWith(true);
    expect(setFtShooterId).toHaveBeenCalledWith(SPECIAL_PLAYER_IDS.OPPONENT);
    expect(setFtAttempts).toHaveBeenCalledWith(2);
  });

  describe("1-and-1 Non-Shooting Foul Bonus Enforcement", () => {
    it("triggers 1-and-1 free throws when foul puts committing team in single bonus (HALVES format, 7th foul)", async () => {
      const params = {
        ...defaultParams,
        team: { periodType: "HALVES" },
        gameData: {
          ...defaultParams.gameData,
          teamFoulStats: { teamFouls: 6, oppFouls: 0 },
        },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.FOUL_NON_SHOOTING);
      });

      expect(setFtShooterId).toHaveBeenCalledWith(SPECIAL_PLAYER_IDS.OPPONENT);
      expect(setFtAttempts).toHaveBeenCalledWith("1-and-1");
      expect(setIsFtWorkflowOpen).toHaveBeenCalledWith(true);
    });

    it("triggers 2 free throws when foul puts committing team in double bonus (HALVES format, 10th foul)", async () => {
      const params = {
        ...defaultParams,
        team: { periodType: "HALVES" },
        gameData: {
          ...defaultParams.gameData,
          teamFoulStats: { teamFouls: 9, oppFouls: 0 },
        },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.FOUL_NON_SHOOTING);
      });

      expect(setFtShooterId).toHaveBeenCalledWith(SPECIAL_PLAYER_IDS.OPPONENT);
      expect(setFtAttempts).toHaveBeenCalledWith(2);
      expect(setIsFtWorkflowOpen).toHaveBeenCalledWith(true);
    });

    it("does NOT trigger free throws for non-shooting foul if not in bonus (HALVES format, 4th foul)", async () => {
      const params = {
        ...defaultParams,
        team: { periodType: "HALVES" },
        gameData: {
          ...defaultParams.gameData,
          teamFoulStats: { teamFouls: 3, oppFouls: 0 },
        },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.FOUL_NON_SHOOTING);
      });

      expect(setIsFtWorkflowOpen).not.toHaveBeenCalled();
    });
  });

  it("handles handleSaveStat for FOUL_SHOOTING in OPPONENT mode", async () => {
    const params = { ...defaultParams, trackingMode: "OPPONENT" };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.FOUL_SHOOTING);
    });

    expect(setIsFtWorkflowOpen).toHaveBeenCalledWith(true);
    expect(setFtShooterId).toHaveBeenCalledWith(null);
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

  it("derives shot clock phase correctly (EARLY, MID, LATE)", async () => {
    // EARLY: possessionStart (600) - current (595) = 5s
    const paramsEarly = { ...defaultParams, clockSeconds: 595 };
    const { result: resEarly } = renderHook(() =>
      useGameModeActions(paramsEarly),
    );
    await act(async () => {
      await resEarly.current.handleSaveStat(ACTION_TYPES.MAKE);
    });
    let stats = await mockDb.stats.toArray();
    expect(stats[0].shotClockPhase).toBe("EARLY");

    await mockDb.stats.clear();

    // MID: possessionStart (600) - current (585) = 15s
    const paramsMid = { ...defaultParams, clockSeconds: 585 };
    const { result: resMid } = renderHook(() => useGameModeActions(paramsMid));
    await act(async () => {
      await resMid.current.handleSaveStat(ACTION_TYPES.MAKE);
    });
    stats = await mockDb.stats.toArray();
    expect(stats[0].shotClockPhase).toBe("MID");

    await mockDb.stats.clear();

    // LATE: possessionStart (600) - current (575) = 25s
    const paramsLate = { ...defaultParams, clockSeconds: 575 };
    const { result: resLate } = renderHook(() =>
      useGameModeActions(paramsLate),
    );
    await act(async () => {
      await resLate.current.handleSaveStat(ACTION_TYPES.MAKE);
    });
    stats = await mockDb.stats.toArray();
    expect(stats[0].shotClockPhase).toBe("LATE");
  });

  it("handles jump ball and sets possession arrow", async () => {
    await mockDb.games.add({ id: "g1" } as any);
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleJumpBall(SPECIAL_PLAYER_IDS.OUR_TEAM);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats[0].type).toBe(ACTION_TYPES.POSSESSION);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);

    const game = await mockDb.games.get("g1");
    expect(game?.possessionArrow).toBe("OPPONENT");
  });

  it("flips arrow when HELD_BALL is recorded", async () => {
    await mockDb.games.add({ id: "g1", possessionArrow: "OUR_TEAM" } as any);
    const params = { ...defaultParams, game: { possessionArrow: "OUR_TEAM" } };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.HELD_BALL);
    });

    const game = await mockDb.games.get("g1");
    expect(game?.possessionArrow).toBe("OPPONENT");
  });

  it("pauses clock on technical foul", async () => {
    const { result } = renderHook(() => useGameModeActions(defaultParams));

    await act(async () => {
      await result.current.handleSaveStat(ACTION_TYPES.TECHNICAL_FOUL);
    });

    expect(setIsClockRunning).toHaveBeenCalledWith(false);
  });

  it("handles handleConfirmStartingLineup and saves SUB_IN records", async () => {
    const setIsJumpBallOpen = vi.fn();
    const params = {
      ...defaultParams,
      setIsJumpBallOpen,
    };
    const { result } = renderHook(() => useGameModeActions(params));

    await act(async () => {
      await result.current.handleConfirmStartingLineup(
        new Set(["p1", "p2", "p3", "p4", "p5"]),
      );
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(5);
    expect(stats.every((s) => s.type === ACTION_TYPES.SUB_IN)).toBe(true);
    expect(setIsJumpBallOpen).toHaveBeenCalledWith(true);
  });

  describe("Clock Auto-Stop on Successful Field Goal in Final Minute of Regulation/OT", () => {
    it("stops the clock on a 2pt/3pt MAKE in the final minute of regulation (Period 4)", async () => {
      const params = {
        ...defaultParams,
        period: 4,
        clockSeconds: 30, // Final minute
        statType: ACTION_TYPES.MAKE,
        points: 2, // Successful field goal
        team: { defaultFoulLimit: 5, periodType: "QUARTERS" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).toHaveBeenCalledWith(false);
    });

    it("stops the clock on a 2pt/3pt MAKE in overtime (Period 5)", async () => {
      const params = {
        ...defaultParams,
        period: 5, // Overtime
        clockSeconds: 45, // Final minute
        statType: ACTION_TYPES.MAKE,
        points: 3, // Successful field goal
        team: { defaultFoulLimit: 5, periodType: "QUARTERS" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).toHaveBeenCalledWith(false);
    });

    it("does NOT stop the clock on a 1pt free throw MAKE in the final minute of regulation", async () => {
      const params = {
        ...defaultParams,
        period: 4,
        clockSeconds: 30,
        statType: ACTION_TYPES.MAKE,
        points: 1, // Free throw, not a field goal
        team: { defaultFoulLimit: 5, periodType: "QUARTERS" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).not.toHaveBeenCalled();
    });

    it("does NOT stop the clock on a MAKE with > 60 seconds left", async () => {
      const params = {
        ...defaultParams,
        period: 4,
        clockSeconds: 90, // More than 60 seconds
        statType: ACTION_TYPES.MAKE,
        points: 2,
        team: { defaultFoulLimit: 5, periodType: "QUARTERS" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).not.toHaveBeenCalled();
    });

    it("does NOT stop the clock on a MAKE in Period 1", async () => {
      const params = {
        ...defaultParams,
        period: 1, // Not regulation end/OT
        clockSeconds: 15, // Under 60 seconds but wrong period
        statType: ACTION_TYPES.MAKE,
        points: 2,
        team: { defaultFoulLimit: 5, periodType: "QUARTERS" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).not.toHaveBeenCalled();
    });

    it("handles HALVES period type correctly (stops clock in Period 2 final minute)", async () => {
      const params = {
        ...defaultParams,
        period: 2, // Second half (final period of regulation for halves)
        clockSeconds: 20, // Final minute
        statType: ACTION_TYPES.MAKE,
        points: 2,
        team: { defaultFoulLimit: 5, periodType: "HALVES" },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsClockRunning).toHaveBeenCalledWith(false);
    });
  });

  describe("Verified Period Lockout", () => {
    it("blocks handleSaveStat when current period is verified and locked", async () => {
      const params = {
        ...defaultParams,
        period: 1,
        game: { ...defaultParams.game, verifiedPeriods: [1] },
      };
      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleSaveStat(ACTION_TYPES.MAKE);
      });

      expect(setIsDialogOpen).toHaveBeenCalledWith(false);
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Period 1 is verified and locked. Unlock the period to add new actions.",
          severity: "warning",
        }),
      );
      const stats = await mockDb.stats.toArray();
      expect(stats).toHaveLength(0);
    });

    it("blocks handleUndo when last action is from a verified period", async () => {
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
        game: { ...defaultParams.game, verifiedPeriods: [1] },
        gameData: {
          ...defaultParams.gameData,
          recentStats: [stat],
        },
      };

      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleUndo();
      });

      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Period 1 stats are verified and locked. Unlock period to undo.",
          severity: "warning",
        }),
      );
      const updatedStat = await mockDb.stats.get("s1");
      expect(updatedStat?.deletedAt).toBeUndefined();
    });

    it("blocks handleDeleteStat when target action is from a verified period", async () => {
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
        statToDelete: "s1",
        game: { ...defaultParams.game, verifiedPeriods: [1] },
        gameData: {
          ...defaultParams.gameData,
          recentStats: [stat],
        },
      };

      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleDeleteStat();
      });

      expect(setIsDeleteDialogOpen).toHaveBeenCalledWith(false);
      expect(setStatToDelete).toHaveBeenCalledWith(null);
      expect(setSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "Period 1 stats are verified and locked. Unlock period to delete actions.",
          severity: "warning",
        }),
      );
      const updatedStat = await mockDb.stats.get("s1");
      expect(updatedStat?.deletedAt).toBeUndefined();
    });
  });

  describe("handleReopenGame", () => {
    it("successfully re-opens a completed game", async () => {
      await mockDb.games.add({
        id: "g1",
        teamId: "t1",
        opponent: "Opponent",
        completed: 1,
        synced: 1,
        date: "2026-08-02",
        location: "Home",
      });

      const setIsReopening = vi.fn();
      const setIsConfirmReopenOpen = vi.fn();

      const params = {
        ...defaultParams,
        setIsReopening,
        setIsConfirmReopenOpen,
      };

      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleReopenGame();
      });

      expect(setIsReopening).toHaveBeenCalledWith(true);
      expect(setIsReopening).toHaveBeenCalledWith(false);
      expect(setIsConfirmReopenOpen).toHaveBeenCalledWith(false);
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: "Game re-opened successfully!",
        severity: "success",
      });

      const game = await mockDb.games.get("g1");
      expect(game?.completed).toBe(0);
      expect(game?.synced).toBe(0);
    });

    it("handles errors during re-opening", async () => {
      const setIsReopening = vi.fn();
      const setIsConfirmReopenOpen = vi.fn();

      const originalUpdate = mockDb.games.update;
      mockDb.games.update = vi.fn().mockRejectedValue(new Error("DB error"));

      const params = {
        ...defaultParams,
        setIsReopening,
        setIsConfirmReopenOpen,
      };

      const { result } = renderHook(() => useGameModeActions(params));

      await act(async () => {
        await result.current.handleReopenGame();
      });

      expect(setIsReopening).toHaveBeenCalledWith(true);
      expect(setIsReopening).toHaveBeenCalledWith(false);
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: "Failed to re-open game",
        severity: "error",
      });

      mockDb.games.update = originalUpdate;
    });
  });
});
