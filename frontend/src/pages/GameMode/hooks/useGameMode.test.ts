import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "../../../test-utils";
import { useGameMode } from "./useGameMode";
import { mockDb } from "../../../dbMock";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

// Mock internal hooks
vi.mock("../../../hooks/useGameClock", () => ({
  useGameClock: vi.fn(),
}));
vi.mock("../../../hooks/useLineup", () => ({
  useLineup: vi.fn(),
}));
vi.mock("../../../hooks/useStatWriter", () => ({
  useStatWriter: vi.fn(),
}));
vi.mock("./usePossessionTracker", () => ({
  usePossessionTracker: vi.fn(),
}));
vi.mock("../../../hooks/useVoiceRecognition", () => ({
  useVoiceRecognition: vi.fn(),
}));
vi.mock("../../../hooks/useGameAggregator", () => ({
  useGameAggregator: vi.fn(),
}));

import { useGameClock } from "../../../hooks/useGameClock";
import { useLineup } from "../../../hooks/useLineup";
import { useStatWriter } from "../../../hooks/useStatWriter";
import { usePossessionTracker } from "./usePossessionTracker";
import { useVoiceRecognition } from "../../../hooks/useVoiceRecognition";
import { useGameAggregator } from "../../../hooks/useGameAggregator";

describe("useGameMode hook", () => {
  const gameId = "g1";
  const teamId = "t1";

  const defaultClock = {
    clockSeconds: 600,
    setClockSeconds: vi.fn(),
    clockSecondsRef: { current: 600 },
    isClockRunning: false,
    setIsClockRunning: vi.fn(),
    period: 1,
    setPeriod: vi.fn(),
    handleToggleClock: vi.fn(),
    handleEditClock: vi.fn(),
    handleNextPeriod: vi.fn(),
  };

  const defaultLineup = {
    isSubDialogOpen: false,
    setIsSubDialogOpen: vi.fn(),
    subOutPlayerId: null,
    setSubOutPlayerId: vi.fn(),
    draftOnCourtIds: new Set(),
    selectedSwapId: null,
    handleSwapClick: vi.fn(),
    isLineupIllegal: false,
  };

  const defaultAggregator = {
    eventAggregates: {
      currentScore: 0,
      opponentScore: 0,
      teamFoulStats: { teamFouls: 0, oppFouls: 0 },
      oppPeriodPlayerFouls: new Map(),
    },
    gameData: {
      onCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
      stintStarts: new Map(),
      stintDurations: new Map(),
      defensiveStats: { totalKills: 0 },
      momentumAlerts: { opponentThreats: [] },
      teamFoulStats: { teamFouls: 0, oppFouls: 0 },
    },
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();

    (useGameClock as any).mockReturnValue(defaultClock);
    (useLineup as any).mockReturnValue(defaultLineup);
    (useGameAggregator as any).mockReturnValue(defaultAggregator);
    (useStatWriter as any).mockReturnValue({
      isSavingStat: false,
      setIsSavingStat: vi.fn(),
      isDeleting: false,
      setIsDeleting: vi.fn(),
      isEnding: false,
      setIsEnding: vi.fn(),
      writeStat: vi.fn(),
      deleteStat: vi.fn(),
      quickSub: vi.fn(),
      endHighGame: vi.fn(),
    });
    (usePossessionTracker as any).mockReturnValue({
      togglePossession: vi.fn(),
    });
    (useVoiceRecognition as any).mockReturnValue({
      isListening: false,
      lastTranscript: "",
    });
  });

  it("stops the clock and shows snackbar when lineup becomes illegal while clock is running", () => {
    const setIsClockRunning = vi.fn();
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      isClockRunning: true,
      setIsClockRunning,
    });
    (useLineup as any).mockReturnValue({
      ...defaultLineup,
      isLineupIllegal: true,
    });

    renderHook(() => useGameMode(gameId, teamId));

    expect(setIsClockRunning).toHaveBeenCalledWith(false);
  });

  it("opens verification modal when clock reaches zero and period is not verified", () => {
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      clockSeconds: 0,
      isClockRunning: false,
      period: 1,
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));

    expect(result.current.isVerificationOpen).toBe(true);
  });

  it("advances period after verification", async () => {
    const handleNextPeriod = vi.fn();
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      handleNextPeriod,
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));

    await act(async () => {
      await result.current.handleVerifyPeriod({
        teamScore: 0,
        oppScore: 0,
        teamFouls: 0,
        oppFouls: 0,
        playerFoulAdjustments: {},
        oppPlayerFoulAdjustments: {},
        removedBuzzerBeaterIds: [],
      });
    });

    expect(handleNextPeriod).toHaveBeenCalled();
  });

  it("triggers jump ball dialog on first period start with no stats", () => {
    const setIsClockRunning = vi.fn();
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      isClockRunning: true,
      period: 1,
      setIsClockRunning,
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));

    expect(result.current.isJumpBallOpen).toBe(true);
    expect(setIsClockRunning).toHaveBeenCalledWith(false);
  });

  it("records SYSTEM_ADJUSTMENT stats in handleVerifyPeriod", async () => {
    const { result } = renderHook(() => useGameMode(gameId, teamId));

    await act(async () => {
      await result.current.handleVerifyPeriod({
        teamScore: 10,
        oppScore: 8,
        teamFouls: 2,
        oppFouls: 3,
        playerFoulAdjustments: {},
        oppPlayerFoulAdjustments: {},
        removedBuzzerBeaterIds: [],
      });
    });

    const stats = mockDb.stats.data;
    expect(stats).toContainEqual(
      expect.objectContaining({
        type: ACTION_TYPES.SYSTEM_ADJUSTMENT,
        points: 10,
        playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
      }),
    );
  });

  it("records player foul adjustments in handleVerifyPeriod", async () => {
    const { result } = renderHook(() => useGameMode(gameId, teamId));

    await act(async () => {
      await result.current.handleVerifyPeriod({
        teamScore: 0,
        oppScore: 0,
        teamFouls: 1,
        oppFouls: 0,
        playerFoulAdjustments: { p1: 1 },
        oppPlayerFoulAdjustments: {},
        removedBuzzerBeaterIds: [],
      });
    });

    const stats = mockDb.stats.data;
    expect(stats).toContainEqual(
      expect.objectContaining({
        type: ACTION_TYPES.FOUL,
        playerId: "p1",
      }),
    );
  });

  it("calculates halftime stats when report is open", () => {
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      period: 3,
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));

    act(() => {
      result.current.setIsHalftimeReportOpen(true);
    });

    expect(result.current.halftimeStats).toBeDefined();
  });

  it("updates snackbar when a kill is achieved", () => {
    const { result, rerender } = renderHook(
      ({ kills }: { kills: number }) => {
        (useGameAggregator as any).mockReturnValue({
          ...defaultAggregator,
          gameData: {
            ...defaultAggregator.gameData,
            defensiveStats: { totalKills: kills },
          },
        });
        return useGameMode(gameId, teamId);
      },
      { initialProps: { kills: 0 } },
    );

    rerender({ kills: 1 });
    expect(result.current.snackbar.message).toContain("KILL ACHIEVED");
  });

  it("handles voice substitution command", async () => {
    let capturedOnCommand: any;
    (useVoiceRecognition as any).mockImplementation(({ onCommand }: any) => {
      capturedOnCommand = onCommand;
      return { isListening: false, lastTranscript: "" };
    });

    const quickSub = vi.fn().mockResolvedValue(undefined);
    (useStatWriter as any).mockReturnValue({
      isSavingStat: false,
      setIsSavingStat: vi.fn(),
      isDeleting: false,
      setIsDeleting: vi.fn(),
      isEnding: false,
      setIsEnding: vi.fn(),
      writeStat: vi.fn(),
      deleteStat: vi.fn(),
      quickSub,
      endHighGame: vi.fn(),
    });

    mockDb.seed({
      teamPlayers: [
        { id: "tp1", teamId: "t1", playerId: "p1", jerseyNumber: "10" },
        { id: "tp2", teamId: "t1", playerId: "p2", jerseyNumber: "20" },
      ],
      players: [
        { id: "p1", name: "Player 1" },
        { id: "p2", name: "Player 2" },
      ],
    });

    renderHook(() => useGameMode(gameId, teamId));

    await act(async () => {
      await capturedOnCommand({
        actions: [
          {
            action: ACTION_TYPES.SUB_IN,
            jerseyNumber: "10",
            isOpponent: false,
          },
          {
            action: ACTION_TYPES.SUB_OUT,
            jerseyNumber: "20",
            isOpponent: false,
          },
        ],
      });
    });

    expect(quickSub).toHaveBeenCalled();
  });

  it("automatically stops the clock and triggers QuickSubDialog when a player on court reaches foul limit", async () => {
    const setIsClockRunning = vi.fn();
    const setIsSubDialogOpen = vi.fn();
    const setSubOutPlayerId = vi.fn();

    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      isClockRunning: true,
      setIsClockRunning,
    });
    (useLineup as any).mockReturnValue({
      ...defaultLineup,
      isSubDialogOpen: false,
      setIsSubDialogOpen,
      setSubOutPlayerId,
    });

    mockDb.seed({
      players: [
        { id: "p1", name: "Player 1" },
        { id: "p2", name: "Player 2" },
        { id: "p3", name: "Player 3" },
        { id: "p4", name: "Player 4" },
        { id: "p5", name: "Player 5" },
      ],
      teamPlayers: [
        { id: "tp1", teamId: "t1", playerId: "p1", jerseyNumber: "10" },
        { id: "tp2", teamId: "t1", playerId: "p2", jerseyNumber: "20" },
        { id: "tp3", teamId: "t1", playerId: "p3", jerseyNumber: "30" },
        { id: "tp4", teamId: "t1", playerId: "p4", jerseyNumber: "40" },
        { id: "tp5", teamId: "t1", playerId: "p5", jerseyNumber: "50" },
      ],
      games: [{ id: "g1", teamId: "t1", foulLimit: 5 }],
      stats: [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          clockTime: 500,
          timestamp: "2026-07-20T10:00:00Z",
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          clockTime: 400,
          timestamp: "2026-07-20T10:01:00Z",
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          clockTime: 300,
          timestamp: "2026-07-20T10:02:00Z",
        },
        {
          id: "s4",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          clockTime: 200,
          timestamp: "2026-07-20T10:03:00Z",
        },
        {
          id: "s5",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          period: 1,
          clockTime: 100,
          timestamp: "2026-07-20T10:04:00Z",
        },
      ],
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));

    // Wait for async dexie queries to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(setIsClockRunning).toHaveBeenCalledWith(false);
    expect(setIsSubDialogOpen).toHaveBeenCalledWith(true);
    expect(setSubOutPlayerId).toHaveBeenCalledWith("p1");
    expect(result.current.fouledOutOnCourtPlayer).toBe("p1");
  });

  it("correctly identifies isPreTipState when period is 1, game stats are empty, and clockSeconds is at max", () => {
    (useGameClock as any).mockReturnValue({
      ...defaultClock,
      period: 1,
      clockSeconds: 600,
    });
    (useGameAggregator as any).mockReturnValue({
      ...defaultAggregator,
      gameData: {
        ...defaultAggregator.gameData,
        onCourtIds: new Set(),
      },
    });

    const { result } = renderHook(() => useGameMode(gameId, teamId));
    expect(result.current.isPreTipState).toBe(true);
  });
});
