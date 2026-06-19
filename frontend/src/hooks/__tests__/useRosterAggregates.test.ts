 
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useRosterAggregates } from "../useRosterAggregates";
import { mockDb } from "../../dbMock";
import { ACTION_TYPES } from "../../constants/stats";

describe("useRosterAggregates", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("returns empty array if no teamId provided", async () => {
    const { result } = renderHook(() => useRosterAggregates(null));
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it("calculates aggregates for players on a team", async () => {
    const teamId = "t1";
    const playerId = "p1";
    const gameId = "g1";

    await mockDb.teams.add({ id: teamId, name: "Team 1" } as any);
    await mockDb.players.add({ id: playerId, name: "Player 1" } as any);
    await mockDb.teamPlayers.add({ teamId, playerId } as any);
    await mockDb.games.add({ id: gameId, teamId, completed: 1 } as any);
    await mockDb.stats.add({
      id: "s1",
      gameId,
      playerId,
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      clockTime: 100,
    } as any);

    const { result } = renderHook(() => useRosterAggregates(teamId));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].playerId).toBe(playerId);
      expect(result.current[0].points).toBe(2);
    });
  });

  it("filters out archived or deleted players", async () => {
    const teamId = "t1";

    await act(async () => {
      await mockDb.players.bulkPut([
        { id: "p1", name: "Active" },
        { id: "p2", name: "Archived", isArchived: true },
        { id: "p3", name: "Deleted", deletedAt: new Date().toISOString() },
      ] as any);
      await mockDb.teamPlayers.bulkPut([
        { id: "tp1", teamId, playerId: "p1" },
        { id: "tp2", teamId, playerId: "p2" },
        { id: "tp3", teamId, playerId: "p3" },
      ] as any);
      await mockDb.games.add({ id: "g1", teamId, completed: 1 } as any);
      await mockDb.stats.bulkPut([
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 100,
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 100,
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 1,
          clockTime: 100,
        },
      ] as any);
    });

    const { result } = renderHook(() => useRosterAggregates(teamId));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].playerId).toBe("p1");
    });
  });
});
