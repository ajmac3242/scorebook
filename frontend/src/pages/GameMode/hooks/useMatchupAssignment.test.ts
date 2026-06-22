import { renderHook, act } from "../../../test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useMatchupAssignment } from "./useMatchupAssignment";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
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
    await mockDb.games.add({ id: "g1", matchups: {} } as any);
    const { result } = renderHook(() =>
      useMatchupAssignment({ gameId: "g1", game: { id: "g1", matchups: {} } as any })
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const game = await mockDb.games.get("g1");
    expect(game?.matchups?.["opp1"]).toBe("p1");
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("unassigns a defender if clicking the same one", async () => {
    await mockDb.games.add({ id: "g1", matchups: { opp1: "p1" } } as any);
    const { result } = renderHook(() =>
      useMatchupAssignment({ gameId: "g1", game: { id: "g1", matchups: { opp1: "p1" } } as any })
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    const game = await mockDb.games.get("g1");
    expect(game?.matchups?.["opp1"]).toBe("");
  });

  it("does nothing if gameId is missing", async () => {
    const { result } = renderHook(() =>
      useMatchupAssignment({ gameId: null, game: undefined })
    );

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    expect(syncService.pushUpdates).not.toHaveBeenCalled();
  });
});
