import { renderHook, act } from "../../../test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useTeamsData } from "./useTeamsData";
import { mockDb } from "../../../dbMock";
import { syncService } from "../../../utils/syncService";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("useTeamsData", () => {
  const mockShowSnackbar = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("handles toggling default team", async () => {
    await mockDb.teams.bulkPut([
      { id: "t1", name: "Team 1", isFavorite: 1, synced: 1 },
      { id: "t2", name: "Team 2", isFavorite: 0, synced: 1 },
    ]);

    const { result } = renderHook(() =>
      useTeamsData({
        teams: [{ id: "t2" } as any],
        showSnackbar: mockShowSnackbar,
      }),
    );

    const mockEvent = { stopPropagation: vi.fn() } as any;

    await act(async () => {
      await result.current.handleToggleDefault("t2", 0, mockEvent);
    });

    const t1 = await mockDb.teams.get("t1");
    const t2 = await mockDb.teams.get("t2");
    expect(t1?.isFavorite).toBe(0);
    expect(t2?.isFavorite).toBe(1);
    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("removes favorite status if already default", async () => {
    await mockDb.teams.add({
      id: "t1",
      name: "Team 1",
      isFavorite: 1,
      synced: 1,
    });
    const { result } = renderHook(() =>
      useTeamsData({
        teams: [{ id: "t1" } as any],
        showSnackbar: mockShowSnackbar,
      }),
    );

    const mockEvent = { stopPropagation: vi.fn() } as any;

    await act(async () => {
      await result.current.handleToggleDefault("t1", 1, mockEvent);
    });

    const t1 = await mockDb.teams.get("t1");
    expect(t1?.isFavorite).toBe(0);
  });
});
