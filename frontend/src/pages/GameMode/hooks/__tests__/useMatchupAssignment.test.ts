import { renderHook, act } from "../../../../test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMatchupAssignment } from "../useMatchupAssignment";
import { mockDb } from "../../../../dbMock";
import { syncService } from "../../../../utils/syncService";

vi.mock("../../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useMatchupAssignment", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("assigns a defender to an opponent", async () => {
    const gameId = "game-1";
    const game = { id: gameId, matchups: {} } as any;

    await act(async () => {
      await mockDb.games.add(game);
    });

    const { result } = renderHook(() => useMatchupAssignment({ gameId, game }));

    await act(async () => {
      await result.current.handleAssignDefender("opp-1", "player-1");
    });

    const updatedGame = await mockDb.games.get(gameId);
    expect(updatedGame?.matchups).toEqual({ "opp-1": "player-1" });
    expect(updatedGame?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("toggles/unassigns a defender if already assigned", async () => {
    const gameId = "game-1";
    const game = { id: gameId, matchups: { "opp-1": "player-1" } } as any;

    await act(async () => {
      await mockDb.games.add(game);
    });

    const { result } = renderHook(() => useMatchupAssignment({ gameId, game }));

    await act(async () => {
      await result.current.handleAssignDefender("opp-1", "player-1");
    });

    const updatedGame = await mockDb.games.get(gameId);
    expect(updatedGame?.matchups).toEqual({ "opp-1": "" });
    expect(updatedGame?.synced).toBe(0);
  });

  it("does nothing if gameId is missing", async () => {
    const gameId = null;
    const game = { id: "game-1", matchups: {} } as any;

    const { result } = renderHook(() => useMatchupAssignment({ gameId, game }));

    await act(async () => {
      await result.current.handleAssignDefender("opp-1", "player-1");
    });

    expect(syncService.pushUpdates).not.toHaveBeenCalled();
  });

  it("handles undefined matchups in game object", async () => {
    const gameId = "game-1";
    const game = { id: gameId } as any;

    await act(async () => {
      await mockDb.games.add(game);
    });

    const { result } = renderHook(() => useMatchupAssignment({ gameId, game }));

    await act(async () => {
      await result.current.handleAssignDefender("opp-1", "player-1");
    });

    const updatedGame = await mockDb.games.get(gameId);
    expect(updatedGame?.matchups).toEqual({ "opp-1": "player-1" });
  });
});
