import { describe, it, expect } from "vitest";
import { getBonusStatus } from "./stats/aggregators";
import { BONUS_CONFIG } from "../constants/stats";

describe("Basketball Bonus Logic", () => {
  it("should have correct bonus config for QUARTERS", () => {
    expect(BONUS_CONFIG.QUARTERS.single).toBe(5);
    expect(BONUS_CONFIG.QUARTERS.double).toBe(5);
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
    expect(getBonusStatus(5, "QUARTERS").isDouble).toBe(true);

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

  it("should respect custom single and double bonus threshold overrides", () => {
    // Custom single = 3, double = 5
    const status1 = getBonusStatus(2, "QUARTERS", 3, 5);
    expect(status1.isBonus).toBe(false);
    expect(status1.color).toBe("warning.main");

    const status2 = getBonusStatus(3, "QUARTERS", 3, 5);
    expect(status2.isBonus).toBe(true);
    expect(status2.isDouble).toBe(false);
    expect(status2.label).toBe("BONUS");

    const status3 = getBonusStatus(5, "QUARTERS", 3, 5);
    expect(status3.isBonus).toBe(true);
    expect(status3.isDouble).toBe(true);
    expect(status3.label).toBe("DBL BONUS");
  });

  it("should handle zero and negative foul counts gracefully", () => {
    const zeroStatus = getBonusStatus(0, "QUARTERS");
    expect(zeroStatus.isBonus).toBe(false);
    expect(zeroStatus.isDouble).toBe(false);
    expect(zeroStatus.color).toBe("default");

    const negStatus = getBonusStatus(-1, "QUARTERS");
    expect(negStatus.isBonus).toBe(false);
    expect(negStatus.color).toBe("default");
  });

  it("should fallback to QUARTERS config for unknown period types", () => {
    const unknownStatus = getBonusStatus(5, "UNKNOWN_PERIOD_TYPE");
    expect(unknownStatus.isBonus).toBe(true);
    expect(unknownStatus.isDouble).toBe(true);
  });
});
