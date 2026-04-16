import { jest } from "@jest/globals";
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
        "Period must be an integer between 1 and 20",
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
        "Clock time must be an integer between 0 and 3600 seconds",
      );
    });

    it("rejects non-integer location coordinates", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fa",
        points: 2,
        locationX: 50.5,
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Location coordinates must be integers",
      );
    });

    it("rejects 3-digit jersey numbers for opponents", async () => {
      const event = createEvent("POST", `/games/${gameId}/stats`, {
        type: "MAKE",
        playerId: "OPPONENT:123",
        points: 2,
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toContain(
        "Valid playerId is required",
      );
    });
  });

  describe("Cleanup Endpoint Hardening", () => {
    it("rejects extremely long API keys in cleanup request", async () => {
      process.env.ADMIN_API_KEY = "secret";
      const event = createEvent("POST", "/cleanup");
      event.headers = { "x-api-key": "a".repeat(129) };
      const response: any = await handler(event);
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body).message).toContain("Invalid key format");
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
});
