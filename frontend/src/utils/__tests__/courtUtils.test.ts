import { describe, it, expect } from "vitest";
import { detectShotValueFromCoords } from "../courtUtils";

describe("courtUtils", () => {
  describe("detectShotValueFromCoords", () => {
    // Coordinate system: 0-100 percentage.
    // SVG viewport: 500x470.
    // svgX = x * 5, svgY = y * 4.7

    it("identifies a side 3-pointer (left)", () => {
      // svgX = 5, svgY = 23.5 (<= 140)
      // svgX <= 30 is a 3
      expect(detectShotValueFromCoords(1, 5)).toBe(3);
    });

    it("identifies a side 3-pointer (right)", () => {
      // svgX = 475, svgY = 23.5 (<= 140)
      // svgX >= 470 is a 3
      expect(detectShotValueFromCoords(95, 5)).toBe(3);
    });

    it("identifies a side 2-pointer", () => {
      // svgX = 250, svgY = 23.5 (<= 140)
      // 30 < svgX < 470 is a 2
      expect(detectShotValueFromCoords(50, 5)).toBe(2);
    });

    it("identifies an arc 3-pointer", () => {
      // y = 50 => svgY = 50 * 4.7 = 235 (> 140)
      // Center = (250, 140)
      // dist = sqrt((svgX - 250)^2 + (235 - 140)^2)
      // For svgX = 250, dist = 95 (< 220) => 2
      // For svgX = 0, dist = sqrt(250^2 + 95^2) = sqrt(62500 + 9025) = sqrt(71525) approx 267 (> 220) => 3
      expect(detectShotValueFromCoords(0, 50)).toBe(3);
    });

    it("identifies an arc 2-pointer", () => {
      // svgX = 250, svgY = 235 (> 140)
      // dist = 95 (< 220)
      expect(detectShotValueFromCoords(50, 50)).toBe(2);
    });

    it("identifies a 3-pointer at the very top of the arc", () => {
       // x = 50, svgX = 250
       // dist = 220 => svgY - 140 = 220 => svgY = 360
       // y = 360 / 4.7 approx 76.6
       expect(detectShotValueFromCoords(50, 80)).toBe(3);
    });

    it("identifies a 2-pointer just inside the arc", () => {
       // x = 50, svgX = 250
       // svgY = 350, dist = 210 (< 220)
       expect(detectShotValueFromCoords(50, 350/4.7)).toBe(2);
    });

    it("handles 0,0 coordinate", () => {
       expect(detectShotValueFromCoords(0, 0)).toBe(3); // Corner 3 area
    });

    it("handles 100,100 coordinate", () => {
       // svgX = 500, svgY = 470
       // dist = sqrt(250^2 + 330^2) = sqrt(62500 + 108900) = sqrt(171400) approx 414 (> 220)
       expect(detectShotValueFromCoords(100, 100)).toBe(3);
    });
  });
});
