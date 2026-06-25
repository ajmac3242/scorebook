import { renderHook, act } from "../../../test-utils";
import { useGameActions } from "./useGameActions";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { logger } from "../../../utils/logger";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue("data:image/png;base64,abc"),
    width: 100,
    height: 100
  })
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(function() {
    return {
      internal: {
        pageSize: {
          getWidth: vi.fn().mockReturnValue(210),
          getHeight: vi.fn().mockReturnValue(297)
        }
      },
      addImage: vi.fn(),
      save: vi.fn()
    };
  })
}));

describe("useGameActions", () => {
  const gameId = "g1";
  const mockGame: any = {
    id: gameId,
    teamId: "t1",
    opponent: "Bulls",
    date: "2023-01-01",
    location: "Home",
    synced: 1
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles handleUpdateGame", async () => {
    await mockDb.games.add(mockGame);
    const { result } = renderHook(() => useGameActions({ game: mockGame, gameId, teamName: "Lakers" }));

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
    const { result } = renderHook(() => useGameActions({ game: mockGame, gameId, teamName: "Lakers" }));

    await act(async () => {
      await result.current.handleDeleteGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.deletedAt).toBeDefined();
  });

  it("handles handleRestoreGame", async () => {
    const deletedGame = { ...mockGame, deletedAt: "2023-01-01" };
    await mockDb.games.add(deletedGame);
    const { result } = renderHook(() => useGameActions({ game: deletedGame, gameId, teamName: "Lakers" }));

    await act(async () => {
      await result.current.handleRestoreGame();
    });

    const game = await mockDb.games.get(gameId);
    expect(game?.deletedAt).toBeUndefined();
  });

  it("handles handleExportPDF", async () => {
    const mockElement = document.createElement("div");
    mockElement.id = "game-stats-container";
    document.body.appendChild(mockElement);

    const { result } = renderHook(() => useGameActions({ game: mockGame, gameId, teamName: "Lakers" }));

    await act(async () => {
      await result.current.handleExportPDF();
    });

    expect(html2canvas).toHaveBeenCalled();
    expect(jsPDF).toHaveBeenCalled();

    document.body.removeChild(mockElement);
  });

  it("handles deletion timer", async () => {
    vi.useFakeTimers();
    const deletedAt = new Date().toISOString();
    const deletedGame = { ...mockGame, deletedAt };
    await mockDb.games.add(deletedGame);

    const { result } = renderHook(() => useGameActions({ game: deletedGame, gameId, teamName: "Lakers" }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBeDefined();

    vi.useRealTimers();
  });

  it("handles failure paths and logs errors", async () => {
    vi.spyOn(mockDb.games, "update").mockRejectedValue(new Error("DB Error"));
    const { result } = renderHook(() => useGameActions({ game: mockGame, gameId, teamName: "Lakers" }));

    await act(async () => {
      await result.current.handleDeleteGame();
    });
    expect(logger.error).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleRestoreGame();
    });
    expect(logger.error).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleUpdateGame();
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
