import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useGames } from "../useGames";
import { mockDb } from "../../dbMock";

describe("useGames", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("returns an empty array when no teamId is provided", async () => {
    const { result } = renderHook(() => useGames());
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("returns games filtered by teamId", async () => {
    const teamId = "team-1";
    await mockDb.games.add({ id: "g1", teamId: "team-1", name: "Game 1" } as any);
    await mockDb.games.add({ id: "g2", teamId: "team-2", name: "Game 2" } as any);

    const { result } = renderHook(() => useGames(teamId));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("g1");
    });
  });

  it("updates reactively when a new game is added", async () => {
    const teamId = "team-1";
    const { result } = renderHook(() => useGames(teamId));

    await waitFor(() => expect(result.current).toHaveLength(0));

    await act(async () => {
      await mockDb.games.add({ id: "g1", teamId, name: "New Game" } as any);
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("g1");
    });
  });

  it("updates reactively when a game is deleted", async () => {
    const teamId = "team-1";
    await mockDb.games.add({ id: "g1", teamId, name: "Game to delete" } as any);

    const { result } = renderHook(() => useGames(teamId));
    await waitFor(() => expect(result.current).toHaveLength(1));

    await act(async () => {
      await mockDb.games.delete("g1");
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(0);
    });
  });
});
