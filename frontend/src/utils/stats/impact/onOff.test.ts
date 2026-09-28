import { describe, it, expect } from "vitest";
import { calculateOnOffStats } from "./onOff";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("onOff.ts", () => {
  const baseStat: Omit<StatEvent, "id" | "gameId" | "type" | "playerId"> = {
    period: 1,
    clockTime: 600,
    timestamp: "2026-09-22T00:00:00Z",
    synced: 1,
  };

  it("calculates On/Off offensive, defensive, net ratings, and differentials", () => {
    const players = [
      { id: "p1", name: "Player One" },
      { id: "p2", name: "Player Two" },
    ];

    const stats: StatEvent[] = [
      {
        ...baseStat,
        id: "1",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:01Z",
      },
      {
        ...baseStat,
        id: "2",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 2,
        timestamp: "2026-09-22T00:00:02Z",
      },
      {
        ...baseStat,
        id: "3",
        gameId: "g1",
        type: ACTION_TYPES.MISS,
        playerId: "p1",
        points: 0,
        timestamp: "2026-09-22T00:00:03Z",
      },
      {
        ...baseStat,
        id: "4",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 3,
        timestamp: "2026-09-22T00:00:04Z",
      },
      {
        ...baseStat,
        id: "5",
        gameId: "g1",
        type: ACTION_TYPES.SUB_OUT,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:05Z",
      },
      {
        ...baseStat,
        id: "6",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p2",
        timestamp: "2026-09-22T00:00:06Z",
      },
      {
        ...baseStat,
        id: "7",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p2",
        points: 2,
        timestamp: "2026-09-22T00:00:07Z",
      },
      {
        ...baseStat,
        id: "8",
        gameId: "g1",
        type: ACTION_TYPES.TURNOVER,
        playerId: "p2",
        timestamp: "2026-09-22T00:00:08Z",
      },
    ];

    const results = calculateOnOffStats(stats, players);

    expect(results).toHaveLength(2);

    const p1Stats = results.find((r) => r.playerId === "p1");
    expect(p1Stats).toBeDefined();
    expect(p1Stats?.on.ptsFor).toBe(2);
    expect(p1Stats?.on.ptsAgainst).toBe(3);
    expect(p1Stats?.off.ptsFor).toBe(2);
    expect(p1Stats?.off.ptsAgainst).toBe(0);
    expect(typeof p1Stats?.differential).toBe("string");
  });

  it("handles free throws, offensive rebounds, and soft-deleted events correctly", () => {
    const players = [{ id: "p1", name: "Player One" }];

    const stats: StatEvent[] = [
      {
        ...baseStat,
        id: "1",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:01Z",
      },
      {
        ...baseStat,
        id: "2",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 1,
        situation: "FT",
        timestamp: "2026-09-22T00:00:02Z",
      },
      {
        ...baseStat,
        id: "3",
        gameId: "g1",
        type: ACTION_TYPES.OFF_REBOUND,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:03Z",
      },
      {
        ...baseStat,
        id: "4",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 2,
        timestamp: "2026-09-22T00:00:04Z",
        deletedAt: "2026-09-22T00:01:00Z",
      },
    ];

    const results = calculateOnOffStats(stats, players);

    expect(results[0].on.ptsFor).toBe(1);
  });

  it("handles opponent misses, free throws, turnovers, and offensive rebounds while player is on vs off court", () => {
    const players = [
      { id: "p1", name: "Player One" },
      { id: "p2", name: "Player Two" },
    ];

    const stats: StatEvent[] = [
      {
        ...baseStat,
        id: "1",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:01Z",
      },
      // Opponent missed field goal
      {
        ...baseStat,
        id: "2",
        gameId: "g1",
        type: ACTION_TYPES.MISS,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 0,
        timestamp: "2026-09-22T00:00:02Z",
      },
      // Opponent free throw make & miss
      {
        ...baseStat,
        id: "3",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 1,
        situation: "FT",
        timestamp: "2026-09-22T00:00:03Z",
      },
      {
        ...baseStat,
        id: "4",
        gameId: "g1",
        type: ACTION_TYPES.MISS,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 0,
        situation: "FT",
        timestamp: "2026-09-22T00:00:04Z",
      },
      // Opponent turnover and offensive rebound
      {
        ...baseStat,
        id: "5",
        gameId: "g1",
        type: ACTION_TYPES.TURNOVER,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        timestamp: "2026-09-22T00:00:05Z",
      },
      {
        ...baseStat,
        id: "6",
        gameId: "g1",
        type: ACTION_TYPES.OFF_REBOUND,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        timestamp: "2026-09-22T00:00:06Z",
      },
      // Sub out p1, sub in p2
      {
        ...baseStat,
        id: "7",
        gameId: "g1",
        type: ACTION_TYPES.SUB_OUT,
        playerId: "p1",
        timestamp: "2026-09-22T00:00:07Z",
      },
      {
        ...baseStat,
        id: "8",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p2",
        timestamp: "2026-09-22T00:00:08Z",
      },
      // Opponent actions while p1 is off (and p2 is on)
      {
        ...baseStat,
        id: "9",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 2,
        timestamp: "2026-09-22T00:00:09Z",
      },
    ];

    const results = calculateOnOffStats(stats, players);
    const p1Stats = results.find((r) => r.playerId === "p1");
    expect(p1Stats?.on.ptsAgainst).toBe(1);
    expect(p1Stats?.off.ptsAgainst).toBe(2);

    const p2Stats = results.find((r) => r.playerId === "p2");
    expect(p2Stats?.on.ptsAgainst).toBe(2);
    expect(p2Stats?.off.ptsAgainst).toBe(1);
  });
});
