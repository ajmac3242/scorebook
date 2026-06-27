import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.restoreAllMocks();
  });

  it("stores info logs", () => {
    logger.info("Test info message", { foo: "bar" });
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe("info");
    expect(logs[0].message).toBe("Test info message");
    expect(logs[0].context).toEqual({ foo: "bar" });
  });

  it("stores warn logs", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("Test warn message", { baz: 123 });
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe("warn");
    expect(spy).toHaveBeenCalled();
  });

  it("stores error logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Sample error");
    logger.error("Test error message", error, { extra: "data" });
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe("error");
    expect(logs[0].error).toBeDefined();
    expect(spy).toHaveBeenCalled();
  });

  it("redacts sensitive information in messages", () => {
    logger.info("User password is secret123");
    const logs = logger.getLogs();
    expect(logs[0].message).toContain("[REDACTED]");
    expect(logs[0].message).not.toContain("secret123");
  });

  it("redacts sensitive keys in context objects", () => {
    logger.info("Login attempt", { password: "mypassword", token: "abc" });
    const logs = logger.getLogs();
    expect(logs[0].context).toEqual({
      password: "[REDACTED]",
      token: "[REDACTED]",
    });
  });

  it("handles non-Error objects as error parameter", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("Non-Error", { some: "data" });
    const logs = logger.getLogs();
    expect(logs[0].error).toEqual({ some: "data" });
    expect(spy).toHaveBeenCalled();
  });

  it("limits log history to MAX_LOGS", () => {
    for (let i = 0; i < 60; i++) {
      logger.info(`Message ${i}`);
    }
    expect(logger.getLogs()).toHaveLength(50);
  });

  it("notifies listeners on new logs", () => {
    let capturedEntry: any = null;
    const unsubscribe = logger.subscribe((entry) => {
      capturedEntry = entry;
    });
    logger.info("Notify me");
    expect(capturedEntry.message).toBe("Notify me");
    unsubscribe();
  });
});
