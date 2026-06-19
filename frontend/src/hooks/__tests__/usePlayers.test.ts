/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePlayers } from "../usePlayers";
import { mockDb } from "../../dbMock";
import { logger } from "../../utils/logger";

vi.mock("../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("usePlayers", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("returns an empty array when no players exist", async () => {
    const { result } = renderHook(() => usePlayers());
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("returns players sorted by name", async () => {
    await act(async () => {
      await mockDb.players.bulkPut([
        { id: "p1", name: "Charlie" },
        { id: "p2", name: "Alpha" },
        { id: "p3", name: "Bravo" },
      ]);
    });

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      expect(result.current[0].name).toBe("Alpha");
      expect(result.current[1].name).toBe("Bravo");
      expect(result.current[2].name).toBe("Charlie");
    });
  });

  it("handles players with missing names during sorting", async () => {
    await act(async () => {
      await mockDb.players.bulkPut([
        { id: "p1", name: "Charlie" },
        { id: "p2" }, // name is undefined
        { id: "p3", name: "Alpha" },
      ] as any);
    });

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      // Empty/undefined names should come first
      expect(result.current[0].id).toBe("p2");
      expect(result.current[1].name).toBe("Alpha");
    });
  });

  it("updates reactively when a player is added", async () => {
    const { result } = renderHook(() => usePlayers());
    await waitFor(() => expect(result.current).toHaveLength(0));

    await act(async () => {
      await mockDb.players.add({ id: "p1", name: "New Player" });
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe("New Player");
    });
  });

  it("handles players with identical names during sorting", async () => {
    await act(async () => {
      await mockDb.players.bulkPut([
        { id: "p1", name: "Alpha" },
        { id: "p2", name: "Alpha" },
      ]);
    });

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current[0].name).toBe("Alpha");
      expect(result.current[1].name).toBe("Alpha");
    });
  });

  it("logs error and returns empty array on failure", async () => {
    vi.spyOn(mockDb.players, "toArray").mockRejectedValue(
      new Error("Dexie Error"),
    );

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch players:",
        expect.any(Error),
      );
    });
  });
});
