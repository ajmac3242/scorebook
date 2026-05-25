import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "277e909a-6536-4d2d-937e-f608759556f8"),
}));

describe("Sentinel Security Enhancements Tests", () => {
  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    process.env.TABLE_NAME = "TestTable";
    process.env.DATA_BUCKET = "TestDataBucket";
    process.env.ADMIN_API_KEY = "test-admin-key-secure";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
    queryStringParameters: any = null,
  ): any => ({
    version: "2.0",
    rawPath: path,
    headers: ["POST", "PUT", "PATCH"].includes(method)
      ? { "content-type": "application/json" }
      : {},
    requestContext: {
      http: {
        method,
        path,
      },
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
  });

  describe("Path Parameter Validation", () => {
    it("rejects invalid UUID in /players/{playerId}", async () => {
      const event = createEvent("DELETE", "/players/not-a-uuid");
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain("UUID required");
    });

    it("rejects invalid UUID in /teams/{teamId}", async () => {
      const event = createEvent("DELETE", "/teams/not-a-uuid");
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain("UUID required");
    });

    it("rejects invalid UUID in /games/{gameId}", async () => {
      const event = createEvent("DELETE", "/games/not-a-uuid");
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain("UUID required");
    });
  });

  describe("Query Parameter Validation", () => {
    it("rejects invalid UUID in teamId query param for GET /games", async () => {
      const event = createEvent("GET", "/games", null, {
        teamId: "invalid-uuid",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Valid teamId (UUID) is required",
      );
    });
  });

  describe("Stat Event Validation", () => {
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";

    it("rejects invalid playerId in stat event", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        points: 2,
        playerId: "invalid-player-id",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Valid playerId is required",
      );
    });

    it("accepts special player IDs in stat event", async () => {
      ddbMock.on(PutCommand).resolves({});
      s3Mock.on(PutObjectCommand).resolves({});
      ddbMock.on(GetCommand).resolves({ Item: { id: gameId } });
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const specialIds = [
        "OPPONENT",
        "OPPONENT:12",
        "OUR_TEAM",
        "TEAM_TIMEOUT",
      ];
      for (const pId of specialIds) {
        const event = createEvent("POST", `/games/${gameId}/stats`, {
          type: "MAKE",
          points: 2,
          playerId: pId,
        });
        const response: any = await handler(event);
        expect(response.statusCode).toBe(201);
      }
    });

    it("rejects invalid period in stat event", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fa",
        points: 2,
        period: 0,
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Period must be an integer at least 1",
      );
    });

    it("rejects invalid clockTime in stat event", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fa",
        points: 2,
        clockTime: -1,
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Clock time must be a finite number at least 0",
      );
    });

    it("rejects non-numeric location coordinates", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fa",
        points: 2,
        locationX: "50",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Location coordinates must be finite numbers between 0 and 100",
      );
    });

    it("validates points and period are integers", async () => {
      // Test points as float
      const event1 = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        points: 2.5,
        playerId: "OPPONENT",
      });
      const resp1: any = await handler(event1);
      expect(resp1.statusCode).toBe(400);
      expect(JSON.parse(resp1.body).message).toBe(
        "Points must be an integer between 0 and 3",
      );

      // Test period as float
      const event2 = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        points: 2,
        period: 1.5,
        playerId: "OPPONENT",
      });
      const resp2: any = await handler(event2);
      expect(resp2.statusCode).toBe(400);
      expect(JSON.parse(resp2.body).message).toBe(
        "Period must be an integer at least 1",
      );
    });
  });

  describe("Game Logic Validation", () => {
    it("validates location and date lengths", async () => {
      // Test location too long
      const event1 = createEvent("POST", "/games", {
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
        opponent: "Opp",
        location: "A".repeat(101),
      });
      const resp1: any = await handler(event1);
      expect(resp1.statusCode).toBe(400);
      expect(JSON.parse(resp1.body).message).toBe(
        "Location must be a string under 100 characters",
      );

      // Test date too long
      const event2 = createEvent("POST", "/games", {
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
        opponent: "Opp",
        date: "A".repeat(51),
      });
      const resp2: any = await handler(event2);
      expect(resp2.statusCode).toBe(400);
      expect(JSON.parse(resp2.body).message).toBe(
        "Date must be a string under 50 characters",
      );
    });
  });

  describe("Team Player Validation", () => {
    it("validates jerseyNumber in handleTeams", async () => {
      const teamId = "277e909a-6536-4d2d-937e-f608759556fb";

      // Test non-digit
      const event1 = createEvent("POST", `/teams/${teamId}/players`, {
        playerId: "277e909a-6536-4d2d-937e-f608759556fc",
        jerseyNumber: "12A",
      });
      const resp1: any = await handler(event1);
      expect(resp1.statusCode).toBe(400);
      expect(JSON.parse(resp1.body).message).toBe(
        "Jersey number must be 1-3 digits",
      );

      // Test too long
      const event2 = createEvent("POST", `/teams/${teamId}/players`, {
        playerId: "277e909a-6536-4d2d-937e-f608759556fc",
        jerseyNumber: "1234",
      });
      const resp2: any = await handler(event2);
      expect(resp2.statusCode).toBe(400);
      expect(JSON.parse(resp2.body).message).toBe(
        "Jersey number must be 1-3 digits",
      );
    });
  });

  describe("Recursive Security Logic", () => {
    it("enforces recursion limit in validation and output", async () => {
      const deepObject: any = {};
      let current = deepObject;
      // Build a deep object: root -> nested -> nested ... (15 levels)
      for (let i = 0; i < 15; i++) {
        current.nested = { id: `level-${i}`, PK: "SECRET" };
        current = current.nested;
      }

      // handlePlayers POST uses validatePlayerMetadata which enforces depth limit (10)
      const event = createEvent("POST", "/players", {
        name: "Test",
        ...deepObject,
      });
      ddbMock.on(PutCommand).resolves({});
      const resp: any = await handler(event);

      // Should fail with 400 because strict validation (limit 10) precedes sanitization
      expect(resp.statusCode).toBe(400);
      expect(JSON.parse(resp.body).message).toBe("Object depth limit exceeded");
    });

    it("enforces recursion limit in recursive helpers (stripLocalFields/sanitizeOutput)", async () => {
      // This test targets the internal helpers by using an object exactly at the validation limit
      // but where further processing (like adding metadata) might trigger the limit in helpers.
      // Or just verify they handle it if validation were somehow bypassed.
      const deepObject: any = {};
      let current = deepObject;
      // Build exactly 10 levels of nesting
      for (let i = 0; i < 10; i++) {
        current.nested = { id: `level-${i}`, PK: "SECRET" };
        current = current.nested;
      }

      const event = createEvent("POST", "/players", {
        name: "Test",
        ...deepObject,
      });
      ddbMock.on(PutCommand).resolves({});
      const resp: any = await handler(event);
      expect(resp.statusCode).toBe(201);
      const body = JSON.parse(resp.body);

      let drill = body;
      for (let i = 0; i < 10; i++) {
        expect(drill.nested).toBeDefined();
        drill = drill.nested;
      }
      // The 11th level should be empty/truncated if it existed,
      // but here level 10 had no .nested property.
      expect(drill.nested).toBeUndefined();
    });

    it("recursive stripLocalFields removes nested internal keys", async () => {
      const maliciousBody = {
        name: "Test Player",
        id: "277e909a-6536-4d2d-937e-f608759556fb",
        nested: {
          PK: "HACKED",
          safe: "value",
        },
      };

      const event = createEvent("POST", "/players", maliciousBody);
      ddbMock.on(PutCommand).resolves({});
      await handler(event);

      const putCall = ddbMock.commandCalls(PutCommand)[0];
      const item = putCall.args[0].input.Item as any;
      expect(item.nested.PK).toBeUndefined();
      expect(item.nested.safe).toBe("value");
    });
  });

  describe("Security Headers", () => {
    it("includes COOP and CORP headers", async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      const event = createEvent("GET", "/players");
      const resp: any = await handler(event);
      expect(resp.headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
      expect(resp.headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    });
  });

  describe("Body Parsing", () => {
    it("handles null or non-object bodies safely", async () => {
      // Test null body string
      const event1 = createEvent("POST", "/teams", null);
      event1.body = "null";
      const resp1: any = await handler(event1);
      expect(resp1.statusCode).toBe(400); // Team name is required

      // Test non-object JSON
      const event2 = createEvent("POST", "/teams", null);
      event2.body = "123";
      const resp2: any = await handler(event2);
      expect(resp2.statusCode).toBe(400);
    });
  });

  describe("Score Accumulation Logic", () => {
    it("correctly attributes scores to opponent when jersey-specific ID is used", async () => {
      const gId = "277e909a-6536-4d2d-937e-f608759556fa";
      const tId = "277e909a-6536-4d2d-937e-f608759556fb";
      ddbMock.on(GetCommand).resolves({ Item: { id: gId, teamId: tId } });
      // Mock stats query returning a jersey-specific opponent
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { playerId: "OPPONENT:12", points: 2, type: "MAKE" },
          {
            playerId: "277e909a-6536-4d2d-937e-f608759556fc",
            points: 3,
            type: "MAKE",
          },
        ],
      });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent("POST", `/games/${gId}/complete`);
      await handler(event);

      const s3Call = s3Mock
        .calls()
        .find((call) => (call.args[0].input as any).Key.includes("stats.json"));
      if (!s3Call) throw new Error("S3 call for stats.json not found");
      const input = s3Call.args[0].input as any;
      const snapshot = JSON.parse(input.Body as string);

      // If accumulateScores is buggy, it might attribute OPPONENT:12 to the team
      expect(snapshot.game.oppScore).toBe(2);
      expect(snapshot.game.teamScore).toBe(3);
    });
  });

  describe("New Security Fixes", () => {
    it("should NOT allow extra characters at the end of a timestamp", async () => {
      const malformedBody = {
        id: "277e909a-6536-4d2d-937e-f608759556f8",
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        timestamp: "2023-01-01T12:00:00HACKED",
      };

      const event = createEvent(
        "POST",
        "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
        malformedBody,
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe(
        "Invalid timestamp format",
      );
    });

    it("should reject non-finite numbers for clockTime", async () => {
      const { validateStatEvent } = await import("../validation.js");
      const error = validateStatEvent({
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        clockTime: Infinity,
      });
      expect(error).toBe("Clock time must be a finite number at least 0");
    });

    it("should strip __proto__ in stripLocalFields", async () => {
      const { stripLocalFields } = await import("../utils.js");
      const malicious = JSON.parse(
        '{"name": "test", "__proto__": {"polluted": true}}',
      );
      const cleaned = stripLocalFields(malicious);
      expect((cleaned as any).__proto__.polluted).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(cleaned, "__proto__")).toBe(
        false,
      );
    });

    it("should handle nested arrays in stripLocalFields", async () => {
      const { stripLocalFields } = await import("../utils.js");
      const data = {
        name: "Team",
        PK: "SECRET",
        players: [{ name: "P1", SK: "HIDE" }],
      };
      const cleaned: any = stripLocalFields(data);
      expect(cleaned.PK).toBeUndefined();
      expect((cleaned.players as any)[0].SK).toBeUndefined();
    });

    it("should validate ID in team-player association", async () => {
      const malformedBody = {
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        id: "../../../traversal",
      };

      const event = createEvent(
        "POST",
        "/teams/277e909a-6536-4d2d-937e-f608759556fb/players",
        malformedBody,
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain("UUID required");
    });
  });
});
