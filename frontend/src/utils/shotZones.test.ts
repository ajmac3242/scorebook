import { describe, it, expect } from "vitest";
import { getShotZone, getHeatmapColor } from "./shotZones";

describe("shotZones.ts", () => {
  describe("getShotZone", () => {
    it("identifies Restricted Area (RA)", () => {
      // Rim is at (250, 47) in SVG coords. (50, 10) in 0-100 coords -> (250, 47)
      expect(getShotZone(50, 10)).toBe("RA");
      expect(getShotZone(51, 11)).toBe("RA");
    });

    it("identifies the Paint", () => {
      // Paint is (170-330, 0-190) in SVG coords.
      // (40, 20) -> (200, 94) which is in paint
      expect(getShotZone(40, 20)).toBe("PAINT");
      expect(getShotZone(60, 30)).toBe("PAINT");
    });

    it("identifies Corner 3s", () => {
      // svgY <= 140 and (svgX <= 30 or svgX >= 470)
      // (5, 10) -> (25, 47) -> Left Corner 3
      expect(getShotZone(5, 10)).toBe("3PT_LEFT_CORNER");
      // (95, 10) -> (475, 47) -> Right Corner 3
      expect(getShotZone(95, 10)).toBe("3PT_RIGHT_CORNER");
    });

    it("identifies Wings and Center 3s", () => {
      // Center 3: (50, 90) -> (250, 423) -> angle around 90 deg
      expect(getShotZone(50, 90)).toBe("3PT_CENTER");
      // Left Wing 3: (1, 80) -> (5, 376) -> angle = atan2(236, -245) = 136.1 deg > 135
      expect(getShotZone(1, 80)).toBe("3PT_LEFT");
      // Right Wing 3: (99, 40) -> (495, 188). svgY-140 = 48, svgX-250 = 245. atan2(48, 245) = 11 deg < 45.
      expect(getShotZone(99, 40)).toBe("3PT_RIGHT");
    });

    it("identifies Mid-range zones", () => {
      // Mid Left: (10, 20) -> (50, 94). Not 3pt (x>30), Not paint (x<170)
      expect(getShotZone(10, 20)).toBe("MID_LEFT");
      // Mid Center: (50, 50) -> (250, 235). Not paint (y>190), Not 3pt
      expect(getShotZone(50, 50)).toBe("MID_CENTER");
      // Mid Right: (90, 20) -> (450, 94)
      expect(getShotZone(90, 20)).toBe("MID_RIGHT");
    });

    it("covers edge cases for mid-range and heatmaps", () => {
      // svgY > 140, svgX < 170 -> MID_LEFT
      // 100/5 = 20. 20 * 5 = 100. 40 * 4.7 = 188.
      expect(getShotZone(20, 40)).toBe("MID_LEFT");
      // svgY > 140, svgX > 330 -> MID_RIGHT
      // 80 * 5 = 400. 40 * 4.7 = 188.
      expect(getShotZone(80, 40)).toBe("MID_RIGHT");
    });
  });

  describe("getHeatmapColor", () => {
    it("returns correct colors for percentages", () => {
      expect(getHeatmapColor(55)).toBe("#4caf50");
      expect(getHeatmapColor(45)).toBe("#8bc34a");
      expect(getHeatmapColor(35)).toBe("#ffeb3b");
      expect(getHeatmapColor(25)).toBe("#ff9800");
      expect(getHeatmapColor(15)).toBe("#f44336");
    });
  });
});
