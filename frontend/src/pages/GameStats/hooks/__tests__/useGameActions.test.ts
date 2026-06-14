import { renderHook, act } from "../../../../test-utils";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameActions } from "../useGameActions";
import { mockDb } from "../../../../dbMock";
import { syncService } from "../../../../utils/syncService";
import { logger } from "../../../../utils/logger";

vi.mock("../../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock html2canvas and jspdf
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
    width: 100,
    height: 100,
  }),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: vi.fn().mockReturnValue(210),
      },
    },
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

describe("useGameActions", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    game: { id: "game-1", opponent: "Opponent", date: "2024-01-01" } as any,
    gameId: "game-1",
    teamName: "My Team",
  };

  it("initializes edit state from game prop", () => {
    const { result } = renderHook(() => useGameActions(defaultProps));
    expect(result.current.editOpponent).toBe("Opponent");
    expect(result.current.editDate).toBe("2024-01-01");
  });

  it("handles game deletion", async () => {
    await act(async () => {
      await mockDb.games.add(defaultProps.game);
    });

    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteGame();
    });

    const updatedGame = await mockDb.games.get("game-1");
    expect(updatedGame?.deletedAt).toBeDefined();
    expect(updatedGame?.synced).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(result.current.isDeleteDialogOpen).toBe(false);
  });

  it("handles game restoration", async () => {
    const deletedGame = { ...defaultProps.game, deletedAt: new Date().toISOString() };
    await act(async () => {
      await mockDb.games.add(deletedGame);
    });

    const { result } = renderHook(() => useGameActions({ ...defaultProps, game: deletedGame }));

    await act(async () => {
      await result.current.handleRestoreGame();
    });

    const updatedGame = await mockDb.games.get("game-1");
    expect(updatedGame?.deletedAt).toBeUndefined();
    expect(updatedGame?.synced).toBe(0);
  });

  it("handles game update", async () => {
    await act(async () => {
      await mockDb.games.add(defaultProps.game);
    });

    const { result } = renderHook(() => useGameActions(defaultProps));

    act(() => {
      result.current.setEditOpponent("New Opponent");
    });

    await act(async () => {
      await result.current.handleUpdateGame();
    });

    const updatedGame = await mockDb.games.get("game-1");
    expect(updatedGame?.opponent).toBe("New Opponent");
    expect(updatedGame?.synced).toBe(0);
    expect(result.current.openEditDialog).toBe(false);
  });

  it("calculates time left for deleted game", () => {
    const now = new Date("2024-01-01T12:00:00Z");
    vi.setSystemTime(now);
    const deletedAt = now.toISOString();
    const game = { ...defaultProps.game, deletedAt };

    const { result } = renderHook(() => useGameActions({ ...defaultProps, game }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // 24 hours from deletedAt
    expect(result.current.timeLeft).toBe("23h 59m");
  });

  it("handles PDF export", async () => {
    // Mock getElementById
    const mockElement = document.createElement("div");
    mockElement.id = "game-stats-container";
    document.body.appendChild(mockElement);

    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleExportPDF();
    });

    expect(result.current.isExporting).toBe(false);

    document.body.removeChild(mockElement);
  });

  it("logs error on delete failure", async () => {
    vi.spyOn(mockDb.games, "update").mockRejectedValue(new Error("Update failed"));
    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteGame();
    });

    expect(logger.error).toHaveBeenCalledWith("Failed to delete game:", expect.any(Error));
  });
});
