import { describe, it, expect } from "vitest";
import {
  isEventInPeriod,
  calculatePlayEfficiency,
  calculatePlayerAggregates,
} from "./stats";
import { ACTION_TYPES } from "../constants/stats";
import { StatEvent, Player } from "../db";

describe("Scout: Audit V3", () => {
  describe("isEventInPeriod Bug", () => {
    it("should correctly isolate OT periods in HALVES mode", () => {
      // In HALVES mode, P1 is 1st half, P2 is 2nd half, P3 is OT1
      expect(isEventInPeriod(1, 1, "HALVES")).toBe(true);
      expect(isEventInPeriod(2, 1, "HALVES")).toBe(false);

      // Current Period 2 (2nd Half) should see P2 and all OTs (P3+)
      expect(isEventInPeriod(2, 2, "HALVES")).toBe(true);
      expect(isEventInPeriod(3, 2, "HALVES")).toBe(true);

      // BUG: Current Period 3 (OT1) should NOT see P2 (2nd Half)
      expect(isEventInPeriod(2, 3, "HALVES")).toBe(false);
      expect(isEventInPeriod(3, 3, "HALVES")).toBe(true);
    });
  });

  describe("calculatePlayEfficiency oreb Bug", () => {
    it("should subtract oreb from play possessions", () => {
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MISS,
          playName: "Motion",
          clockTime: 300,
          period: 1,
          timestamp: "1000",
        },
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.OFF_REBOUND,
          playName: "Motion",
          clockTime: 298,
          period: 1,
          timestamp: "1100",
        },
      ];
      // If oreb is not subtracted, possessions = FGA(1) + 0 + 0 - 0 = 1.
      // If oreb is subtracted, possessions = 1 - 1 = 0.
      const results = calculatePlayEfficiency(stats);
      const motion = results.find((r) => r.name === "Motion");
      expect(motion?.ppp).toBe("0.00");
    });
  });

  describe("calculatePlayerAggregates Clutch Minutes Bug", () => {
    it("should calculate minutes when clutchOnly is enabled", () => {
      const players: Player[] = [{ id: "p1", name: "Player 1" }];
      const stats: StatEvent[] = [
        {
          id: "1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 4,
          clockTime: 300,
          timestamp: "1000",
        }, // 5:00 (Not clutch yet)
        {
          id: "2",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.MAKE,
          points: 2,
          period: 4,
          clockTime: 200,
          timestamp: "1100",
        }, // 3:20 (Clutch! Score diff is 2, time < 240)
        {
          id: "3",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_OUT,
          period: 4,
          clockTime: 100,
          timestamp: "1200",
        }, // 1:40 (Clutch)
      ];

      const results = calculatePlayerAggregates(players, stats, [], "total", {
        clutchOnly: true,
        periodType: "QUARTERS",
      });
      const p1 = results.find((r) => r.id === "p1");
      expect(p1?.points).toBe(2);
      // Expected clutch minutes: (240 - 100) / 60 = 2.33 -> 2.3
      expect(p1?.min).toBe(2.3);
    });
  });
});
