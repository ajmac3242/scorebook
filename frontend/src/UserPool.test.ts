import { describe, it, expect } from "vitest";
import { UserPool } from "./UserPool";

describe("UserPool", () => {
  it("initializes CognitoUserPool instance correctly", () => {
    expect(UserPool).toBeDefined();
    expect(UserPool.getCurrentUser()).toBeFalsy();
  });
});
