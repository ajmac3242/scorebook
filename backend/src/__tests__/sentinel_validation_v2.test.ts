import {
  describe,
  it,
  expect,
} from "@jest/globals";
import { validateStatEvent } from "../validation.js";

const VALID_ID = "277e909a-6536-4d2d-937e-f608759556fb";

describe("Sentinel Stat Validation", () => {
  it("prevents playerId and relatedPlayerId from being the same", () => {
    const stat = {
      type: "ASSIST",
      playerId: VALID_ID,
      relatedPlayerId: VALID_ID,
    };
    expect(validateStatEvent(stat)).toBe("playerId and relatedPlayerId must be different");
  });

  it("prevents subInPlayerId and subOutPlayerId from being the same", () => {
    const stat = {
      type: "SUB_IN",
      playerId: VALID_ID,
      subInPlayerId: VALID_ID,
      subOutPlayerId: VALID_ID,
    };
    expect(validateStatEvent(stat)).toBe("subInPlayerId and subOutPlayerId must be different");
  });

  it("validates stat id format in validateStatEvent", () => {
    const stat = {
      type: "MAKE",
      playerId: VALID_ID,
      id: "not-a-uuid",
    };
    expect(validateStatEvent(stat)).toBe("Invalid stat id format (UUID required)");
  });

  it("validates playType length", () => {
    const stat = {
      type: "MAKE",
      playerId: VALID_ID,
      playType: "A".repeat(51),
    };
    expect(validateStatEvent(stat)).toBe("Invalid play type");
  });
});
