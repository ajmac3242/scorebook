import { renderHook, act } from "../../../test-utils";
import { useGameTimeout } from "./useGameTimeout";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";

describe("useGameTimeout", () => {
  const gameId = "g1";

  beforeEach(() => {
    mockDb.reset();
  });

  it("records a team timeout", async () => {
    const { result } = renderHook(() =>
      useGameTimeout({
        gameId,
        isReadOnly: false,
        trackingMode: "TEAM",
        period: 1,
        clockSeconds: 600,
      }),
    );

    await act(async () => {
      await result.current.handleTimeout();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe(ACTION_TYPES.TIMEOUT);
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.TEAM_TIMEOUT);
  });

  it("records an opponent timeout", async () => {
    const { result } = renderHook(() =>
      useGameTimeout({
        gameId,
        isReadOnly: false,
        trackingMode: "OPPONENT",
        period: 1,
        clockSeconds: 600,
      }),
    );

    await act(async () => {
      await result.current.handleTimeout();
    });

    const stats = await mockDb.stats.toArray();
    expect(stats[0].playerId).toBe(SPECIAL_PLAYER_IDS.OPPONENT);
  });
});
