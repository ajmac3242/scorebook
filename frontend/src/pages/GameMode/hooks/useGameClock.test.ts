import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameClock } from "./useGameClock";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../db", () => ({
  db: {
    games: {
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("GameMode useGameClock", () => {
  const mockProps = {
    gameId: "game-1",
    period: 1,
    periodType: "QUARTERS",
    setPeriod: vi.fn(),
    setClockSeconds: vi.fn(),
    setIsClockRunning: vi.fn(),
    setIsClockEditDialogOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles edit clock correctly", async () => {
    const { result } = renderHook(() => useGameClock(mockProps));

    await act(async () => {
      await result.current.handleEditClock(8, 30);
    });

    expect(db.games.update).toHaveBeenCalledWith("game-1", {
      clockTime: 510,
      synced: 0,
    });
    expect(mockProps.setClockSeconds).toHaveBeenCalledWith(510);
    expect(mockProps.setIsClockEditDialogOpen).toHaveBeenCalledWith(false);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles next period correctly for QUARTERS", async () => {
    const { result } = renderHook(() => useGameClock(mockProps));

    await act(async () => {
      await result.current.handleNextPeriod();
    });

    expect(db.games.update).toHaveBeenCalledWith("game-1", {
      currentPeriod: 2,
      clockTime: 600,
      synced: 0,
    });
    expect(mockProps.setPeriod).toHaveBeenCalledWith(2);
    expect(mockProps.setClockSeconds).toHaveBeenCalledWith(600);
    expect(mockProps.setIsClockRunning).toHaveBeenCalledWith(false);
  });

  it("handles next period correctly for HALVES", async () => {
    const { result } = renderHook(() => useGameClock({ ...mockProps, periodType: "HALVES" }));

    await act(async () => {
      await result.current.handleNextPeriod();
    });

    expect(db.games.update).toHaveBeenCalledWith("game-1", {
      currentPeriod: 2,
      clockTime: 1200,
      synced: 0,
    });
  });

  it("does nothing if gameId is missing", async () => {
    const { result } = renderHook(() => useGameClock({ ...mockProps, gameId: null }));

    await act(async () => {
      await result.current.handleEditClock(10, 0);
    });
    expect(db.games.update).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleNextPeriod();
    });
    expect(db.games.update).not.toHaveBeenCalled();
  });
});
