import { describe, it, expect } from "vitest";
import { getShotZone, getHeatmapColor, XPTS_TABLE } from "../shotZones";

describe("shotZones.ts", () => {
  describe("getShotZone", () => {
    it("identifies Restricted Area (RA)", () => {
      // Rim is at (250, 47) in SVG coords. (50, 10) in 0-100 coords -> (250, 47)
      expect(getShotZone(50, 10)).toBe("RA");
      expect(getShotZone(51, 11)).toBe("RA");
    });

    it.each([
      [50, 10 + 44.9 / 4.7, "RA"], // Inside RA (svgDist ~44.9)
      [50, 10 + 45 / 4.7, "RA"], // On RA boundary (svgDist 45)
      [50, 10 + 45.1 / 4.7, "PAINT"], // Just outside RA (svgDist 45.1)
    ])("RA boundary check at (%f, %f) should be %s", (x, y, expected) => {
      expect(getShotZone(x, y)).toBe(expected);
    });

    it("identifies the Paint", () => {
      // Paint is (170-330, 0-190) in SVG coords.
      // (40, 20) -> (200, 94) which is in paint
      expect(getShotZone(40, 20)).toBe("PAINT");
      expect(getShotZone(60, 30)).toBe("PAINT");
    });

    it.each([
      [169 / 5, 100 / 4.7, "MID_LEFT"], // Just left of paint
      [170 / 5, 100 / 4.7, "PAINT"], // Left edge of paint
      [330 / 5, 100 / 4.7, "PAINT"], // Right edge of paint
      [331 / 5, 100 / 4.7, "MID_RIGHT"], // Just right of paint
      [250 / 5, 190 / 4.7, "PAINT"], // Bottom edge of paint
      [250 / 5, 191 / 4.7, "MID_CENTER"], // Just below paint
    ])("Paint boundary check at (%f, %f) should be %s", (x, y, expected) => {
      expect(getShotZone(x, y)).toBe(expected);
    });

    it("identifies Corner 3s", () => {
      // svgY <= 140 and (svgX <= 30 or svgX >= 470)
      // (5, 10) -> (25, 47) -> Left Corner 3
      expect(getShotZone(5, 10)).toBe("3PT_LEFT_CORNER");
      // (95, 10) -> (475, 47) -> Right Corner 3
      expect(getShotZone(95, 10)).toBe("3PT_RIGHT_CORNER");
    });

    it.each([
      [30 / 5, 140 / 4.7, "3PT_LEFT_CORNER"], // Edge of corner 3
      [31 / 5, 140 / 4.7, "MID_LEFT"], // Just inside corner 3 edge
      [470 / 5, 140 / 4.7, "3PT_RIGHT_CORNER"], // Edge of corner 3
      [469 / 5, 140 / 4.7, "MID_RIGHT"], // Just inside corner 3 edge
    ])(
      "Corner 3 horizontal boundary check at (%f, %f) should be %s",
      (x, y, expected) => {
        expect(getShotZone(x, y)).toBe(expected);
      },
    );

    it.each([
      [10 / 5, 140 / 4.7, "3PT_LEFT_CORNER"], // On vertical boundary
      [10 / 5, 141 / 4.7, "3PT_LEFT"], // Just above corner (Wing 3)
    ])(
      "Corner 3 vertical boundary check at (%f, %f) should be %s",
      (x, y, expected) => {
        expect(getShotZone(x, y)).toBe(expected);
      },
    );

    it("identifies Wings and Center 3s", () => {
      // Center 3: (50, 90) -> (250, 423) -> angle around 90 deg
      expect(getShotZone(50, 90)).toBe("3PT_CENTER");
      // Left Wing 3: (1, 80) -> (5, 376) -> angle = atan2(236, -245) = 136.1 deg > 135
      expect(getShotZone(1, 80)).toBe("3PT_LEFT");
      // Right Wing 3: (99, 40) -> (495, 188). svgY-140 = 48, svgX-250 = 245. atan2(48, 245) = 11 deg < 45.
      expect(getShotZone(99, 40)).toBe("3PT_RIGHT");
    });

    it.each([
      [250 / 5, (140 + 219.9) / 4.7, "MID_CENTER"], // Inside 3pt arc
      [250 / 5, (140 + 220) / 4.7, "3PT_CENTER"], // On 3pt arc boundary
      [250 / 5, (140 + 220.1) / 4.7, "3PT_CENTER"], // Just outside 3pt arc
    ])("Arc 3PT boundary check at (%f, %f) should be %s", (x, y, expected) => {
      expect(getShotZone(x, y)).toBe(expected);
    });

    it("identifies Mid-range zones", () => {
      // Mid Left: (10, 20) -> (50, 94). Not 3pt (x>30), Not paint (x<170)
      expect(getShotZone(10, 20)).toBe("MID_LEFT");
      // Mid Center: (50, 50) -> (250, 235). Not paint (y>190), Not 3pt
      expect(getShotZone(50, 50)).toBe("MID_CENTER");
      // Mid Right: (90, 20) -> (450, 94)
      expect(getShotZone(90, 20)).toBe("MID_RIGHT");
    });
  });

  describe("getHeatmapColor", () => {
    it("returns colors for various percentages", () => {
      expect(getHeatmapColor(50)).toBe("#4caf50");
      expect(getHeatmapColor(40)).toBe("#8bc34a");
      expect(getHeatmapColor(30)).toBe("#ffeb3b");
      expect(getHeatmapColor(20)).toBe("#ff9800");
      expect(getHeatmapColor(10)).toBe("#f44336");
    });
  });

  describe("XPTS_TABLE", () => {
    it("has entries for all shot zones", () => {
      expect(Object.keys(XPTS_TABLE)).toHaveLength(10);
      expect(XPTS_TABLE.RA.OPEN).toBe(1.65);
    });
  });
});
