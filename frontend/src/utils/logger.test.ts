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

    capturedEntry = null;
    logger.info("Do not notify me");
    expect(capturedEntry).toBeNull();
  });

  it("redacts sensitive keys in messages with different formats", () => {
    logger.info('API Key="hidden-key"');
    expect(logger.getLogs()[0].message).toBe(
      '[REDACTED] [REDACTED]="[REDACTED]"',
    );

    logger.clearLogs();
    logger.info("token: my-token");
    expect(logger.getLogs()[0].message).toBe("[REDACTED]: [REDACTED]");

    logger.clearLogs();
    logger.info("Authorization Bearer super-secret-token");
    expect(logger.getLogs()[0].message).toBe(
      "[REDACTED] Bearer super-[REDACTED]-[REDACTED]",
    );
  });

  it("handles deep recursion and arrays in redaction", () => {
    const deepContext = {
      level1: {
        level2: {
          level3: {
            password: "p",
            list: ["plain", { secret: "s" }],
          },
        },
      },
    };
    logger.info("Deep nesting", deepContext);
    const logs = logger.getLogs();
    const l3 = (logs[0].context as any).level1.level2.level3;
    expect(l3.password).toBe("[REDACTED]");
    expect(l3.list[1].secret).toBe("[REDACTED]");
  });

  it("redacts Error properties", () => {
    const err = new Error("Failed");
    (err as any).token = "secret";
    logger.error("Error with token", err);
    expect((logger.getLogs()[0].error as any).token).toBe("[REDACTED]");
  });

  it("redacts standalone sensitive words in messages", () => {
    logger.info("The password was leaked");
    expect(logger.getLogs()[0].message).toContain("[REDACTED]");
  });

  it("stops redaction at depth limit", () => {
    const createDeep = (d: number): any => {
      if (d === 0) return { password: "p" };
      return { next: createDeep(d - 1) };
    };
    const deep = createDeep(12);
    logger.info("Too deep", deep);
    // Should contain [DEPTH_LIMIT] somewhere deep
    let current = logger.getLogs()[0].context as any;
    for (let i = 0; i < 11; i++) {
      current = current.next;
    }
    expect(current).toBe("[DEPTH_LIMIT]");
  });

  it("redacts browser console outputs directly", () => {
    const spyInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spyError = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.info("Secret API Key was leaked here", { apiKey: "super-secret" });
    expect(spyInfo).toHaveBeenCalled();
    const infoArgs = spyInfo.mock.calls[0];
    expect(infoArgs[0]).toContain("[REDACTED]");
    expect(infoArgs[0]).not.toContain("API Key");
    expect(infoArgs[1].context.apiKey).toBe("[REDACTED]");

    logger.warn("Attention token", { token: "secret-token-123" });
    expect(spyWarn).toHaveBeenCalled();
    const warnArgs = spyWarn.mock.calls[0];
    expect(warnArgs[0]).toContain("[REDACTED]");
    expect(warnArgs[1].context.token).toBe("[REDACTED]");

    const err = new Error("Connection failed due to password=my_password");
    logger.error("Authentication Error with password", err, { password: "other-password" });
    expect(spyError).toHaveBeenCalled();
    const errorArgs = spyError.mock.calls[0];
    expect(errorArgs[0]).toContain("[REDACTED]");
    expect(errorArgs[1].message).toContain("[REDACTED]");
    expect(errorArgs[1].message).not.toContain("my_password");
    expect(errorArgs[2].password).toBe("[REDACTED]");
  });
});
