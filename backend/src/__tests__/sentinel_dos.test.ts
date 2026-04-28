import {
  describe,
  it,
  expect,
} from "@jest/globals";
import { sanitizeOutput } from "../responses.js";

describe("Sentinel DoS Protection", () => {
  it("limits array size in sanitizeOutput to 1000 items", () => {
    const largeArray = new Array(2000).fill({ id: "test", PK: "internal" });
    const result = sanitizeOutput(largeArray) as any[];
    expect(result.length).toBe(1000);
    expect(result[0].PK).toBeUndefined();
  });
});
