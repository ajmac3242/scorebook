import { describe, it, expect } from "vitest";
import {
  roundToOne,
  formatToOne,
  determineResult,
  formatClock,
  formatTimestampToTime,
} from "./mathUtils";

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
    it("formats 0 seconds correctly", () => {
      expect(formatClock(0)).toBe("0:00");
    });

    it("formats seconds under 10 with a leading zero", () => {
      expect(formatClock(65)).toBe("1:05");
    });

    it("formats 10 minutes correctly", () => {
      expect(formatClock(600)).toBe("10:00");
    });

    it("formats exactly one hour (3600s) correctly", () => {
      expect(formatClock(3600)).toBe("60:00");
    });

    it("formats more than one hour correctly", () => {
      expect(formatClock(3665)).toBe("61:05");
    });
  });

  describe("formatTimestampToTime", () => {
    it("extracts mm:ss from an ISO timestamp", () => {
      expect(formatTimestampToTime("2023-01-01T12:00:30.000Z")).toBe("00:30");
      expect(formatTimestampToTime("2023-01-01T12:15:45.000Z")).toBe("15:45");
    });
  });
});
