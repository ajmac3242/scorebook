import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "../../../test-utils";
import { usePlayersData } from "./usePlayersData";
import { mockDb } from "../../../dbMock";
import { act } from "react";

describe("usePlayersData", () => {
  const showSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    showSnackbar.mockClear();
    (window as any).isTesting = true;
  });

  it("filters and sorts players with stats", async () => {
    mockDb.seed({
      players: [
        { id: "p1", name: "Zeb", isStar: 0, isArchived: 0 },
        { id: "p2", name: "Ace", isStar: 1, isArchived: 0 },
      ],
      stats: [
        { id: "s1", playerId: "p1", type: "MAKE", points: 2, gameId: "g1" },
        { id: "s2", playerId: "p2", type: "MAKE", points: 3, gameId: "g1" },
      ],
    });

    const { result } = renderHook(() =>
      usePlayersData({
        searchTerm: "",
        activeTab: "active",
        showSnackbar,
      }),
    );

    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(2);
    });

    // Ace should be first because he is a star, even though Zeb is last alphabetically
    expect(result.current.playersWithStats[0].name).toBe("Ace");
    expect(result.current.playersWithStats[1].name).toBe("Zeb");

    // Check stats (averages)
    expect(result.current.playersWithStats[0].ppg).toBe(3);
    expect(result.current.playersWithStats[1].ppg).toBe(2);
  });

  it("handles searching", async () => {
    mockDb.seed({
      players: [
        { id: "p1", name: "LeBron", isArchived: 0 },
        { id: "p2", name: "Curry", isArchived: 0 },
      ],
      stats: [],
    });

    const { result } = renderHook(() =>
      usePlayersData({
        searchTerm: "Le",
        activeTab: "active",
        showSnackbar,
      }),
    );

    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(1);
    });
    expect(result.current.playersWithStats[0].name).toBe("LeBron");
  });

  it("handles archived tab", async () => {
    mockDb.seed({
      players: [
        { id: "p1", name: "Active", isArchived: 0 },
        { id: "p2", name: "Archived", isArchived: 1 },
      ],
      stats: [],
    });

    const { result } = renderHook(() =>
      usePlayersData({
        searchTerm: "",
        activeTab: "archived",
        showSnackbar,
      }),
    );

    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(1);
    });
    expect(result.current.playersWithStats[0].name).toBe("Archived");
  });

  it("restores an archived player", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Archived", isArchived: 1 }],
      stats: [],
    });

    const { result } = renderHook(() =>
      usePlayersData({
        searchTerm: "",
        activeTab: "archived",
        showSnackbar,
      }),
    );

    await act(async () => {
      await result.current.handleRestorePlayer("p1");
    });

    expect(mockDb.players.update).toHaveBeenCalledWith("p1", {
      isArchived: 0,
      synced: 0,
    });
    expect(showSnackbar).toHaveBeenCalledWith(
      "Player restored to active roster",
      "success",
    );
  });

  it("toggles star status", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Player", isStar: 0, isArchived: 0 }],
      stats: [],
    });

    const { result } = renderHook(() =>
      usePlayersData({
        searchTerm: "",
        activeTab: "active",
        showSnackbar,
      }),
    );

    const mockEvent = { stopPropagation: vi.fn() } as any;
    await act(async () => {
      await result.current.handleToggleStar(mockEvent, "p1", 0);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockDb.players.update).toHaveBeenCalledWith("p1", {
      isStar: 1,
      synced: 0,
    });
  });
});
