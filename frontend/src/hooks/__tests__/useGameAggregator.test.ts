import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useGameAggregator } from "../useGameAggregator";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { Team, Game, StatEvent } from "../../db";

describe("useGameAggregator", () => {
  const mockTeam: Team = {
    id: "t1",
    name: "My Team",
    periodType: "QUARTERS",
    fouls: 3, // Max timeouts in this context apparently
  } as any;

  const mockGame: Game = {
    id: "g1",
    periodLength: 10,
  } as any;

  const createStat = (overrides: Partial<StatEvent>): StatEvent => ({
    id: Math.random().toString(),
    gameId: "g1",
    playerId: "p1",
    type: ACTION_TYPES.MAKE,
    points: 2,
    period: 1,
    clockTime: 600,
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  it("calculates basic score correctly", async () => {
    const stats = [
      createStat({ points: 2, playerId: "p1" }),
      createStat({ points: 3, playerId: "p1" }),
      createStat({ points: 2, playerId: SPECIAL_PLAYER_IDS.OPPONENT }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.currentScore).toBe(5);
      expect(result.current.gameData.opponentScore).toBe(2);
    });
  });

  it("calculates team and opponent fouls for the current period", async () => {
    const stats = [
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }),
      createStat({
        type: ACTION_TYPES.FOUL,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        period: 1,
      }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 2 }), // Should be ignored for period 1
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.teamFoulStats.teamFouls).toBe(2);
      expect(result.current.gameData.teamFoulStats.oppFouls).toBe(1);
    });
  });

  it("detects team and opponent runs", async () => {
    const stats = [
      createStat({ type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" }),
      createStat({ type: ACTION_TYPES.MAKE, points: 3, playerId: "p1" }),
      createStat({ type: ACTION_TYPES.MAKE, points: 3, playerId: "p1" }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 300, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.momentumAlerts.teamRun).toBe("8-0");
      expect(result.current.gameData.momentumAlerts.opponentRun).toBeNull();
    });
  });

  it("calculates stint durations for players on court", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        clockTime: 600,
        period: 1,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.stintDurations.get("p1")).toBe(200);
    });
  });

  it("identifies hot opponent threats", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        period: 1,
        clockTime: 600,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        period: 1,
        clockTime: 550,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        period: 1,
        clockTime: 500,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 450, mockTeam, mockGame),
    );

    await waitFor(() => {
      const threats = result.current.gameData.momentumAlerts.opponentThreats;
      const hotThreat = threats.find((t) => t.playerId === "OPPONENT:1");
      expect(hotThreat?.isHot).toBe(true);
    });
  });

  it("calculates PPP correctly", async () => {
    const stats = [
      createStat({ type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" }), // 1 possession
      createStat({ type: ACTION_TYPES.MISS, points: 0, playerId: "p1" }), // 1 possession
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 300, mockTeam, mockGame),
    );

    // 2 points / 2 possessions = 1.00
    await waitFor(() => {
      expect(result.current.gameData.teamPpp).toBe("1.00");
    });
  });

  it("handles scoring drought calculation", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
        clockTime: 600,
        period: 1,
      }),
    ];

    // Current time is 250 seconds later (600 - 350 = 250), which is > 180s
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 350, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.momentumAlerts.scoringDrought).toBe(
        "4m 10s",
      );
    });
  });
});
