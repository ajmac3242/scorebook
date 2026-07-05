import { describe, it, expect, beforeEach, vi } from "vitest";
import { logger } from "./logger";

describe("Sentinel Frontend Logger Enhancements", () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it("redacts new sensitive keys in context", () => {
    logger.info("Test new keys", { "x-api-token": "secret123", "x-user-id": "user456" });
    const logs = logger.getLogs();
    expect(logs[0].context).toEqual({ "x-api-token": "[REDACTED]", "x-user-id": "[REDACTED]" });
  });

  it("redacts sensitive information with => delimiter in message", () => {
    logger.info("Setting x-refresh-token => mysecrettoken");
    const logs = logger.getLogs();
    expect(logs[0].message).toContain("[REDACTED] => [REDACTED]");
    expect(logs[0].message).not.toContain("mysecrettoken");
  });

  it("redacts sensitive information with -> delimiter in message (existing)", () => {
    logger.info("token -> some-token");
    const logs = logger.getLogs();
    expect(logs[0].message).toContain("[REDACTED] -> [REDACTED]");
  });
});
