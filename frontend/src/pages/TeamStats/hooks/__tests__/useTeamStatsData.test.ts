import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "../../../../test-utils";
import { useTeamStatsData } from "../useTeamStatsData";
import { mockDb } from "../../../../dbMock";
import { db } from "../../../../db";

describe("useTeamStatsData", () => {
  const teamId = "team-1";

  beforeEach(async () => {
    mockDb.reset();
    await db.teams.add({
      id: teamId,
      name: "Home Team",
      periodType: "QUARTERS",
    });

    await db.players.bulkPut([
      { id: "p1", name: "Player 1" },
      { id: "p2", name: "Player 2" },
    ]);

    await db.teamPlayers.bulkPut([
      { teamId, playerId: "p1", jerseyNumber: "10" },
      { teamId, playerId: "p2", jerseyNumber: "05" },
    ]);

    await db.games.bulkPut([
      { id: "g1", teamId, opponent: "Opponent A", date: "2026-06-01", time: "10:00", completed: 1, location: "Home" },
      { id: "g2", teamId, opponent: "Opponent B", date: "2026-06-02", time: "11:00", completed: 1, location: "Away" },
      { id: "g3", teamId, opponent: "Opponent C", date: "2026-06-03", time: "09:00", completed: 0, location: "Home" },
    ]);
  });

  it("filters games based on gameCountFilter", async () => {
    const { result, rerender } = renderHook(({ gameCountFilter }) =>
      useTeamStatsData({
        teamId,
        gameCountFilter,
        scheduleView: "all",
        statView: "total",
      }),
      { initialProps: { gameCountFilter: "all" } }
    );

    await waitFor(() => expect(result.current.team).toBeDefined());
    expect(result.current.gameIds).toHaveLength(2); // g1, g2 are completed

    rerender({ gameCountFilter: "1" });
    // Sorted by date desc: g2 is newer than g1
    expect(result.current.gameIds).toHaveLength(1);
    expect(result.current.gameIds[0]).toBe("g2");
  });

  it("sorts roster based on jersey number", async () => {
    const { result } = renderHook(() =>
      useTeamStatsData({
        teamId,
        gameCountFilter: "all",
        scheduleView: "all",
        statView: "total",
      })
    );

    await waitFor(() => expect(result.current.sortedRoster).toHaveLength(2));

    // Player 2 has jersey "05", Player 1 has jersey "10"
    expect(result.current.sortedRoster[0].name).toBe("Player 2");
    expect(result.current.sortedRoster[1].name).toBe("Player 1");
  });

  it("sorts schedule based on date and time", async () => {
    const { result } = renderHook(() =>
      useTeamStatsData({
        teamId,
        gameCountFilter: "all",
        scheduleView: "all",
        statView: "total",
      })
    );

    await waitFor(() => expect(result.current.filteredSchedule).toHaveLength(3));

    // Schedule should be sorted by date/time ascending
    expect(result.current.filteredSchedule[0].id).toBe("g1"); // 2026-06-01 10:00
    expect(result.current.filteredSchedule[1].id).toBe("g2"); // 2026-06-02 11:00
    expect(result.current.filteredSchedule[2].id).toBe("g3"); // 2026-06-03 09:00
  });

  it("calculates time left for deleted teams", async () => {
    const deletedTeamId = "team-deleted";
    const now = new Date("2026-06-17T10:00:00Z");

    await db.teams.add({
      id: deletedTeamId,
      name: "Deleted Team",
      periodType: "QUARTERS",
      deletedAt: now.toISOString(),
    });

    const { result } = renderHook(() =>
      useTeamStatsData({
        teamId: deletedTeamId,
        gameCountFilter: "all",
        scheduleView: "all",
        statView: "total",
      })
    );

    await waitFor(() => expect(result.current.team).toBeDefined());

    // Since we are not using fake timers here, it will be relative to real now.
    // But deletedAt was set to 2026-06-17. If real now is also 2026-06-17, it might work.
    // Wait, let's use a date in the far future to ensure it doesn't expire.
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 25); // 25 hours from now
    await db.teams.update(deletedTeamId, { deletedAt: farFuture.toISOString() });

    await waitFor(() => expect(result.current.timeLeft).not.toBe(""), { timeout: 2000 });
    expect(result.current.timeLeft).toMatch(/\d+h \d+m/);
  });
});
