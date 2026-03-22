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
  v4: jest.fn(() => "test-uuid"),
}));

describe("Lambda Handler", () => {
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
    routeKey: "$default",
    rawPath: path,
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

  describe("Seasons", () => {
    it("GET /seasons returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "1", name: "Season 1" }],
      });

      const event = createEvent("GET", "/seasons");
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([
        { id: "1", name: "Season 1" },
      ]);
    });

    it("POST /seasons creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/seasons", { name: "New Season" });
      const response: any = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe("New Season");
      expect(body.id).toBe("test-uuid");
    });
  });

  describe("Teams", () => {
    it("GET /teams returns items for a season", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "t1", name: "Team 1" }],
      });

      const event = createEvent("GET", "/teams", null, { seasonId: "s1" });
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
        seasonId: "s1",
      });
      const response: any = await handler(event);

      expect(response.statusCode).toBe(201);
      expect(s3Mock.calls().length).toBe(2); // roster.json and games.json
    });

    it("POST /teams/:id/players adds player and snapshots roster", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(GetCommand).resolves({ Item: { id: "t1", name: "Team 1" } });
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "p1", name: "Player 1", jerseyNumber: "10" }],
      });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent("POST", "/teams/t1/players", {
        playerId: "p1",
        name: "Player 1",
        jerseyNumber: "10",
      });
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

      const event = createEvent("GET", "/games", null, { teamId: "t1" });
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /games creates a game and snapshots team games", async () => {
      ddbMock.on(PutCommand).resolves({});
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      s3Mock.on(PutObjectCommand).resolves({});
      const event = createEvent("POST", "/games", {
        teamId: "t1",
        opponent: "Opp",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
      expect(s3Mock.calls().length).toBe(1);
    });

    it("POST /games/:id/complete marks as completed and snapshots stats and team games", async () => {
      ddbMock.on(UpdateCommand).resolves({});
      ddbMock
        .on(GetCommand)
        .resolves({ Item: { id: "g1", teamId: "t1", opponent: "Opp" } });
      ddbMock
        .on(QueryCommand)
        .resolves({ Items: [{ id: "st1", type: "SHOT" }] });
      s3Mock.on(PutObjectCommand).resolves({});

      const event = createEvent("POST", "/games/g1/complete");
      const response: any = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(s3Mock.calls().length).toBe(2); // stats.json and team games.json
    });

    it("POST /games/:id/stats records a stat", async () => {
      ddbMock.on(PutCommand).resolves({});
      const event = createEvent("POST", "/games/g1/stats", {
        id: "st1",
        type: "MAKE",
        points: 2,
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.GSI1PK).toBe("GAME#g1");
    });
  });

  it("returns 404 for unknown route", async () => {
    const event = createEvent("GET", "/unknown");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(404);
  });

  it("returns 500 on error", async () => {
    ddbMock.on(QueryCommand).rejects(new Error("DDB Error"));

    const event = createEvent("GET", "/seasons");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
  });

  describe("Edge Cases", () => {
    it("POST /seasons with malformed JSON returns 400", async () => {
      const event: any = createEvent("POST", "/seasons");
      event.body = "invalid-json";
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });

    it("GET /teams without seasonId returns empty if DDB query handles it", async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      const event = createEvent("GET", "/teams");
      const response: any = await handler(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([]);
    });

    it("POST /teams with null body handled gracefully", async () => {
      const event: any = createEvent("POST", "/teams", null);
      const response: any = await handler(event);
      expect(response.statusCode).toBe(400);
    });
  });
});
