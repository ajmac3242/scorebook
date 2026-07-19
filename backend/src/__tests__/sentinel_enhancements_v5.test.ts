import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock uuid BEFORE any other imports to prevent ESM loading issues in Jest
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

import { handler } from "../index.js";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { redactString } from "../utils.js";
import { validateStatEvent, validateGameMetadata } from "../validation.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Sentinel Security Enhancements V5", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe("Step 1 & 2: statEvent validation (period, clockTime)", () => {
    const validEvent = {
      type: "MAKE",
      playerId: "277e909a-6536-4d2d-937e-f608759556fb",
      points: 2,
      period: 1,
      clockTime: 600,
    };

    it("rejects period > 20", () => {
      expect(validateStatEvent({ ...validEvent, period: 21 })).toBe(
        "Period must be under 20",
      );
    });

    it("rejects clockTime > 3600", () => {
      expect(validateStatEvent({ ...validEvent, clockTime: 3601 })).toBe(
        "Clock time exceeds maximum allowed value of 3600",
      );
    });

    it("accepts valid period and clockTime", () => {
      expect(
        validateStatEvent({ ...validEvent, period: 5, clockTime: 3600 }),
      ).toBeNull();
    });
  });

  describe("Step 3: validateGameMetadata (completed field type safety)", () => {
    const validMeta = {
      teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      opponent: "Rivals",
    };

    it("rejects invalid completed field types", () => {
      expect(validateGameMetadata({ ...validMeta, completed: "yes" })).toBe(
        "Completed must be a boolean or 0 or 1",
      );
      expect(validateGameMetadata({ ...validMeta, completed: 5 })).toBe(
        "Completed must be a boolean or 0 or 1",
      );
    });

    it("accepts valid completed fields", () => {
      expect(
        validateGameMetadata({ ...validMeta, completed: true }),
      ).toBeNull();
      expect(validateGameMetadata({ ...validMeta, completed: 0 })).toBeNull();
    });
  });

  describe("Step 4 & 5: team-player associations (depth/size/string length/jerseyNumber)", () => {
    const createPostRosterEvent = (body: any): any => ({
      version: "2.0",
      rawPath: "/teams/277e909a-6536-4d2d-937e-f608759556fb/players",
      requestContext: {
        http: {
          method: "POST",
          path: "/teams/277e909a-6536-4d2d-937e-f608759556fb/players",
        },
      },
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    it("rejects oversized roster player bodies (property count)", async () => {
      const oversizedBody: any = {
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        jerseyNumber: "15",
      };
      for (let i = 0; i < 60; i++) oversizedBody[`key${i}`] = "value";

      const event = createPostRosterEvent(oversizedBody);
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(400);
      expect(JSON.parse(resp.body).message).toBe(
        "Object property limit exceeded",
      );
    });

    it("rejects roster player bodies with oversized string lengths", async () => {
      const longStringBody = {
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        jerseyNumber: "15",
        notes: "A".repeat(129),
      };

      const event = createPostRosterEvent(longStringBody);
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(400);
      expect(JSON.parse(resp.body).message).toContain(
        "exceeds maximum length of 128 characters",
      );
    });

    it("rejects jersey numbers outside 0-99 range", async () => {
      const badJerseyBody1 = {
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        jerseyNumber: "100",
      };
      const badJerseyBody2 = {
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        jerseyNumber: "-1",
      };

      const event1 = createPostRosterEvent(badJerseyBody1);
      const resp1: any = await handler(event1);
      expect(resp1.statusCode).toBe(400);
      expect(JSON.parse(resp1.body).message).toBe(
        "Jersey number must be between 0 and 99",
      );

      const event2 = createPostRosterEvent(badJerseyBody2);
      const resp2: any = await handler(event2);
      expect(resp2.statusCode).toBe(400);
      expect(JSON.parse(resp2.body).message).toBe(
        "Jersey number must be 1-3 digits",
      );
    });
  });

  describe("Step 6 & 7: index.ts (query parameter and path length limits)", () => {
    it("rejects too many query parameters (> 50)", async () => {
      const queryParams: Record<string, string> = {};
      for (let i = 0; i < 51; i++) queryParams[`param${i}`] = "val";

      const event: any = {
        version: "2.0",
        rawPath: "/teams",
        requestContext: { http: { method: "GET", path: "/teams" } },
        queryStringParameters: queryParams,
      };

      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(400);
      expect(JSON.parse(resp.body).message).toBe("Too many query parameters");
    });

    it("rejects excessively long request paths (> 512)", async () => {
      const longPath = "/teams/" + "a".repeat(510);
      const event: any = {
        version: "2.0",
        rawPath: longPath,
        requestContext: { http: { method: "GET", path: longPath } },
      };

      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(400);
      expect(JSON.parse(resp.body).message).toBe("Request path too long");
    });
  });

  describe("Step 8: Log Injection mitigation in redactString", () => {
    it("escapes carriage returns, line feeds, and null bytes in logs", () => {
      const dirtyLog = "Unauthorized attempt\r\n[INFO] Routing: fake-info\0";
      const sanitized = redactString(dirtyLog);
      expect(sanitized).toBe(
        "Unauthorized attempt\\r\\n[INFO] Routing: fake-info\\0",
      );
      expect(sanitized).not.toContain("\r");
      expect(sanitized).not.toContain("\n");
      expect(sanitized).not.toContain("\0");
    });
  });

  describe("Step 9: Expanded XSS prevention pattern", () => {
    const validEvent = {
      type: "MAKE",
      playerId: "277e909a-6536-4d2d-937e-f608759556fb",
      points: 2,
    };

    it("rejects vector containing svg tag", () => {
      expect(
        validateStatEvent({
          ...validEvent,
          situation: "ATO",
          notes: "<svg onload=alert(1)>",
        }),
      ).toContain("potentially malicious content");
    });

    it("rejects vector containing onclick event handler", () => {
      expect(
        validateStatEvent({
          ...validEvent,
          situation: "ATO",
          notes: "something onclick=alert(1)",
        }),
      ).toContain("potentially malicious content");
    });
  });
});
