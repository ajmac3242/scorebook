import { renderHook, waitFor } from "@testing-library/react";
import { useRosterAggregates } from "./useRosterAggregates";
import { mockDb } from "../dbMock";
import { describe, it, expect, beforeEach } from "vitest";

describe("useRosterAggregates", () => {
  beforeEach(() => {
    mockDb.reset();
    (window as any).isTesting = true;
  });

  it("returns empty array if no teamId", async () => {
    const { result } = renderHook(() => useRosterAggregates(null));
    expect(result.current).toEqual([]);
  });

  it("calculates aggregates for team roster", async () => {
    const teamId = "t1";
    await mockDb.teams.add({ id: teamId, name: "Team 1" } as any);
    await mockDb.players.add({ id: "p1", name: "Player 1" } as any);
    await mockDb.teamPlayers.add({ teamId, playerId: "p1", jerseyNumber: "10" } as any);
    await mockDb.games.add({ id: "g1", teamId, completed: 1, date: "2023-01-01" } as any);
    await mockDb.stats.add({ id: "s1", gameId: "g1", playerId: "p1", type: "MAKE", points: 2, timestamp: "1", period: 1 } as any);

    const { result } = renderHook(() => useRosterAggregates(teamId));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    expect(result.current[0].playerId).toBe("p1");
    expect(result.current[0].points).toBe(2);
  });

  it("filters out archived or deleted players", async () => {
    const teamId = "t1";
    await mockDb.teams.add({ id: teamId, name: "Team 1" } as any);
    await mockDb.players.add({ id: "p1", name: "P1", isArchived: 1 } as any);
    await mockDb.players.add({ id: "p2", name: "P2", deletedAt: "2023-01-01" } as any);
    await mockDb.teamPlayers.add({ teamId, playerId: "p1" } as any);
    await mockDb.teamPlayers.add({ teamId, playerId: "p2" } as any);

    const { result } = renderHook(() => useRosterAggregates(teamId));

    // Both are filtered out
    await waitFor(() => {
       expect(result.current).toEqual([]);
    });
  });
});
