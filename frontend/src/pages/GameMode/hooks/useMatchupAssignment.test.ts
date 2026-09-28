import { renderHook, act } from "../../../test-utils";
import { useMatchupAssignment } from "./useMatchupAssignment";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach } from "vitest";

describe("useMatchupAssignment", () => {
  const gameId = "g1";
  const mockGame: any = { id: gameId, teamId: "t1", matchups: {}, synced: 1 };

  beforeEach(() => {
    mockDb.reset();
  });

  it("assigns a defender to an opponent", async () => {
    await mockDb.games.add({
      ...mockGame,
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
    });
    const { result } = renderHook(() =>
      useMatchupAssignment({
        gameId,
        game: mockGame,
      }),
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.matchups?.["opp1"]).toBe("p1");
  });

  it("toggles off a defender if already assigned", async () => {
    const gameWithMatchup = {
      ...mockGame,
      matchups: { opp1: "p1" },
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
    };
    await mockDb.games.add(gameWithMatchup);
    const { result } = renderHook(() =>
      useMatchupAssignment({
        gameId,
        game: gameWithMatchup,
      }),
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.matchups?.["opp1"]).toBe("");
  });

  it("handles undefined game.matchups gracefully on initial assignment", async () => {
    const gameNoMatchups = {
      id: gameId,
      teamId: "t1",
      opponent: "Opp",
      date: "2023-01-01",
      location: "Home",
      synced: 1,
    };
    await mockDb.games.add(gameNoMatchups);

    const { result } = renderHook(() =>
      useMatchupAssignment({
        gameId,
        game: gameNoMatchups as any,
      }),
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const updatedGame = await mockDb.games.get(gameId);
    expect(updatedGame?.matchups).toEqual({ opp1: "p1" });
  });

  it("returns early without modifying DB if gameId is null", async () => {
    const { result } = renderHook(() =>
      useMatchupAssignment({
        gameId: null,
        game: undefined,
      }),
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const games = await mockDb.games.toArray();
    expect(games).toHaveLength(0);
  });
});
