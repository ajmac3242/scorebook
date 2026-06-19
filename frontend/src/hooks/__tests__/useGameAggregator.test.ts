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

  it("handles scoring drought calculation when no team score recorded yet", async () => {
    const stats: StatEvent[] = []; // No scores

    // Elapsed time 180s exactly
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 420, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.momentumAlerts.scoringDrought).toBe(
        "3m 0s",
      );
    });
  });

  it("handles lineup change edge case where no changes in period", async () => {
    // If no SUB_IN/SUB_OUT in current period, it should use period start scores
    const stats = [
      createStat({ points: 2, period: 1, clockTime: 590 }), // Score 2-0 before period 2
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 2, 600, mockTeam, mockGame),
    );

    await waitFor(() => {
      // Lineup change scores should be 2-0 (from period 1 end)
      expect(result.current.gameData.lastLineupChangeScoreTeam).toBe(2);
      expect(result.current.gameData.lastLineupChangeScoreOpp).toBe(0);
      expect(result.current.gameData.currentLineupPlusMinus).toBe(0);
    });
  });

  it("handles scoring drought across periods", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
        clockTime: 50, // 50 seconds left in period 1
        period: 1,
      }),
    ];

    // Current time: period 2, 500 seconds left
    // Drought = 50 (rest of P1) + 100 (elapsed in P2) = 150 (not enough for drought)
    const { result: r1 } = renderHook(() =>
      useGameAggregator(stats, 2, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(r1.current.gameData.momentumAlerts.scoringDrought).toBeNull();
    });

    // Current time: period 2, 400 seconds left
    // Drought = 50 (rest of P1) + 200 (elapsed in P2) = 250
    const { result: r2 } = renderHook(() =>
      useGameAggregator(stats, 2, 400, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(r2.current.gameData.momentumAlerts.scoringDrought).toBe("4m 10s");
    });
  });

  it("updates possessionStartClock on team turnover", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.TURNOVER,
        playerId: "p1",
        clockTime: 500,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.possessionStartClock).toBe(500);
    });
  });

  it("updates possessionStartClock on team offensive rebound", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.OFF_REBOUND,
        playerId: "p1",
        clockTime: 450,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.possessionStartClock).toBe(450);
    });
  });

  it("updates possessionStartClock on opponent turnover", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.TURNOVER,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        clockTime: 420,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );

    await waitFor(() => {
      expect(result.current.gameData.possessionStartClock).toBe(420);
    });
  });

  it("updates possessionStartClock and reset threats on opponent miss", async () => {
    // First make him hot
    const stats = [
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        clockTime: 500,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        clockTime: 480,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 3,
        playerId: "OPPONENT:1",
        clockTime: 460,
      }),
      createStat({
        type: ACTION_TYPES.MISS,
        points: 0,
        playerId: "OPPONENT:1",
        clockTime: 440,
      }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );

    await waitFor(() => {
      const threat =
        result.current.gameData.momentumAlerts.opponentThreats.find(
          (t) => t.playerId === "OPPONENT:1",
        );
      // consecutiveMakes should be reset to 0 but points remain
      expect(threat?.points).toBe(9);
    });
  });
});
