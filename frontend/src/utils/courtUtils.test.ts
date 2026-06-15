import { describe, it, expect } from "vitest";
import { detectShotValueFromCoords } from "./courtUtils";

describe("detectShotValueFromCoords", () => {
  it("case 1: Left sideline corner (svgX <= 30, svgY <= 140)", () => {
    expect(detectShotValueFromCoords(3, 20)).toBe(3);
  });

  it("case 2: Right sideline corner (svgX >= 470, svgY <= 140)", () => {
    expect(detectShotValueFromCoords(97, 20)).toBe(3);
  });

  it("case 3: Mid-range inside arc, above the line (svgY <= 140, 30 < svgX < 470)", () => {
    expect(detectShotValueFromCoords(50, 20)).toBe(2);
  });

  it("case 4: Center of the court above line", () => {
    expect(detectShotValueFromCoords(50, 10)).toBe(2);
  });

  it("case 5: Below the line, inside the arc (dist < 220)", () => {
    expect(detectShotValueFromCoords(50, 50)).toBe(2);
  });

  it("case 6: Below the line, exactly on the arc boundary (dist == 220)", () => {
    expect(detectShotValueFromCoords(5, 80)).toBe(3);
  });

  it("case 7: Below the line, far outside the arc (dist > 220)", () => {
    expect(detectShotValueFromCoords(2, 90)).toBe(3);
  });

  it("case 8: svgY exactly equals 140 (boundary condition, uses svgY <= 140 branch)", () => {
    expect(detectShotValueFromCoords(50, 29.79)).toBe(2);
  });

  it("case 9: Left corner below the line", () => {
    expect(detectShotValueFromCoords(1, 70)).toBe(3);
  });

  it("case 10: Right corner below the line", () => {
    expect(detectShotValueFromCoords(99, 70)).toBe(3);
  });
});
