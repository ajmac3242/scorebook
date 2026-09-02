import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "../test-utils";
import { useStatWriter } from "./useStatWriter";
import { mockDb } from "../dbMock";
import { syncService } from "../utils/syncService";
import { ACTION_TYPES } from "../constants/stats";
import { logger } from "../utils/logger";

vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("useStatWriter", () => {
  const gameId = "test-game-id";

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("should write a new stat (MAKE)", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    let savedStat: any;
    await act(async () => {
      savedStat = await result.current.writeStat({
        playerId: "player-1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 600,
      });
    });

    expect(savedStat).toBeDefined();
    expect(savedStat.gameId).toBe(gameId);
    expect(savedStat.playerId).toBe("player-1");
    expect(savedStat.points).toBe(2);
    expect(syncService.pushUpdates).toHaveBeenCalled();

    const dbStat = await mockDb.stats.get(savedStat.id);
    expect(dbStat).toBeDefined();
    expect(dbStat?.type).toBe(ACTION_TYPES.MAKE);
  });

  it("should write other stat types (TURNOVER, FOUL, REBOUND, STEAL, BLOCK, etc.)", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    await act(async () => {
      await result.current.writeStat({
        playerId: "player-1",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        clockTime: 550,
      });
      await result.current.writeStat({
        playerId: "player-2",
        type: ACTION_TYPES.FOUL,
        period: 1,
        clockTime: 540,
      });
      await result.current.writeStat({
        playerId: "player-1",
        type: ACTION_TYPES.REBOUND,
        period: 1,
        clockTime: 530,
      });
      await result.current.writeStat({
        playerId: "player-2",
        type: ACTION_TYPES.STEAL,
        period: 1,
        clockTime: 520,
      });
      await result.current.writeStat({
        playerId: "player-1",
        type: ACTION_TYPES.BLOCK,
        period: 1,
        clockTime: 510,
      });
    });

    const allStats = await mockDb.stats.toArray();
    expect(allStats).toHaveLength(5);
    expect(
      allStats.find((s) => s.type === ACTION_TYPES.TURNOVER),
    ).toBeDefined();
    expect(allStats.find((s) => s.type === ACTION_TYPES.FOUL)).toBeDefined();
    expect(allStats.find((s) => s.type === ACTION_TYPES.REBOUND)).toBeDefined();
    expect(allStats.find((s) => s.type === ACTION_TYPES.STEAL)).toBeDefined();
    expect(allStats.find((s) => s.type === ACTION_TYPES.BLOCK)).toBeDefined();
  });

  it("should update an existing stat when editing", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    // First, add a stat
    const initialStat = {
      id: "stat-to-edit",
      gameId,
      playerId: "player-1",
      type: ACTION_TYPES.MISS,
      period: 1,
      clockTime: 500,
      synced: 1,
      timestamp: new Date().toISOString(),
    };
    await mockDb.stats.add(initialStat);

    await act(async () => {
      await result.current.writeStat({
        isEditing: true,
        editingStatId: "stat-to-edit",
        type: ACTION_TYPES.MAKE,
        points: 3,
      });
    });

    const updatedStat = await mockDb.stats.get("stat-to-edit");
    expect(updatedStat?.type).toBe(ACTION_TYPES.MAKE);
    expect(updatedStat?.points).toBe(3);
    expect(updatedStat?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("should soft delete a stat", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    const statId = "stat-to-delete";
    await mockDb.stats.add({
      id: statId,
      gameId,
      playerId: "player-1",
      type: ACTION_TYPES.MAKE,
      synced: 1,
      period: 1,
      timestamp: new Date().toISOString(),
    });

    await act(async () => {
      await result.current.deleteStat(statId);
    });

    const deletedStat = await mockDb.stats.get(statId);
    expect(deletedStat?.deletedAt).toBeDefined();
    expect(deletedStat?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("should handle quick substitution", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    const originalOnCourt = new Set(["p1", "p2", "p3", "p4", "p5"]);
    const finalOnCourt = new Set(["p1", "p2", "p3", "p4", "p6"]); // p5 out, p6 in

    await act(async () => {
      await result.current.quickSub(originalOnCourt, finalOnCourt, 1, 300);
    });

    const allStats = await mockDb.stats.toArray();
    const subOut = allStats.find(
      (s) => s.playerId === "p5" && s.type === ACTION_TYPES.SUB_OUT,
    );
    const subIn = allStats.find(
      (s) => s.playerId === "p6" && s.type === ACTION_TYPES.SUB_IN,
    );

    expect(subOut).toBeDefined();
    expect(subIn).toBeDefined();
    expect(subOut?.clockTime).toBe(300);
    expect(subIn?.clockTime).toBe(300);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("should end a game, calculate result, and sync opponent roster to persistent record", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    await mockDb.opponents.add({
      id: "opp-1",
      name: "Celtics",
      roster: ["0", "7"],
      synced: 1,
    });

    await mockDb.games.add({
      id: gameId,
      teamId: "t1",
      opponent: "Celtics",
      opponentId: "opp-1",
      opponentRoster: ["0", "7"],
      date: "2026-06-18",
      location: "Gym",
      completed: 0,
      synced: 1,
    });

    await mockDb.stats.add({
      id: "s1",
      gameId,
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 100,
      timestamp: new Date().toISOString(),
    });
    await mockDb.stats.add({
      id: "s2",
      gameId,
      playerId: "OPPONENT:23",
      type: ACTION_TYPES.MAKE,
      points: 3,
      period: 1,
      clockTime: 50,
      timestamp: new Date().toISOString(),
    });

    await act(async () => {
      await result.current.endHighGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.completed).toBe(1);
    expect(game?.teamScore).toBe(2);
    expect(game?.oppScore).toBe(3);
    expect(game?.opponentRoster).toEqual(["0", "7", "23"]);

    const persistentOpp = await mockDb.opponents.get("opp-1");
    expect(persistentOpp?.roster).toEqual(["0", "7", "23"]);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("should return null and do nothing if gameId is missing", async () => {
    const { result } = renderHook(() => useStatWriter(null));

    let res: any;
    await act(async () => {
      res = await result.current.writeStat({
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
      });
    });

    expect(res).toBeNull();
    expect(syncService.pushUpdates).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.quickSub(new Set(), new Set(), 1, 1);
      await result.current.endHighGame();
    });
    expect(syncService.pushUpdates).not.toHaveBeenCalled();
  });

  it("should log and throw error when database operation fails", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    // Force an error by mocking db.stats.add
    vi.spyOn(mockDb.stats, "add").mockRejectedValue(new Error("DB Error"));

    await expect(
      act(async () => {
        await result.current.writeStat({
          playerId: "player-1",
          type: ACTION_TYPES.MAKE,
          period: 1,
          clockTime: 600,
        });
      }),
    ).rejects.toThrow("DB Error");

    expect(logger.error).toHaveBeenCalled();
  });

  it("should log and throw error when deleteStat database operation fails", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    vi.spyOn(mockDb.stats, "update").mockRejectedValue(
      new Error("Delete Error"),
    );

    await expect(
      act(async () => {
        await result.current.deleteStat("some-id");
      }),
    ).rejects.toThrow("Delete Error");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to delete stat:",
      expect.any(Error),
    );
  });

  it("should log and throw error when endHighGame database operation fails", async () => {
    const { result } = renderHook(() => useStatWriter(gameId));

    vi.spyOn(mockDb.games, "update").mockRejectedValue(
      new Error("End Game Error"),
    );

    await expect(
      act(async () => {
        await result.current.endHighGame();
      }),
    ).rejects.toThrow("End Game Error");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to end game:",
      expect.any(Error),
    );
  });
});
