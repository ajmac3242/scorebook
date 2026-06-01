import { describe, it, expect } from "vitest";
import { calculateXPts, calculateShotROI } from "../analytics";
import { ACTION_TYPES, SHOT_QUALITY } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("Shot Analytics", () => {
  describe("calculateXPts", () => {
    it("returns 0 for inactive or non-scoring events", () => {
      const stat: Partial<StatEvent> = {
        type: ACTION_TYPES.TURNOVER,
      };
      expect(calculateXPts(stat as StatEvent)).toBe(0);
    });

    it("returns 0.75 for free throws", () => {
      const stat: Partial<StatEvent> = {
        type: ACTION_TYPES.MAKE,
        points: 1,
      };
      expect(calculateXPts(stat as StatEvent)).toBe(0.75);
    });

    it("calculates xPTS based on zone and quality", () => {
      // Restricted Area (Zone RA), Open
      const stat: Partial<StatEvent> = {
        type: ACTION_TYPES.MISS,
        points: 2,
        locationX: 50,
        locationY: 10, // Near basket
        shotQuality: SHOT_QUALITY.OPEN,
      };
      // According to shotZones.ts: XPTS_TABLE["RA"].OPEN = 1.65
      expect(calculateXPts(stat as StatEvent)).toBe(1.65);
    });
  });

  describe("calculateShotROI", () => {
    it("calculates ROI and average xPTS correctly", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          locationX: 5,
          locationY: 5, // Corner 3
          shotQuality: SHOT_QUALITY.OPEN,
          playerId: "p1",
        },
        {
          type: ACTION_TYPES.MISS,
          points: 3,
          locationX: 5,
          locationY: 5, // Corner 3
          shotQuality: SHOT_QUALITY.OPEN,
          playerId: "p1",
        },
      ];
      // Corner 3 (Zone 3PT_LEFT_CORNER), Open = 1.15 xPTS
      // Total xPTS = 2.30
      // Total Points = 3
      // ROI = 3 / 2.3 - 1 = 0.304...

      const result = calculateShotROI(stats as StatEvent[]);
      expect(result.totalPoints).toBe(3);
      expect(result.totalXPts).toBe("2.3");
      expect(result.roi).toBe("0.30");
      expect(result.avgXPts).toBe("1.15");
    });

    it("ignores opponent stats", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "OPPONENT:10",
        },
      ];
      const result = calculateShotROI(stats as StatEvent[]);
      expect(result.totalPoints).toBe(0);
    });
  });
});
