import { describe, it, expect } from "vitest";
import { roundToOne, formatToOne, determineResult } from "./mathUtils";

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
});
