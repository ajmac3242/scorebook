import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePossessionTracker } from "../hooks/usePossessionTracker";
import { mockDb } from "../dbMock";
import { syncService } from "../utils/syncService";
import { SPECIAL_PLAYER_IDS, ACTION_TYPES } from "../constants/stats";

vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("usePossessionTracker", () => {
  const gameId = "test-game-id";

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("should toggle possession to OPPONENT when current is OUR_TEAM", async () => {
    const { result } = renderHook(() => usePossessionTracker(gameId));

    await act(async () => {
      await result.current.togglePossession(
        SPECIAL_PLAYER_IDS.OUR_TEAM,
        1,
        600,
      );
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.length).toBe(1);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
    expect(stats[0].type).toBe(ACTION_TYPES.POSSESSION);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("should toggle possession to OUR_TEAM when current is OPPONENT", async () => {
    const { result } = renderHook(() => usePossessionTracker(gameId));

    await act(async () => {
      await result.current.togglePossession(
        SPECIAL_PLAYER_IDS.OPPONENT,
        1,
        600,
      );
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.length).toBe(1);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);
    expect(stats[0].type).toBe(ACTION_TYPES.POSSESSION);
  });

  it("should toggle possession to OUR_TEAM when current is null", async () => {
    const { result } = renderHook(() => usePossessionTracker(gameId));

    await act(async () => {
      await result.current.togglePossession(null, 1, 600);
    });

    const stats = await mockDb.stats.toArray();
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OUR_TEAM);
  });

  it("should do nothing if gameId is missing", async () => {
    const { result } = renderHook(() => usePossessionTracker(null));

    await act(async () => {
      await result.current.togglePossession(
        SPECIAL_PLAYER_IDS.OUR_TEAM,
        1,
        600,
      );
    });

    const stats = await mockDb.stats.toArray();
    expect(stats.length).toBe(0);
    expect(syncService.pushUpdates).not.toHaveBeenCalled();
  });
});
