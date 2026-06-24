import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMatchupAssignment } from "./useMatchupAssignment";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";

// Mock dependencies
vi.mock("../../../db", () => ({
  db: {
    games: {
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

describe("useMatchupAssignment", () => {
  const defaultProps = {
    gameId: "g1",
    game: {
      id: "g1",
      matchups: { opp1: "p1" },
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assigns a defender correctly", async () => {
    const { result } = renderHook(() => useMatchupAssignment(defaultProps));

    await act(async () => {
      await result.current.handleAssignDefender("opp2", "p2");
    });

    expect(db.games.update).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({
        matchups: { opp1: "p1", opp2: "p2" },
        synced: 0,
      }),
    );
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("toggles assignment off if same defender is picked", async () => {
    const { result } = renderHook(() => useMatchupAssignment(defaultProps));

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    expect(db.games.update).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({
        matchups: { opp1: "" },
      }),
    );
  });

  it("does nothing if gameId is missing", async () => {
    const props = { ...defaultProps, gameId: null };
    const { result } = renderHook(() => useMatchupAssignment(props));

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    expect(db.games.update).not.toHaveBeenCalled();
  });

  it("handles missing matchups object in game gracefully", async () => {
    const props = { ...defaultProps, game: { id: "g1" } as any };
    const { result } = renderHook(() => useMatchupAssignment(props));

    await act(async () => {
      await result.current.handleAssignDefender("opp1", "p1");
    });

    expect(db.games.update).toHaveBeenCalledWith(
      "g1",
      expect.objectContaining({
        matchups: { opp1: "p1" },
      }),
    );
  });
});
