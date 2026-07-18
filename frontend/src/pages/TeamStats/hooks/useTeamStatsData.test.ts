import { renderHook, waitFor, act } from "../../../test-utils";
import { useTeamStatsData } from "./useTeamStatsData";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import dayjs from "dayjs";

describe("useTeamStatsData", () => {
  beforeEach(() => {
    mockDb.reset();
    (window as any).isTesting = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    teamId: "t1",
    gameCountFilter: "all",
    scheduleView: "all" as const,
    statView: "total" as const,
  };

  it("loads basic team data", async () => {
    await mockDb.teams.add({ id: "t1", name: "Team 1" } as any);
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.team?.name).toBe("Team 1"));
  });

  it("calculates aggregates correctly", async () => {
    await mockDb.teams.add({ id: "t1", name: "Team 1" } as any);
    await mockDb.players.add({ id: "p1", name: "Player 1" } as any);
    await mockDb.teamPlayers.add({
      teamId: "t1",
      playerId: "p1",
      jerseyNumber: "10",
    } as any);
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      completed: 1,
      date: "2023-01-01",
    } as any);
    await mockDb.stats.add({
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: "MAKE",
      points: 2,
      timestamp: "1",
      period: 1,
    } as any);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.teamAggregates.ppg).toBe("2.0"));
    expect(result.current.aggregatedStats).toHaveLength(1);
  });

  it("handles deleted state and timeLeft interval timer", async () => {
    vi.useFakeTimers();

    // team deleted 2 hours ago => 22 hours remaining
    const deletedAt = dayjs().subtract(2, "hour").toISOString();

    await mockDb.teams.add({
      id: "t1",
      name: "Deleted Team",
      deletedAt,
    } as any);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));

    // Let Dexie and React initial state finish asynchronously under fake timers
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.isDeleted).toBe(true);

    // Advance 1 second to fire the interval
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toContain("21h 59m");
  });

  it("sorts roster handling empty, invalid, and 00 jersey number cases", async () => {
    await mockDb.teams.add({ id: "t1", name: "T" } as any);

    await mockDb.players.add({ id: "p1", name: "Player 00" } as any);
    await mockDb.players.add({ id: "p2", name: "Player 5" } as any);
    await mockDb.players.add({ id: "p3", name: "Player Invalid" } as any);
    await mockDb.players.add({ id: "p4", name: "Player Empty" } as any);

    await mockDb.teamPlayers.add({
      teamId: "t1",
      playerId: "p1",
      jerseyNumber: "00",
    } as any);
    await mockDb.teamPlayers.add({
      teamId: "t1",
      playerId: "p2",
      jerseyNumber: "5",
    } as any);
    await mockDb.teamPlayers.add({
      teamId: "t1",
      playerId: "p3",
      jerseyNumber: "AB", // Non-numeric
    } as any);
    await mockDb.teamPlayers.add({
      teamId: "t1",
      playerId: "p4",
      jerseyNumber: "", // Empty
    } as any);

    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.sortedRoster).toHaveLength(4));

    // Expected order:
    // 1. "00" (sortKey = -1)
    // 2. "5" (sortKey = 5)
    // 3. "AB" (sortKey = 999)
    // 4. "" (sortKey = 1000)
    const sorted = result.current.sortedRoster;
    expect(sorted[0].name).toBe("Player 00");
    expect(sorted[1].name).toBe("Player 5");
    expect(sorted[2].name).toBe("Player Invalid");
    expect(sorted[3].name).toBe("Player Empty");
  });

  it("filters game count and sorts schedule with identical date/times", async () => {
    await mockDb.teams.add({ id: "t1", name: "T" } as any);

    // Game 1: Dec 20, 2023, 20:00
    await mockDb.games.add({
      id: "g1",
      teamId: "t1",
      completed: 1,
      date: "2023-12-20",
      time: "20:00",
    } as any);

    // Game 2: Dec 21, 2023, 19:00
    await mockDb.games.add({
      id: "g2",
      teamId: "t1",
      completed: 1,
      date: "2023-12-21",
      time: "19:00",
    } as any);

    // Game 3: Dec 21, 2023, 19:00 (identical datetime)
    await mockDb.games.add({
      id: "g3",
      teamId: "t1",
      completed: 1,
      date: "2023-12-21",
      time: "19:00",
    } as any);

    // Retrieve stats with a limited game count of 2
    const { result } = renderHook(() =>
      useTeamStatsData({
        ...defaultProps,
        gameCountFilter: "2",
      }),
    );

    await waitFor(() => {
      // Completed games are sorted descending in gameIds (g2, g3 are later than g1)
      expect(result.current.gameIds).toHaveLength(2);
      expect(result.current.gameIds).toContain("g2");
      expect(result.current.gameIds).toContain("g3");
      expect(result.current.gameIds).not.toContain("g1");
    });

    // Schedule: sorted ascending
    const schedule = result.current.filteredSchedule;
    expect(schedule[0].id).toBe("g1"); // Dec 20 comes first
  });

  it("handles location fetch error", async () => {
    const original = mockDb.games.toArray;
    mockDb.games.toArray = vi.fn().mockRejectedValue(new Error("err"));
    const { result } = renderHook(() => useTeamStatsData(defaultProps));
    await waitFor(() => expect(result.current.allRecentLocations).toEqual([]));
    mockDb.games.toArray = original;
  });
});
