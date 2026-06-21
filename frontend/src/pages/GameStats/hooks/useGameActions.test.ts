import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useGameActions } from "./useGameActions";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock html2canvas and jspdf
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,123",
    width: 100,
    height: 100,
  }),
}));

vi.mock("jspdf", () => {
  return {
    default: function() {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
        },
        addImage: vi.fn(),
        save: vi.fn(),
      };
    },
  };
});

describe("useGameActions", () => {
  const mockGame = {
    id: "game1",
    teamId: "team1",
    opponent: "Lakers",
    date: "2024-06-21",
    time: "19:00",
    location: "Staples Center",
  } as any;

  const defaultProps = {
    game: mockGame,
    gameId: "game1",
    teamName: "Warriors",
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("initializes state from game", () => {
    const { result } = renderHook(() => useGameActions(defaultProps));

    expect(result.current.editOpponent).toBe("Lakers");
    expect(result.current.editLocation).toBe("Staples Center");
  });

  it("updates game details successfully", async () => {
    await mockDb.games.add(mockGame);
    const { result } = renderHook(() => useGameActions(defaultProps));

    act(() => {
      result.current.setEditOpponent("Clippers");
    });

    await act(async () => {
      await result.current.handleUpdateGame();
    });

    const updated = await mockDb.games.get("game1");
    expect(updated?.opponent).toBe("Clippers");
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(result.current.openEditDialog).toBe(false);
  });

  it("deletes a game", async () => {
    await mockDb.games.add(mockGame);
    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleDeleteGame();
    });

    const deleted = await mockDb.games.get("game1");
    expect(deleted?.deletedAt).toBeDefined();
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(result.current.isDeleteDialogOpen).toBe(false);
  });

  it("restores a deleted game", async () => {
    await mockDb.games.add({ ...mockGame, deletedAt: "2024-01-01" });
    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleRestoreGame();
    });

    const restored = await mockDb.games.get("game1");
    expect(restored?.deletedAt).toBeUndefined();
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("handles PDF export", async () => {
    // Create a dummy element for html2canvas
    const div = document.createElement("div");
    div.id = "game-stats-container";
    document.body.appendChild(div);

    const { result } = renderHook(() => useGameActions(defaultProps));

    await act(async () => {
      await result.current.handleExportPDF();
    });

    expect(result.current.isExporting).toBe(false);
    // Our mocks should have been called
    document.body.removeChild(div);
  });

  it("calculates time left for deletion", async () => {
    vi.useFakeTimers();
    const now = new Date();
    const deletedAt = now.toISOString();
    const gameWithDeletedAt = { ...mockGame, deletedAt };

    const { result } = renderHook(() => useGameActions({ ...defaultProps, game: gameWithDeletedAt }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe("23h 59m");

    vi.useRealTimers();
  });
});
