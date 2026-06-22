import { renderHook, act, waitFor } from "../../../test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { usePlayersData } from "./usePlayersData";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("usePlayersData", () => {
  const mockShowSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("filters players by active tab and search term", async () => {
    await mockDb.players.bulkPut([
      { id: "p1", name: "LeBron James", isArchived: 0, synced: 1 },
      { id: "p2", name: "Stephen Curry", isArchived: 0, synced: 1 },
      { id: "p3", name: "Kevin Durant", isArchived: 1, synced: 1 },
    ]);

    const { result, rerender } = renderHook(
      ({ searchTerm, activeTab }: { searchTerm: string; activeTab: "active" | "archived" }) =>
        usePlayersData({ searchTerm, activeTab, showSnackbar: mockShowSnackbar }),
      {
        initialProps: { searchTerm: "", activeTab: "active" as const },
      }
    );

    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(2);
    });

    rerender({ searchTerm: "LeBron", activeTab: "active" });
    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(1);
      expect(result.current.playersWithStats[0].name).toBe("LeBron James");
    });

    rerender({ searchTerm: "", activeTab: "archived" });
    await waitFor(() => {
      expect(result.current.playersWithStats).toHaveLength(1);
      expect(result.current.playersWithStats[0].name).toBe("Kevin Durant");
    });
  });

  it("handles restoring a player", async () => {
    await mockDb.players.add({ id: "p1", name: "LeBron", isArchived: 1, synced: 1 });
    const { result } = renderHook(() =>
      usePlayersData({ searchTerm: "", activeTab: "archived", showSnackbar: mockShowSnackbar })
    );

    await act(async () => {
      await result.current.handleRestorePlayer("p1");
    });

    const player = await mockDb.players.get("p1");
    expect(player?.isArchived).toBe(0);
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(mockShowSnackbar).toHaveBeenCalledWith(
      "Player restored to active roster",
      "success"
    );
  });

  it("handles toggling star status", async () => {
    await mockDb.players.add({ id: "p1", name: "LeBron", isStar: 0, synced: 1 });
    const { result } = renderHook(() =>
      usePlayersData({ searchTerm: "", activeTab: "active", showSnackbar: mockShowSnackbar })
    );

    const mockEvent = { stopPropagation: vi.fn() } as any;
    await act(async () => {
      await result.current.handleToggleStar(mockEvent, "p1", 0);
    });

    const player = await mockDb.players.get("p1");
    expect(player?.isStar).toBe(1);
    expect(syncService.pushUpdates).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it("sorts starred players first and then by name", async () => {
    await mockDb.players.bulkPut([
      { id: "p1", name: "Zion", isStar: 0, synced: 1 },
      { id: "p2", name: "Anthony", isStar: 1, synced: 1 },
      { id: "p3", name: "Beal", isStar: 0, synced: 1 },
    ]);

    const { result } = renderHook(() =>
      usePlayersData({ searchTerm: "", activeTab: "active", showSnackbar: mockShowSnackbar })
    );

    await waitFor(() => {
      const names = result.current.playersWithStats.map(p => p.name);
      expect(names).toEqual(["Anthony", "Beal", "Zion"]);
    });
  });
});
