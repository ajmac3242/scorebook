import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates, calculateLineupStats } from "./lineups";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";
import { buildGameEvent } from "../../test-factories";

describe("lineups analytics", () => {
  const players = [
    { id: "p1", name: "Player 1" },
    { id: "p2", name: "Player 2" },
    { id: "p3", name: "Player 3" },
    { id: "p4", name: "Player 4" },
    { id: "p5", name: "Player 5" },
    { id: "p6", name: "Player 6" },
  ];

  describe("calculatePlayerAggregates", () => {
    it("should calculate minutes and plus/minus correctly", () => {
      const stats: StatEvent[] = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 500,
          period: 1,
          timestamp: "2026-01-01T00:00:00.001Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 400,
          period: 1,
          timestamp: "2026-01-01T00:00:00.002Z",
        }),
      ];

      const result = calculatePlayerAggregates(
        players.slice(0, 2) as any,
        stats,
      );
      const p1 = result.find((r) => r.id === "p1")!;
      // 600 - 400 = 200 seconds = 3.3 minutes
      expect(p1.min).toBe(3.3);
      // P1 was on for p2's 2 points.
      expect(p1.plusMinus).toBe(2);
    });

    it("should calculate all stat types and handle averages", () => {
      const stats: StatEvent[] = [
        buildGameEvent({
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 3,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.REBOUND,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "4",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.ASSIST,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "5",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.STEAL,
          timestamp: "2026-01-01T00:00:06Z",
        }),
        buildGameEvent({
          id: "6",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.BLOCK,
          timestamp: "2026-01-01T00:00:07Z",
        }),
        buildGameEvent({
          id: "7",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.TURNOVER,
          timestamp: "2026-01-01T00:00:08Z",
        }),
        buildGameEvent({
          id: "f1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.FOUL,
          timestamp: "2026-01-01T00:00:09Z",
        }),
        buildGameEvent({
          id: "o1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.OFF_REBOUND,
          timestamp: "2026-01-01T00:00:10Z",
        }),
        buildGameEvent({
          id: "d1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.DEF_REBOUND,
          timestamp: "2026-01-01T00:00:11Z",
        }),
        buildGameEvent({
          id: "h1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.HOCKEY_ASSIST,
          timestamp: "2026-01-01T00:00:12Z",
        }),
        buildGameEvent({
          id: "ft1",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          timestamp: "2026-01-01T00:00:13Z",
        }),
        buildGameEvent({
          id: "ft2",
          gameId: "g1",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          points: 1,
          timestamp: "2026-01-01T00:00:14Z",
        }),
        buildGameEvent({
          id: "s2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 0,
          timestamp: "2026-01-01T00:10:00Z",
        }),
        buildGameEvent({
          id: "8",
          gameId: "g2",
          period: 1,
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2026-01-02T00:00:01Z",
        }),
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
        [],
        "average",
      );
      const p1 = result.find((r) => r.id === "p1")!;
      expect(p1.gp).toBe(2);
      expect(p1.points).toBe(3); // (2+1+3)/2 = 3
      expect(p1.rebounds).toBe(1.5); // (1+1+1)/2 = 1.5
      expect(p1.assists).toBe(0.5); // 1/2
      expect(p1.min).toBe(5); // 10 mins in 1 game / 2 games = 5
    });

    it("should handle skipped periods and game resets", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 3,
          timestamp: "2026-01-01T00:01:00.000Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-02T00:00:00.000Z",
        }),
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
      );
      const p1 = result.find((r) => r.id === "p1")!;
      // g1: P1 (10m) + P2 (skipped, 10m) + P3 (10m) = 30 mins
      // g2: P1 starts but loop ends, handle active stints end at 0. So +10m.
      // Total: 40 mins.
      expect(p1.min).toBe(40);
    });

    it("should handle clutch filtering", () => {
      const stats = [
        buildGameEvent({
          id: "1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "1b",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 550,
          period: 1,
          timestamp: "2026-01-01T00:00:015Z",
        }),
        buildGameEvent({
          id: "2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 500,
          period: 1,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          clockTime: 60,
          period: 4,
          timestamp: "2026-01-01T00:10:01Z",
        }),
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
        [],
        "total",
        {
          clutchOnly: true,
        },
      );
      const p1 = result[0];
      expect(p1.points).toBe(3); // Only the period 4 make
    });

    it("should handle live context correctly", () => {
      const stats = [
        buildGameEvent({
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          timestamp: "2026-01-01T00:00:00Z",
        }),
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
        [],
        "total",
        {
          liveContext: { clockTime: 300, period: 1 },
        },
      );
      expect(result[0].min).toBe(5); // 300 seconds = 5 mins
    });

    it("should handle clutch filtering with clutch sub events", () => {
      const stats = [
        // Non-clutch sub in/out - should not count towards mins if clutchOnly is true
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 500,
          period: 1,
        }),
        // Clutch sub in
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 300,
          period: 4,
        }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 10,
          period: 4,
        }),
        // Clutch sub out
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 0,
          period: 4,
        }),
      ];
      const result = calculatePlayerAggregates(
        [{ id: "p1", name: "P1" }] as any,
        stats,
        [],
        "total",
        { clutchOnly: true },
      );
      expect(result[0].points).toBe(2);
      expect(result[0].min).toBe(5); // 300s = 5m
    });

    it("should handle free throws in aggregates", () => {
      const stats = [
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.MAKE, points: 1 }),
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.MISS, points: 1 }),
      ];
      const result = calculatePlayerAggregates(
        [{ id: "p1", name: "P1" }] as any,
        stats,
      );
      expect(result[0].ftm).toBe(1);
      expect(result[0].fta).toBe(2);
    });

    it("should handle various foul types in aggregates", () => {
      const stats = [
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.FOUL }),
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.FOUL_SHOOTING }),
        buildGameEvent({
          playerId: "p1",
          type: ACTION_TYPES.FOUL_NON_SHOOTING,
        }),
        buildGameEvent({ playerId: "p1", type: ACTION_TYPES.TECHNICAL_FOUL }),
      ];
      const result = calculatePlayerAggregates(
        [{ id: "p1", name: "P1" }] as any,
        stats,
      );
      expect(result[0].fouls).toBe(4);
    });
  });

  describe("calculateLineupStats", () => {
    it("should track 5-man lineup efficiency and sorting", () => {
      const stats: StatEvent[] = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "6",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          clockTime: 500,
          period: 1,
          timestamp: "2026-01-01T00:00:06Z",
        }),
        buildGameEvent({
          id: "7",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 400,
          period: 1,
          timestamp: "2026-01-01T00:00:07Z",
        }),
        buildGameEvent({
          id: "8",
          gameId: "g1",
          playerId: "p6",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 400,
          period: 1,
          timestamp: "2026-01-01T00:00:08Z",
        }),
        buildGameEvent({
          id: "9",
          gameId: "g1",
          playerId: "p6",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 1,
          timestamp: "2026-01-01T00:00:09Z",
        }),
      ];

      const result = calculateLineupStats(stats, {
        key: "netRatingPer40",
        direction: "desc",
      });
      expect(result).toHaveLength(2);
      expect(result[0].seconds).toBe(200);
    });

    it("should handle period transitions, game transitions, and live context", () => {
      const stats: StatEvent[] = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "6",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 2,
          timestamp: "2026-01-01T00:10:01Z",
        }),
        buildGameEvent({
          id: "7",
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-02T00:00:01Z",
        }),
      ];
      const result = calculateLineupStats(stats, {
        liveContext: { clockTime: 300, period: 1 },
      });
      expect(result[0].seconds).toBe(1200);
    });

    it("should handle skipped periods in lineup stats", () => {
      const stats: StatEvent[] = [
        buildGameEvent({
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          id: "2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          id: "3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          id: "4",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          id: "5",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          id: "6",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 3,
          timestamp: "2026-01-01T00:20:01Z",
        }),
      ];
      const result = calculateLineupStats(stats);
      expect(result[0].seconds).toBe(1800);
    });

    it("should handle numeric sorting and string sorting with directions", () => {
      const stats = [
        // Lineup A: p1,p2,p3,p4,p5 - 100s, 2 pts (+48.0 rating)
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:01Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p2",
          timestamp: "2026-01-01T00:00:02Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p3",
          timestamp: "2026-01-01T00:00:03Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p4",
          timestamp: "2026-01-01T00:00:04Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p5",
          timestamp: "2026-01-01T00:00:05Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 500,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:06Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 500,
          playerId: "p5",
          timestamp: "2026-01-01T00:00:07Z",
        }),

        // Lineup B: p1,p2,p3,p4,p6 - 200s, 1 pt (+12.0 rating)
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 500,
          playerId: "p6",
          timestamp: "2026-01-01T00:00:08Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.MAKE,
          points: 1,
          clockTime: 300,
          playerId: "p1",
          timestamp: "2026-01-01T00:00:09Z",
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 300,
          playerId: "p6",
          timestamp: "2026-01-01T00:00:10Z",
        }),
      ];

      // Numeric sorting (seconds) - DESC
      const descSeconds = calculateLineupStats(stats, {
        key: "seconds",
        direction: "desc",
      });
      expect(descSeconds[0].seconds).toBe(200);

      // Numeric sorting (seconds) - ASC
      const ascSeconds = calculateLineupStats(stats, {
        key: "seconds",
        direction: "asc",
      });
      expect(ascSeconds[0].seconds).toBe(100);

      // String sorting (netRatingPer40) - DESC
      const descRating = calculateLineupStats(stats, {
        key: "netRatingPer40",
        direction: "desc",
      });
      expect(parseFloat(descRating[0].netRatingPer40)).toBe(48.0);

      // String sorting (netRatingPer40) - ASC
      const ascRating = calculateLineupStats(stats, {
        key: "netRatingPer40",
        direction: "asc",
      });
      expect(parseFloat(ascRating[0].netRatingPer40)).toBe(12.0);
    });

    it("should handle clutch only filtering in lineup stats", () => {
      const stats = [
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p1",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p2",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p3",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p4",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p5",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 500,
          playerId: "p5",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 500,
          playerId: "p6",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 10,
          period: 4,
          playerId: "p1",
        }),
      ];
      const result = calculateLineupStats(stats, { clutchOnly: true });
      expect(result.length).toBeGreaterThan(0);
    });

    it("hits cachedLineupKey branch in period transition", () => {
      const stats = [
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p1",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p2",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p3",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p4",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p5",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 1,
          type: ACTION_TYPES.MAKE,
          clockTime: 300,
          playerId: "p1",
        }),
        buildGameEvent({
          gameId: "g1",
          period: 2,
          type: ACTION_TYPES.MAKE,
          clockTime: 600,
          playerId: "p1",
        }),
      ];
      const result = calculateLineupStats(stats);
      expect(result).toHaveLength(1);
    });

    it("hits cachedLineupKey branch in sub event", () => {
      const stats = [
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p1",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p2",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p3",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p4",
          period: 1,
        }),
        buildGameEvent({
          gameId: "g1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          playerId: "p5",
          period: 1,
        }),
        // Period change to 3 (skips 2) sets cachedLineupKey and then uses it for skipped period
        buildGameEvent({
          gameId: "g1",
          period: 3,
          type: ACTION_TYPES.MAKE,
          clockTime: 600,
          playerId: "p1",
        }),
      ];
      const result = calculateLineupStats(stats);
      expect(result).toHaveLength(1);
    });
  });
});
