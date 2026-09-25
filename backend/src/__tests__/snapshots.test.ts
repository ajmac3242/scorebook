import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "277e909a-6536-4d2d-937e-f608759556f8"),
}));

import { handler } from "../index.js";
import {
  withDataBucket,
  deleteTeamSnapshots,
  deleteGameSnapshots,
  snapshotTeamRoster,
  snapshotGameStats,
} from "../snapshots.js";

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
    const teamId = "277e909a-6536-4d2d-937e-f608759556fb";
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: teamId,
        name: "Team 1",
        PK: `TEAM#${teamId}`,
        SK: `METADATA#${teamId}`,
      },
    });
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          id: "p1",
          name: "Player 1",
          GSI1PK: `TEAM#${teamId}`,
          GSI1SK: "PLAYER#p1",
        },
      ],
    });
    s3Mock.on(PutObjectCommand).resolves({});

    const event = createEvent("POST", "/teams", { id: teamId, name: "Team 1" });
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const rosterCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === `teams/${teamId}/roster.json`,
    );

    expect(rosterCall).toBeDefined();
    const body = JSON.parse((rosterCall!.args[0].input as any).Body);
    expect(body.team.id).toBe(teamId);
    expect(body.players).toHaveLength(1);
    expect(body.players[0].name).toBe("Player 1");
    expect(body.team.PK).toBeUndefined();
    expect(body.players[0].GSI1PK).toBeUndefined();
  });

  it("generates correct game stats snapshot with calculated results", async () => {
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: gameId,
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
        opponent: "Opponent",
        PK: `GAME#${gameId}`,
        SK: `METADATA#${gameId}`,
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

    const event = createEvent("POST", `/games/${gameId}/complete`);
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const statsCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === `games/${gameId}/stats.json`,
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
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(GetCommand).resolves({
      Item: {
        id: gameId,
        teamId: "277e909a-6536-4d2d-937e-f608759556fb",
        opponent: "Opponent",
      },
    });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    s3Mock.on(PutObjectCommand).resolves({});

    const event = createEvent("POST", `/games/${gameId}/complete`);
    await handler(event);

    const s3Calls = s3Mock.commandCalls(PutObjectCommand);
    const statsCall = s3Calls.find(
      (c) => (c.args[0].input as any).Key === `games/${gameId}/stats.json`,
    );
    const body = JSON.parse((statsCall!.args[0].input as any).Body);

    expect(body.game.teamScore).toBe(0);
    expect(body.game.oppScore).toBe(0);
    expect(body.game.result).toBe("D");
  });

  it("returns early from withDataBucket when DATA_BUCKET is unset", async () => {
    delete process.env.DATA_BUCKET;
    const fn = jest.fn<(bucket: string) => Promise<void>>();
    await withDataBucket("Test Label", fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it("catches and logs errors inside withDataBucket execution", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const fn = jest.fn<(bucket: string) => Promise<void>>().mockRejectedValue(new Error("S3 Error"));

    await withDataBucket("Test S3 Failure", fn);
    expect(fn).toHaveBeenCalledWith("TestDataBucket");
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("deletes team snapshots from S3 correctly and handles errors", async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});
    await deleteTeamSnapshots("team-123");

    const deleteCalls = s3Mock.commandCalls(DeleteObjectCommand);
    expect(deleteCalls).toHaveLength(2);

    delete process.env.DATA_BUCKET;
    s3Mock.reset();
    await deleteTeamSnapshots("team-123");
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);

    process.env.DATA_BUCKET = "TestDataBucket";
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    s3Mock.on(DeleteObjectCommand).rejects(new Error("Delete failed"));
    await deleteTeamSnapshots("team-123");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("deletes game snapshots from S3 correctly and handles errors", async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});
    await deleteGameSnapshots("game-123");

    const deleteCalls = s3Mock.commandCalls(DeleteObjectCommand);
    expect(deleteCalls).toHaveLength(1);

    delete process.env.DATA_BUCKET;
    s3Mock.reset();
    await deleteGameSnapshots("game-123");
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);

    process.env.DATA_BUCKET = "TestDataBucket";
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    s3Mock.on(DeleteObjectCommand).rejects(new Error("Delete failed"));
    await deleteGameSnapshots("game-123");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("skips snapshotting deleted or non-existent team roster", async () => {
    const docClient = {} as any;
    ddbMock.on(GetCommand).resolves({});
    await snapshotTeamRoster("team-deleted", "TestTable", docClient);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);

    ddbMock.on(GetCommand).resolves({ Item: { id: "team-deleted", deletedAt: "2026-01-01" } });
    await snapshotTeamRoster("team-deleted", "TestTable", docClient);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);
  });

  it("skips snapshotting deleted or non-existent game stats", async () => {
    const docClient = {} as any;
    ddbMock.on(GetCommand).resolves({});
    await snapshotGameStats("game-deleted", "TestTable", docClient);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);

    ddbMock.on(GetCommand).resolves({ Item: { id: "game-deleted", deletedAt: "2026-01-01" } });
    await snapshotGameStats("game-deleted", "TestTable", docClient);
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0);
  });
});
