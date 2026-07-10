import { describe, it, expect, beforeEach } from "@jest/globals";
import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Data Immutability Enforcement", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = "TestTable";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
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
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
  });

  it("POST /games/:id/stats fails if the game is completed", async () => {
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";

    // Mock the GetCommand to return a completed game
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: gameId,
        completed: 1,
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      },
    });

    const event = createEvent("POST", `/games/${gameId}/stats`, {
      type: "MAKE",
      playerId: "277e909a-6536-4d2d-937e-f608759556f9",
      points: 2,
      period: 1,
      clockTime: 600,
    });

    const response: any = await handler(event);

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Cannot modify stats for a finalized game.");
  });

  it("POST /games/:id/stats succeeds if the game is NOT completed", async () => {
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";

    // Mock the GetCommand to return an active game
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: gameId,
        completed: 0,
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      },
    });

    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(QueryCommand).resolves({ Items: [] }); // For snapshotting

    const event = createEvent("POST", `/games/${gameId}/stats`, {
      type: "MAKE",
      playerId: "277e909a-6536-4d2d-937e-f608759556f9",
      points: 2,
      period: 1,
      clockTime: 600,
    });

    const response: any = await handler(event);

    expect(response.statusCode).toBe(201);
  });
});
