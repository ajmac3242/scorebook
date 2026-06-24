import { describe, it, expect } from "vitest";
import { getBonusStatus } from "../stats/aggregators";
import { BONUS_CONFIG } from "../../constants/stats";

describe("Basketball Bonus Logic", () => {
  it("should have correct bonus config for QUARTERS", () => {
    expect(BONUS_CONFIG.QUARTERS.single).toBe(5);
    expect(BONUS_CONFIG.QUARTERS.warning).toBe(4);
  });

  it("should have correct bonus config for HALVES", () => {
    expect(BONUS_CONFIG.HALVES.single).toBe(7);
    expect(BONUS_CONFIG.HALVES.warning).toBe(6);
  });

  it("should correctly identify bonus state from status", () => {
    // Quarters
    expect(getBonusStatus(4, "QUARTERS").isBonus).toBe(false);
    expect(getBonusStatus(5, "QUARTERS").isBonus).toBe(true);

    // Halves
    expect(getBonusStatus(6, "HALVES").isBonus).toBe(false);
    expect(getBonusStatus(7, "HALVES").isBonus).toBe(true);
  });

  it("should correctly identify warning state from status", () => {
    // Quarters
    expect(getBonusStatus(3, "QUARTERS").color).toBe("default");
    expect(getBonusStatus(4, "QUARTERS").color).toBe("warning.main");
    expect(getBonusStatus(5, "QUARTERS").color).toBe("error.main");

    // Halves
    expect(getBonusStatus(5, "HALVES").color).toBe("default");
    expect(getBonusStatus(6, "HALVES").color).toBe("warning.main");
    expect(getBonusStatus(7, "HALVES").color).toBe("error.main");
  });
});
