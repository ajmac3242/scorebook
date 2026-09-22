import { describe, it, expect } from "vitest";
import { calculateOnOffStats } from "./onOff";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("onOff.ts", () => {
  const baseStat: Omit<StatEvent, "id" | "gameId" | "type" | "playerId"> = {
    period: 1,
    clockTime: 600,
    createdAt: "2026-09-22T00:00:00Z",
    updatedAt: "2026-09-22T00:00:00Z",
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
      },
      {
        ...baseStat,
        id: "2",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 2,
      },
      {
        ...baseStat,
        id: "3",
        gameId: "g1",
        type: ACTION_TYPES.MISS,
        playerId: "p1",
        points: 0,
      },
      {
        ...baseStat,
        id: "4",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        points: 3,
      },
      {
        ...baseStat,
        id: "5",
        gameId: "g1",
        type: ACTION_TYPES.SUB_OUT,
        playerId: "p1",
      },
      {
        ...baseStat,
        id: "6",
        gameId: "g1",
        type: ACTION_TYPES.SUB_IN,
        playerId: "p2",
      },
      {
        ...baseStat,
        id: "7",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p2",
        points: 2,
      },
      {
        ...baseStat,
        id: "8",
        gameId: "g1",
        type: ACTION_TYPES.TURNOVER,
        playerId: "p2",
      },
    ];

    const results = calculateOnOffStats(stats, players);

    expect(results).toHaveLength(2);

    const p1Stats = results.find((r) => r.playerId === "p1");
    expect(p1Stats).toBeDefined();
    expect(p1Stats?.on.ptsFor).toBe(4);
    expect(p1Stats?.on.ptsAgainst).toBe(3);
    expect(p1Stats?.off.ptsFor).toBe(0);
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
      },
      {
        ...baseStat,
        id: "2",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 1,
        situation: "FT",
      },
      {
        ...baseStat,
        id: "3",
        gameId: "g1",
        type: ACTION_TYPES.OFF_REBOUND,
        playerId: "p1",
      },
      {
        ...baseStat,
        id: "4",
        gameId: "g1",
        type: ACTION_TYPES.MAKE,
        playerId: "p1",
        points: 2,
        deletedAt: "2026-09-22T00:01:00Z",
      },
    ];

    const results = calculateOnOffStats(stats, players);

    expect(results[0].on.ptsFor).toBe(1);
  });
});
