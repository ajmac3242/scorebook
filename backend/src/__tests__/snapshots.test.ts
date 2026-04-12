import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

import { handler } from "../index.js";

describe("Snapshot Generation Logic", () => {
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
  ): any => ({
    version: "2.0",
    rawPath: path,
    headers: ["POST", "PUT", "PATCH"].includes(method)
      ? { "content-type": "application/json" }
      : {},
    requestContext: { http: { method, path } },
    body: body ? JSON.stringify(body) : null,
  });

  it("generates correct team roster snapshot content", async () => {
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: { id: "t1", name: "Team 1", PK: "TEAM#t1", SK: "METADATA#t1" },
    });
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: "p1", name: "Player 1", GSI1PK: "TEAM#t1", GSI1SK: "PLAYER#p1" },
      ],
    });
    s3Mock.on(PutObjectCommand).resolves({});

    const event = createEvent("POST", "/teams", { id: "t1", name: "Team 1" });
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const rosterCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === "teams/t1/roster.json",
    );

    expect(rosterCall).toBeDefined();
    const body = JSON.parse((rosterCall!.args[0].input as any).Body);
    expect(body.team.id).toBe("t1");
    expect(body.players).toHaveLength(1);
    expect(body.players[0].name).toBe("Player 1");
    expect(body.team.PK).toBeUndefined();
    expect(body.players[0].GSI1PK).toBeUndefined();
  });

  it("generates correct game stats snapshot with calculated results", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: "g1",
        teamId: "t1",
        opponent: "Opponent",
        PK: "GAME#g1",
        SK: "METADATA#g1",
      },
    });
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { playerId: "p1", points: 2, type: "MAKE", SK: "STAT#1" },
        { playerId: "p1", points: 3, type: "MAKE", SK: "STAT#2" },
        { playerId: "OPPONENT", points: 2, type: "MAKE", SK: "STAT#3" },
      ],
    });
    s3Mock.on(PutObjectCommand).resolves({});

    const event = createEvent("POST", "/games/g1/complete");
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const statsCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === "games/g1/stats.json",
    );

    expect(statsCall).toBeDefined();
    const body = JSON.parse((statsCall!.args[0].input as any).Body);

    expect(body.game.teamScore).toBe(5);
    expect(body.game.oppScore).toBe(2);
    expect(body.game.result).toBe("W");
    expect(body.stats).toHaveLength(3);
    expect(body.game.PK).toBeUndefined();
    expect(body.stats[0].SK).toBeUndefined();
  });

  it("handles empty stats in game snapshot", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: { id: "g1", teamId: "t1", opponent: "Opponent" },
    });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    s3Mock.on(PutObjectCommand).resolves({});

    const event = createEvent("POST", "/games/g1/complete");
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const statsCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === "games/g1/stats.json",
    );
    const body = JSON.parse((statsCall!.args[0].input as any).Body);

    expect(body.game.teamScore).toBe(0);
    expect(body.game.oppScore).toBe(0);
    expect(body.game.result).toBe("D");
  });
});
