/**
 * @file snapshots.ts
 * @description S3 snapshot generation logic for the Basketball Stats API.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { sanitizeOutput } from "./responses.js";
import { logError } from "./utils.js";
import { calculateGameResultFromStats } from "./scoring.js";
import { Keys } from "./keys.js";

const s3Client = new S3Client({});

/**
 * Executes snapshot logic with error handling and environment variable validation.
 * @param {string} label - A descriptive label for the operation (for logging).
 * @param {Function} fn - The asynchronous function to execute with the bucket name.
 */
export async function withDataBucket(
  label: string,
  fn: (bucket: string) => Promise<void>,
) {
  const bucket = process.env.DATA_BUCKET;
  if (!bucket) return;
  try {
    await fn(bucket);
  } catch (e) {
    logError(label, e);
  }
}

/**
 * Uploads a JSON snapshot to S3.
 * @param bucket The name of the S3 bucket.
 * @param key The S3 object key.
 * @param data The data object to upload.
 */
export async function uploadSnapshot(
  bucket: string,
  key: string,
  data: unknown,
) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(sanitizeOutput(data)),
      ContentType: "application/json",
    }),
  );
}

/**
 * Generates and uploads a team roster snapshot JSON to S3.
 * @param teamId The unique ID of the team.
 * @param tableName The DynamoDB table name.
 * @param docClient The DynamoDB document client instance.
 */
export async function snapshotTeamRoster(
  teamId: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
) {
  await withDataBucket("Snapshot Team Roster Error", async (bucket) => {
    const teamResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: Keys.team(teamId), SK: Keys.metadata(teamId) },
      }),
    );
    if (!teamResult?.Item || teamResult.Item.deletedAt) return;

    const playersResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": Keys.team(teamId),
          ":sk": "PLAYER#",
        },
      }),
    );

    const snapshot = {
      team: teamResult.Item,
      players: (playersResult.Items || []).filter((p) => !p.deletedAt),
    };
    await uploadSnapshot(bucket, `teams/${teamId}/roster.json`, snapshot);
  });
}

/**
 * Generates and uploads a list of games for a team as a snapshot JSON to S3.
 * @param teamId The unique ID of the team.
 * @param tableName The DynamoDB table name.
 * @param docClient The DynamoDB document client instance.
 */
export async function snapshotTeamGames(
  teamId: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
) {
  await withDataBucket("Snapshot Team Games Error", async (bucket) => {
    const gamesResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: { ":pk": Keys.team(teamId), ":sk": "GAME#" },
      }),
    );
    const snapshot = {
      games: (gamesResult.Items || []).filter((g) => !g.deletedAt),
    };
    await uploadSnapshot(bucket, `teams/${teamId}/games.json`, snapshot);
  });
}

/**
 * Generates and uploads a detailed game stats snapshot JSON to S3.
 * @param gameId The unique ID of the game.
 * @param tableName The DynamoDB table name.
 * @param docClient The DynamoDB document client instance.
 */
export async function snapshotGameStats(
  gameId: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
) {
  await withDataBucket("Snapshot Game Stats Error", async (bucket) => {
    const gameResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
      }),
    );
    if (!gameResult?.Item || gameResult.Item.deletedAt) return;

    const statsResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `GAME#${gameId}`, ":sk": "STAT#" },
      }),
    );

    const stats = (statsResult.Items || []).filter((s) => !s.deletedAt);
    const { teamScore, oppScore, result } = calculateGameResultFromStats(
      stats as Record<string, unknown>[],
    );

    const snapshot = {
      game: { ...gameResult.Item, teamScore, oppScore, result },
      stats,
    };
    await uploadSnapshot(bucket, `games/${gameId}/stats.json`, snapshot);
  });
}

/**
 * Deletes team-related snapshots from S3.
 * @param {string} teamId - The ID of the team whose snapshots should be deleted.
 */
export async function deleteTeamSnapshots(teamId: string) {
  const DATA_BUCKET = process.env.DATA_BUCKET;
  if (!DATA_BUCKET) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `teams/${teamId}/roster.json`,
      }),
    );
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `teams/${teamId}/games.json`,
      }),
    );
  } catch (e) {
    logError("Delete Team Snapshots Error", e);
  }
}

/**
 * Deletes game-related snapshots from S3.
 * @param {string} gameId - The ID of the game whose snapshots should be deleted.
 */
export async function deleteGameSnapshots(gameId: string) {
  const DATA_BUCKET = process.env.DATA_BUCKET;
  if (!DATA_BUCKET) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `games/${gameId}/stats.json`,
      }),
    );
  } catch (e) {
    logError("Delete Game Snapshots Error", e);
  }
}
