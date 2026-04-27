import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock uuid BEFORE any other imports
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

import { handler } from "../index.js";
import { response } from "../responses.js";
import { logError } from "../utils.js";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Sentinel Security Enhancements V3", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.ADMIN_API_KEY = "a-very-long-and-secure-admin-api-key-123";
  });

  describe("Recursion Depth Limit in sanitizeForLog", () => {
    it("stops recursion at depth 10 in sanitizeForLog", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 15; i++) {
        current.nested = { id: `level-${i}` };
        current = current.nested;
      }

      // logError uses sanitizeForLog for non-Error objects
      logError("DeepObjectTest", deepObject);

      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      const logString = JSON.stringify(lastCall);

      expect(logString).toContain("[DEPTH_LIMIT_REACHED]");
      expect(logString).not.toContain("level-11");

      consoleSpy.mockRestore();
    });
  });

  describe("Security Header Protection", () => {
    it("critical security headers cannot be overridden", () => {
      const customHeaders = {
        "X-Frame-Options": "ALLOW-FROM https://evil.com",
        "Content-Security-Policy": "default-src *",
        "X-Custom-Header": "Allowed",
      };

      const resp = response(200, { ok: true }, customHeaders);

      expect(resp.headers!["X-Frame-Options"]).toBe("DENY");
      expect(resp.headers!["Content-Security-Policy"]).toBe(
        "default-src 'none'; object-src 'none'; script-src 'none'; frame-ancestors 'none'; sandbox; base-uri 'none'; form-action 'none'; upgrade-insecure-requests;",
      );
      expect(resp.headers!["X-Custom-Header"]).toBe("Allowed");
    });

    it("includes new Origin-Agent-Cluster and COEP headers", () => {
      const resp = response(200, { ok: true });
      expect(resp.headers!["Origin-Agent-Cluster"]).toBe("?1");
      expect(resp.headers!["Cross-Origin-Embedder-Policy"]).toBe(
        "require-corp",
      );
    });

    it("tightens Permissions-Policy", () => {
      const resp = response(200, { ok: true });
      expect(resp.headers!["Permissions-Policy"]).toBe(
        "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=(), usb=(), bluetooth=(), hid=(), serial=(), idle-detection=(), keyboard-map=(), screen-wake-lock=()",
      );
    });
  });

  describe("ADMIN_API_KEY Length Enforcement", () => {
    const createEvent = (method: string, path: string): any => ({
      version: "2.0",
      rawPath: path,
      requestContext: { http: { method, path } },
      headers: { "x-api-key": "some-key" },
    });

    it("rejects cleanup if ADMIN_API_KEY is too short (< 16 chars)", async () => {
      process.env.ADMIN_API_KEY = "too-short";
      const event = createEvent("POST", "/cleanup");
      const resp: any = await handler(event);

      expect(resp.statusCode).toBe(403);
      expect(JSON.parse(resp.body).message).toBe(
        "Unauthorized cleanup request",
      );
    });

    it("accepts cleanup if ADMIN_API_KEY is at least 16 chars and matches", async () => {
      const secureKey = "a-very-long-and-secure-admin-api-key-123";
      process.env.ADMIN_API_KEY = secureKey;
      const event = createEvent("POST", "/cleanup");
      event.headers["x-api-key"] = secureKey;

      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(200);
    });
  });

  describe("Constant Immutability", () => {
    it("REDACTED_HEADERS is frozen", () => {
      const { REDACTED_HEADERS } = require("../utils.js");
      expect(Object.isFrozen(REDACTED_HEADERS)).toBe(true);
    });

    it("INTERNAL_KEYS is frozen", () => {
      const { INTERNAL_KEYS } = require("../responses.js");
      expect(Object.isFrozen(INTERNAL_KEYS)).toBe(true);
    });

    it("SPECIAL_PLAYER_IDS is frozen", () => {
      const { SPECIAL_PLAYER_IDS } = require("../validation.js");
      expect(Object.isFrozen(SPECIAL_PLAYER_IDS)).toBe(true);
    });

    it("VALID_ACTION_TYPES is frozen", () => {
      const { VALID_ACTION_TYPES } = require("../validation.js");
      expect(Object.isFrozen(VALID_ACTION_TYPES)).toBe(true);
    });
  });
});
