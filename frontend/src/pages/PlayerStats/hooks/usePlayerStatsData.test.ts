import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "../../../test-utils";
import { usePlayerStatsData } from "./usePlayerStatsData";
import { mockDb } from "../../../dbMock";

describe("usePlayerStatsData", () => {
  beforeEach(() => {
    mockDb.reset();
    (window as any).isTesting = true;
  });

  it("fetches player and team data correctly", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      teams: [{ id: "t1", name: "Varsity", primaryColor: "#ff0000" }],
      teamPlayers: [
        { id: "tp1", playerId: "p1", teamId: "t1", jerseyNumber: "12" },
      ],
      games: [
        { id: "g1", teamId: "t1", opponent: "Opponent", date: "2024-01-01" },
      ],
      stats: [
        { id: "s1", playerId: "p1", gameId: "g1", type: "MAKE", points: 2 },
      ],
    });

    const { result } = renderHook(() =>
      usePlayerStatsData({ playerId: "p1", teamIdParam: "t1" }),
    );

    await waitFor(() => {
      expect(result.current.player).toBeDefined();
    });

    expect(result.current.player?.name).toBe("Jacob");
    expect(result.current.currentTeam?.name).toBe("Varsity");
    expect(result.current.jerseyNumber).toBe("12");
    expect(result.current.games).toHaveLength(1);
    expect(result.current.allStats).toHaveLength(1);
    expect(result.current.accent).toBe("#5c8f61");
  });

  it("handles missing playerId gracefully", async () => {
    const { result } = renderHook(() =>
      usePlayerStatsData({ playerId: undefined, teamIdParam: null }),
    );

    await waitFor(() => {
      expect(result.current.player).toBeUndefined();
    });

    expect(result.current.availableTeams).toHaveLength(0);
    expect(result.current.games).toHaveLength(0);
  });

  it("calculates accent color from team if player has none", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob" }],
      teams: [{ id: "t1", name: "Varsity", primaryColor: "#0000ff" }],
      teamPlayers: [{ id: "tp1", playerId: "p1", teamId: "t1" }],
    });

    const { result } = renderHook(() =>
      usePlayerStatsData({ playerId: "p1", teamIdParam: "t1" }),
    );

    await waitFor(() => {
      expect(result.current.accent).toBe("#0000ff");
    });
  });

  it("detects deleted players", async () => {
    const deletedAt = new Date().toISOString();
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", deletedAt }],
    });

    const { result } = renderHook(() =>
      usePlayerStatsData({ playerId: "p1", teamIdParam: null }),
    );

    await waitFor(() => {
      expect(result.current.isDeleted).toBe(true);
    });
    expect(result.current.timeLeft).toBeDefined();
  });
});
