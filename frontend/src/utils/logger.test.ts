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
    expect(logs[0]).toMatchObject({
      level: "info",
      message: "Test info message",
      context: { foo: "bar" },
    });
    expect(logs[0].timestamp).toBeDefined();
  });

  it("stores warn logs", () => {
    logger.warn("Test warn message", { baz: 123 });
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: "warn",
      message: "Test warn message",
      context: { baz: 123 },
    });
  });

  it("stores error logs", () => {
    const error = new Error("Sample error");
    logger.error("Test error message", error, { extra: "data" });
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: "error",
      message: "Test error message",
      error: {
        message: "Sample error",
        name: "Error",
      },
      context: { extra: "data" },
    });
  });

  it("limits the number of logs to 50", () => {
    for (let i = 0; i < 60; i++) {
      logger.info(`Message ${i}`);
    }
    const logs = logger.getLogs();
    expect(logs).toHaveLength(50);
    expect(logs[0].message).toBe("Message 10");
    expect(logs[49].message).toBe("Message 59");
  });

  it("allows clearing logs", () => {
    logger.info("Message 1");
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });

  it("notifies subscribers of new logs", () => {
    const listener = vi.fn();
    const unsubscribe = logger.subscribe(listener);

    logger.info("Subscribed message");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Subscribed message",
        level: "info",
      }),
    );

    unsubscribe();
    logger.info("Unsubscribed message");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
