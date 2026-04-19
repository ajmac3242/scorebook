import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates } from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { Player, StatEvent } from "../db";

describe("Scout Repro: 3PT Stats", () => {
  it("should track 3PT attempts and percentage", () => {
    const players: Player[] = [{ id: "p1", name: "Player 1" }];
    const stats: StatEvent[] = [
      {
        id: "1",
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        timestamp: "1",
        period: 1,
      },
      {
        id: "2",
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 3,
        timestamp: "2",
        period: 1,
      },
    ];

    const aggregates = calculatePlayerAggregates(players, stats);
    const p1 = aggregates[0] as any;

    expect(p1.threePM).toBe(1);
    expect(p1.threePA).toBe(2);
    expect(p1.threePPct).toBe("50.0");
  });
});
