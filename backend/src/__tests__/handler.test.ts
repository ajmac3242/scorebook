import { handler } from "../index.js";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

describe("Lambda Handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = "TestTable";
  });

  const createEvent = (method: string, path: string, body: any = null, queryStringParameters: any = null) => ({
    requestContext: {
      http: {
        method,
        path,
      },
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters,
  });

  describe("Seasons", () => {
    it("GET /seasons returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "1", name: "Season 1" }],
      });

      const event = createEvent("GET", "/seasons");
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([{ id: "1", name: "Season 1" }]);
    });

    it("POST /seasons creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/seasons", { name: "New Season" });
      const response = await handler(event);

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
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([{ id: "t1", name: "Team 1" }]);
    });

    it("POST /teams creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/teams", { name: "New Team", seasonId: "s1" });
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe("New Team");
      expect(body.seasonId).toBe("s1");
    });
  });

  describe("Players", () => {
    it("GET /players returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "p1", name: "Player 1" }],
      });

      const event = createEvent("GET", "/players");
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /players creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/players", { name: "New Player" });
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
    });
  });

  describe("Games", () => {
    it("GET /games returns items for a team", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "g1", opponent: "Opponent" }],
      });

      const event = createEvent("GET", "/games", null, { teamId: "t1" });
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /games creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/games", { teamId: "t1", opponent: "Opponent" });
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
    });
  });

  describe("Stats", () => {
    it("GET /games/:id/stats returns items", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [{ id: "st1", type: "SHOT" }],
      });

      const event = createEvent("GET", "/games/g1/stats");
      const response = await handler(event);

      expect(response.statusCode).toBe(200);
    });

    it("POST /games/:id/stats creates an item", async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createEvent("POST", "/games/g1/stats", { type: "SHOT", playerId: "p1" });
      const response = await handler(event);

      expect(response.statusCode).toBe(201);
    });
  });

  it("returns 404 for unknown route", async () => {
    const event = createEvent("GET", "/unknown");
    const response = await handler(event);

    expect(response.statusCode).toBe(404);
  });

  it("returns 500 on error", async () => {
    ddbMock.on(QueryCommand).rejects(new Error("DDB Error"));

    const event = createEvent("GET", "/seasons");
    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("DDB Error");
  });
});
