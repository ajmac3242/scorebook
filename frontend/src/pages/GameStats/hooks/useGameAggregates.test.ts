import { renderHook } from "../../../test-utils";
import { useGameAggregates } from "./useGameAggregates";
import { ACTION_TYPES, SHOT_QUALITY } from "../../../constants/stats";

describe("useGameAggregates", () => {
  const mockStats = [
    {
      id: "s1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      period: 1,
      timestamp: "2024-06-21T10:00:00Z",
      locationX: 50,
      locationY: 50,
    },
    {
      id: "s2",
      playerId: "p1",
      type: ACTION_TYPES.MISS,
      points: 2,
      period: 1,
      timestamp: "2024-06-21T10:01:00Z",
      locationX: 20,
      locationY: 20,
    },
    {
      id: "s3",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 3,
      period: 2,
      timestamp: "2024-06-21T10:05:00Z",
      locationX: 10,
      locationY: 10,
    },
  ] as any[];

  const mockRawData = {
    allStats: mockStats,
    game: { id: "g1", periodLength: 10, completed: 1 },
    team: { id: "t1", periodType: "QUARTERS" },
    teamPlayers: [{ playerId: "p1", jerseyNumber: "30" }],
    players: [{ id: "p1", name: "Steph" }],
    teamSeasonStats: { ftPct: "80.0", turnoverRate: "10.0", orebPct: "30.0" },
  } as any;

  const mockFilters = {
    periodFilter: "ALL",
    clutchFilter: false,
    selectedPlayerId: "ALL",
    selectedType: "ALL",
    selectedQuality: "ALL",
    selectedBreakdown: "ALL",
    selectedPlay: "ALL",
    sortConfig: { key: "points", direction: "desc" },
    comparePeriod1: "1",
    comparePeriod2: "2",
  } as any;

  it("filters stats by period", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: mockRawData,
        filters: { ...mockFilters, periodFilter: "1" },
      }),
    );

    expect(result.current.stats).toHaveLength(2);
    expect(result.current.stats.every((s) => s.period === 1)).toBe(true);
  });

  it("calculates basic team data", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: mockRawData,
        filters: mockFilters,
      }),
    );

    expect(result.current.teamData.points).toBe(5);
    // 2 FGA (one make, one miss), 0 FTA, 0 TO, 0 OREB -> ~2 possessions (simplified)
    expect(result.current.teamData.possessions).toBeGreaterThan(0);
  });

  it("generates shot chart markers", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: mockRawData,
        filters: mockFilters,
      }),
    );

    expect(result.current.shotChartMarkers).toHaveLength(3); // s1, s2, s3
    expect(result.current.shotChartMarkers[0].label).toBe("30");
  });

  it("calculates heatmap data for compare periods", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: mockRawData,
        filters: mockFilters,
      }),
    );

    expect(result.current.heatmapData1).toBeDefined();
    expect(result.current.heatmapData2).toBeDefined();
  });

  it("filters derived stats by player", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: mockRawData,
        filters: { ...mockFilters, selectedPlayerId: "p1" },
      }),
    );

    expect(
      result.current.shotChartMarkers.every((m) => m.playerId === "p1"),
    ).toBe(true);
  });

  it("calculates opponent play type efficiency with FTs and misses", () => {
    const oppStats = [
      {
        id: "o1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        opponentPlayType: "PnR",
        timestamp: "1",
      },
      {
        id: "o2",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MISS,
        points: 2,
        opponentPlayType: "PnR",
        timestamp: "2",
      },
      {
        id: "o3",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 1,
        opponentPlayType: "PnR",
        timestamp: "3",
      },
      {
        id: "o4",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TURNOVER,
        opponentPlayType: "PnR",
        timestamp: "4",
      },
      {
        id: "o5",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 3,
        opponentPlayType: "PnR",
        timestamp: "5",
      },
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: [...mockStats, ...oppStats] },
        filters: mockFilters,
      }),
    );

    const pnr = result.current.opponentPlayTypeEfficiency.find(
      (e) => e.type === "PnR",
    );
    expect(pnr).toBeDefined();
    expect(pnr?.attempts).toBe(3); // 2pt make, 2pt miss, 3pt make
    expect(pnr?.points).toBe(6); // 2 + 1 + 3
    expect(parseFloat(pnr?.ppp || "0")).toBeGreaterThan(0);
  });

  it("triggers practice focus area alerts", () => {
    const badStats = [
      {
        id: "b1",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 1,
        timestamp: "1",
      }, // 0% FT
      { id: "b2", playerId: "p1", type: ACTION_TYPES.TURNOVER, timestamp: "2" }, // High turnover
      {
        id: "b3",
        playerId: "OPPONENT",
        type: ACTION_TYPES.DEF_REBOUND,
        timestamp: "3",
      }, // Bad Oreb
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: badStats },
        filters: mockFilters,
      }),
    );

    expect(result.current.practiceFocusAreas.length).toBeGreaterThan(0);
  });

  it("handles empty stats and zero attempts gracefully", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: [] },
        filters: mockFilters,
      }),
    );

    expect(result.current.opponentPlayTypeEfficiency).toHaveLength(0);
    expect(result.current.teamData.points).toBe(0);
  });

  it("applies various quality and play filters in derived stats", () => {
    const filteredStats = [
      {
        id: "f1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        shotQuality: "High",
        playName: "Hammer",
        timestamp: "1",
      },
      {
        id: "f2",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        shotQuality: "Low",
        playName: "Hammer",
        timestamp: "2",
      },
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: filteredStats },
        filters: {
          ...mockFilters,
          selectedQuality: "High",
          selectedPlay: "Hammer",
        },
      }),
    );

    // `stats` is only filtered by period. `derivedStats` (internal to markers/heatmap) is filtered by quality.
    expect(result.current.shotChartMarkers).toHaveLength(1);
    expect(result.current.shotChartMarkers[0].id).toBe("f1");
  });

  it("calculates shot clock efficiency", () => {
    const shotClockStats = [
      {
        id: "sc1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        shotClockPhase: "EARLY",
        timestamp: "1",
      },
      {
        id: "sc2",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 2,
        shotClockPhase: "EARLY",
        timestamp: "2",
      },
      {
        id: "sc3",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        shotClockPhase: "LATE",
        timestamp: "3",
      },
      {
        id: "sc4",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "4",
      }, // No phase
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: shotClockStats },
        filters: mockFilters,
      }),
    );

    const early = result.current.shotClockEfficiency.find(
      (e) => e.phase === "EARLY",
    );
    expect(early?.attempts).toBe(2);
    expect(early?.makes).toBe(1);
    expect(early?.points).toBe(2);

    const late = result.current.shotClockEfficiency.find(
      (e) => e.phase === "LATE",
    );
    expect(late?.attempts).toBe(1);
    expect(late?.points).toBe(3);
  });

  it("calculates process efficiency (shot quality)", () => {
    const qualityStats = [
      {
        id: "q1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        shotQuality: SHOT_QUALITY.OPEN,
        timestamp: "1",
      },
      {
        id: "q2",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 2,
        shotQuality: SHOT_QUALITY.OPEN,
        timestamp: "2",
      },
      {
        id: "q3",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        shotQuality: SHOT_QUALITY.CONTESTED,
        timestamp: "3",
      },
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: qualityStats },
        filters: mockFilters,
      }),
    );

    const open = result.current.processEfficiency.find(
      (e) => e.quality === SHOT_QUALITY.OPEN,
    );
    expect(open?.attempts).toBe(2);
    expect(open?.points).toBe(2);
  });

  it("calculates team data with various event types", () => {
    const teamStats = [
      {
        id: "t1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "1",
      },
      {
        id: "t2",
        playerId: "p1",
        type: ACTION_TYPES.MISS,
        points: 1,
        timestamp: "2",
      }, // FTA
      { id: "t3", playerId: "p1", type: ACTION_TYPES.TURNOVER, timestamp: "3" },
      {
        id: "t4",
        playerId: "p1",
        type: ACTION_TYPES.OFF_REBOUND,
        timestamp: "4",
      },
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, allStats: teamStats },
        filters: mockFilters,
      }),
    );

    expect(result.current.teamData.points).toBe(2);
    expect(result.current.teamData.possessions).toBeGreaterThan(0);
  });

  it("handles sorting in aggregated stats", () => {
    const sortStats = [
      {
        id: "p1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 2,
        timestamp: "1",
      },
      {
        id: "p2",
        playerId: "p2",
        type: ACTION_TYPES.MAKE,
        points: 3,
        timestamp: "2",
      },
    ];
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: {
          ...mockRawData,
          allStats: sortStats,
          players: [
            { id: "p1", name: "P1" },
            { id: "p2", name: "P2" },
          ],
          teamPlayers: [{ playerId: "p1" }, { playerId: "p2" }],
        },
        filters: {
          ...mockFilters,
          sortConfig: { key: "points", direction: "asc" },
        },
      }),
    );

    expect(result.current.aggregatedStats[0].id).toBe("p1");
  });

  it("triggers missing teamSeasonStats branch", () => {
    const { result } = renderHook(() =>
      useGameAggregates({
        rawData: { ...mockRawData, teamSeasonStats: undefined },
        filters: mockFilters,
      }),
    );
    expect(result.current.practiceFocusAreas).toHaveLength(0);
  });
});
