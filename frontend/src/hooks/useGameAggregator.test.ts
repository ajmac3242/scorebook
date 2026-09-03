import { renderHook, waitFor } from "../test-utils";
import { describe, it, expect } from "vitest";
import { useGameAggregator } from "./useGameAggregator";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { Team, Game, StatEvent } from "../db";

describe("useGameAggregator", () => {
  const mockTeam: Team = {
    id: "t1",
    name: "My Team",
    periodType: "QUARTERS",
    fouls: 3,
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
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 2 }),
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
      createStat({ type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" }),
      createStat({ type: ACTION_TYPES.MISS, points: 0, playerId: "p1" }),
    ];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 300, mockTeam, mockGame),
    );

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
    const stats: StatEvent[] = [];

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
    const stats = [createStat({ points: 2, period: 1, clockTime: 590 })];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 2, 600, mockTeam, mockGame),
    );

    await waitFor(() => {
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
        clockTime: 50,
        period: 1,
      }),
    ];

    const { result: r1 } = renderHook(() =>
      useGameAggregator(stats, 2, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(r1.current.gameData.momentumAlerts.scoringDrought).toBeNull();
    });

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
      expect(threat?.points).toBe(9);
    });
  });

  it("tracks timeouts correctly", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.TIMEOUT,
        playerId: "p1",
        timestamp: "2026-01-01T00:00:01Z",
      }),
      createStat({
        type: ACTION_TYPES.TIMEOUT,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        timestamp: "2026-01-01T00:00:02Z",
      }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 400, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.timeoutStats.teamTOL).toBe(2);
      expect(result.current.gameData.timeoutStats.oppTOL).toBe(2);
    });
  });

  it("tracks possessions correctly", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.POSSESSION,
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

  it("tracks opponent offensive rebounds and scoring events", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.OFF_REBOUND,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        clockTime: 300,
      }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 200, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.possessionStartClock).toBe(300);
    });
  });

  it("handles HALVES period type", async () => {
    const halfTeam = { ...mockTeam, periodType: "HALVES" };
    const stats = [
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, halfTeam as any, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.teamFoulStats.teamFouls).toBe(1);
    });
  });

  it("handles timeout scope by HALF", async () => {
    const halfTeam = {
      ...mockTeam,
      timeoutScope: "HALF",
      periodType: "QUARTERS",
    };
    const stats = [
      createStat({
        type: ACTION_TYPES.TIMEOUT,
        playerId: SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        period: 1,
      }),
      createStat({
        type: ACTION_TYPES.TIMEOUT,
        playerId: SPECIAL_PLAYER_IDS.TEAM_TIMEOUT,
        period: 3,
      }),
    ];
    // Current period is 1, so only period 1 timeout should count
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, halfTeam as any, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.timeoutStats.teamTOL).toBe(2); // 3 total - 1 in scope = 2 left
    });
  });

  it("handles SUB_OUT and updates lineup change metadata", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        clockTime: 600,
        period: 1,
        points: 0,
      }),
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: "p1",
        clockTime: 500,
        period: 1,
      }),
      createStat({
        type: ACTION_TYPES.SUB_OUT,
        playerId: "p1",
        clockTime: 400,
        period: 1,
        points: 0,
      }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 300, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.lastLineupChangeClock).toBe(400);
      expect(result.current.gameData.lastLineupChangeScoreTeam).toBe(2);
    });
  });

  it("calculates defensive scheme efficiency", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.MAKE,
        points: 2,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        defensiveScheme: "ZONE",
      }),
      createStat({
        type: ACTION_TYPES.MISS,
        points: 0,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        defensiveScheme: "ZONE",
      }),
      createStat({
        type: ACTION_TYPES.TURNOVER,
        playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        defensiveScheme: "ZONE",
      }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      const zone = result.current.gameData.schemeEfficiency.find(
        (s) => s.name === "ZONE",
      );
      expect(zone?.possessions).toBe(3);
    });
  });

  it("tracks on-court fouls for active players", async () => {
    const stats = [
      createStat({
        type: ACTION_TYPES.SUB_IN,
        playerId: "p1",
        clockTime: 600,
        period: 1,
      }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }),
    ];
    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(result.current.gameData.onCourtPeriodFouls.get("p1")).toBe(1);
    });
  });

  it("carries over and resets fouls properly in HALVES format", async () => {
    const halvesTeam: Team = {
      ...mockTeam,
      periodType: "HALVES",
    };
    const stats = [
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }), // 1st half
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }), // 1st half
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 2 }), // 2nd half (reset from P1)
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 2 }), // 2nd half
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 3 }), // OT1 (carries over P2 + P3)
    ];

    // Period 1 (1st Half)
    const { result: resP1 } = renderHook(() =>
      useGameAggregator(stats, 1, 500, halvesTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP1.current.gameData.teamFoulStats.teamFouls).toBe(2);
    });

    // Period 2 (2nd Half: fouls reset to 0 at start, only count Period 2 fouls)
    const { result: resP2 } = renderHook(() =>
      useGameAggregator(stats, 2, 500, halvesTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP2.current.gameData.teamFoulStats.teamFouls).toBe(2);
    });

    // Period 3 (OT1: carries over Period 2 fouls (2) + Period 3 fouls (1) = 3)
    const { result: resP3 } = renderHook(() =>
      useGameAggregator(stats, 3, 500, halvesTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP3.current.gameData.teamFoulStats.teamFouls).toBe(3);
    });
  });

  it("carries over and resets fouls properly in QUARTERS format", async () => {
    const stats = [
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 1 }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 2 }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 3 }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 4 }),
      createStat({ type: ACTION_TYPES.FOUL, playerId: "p1", period: 5 }), // OT
    ];

    // Period 1
    const { result: resP1 } = renderHook(() =>
      useGameAggregator(stats, 1, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP1.current.gameData.teamFoulStats.teamFouls).toBe(1);
    });

    // Period 2 (reset)
    const { result: resP2 } = renderHook(() =>
      useGameAggregator(stats, 2, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP2.current.gameData.teamFoulStats.teamFouls).toBe(1);
    });

    // Period 4 (regulation end, only Period 4 fouls = 1)
    const { result: resP4 } = renderHook(() =>
      useGameAggregator(stats, 4, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP4.current.gameData.teamFoulStats.teamFouls).toBe(1);
    });

    // Period 5 (OT, carries over Period 4 foul (1) + Period 5 foul (1) = 2)
    const { result: resP5 } = renderHook(() =>
      useGameAggregator(stats, 5, 500, mockTeam, mockGame),
    );
    await waitFor(() => {
      expect(resP5.current.gameData.teamFoulStats.teamFouls).toBe(2);
    });
  });

  it("populates onCourt lineup from game.onCourtIds when no substitution events are in stats", async () => {
    const gameWithOnCourt: Game = {
      ...mockGame,
      onCourtIds: ["p1", "p2", "p3", "p4", "p5"],
    };
    const stats: StatEvent[] = [];

    const { result } = renderHook(() =>
      useGameAggregator(stats, 1, 600, mockTeam, gameWithOnCourt),
    );

    await waitFor(() => {
      expect(Array.from(result.current.gameData.onCourtIds)).toEqual([
        "p1",
        "p2",
        "p3",
        "p4",
        "p5",
      ]);
    });
  });
});
