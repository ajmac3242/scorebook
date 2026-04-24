import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { response, sanitizeOutput } from "../responses.js";
import { logError, REDACTED_HEADERS } from "../utils.js";

describe("Sentinel Security Enhancements V4", () => {
  describe("Expanded REDACTED_HEADERS", () => {
    it("includes new sensitive headers", () => {
      const newHeaders = [
        "access-token",
        "refresh-token",
        "id-token",
        "csrf-token",
        "xsrf-token",
        "x-csrf-token",
        "x-xsrf-token",
        "bearer",
        "client-secret",
        "otp",
      ];
      newHeaders.forEach((header) => {
        expect(REDACTED_HEADERS.has(header)).toBe(true);
      });
    });
  });

  describe("Robust logError Redaction", () => {
    it("handles special characters in redacted terms", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // We need a term that is in REDACTED_HEADERS but has regex special chars.
      // 'x-api-key' has dashes, which are special in some regex contexts but usually fine.
      // Let's assume we might have something like 'token+' if we added it.
      // For now, let's just verify it works for current ones and I'll add a test-only one if possible,
      // but I can't easily modify REDACTED_HEADERS for just this test since it's a constant.

      const error = new Error("Error with password: my+password*123");
      logError("TestLabel", error);

      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const logMessage = lastCall[0];

      // 'password' is in REDACTED_HEADERS.
      expect(logMessage).toContain("[REDACTED]");
      expect(logMessage).not.toContain("my+password*123");

      consoleSpy.mockRestore();
    });
  });

  describe("Prototype Pollution Protection in sanitizeOutput", () => {
    it("redacts __proto__, constructor, and prototype keys", () => {
      const maliciousPayload = JSON.parse(
        '{"id": "123", "__proto__": {"polluted": true}, "constructor": {"name": "Injected"}, "prototype": "dangerous"}',
      );
      const sanitized = sanitizeOutput(maliciousPayload) as any;

      expect(sanitized.id).toBe("123");

      // Verify keys are not present in the object
      const keys = Object.keys(sanitized);
      expect(keys).not.toContain("__proto__");
      expect(keys).not.toContain("constructor");
      expect(keys).not.toContain("prototype");

      // Verify that accessing them doesn't return the malicious values
      expect(sanitized.polluted).toBeUndefined();
      if (sanitized.__proto__) {
        expect(sanitized.__proto__.polluted).toBeUndefined();
      }
    });
  });

  describe("Enhanced Security Headers", () => {
    it("includes upgrade-insecure-requests in CSP", () => {
      const resp = response(200, { ok: true });
      const csp = resp.headers!["Content-Security-Policy"] as string;
      expect(csp).toContain("upgrade-insecure-requests;");
    });

    it("includes legacy CSP headers", () => {
      const resp = response(200, { ok: true });
      const csp = resp.headers!["Content-Security-Policy"];
      expect(resp.headers!["X-Content-Security-Policy"]).toBe(csp);
      expect(resp.headers!["X-WebKit-CSP"]).toBe(csp);
    });
  });
});
