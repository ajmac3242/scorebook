import { describe, it, expect } from "vitest";
import {
  roundToOne,
  formatToOne,
  determineResult,
  formatClock,
  formatTimestampToTime,
  getPlusMinusColor,
  formatPlusMinus,
  calculateElapsedSeconds,
  calculateElapsedMinutes,
  getPeriodDurationSeconds,
} from "../mathUtils";

describe("mathUtils", () => {
  describe("roundToOne", () => {
    it("rounds a number with multiple decimal places to one", () => {
      expect(roundToOne(10.55)).toBe(10.6);
      expect(roundToOne(10.54)).toBe(10.5);
    });

    it("handles integers", () => {
      expect(roundToOne(10)).toBe(10);
    });

    it("handles zero", () => {
      expect(roundToOne(0)).toBe(0);
    });

    it("handles negative numbers", () => {
      expect(roundToOne(-10.55)).toBe(-10.5);
      expect(roundToOne(-10.56)).toBe(-10.6);
    });

    it("handles extremely small floating point values", () => {
      expect(roundToOne(0.000001)).toBe(0);
      expect(roundToOne(0.04)).toBe(0);
      expect(roundToOne(0.051)).toBe(0.1);
    });
  });

  describe("formatToOne", () => {
    it("formats a number to a string with one decimal place", () => {
      expect(formatToOne(10.55)).toBe("10.6");
      expect(formatToOne(10.5)).toBe("10.5");
    });

    it("adds .0 to integers", () => {
      expect(formatToOne(10)).toBe("10.0");
    });
  });

  describe("determineResult", () => {
    it("returns 'W' when teamScore > oppScore", () => {
      expect(determineResult(100, 90)).toBe("W");
    });

    it("returns 'L' when teamScore < oppScore", () => {
      expect(determineResult(90, 100)).toBe("L");
    });

    it("returns 'D' when teamScore == oppScore", () => {
      expect(determineResult(90, 90)).toBe("D");
    });
  });

  describe("formatClock", () => {
    it("formats seconds into mm:ss", () => {
      expect(formatClock(600)).toBe("10:00");
      expect(formatClock(599)).toBe("9:59");
      expect(formatClock(0)).toBe("0:00");
      expect(formatClock(61)).toBe("1:01");
    });
  });

  describe("formatTimestampToTime", () => {
    it("extracts mm:ss from ISO timestamp", () => {
      expect(formatTimestampToTime("2023-01-01T12:00:30.000Z")).toBe("00:30");
      expect(formatTimestampToTime("2023-01-01T12:10:05.000Z")).toBe("10:05");
    });
  });

  describe("getPlusMinusColor", () => {
    it("returns 'success.main' for positive values", () => {
      expect(getPlusMinusColor(5)).toBe("success.main");
    });

    it("returns 'error.main' for negative values", () => {
      expect(getPlusMinusColor(-3)).toBe("error.main");
    });

    it("returns 'inherit' for zero", () => {
      expect(getPlusMinusColor(0)).toBe("inherit");
    });
  });

  describe("formatPlusMinus", () => {
    it("adds '+' prefix to positive numbers", () => {
      expect(formatPlusMinus(5)).toBe("+5");
    });

    it("does not add '+' to negative numbers", () => {
      expect(formatPlusMinus(-3)).toBe("-3");
    });

    it("does not add '+' to zero", () => {
      expect(formatPlusMinus(0)).toBe("0");
    });
  });

  describe("calculateElapsedSeconds", () => {
    it.each([
      [1, 600, 600, 0],   // P1 Start
      [1, 0, 600, 600],   // P1 End
      [2, 600, 600, 600], // P2 Start
      [4, 0, 600, 2400],  // P4 End (Standard)
      [5, 300, 600, 2700], // P5 (OT) Start.
    ])("calculateElapsedSeconds(period: %d, clock: %d, duration: %d) should be %d", (p, c, d, expected) => {
        expect(calculateElapsedSeconds(p, c, d)).toBe(expected);
    });
  });

  describe("calculateElapsedMinutes", () => {
    it.each([
      [1, 600, "QUARTERS", 0],
      [1, 0, "QUARTERS", 10],
      [2, 600, "QUARTERS", 10],
      [1, 1200, "HALVES", 0],
      [1, 0, "HALVES", 20],
      [2, 1200, "HALVES", 20],
    ])("calculateElapsedMinutes(period: %d, clock: %d, type: %s) should be %d", (p, c, type, expected) => {
        expect(calculateElapsedMinutes(p, c, type)).toBe(expected);
    });
  });

  describe("getPeriodDurationSeconds", () => {
    it.each([
      [1, "QUARTERS", undefined, undefined, 600],
      [5, "QUARTERS", undefined, undefined, 300], // OT Quarters
      [1, "HALVES", undefined, undefined, 1200],
      [3, "HALVES", undefined, undefined, 300],  // OT Halves
      [1, "QUARTERS", 12, undefined, 720],       // Custom length
      [5, "QUARTERS", undefined, 4, 240],        // Custom OT
    ])("getPeriodDurationSeconds(period: %d, type: %s, len: %j, otLen: %j) should be %d", (p, t, l, ot, expected) => {
        expect(getPeriodDurationSeconds(p, t, l, ot)).toBe(expected);
    });
  });
});
