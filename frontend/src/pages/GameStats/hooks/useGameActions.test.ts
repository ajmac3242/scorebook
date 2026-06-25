import { renderHook, act } from "../../../test-utils";
import { useGameActions } from "./useGameActions";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useGameActions", () => {
  const gameId = "g1";
  const mockGame: any = {
    id: gameId,
    teamId: "t1",
    opponent: "Bulls",
    synced: 1,
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles handleUpdateGame", async () => {
    await mockDb.games.add(mockGame);
    const { result } = renderHook(() =>
      useGameActions({ game: mockGame, gameId, teamName: "Lakers" }),
    );

    await act(async () => {
      result.current.setEditOpponent("Celtics");
    });

    await act(async () => {
      await result.current.handleUpdateGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.opponent).toBe("Celtics");
  });

  it("handles handleDeleteGame", async () => {
    await mockDb.games.add(mockGame);
    const { result } = renderHook(() =>
      useGameActions({ game: mockGame, gameId, teamName: "Lakers" }),
    );

    await act(async () => {
      await result.current.handleDeleteGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.deletedAt).toBeDefined();
  });

  it("handles handleRestoreGame", async () => {
    const deletedGame = { ...mockGame, deletedAt: "2023-01-01" };
    await mockDb.games.add(deletedGame);
    const { result } = renderHook(() =>
      useGameActions({ game: deletedGame, gameId, teamName: "Lakers" }),
    );

    await act(async () => {
      await result.current.handleRestoreGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.deletedAt).toBeUndefined();
  });
});
