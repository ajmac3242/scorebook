import { jest } from '@jest/globals';
import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "277e909a-6536-4d2d-937e-f608759556f8"),
}));

describe("Lambda Handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    s3Mock.reset();
    process.env.TABLE_NAME = "TestTable";
    process.env.DATA_BUCKET = "TestDataBucket";
    process.env.ADMIN_API_KEY = "test-admin-key";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
    queryStringParameters: any = null,
  ): any => ({
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    headers: ["POST", "PUT", "PATCH"].includes(method)
      ? { "content-type": "application/json" }
      : {},
    requestContext: {
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest",
      },
    },
    body: body
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : null,
    queryStringParameters,
    isBase64Encoded: false,
  });

  describe("Teams", () => {
    it("GET /teams returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "t1", name: "Team 1" }],
      });

      const event = createEvent("GET", "/teams");
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([{ id: "t1", name: "Team 1" }]);
    });

    it("POST /teams creates an item and snapshots roster and games", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock
        .on(GetCommand)
        .resolves({ Item: { id: "test-uuid", name: "New Team" } });
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent("POST", "/teams", {
        name: "New Team",
      });
      const response: any = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(s3Mock.calls().length).toBe(2); // roster.json and games.json
    });

    it("POST /teams/:id/players adds player and snapshots roster", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(GetCommand).resolves({
        Item: { id: "277e909a-6536-4d2d-937e-f608759556fb", name: "Team 1" },
      });
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "p1", name: "Player 1", jerseyNumber: "10" }],
      });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent(
        "POST",
        "/teams/277e909a-6536-4d2d-937e-f608759556fb/players",
        {
          playerId: "277e909a-6536-4d2d-937e-f608759556f9",
          name: "Player 1",
          jerseyNumber: "10",
        },
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(s3Mock.calls().length).toBe(1);
    });
  });

  describe("Players", () => {
    it("GET /players returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "p1", name: "Player 1" }],
      });

      const event = createEvent("GET", "/players");
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /players creates a player", async () => {
      ddbMock.on(PutCommand).resolves({});
      const event = createEvent("POST", "/players", { name: "Player 1" });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
    });
  });

  describe("Games", () => {
    it("GET /games returns items for a team", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "g1", opponent: "Opponent" }],
      });

      const event = createEvent("GET", "/games", null, {
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      });
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /games creates a game and snapshots team games", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});
      const event = createEvent("POST", "/games", {
        teamId: "277e909a-6536-4d2d-937e-f608759556fa",
        opponent: "Opp",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
      expect(s3Mock.calls().length).toBe(1);
    });

    it("POST /games/:id/complete marks as completed and snapshots stats and team games", async () => {
      ddbMock.on(UpdateCommand).resolves({});
      ddbMock.on(GetCommand).resolves({
        Item: {
          id: "277e909a-6536-4d2d-937e-f608759556fa",
          teamId: "277e909a-6536-4d2d-937e-f608759556fb",
          opponent: "Opp",
        },
      });
      ddbMock
        .on(QueryCommand)
        .resolves({ Items: [{ id: "st1", type: "SHOT" }] });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent(
        "POST",
        "/games/277e909a-6536-4d2d-937e-f608759556fa/complete",
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(2); // stats.json and team games.json
    });

    it("POST /games/:id/stats records a stat", async () => {
      ddbMock.on(PutCommand).resolves({});
      const event = createEvent(
        "POST",
        "/games/277e909a-6536-4d2d-937e-f608759556fa/stats",
        {
          id: "277e909a-6536-4d2d-937e-f608759556f8",
          type: "MAKE",
          playerId: "277e909a-6536-4d2d-937e-f608759556f9",
          points: 2,
        },
      );
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe("277e909a-6536-4d2d-937e-f608759556f8");
      expect(body.type).toBe("MAKE");
      // Internal keys should be redacted
      expect(body.GSI1PK).toBeUndefined();
      expect(body.PK).toBeUndefined();
    });
  });

  it("returns 404 for unknown route", async () => {
    const event = createEvent("GET", "/unknown");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(404);
  });

  it("returns 500 on error", async () => {
    ddbMock.on(QueryCommand).rejects(new Error("DDB Error"));

    const event = createEvent("GET", "/players");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
  });

  describe("Edge Cases", () => {
    it("POST /players with malformed JSON returns 400", async () => {
      const event: any = createEvent("POST", "/players");
      event.body = "invalid-json";
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });

    it("POST /teams with null body handled gracefully", async () => {
      const event: any = createEvent("POST", "/teams", null);
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });

    it("POST /teams with missing name returns 400", async () => {
      const event = createEvent("POST", "/teams", {
        description: "Missing name",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });

    it("POST /games with missing teamId returns 400", async () => {
      const event = createEvent("POST", "/games", { opponent: "Opp" });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });
  });

  describe("Restoration and Cleanup", () => {
    it("PATCH /teams/:id restores a deleted team", async () => {
      ddbMock.on(UpdateCommand).resolves({});
      s3Mock.on(PutObjectCommand).resolves({});
      // Mock the snapshots triggered by restore
      ddbMock.on(GetCommand).resolves({
        Item: { id: "277e909a-6536-4d2d-937e-f608759556fb", name: "Team 1" },
      });
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const event = createEvent(
        "PATCH",
        "/teams/277e909a-6536-4d2d-937e-f608759556fb",
        { deletedAt: null },
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(
        ddbMock.calls().some((c) => c.args[0] instanceof UpdateCommand),
      ).toBe(true);
      expect(s3Mock.calls().length).toBeGreaterThan(0);
    });

    it("PATCH /players/:id restores a deleted player", async () => {
      ddbMock.on(UpdateCommand).resolves({});
      const event = createEvent(
        "PATCH",
        "/players/277e909a-6536-4d2d-937e-f608759556f9",
        { deletedAt: null },
      );
      const response: any = await handler(event);
      expect(response.statusCode).toBe(200);
    });

    it("PATCH /games/:id restores a deleted game", async () => {
      ddbMock.on(UpdateCommand).resolves({});
      ddbMock.on(GetCommand).resolves({
        Item: {
          id: "277e909a-6536-4d2d-937e-f608759556fa",
          teamId: "277e909a-6536-4d2d-937e-f608759556fb",
          completed: 1,
        },
      });
      s3Mock.on(PutObjectCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const event = createEvent(
        "PATCH",
        "/games/277e909a-6536-4d2d-937e-f608759556fa",
        { deletedAt: null },
      );
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBeGreaterThan(0);
    });

    it("POST /cleanup performs cleanup", async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      const event = createEvent("POST", "/cleanup");
      event.headers = { "x-api-key": "test-admin-key" };
      const response: any = await handler(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe("Cleanup complete");
    });
  });
});
