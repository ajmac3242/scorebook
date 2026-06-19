/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { calculatePlayerAggregates, calculateLineupStats } from "../lineups";
import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";

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
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 500,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 400,
          period: 1,
          timestamp: "3",
        },
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

    it("should handle multi-game aggregates", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          timestamp: "2",
        },
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
      );
      const p1 = result.find((r) => r.id === "p1")!;
      expect(p1.gp).toBe(2);
      expect(p1.points).toBe(5);
    });

    it("should calculate averages correctly", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          timestamp: "1",
        },
        {
          gameId: "g2",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 4,
          timestamp: "2",
        },
      ];
      const result = calculatePlayerAggregates(
        players.slice(0, 1) as any,
        stats,
        [],
        "average",
      );
      const p1 = result.find((r) => r.id === "p1")!;
      expect(p1.points).toBe(3);
    });
  });

  describe("calculateLineupStats", () => {
    it("should track 5-man lineup efficiency", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "5",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 3,
          clockTime: 500,
          period: 1,
          timestamp: "6",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_OUT,
          clockTime: 400,
          period: 1,
          timestamp: "7",
        },
        {
          gameId: "g1",
          playerId: "p6",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 400,
          period: 1,
          timestamp: "8",
        },
        {
          gameId: "g1",
          playerId: "p6",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 1,
          timestamp: "9",
        },
      ];

      const result = calculateLineupStats(stats);
      // Lineup [p1,p2,p3,p4,p5] was on from 600 to 400 (200s), scored 3pts.
      const lineup1 = result.find((l) => l.lineup.includes("p5"))!;
      expect(lineup1.seconds).toBe(200);
      expect(lineup1.pointsFor).toBe(3);

      // Lineup [p1,p2,p3,p4,p6] was on from 400 to 0 (400s), scored 2pts.
      const lineup2 = result.find((l) => l.lineup.includes("p6"))!;
      expect(lineup2.seconds).toBe(400);
      expect(lineup2.pointsFor).toBe(2);
    });

    it("should handle period transitions and resets", () => {
      const stats: StatEvent[] = [
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "1",
        },
        {
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "2",
        },
        {
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "3",
        },
        {
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "4",
        },
        {
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          clockTime: 600,
          period: 1,
          timestamp: "5",
        },
        {
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          clockTime: 300,
          period: 2,
          timestamp: "6",
        },
      ];
      const result = calculateLineupStats(stats);
      // P1: 600s complete.
      // P2: make at 300s means 300s elapsed in P2.
      // Total 900s.
      // Wait, calculateLineupStats handles P2 transition by recording lastClockTime (600) for P1.
      // And then P2 make doesn't trigger a stint recording unless it's a sub.
      // At the end, it records Math.max(0, lastClockTime - endClock).
      // If endClock is 0, it records 600 (P2).
      // So 600 (P1) + 600 (P2) = 1200.
      expect(result[0].seconds).toBe(1200);
    });
  });
});
