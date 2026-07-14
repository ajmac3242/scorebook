import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ok, badRequest, notFound } from "../responses.js";
import { isValidUuid, validateGameMetadata } from "../validation.js";
import { Keys } from "../keys.js";
import { extractIdFromPath } from "../utils.js";
import {
  getItems,
  createItem,
  softDeleteItem,
  restoreItem,
} from "../database.js";
import {
  snapshotTeamGames,
  snapshotGameStats,
  deleteGameSnapshots,
} from "../snapshots.js";
import { handleGameStats } from "./stats.js";

/**
 * Handlers for Games endpoints.
 * @param method - HTTP method.
 * @param path - Request path.
 * @param body - Parsed JSON body.
 * @param event - The full Lambda event.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response or null.
 *
 * @security Manages game metadata and lifecycle.
 * Enforces strict UUID validation for team and game IDs.
 * Prevents unauthorized access to stats via gameId validation.
 * Utilizes snapshots for secure, immutable data exports.
 */
export async function handleGames(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  /**
   * 🏀 Games Handler
   *
   * WHY: Manages game metadata and lifecycle (Creation, Completion, Deletion).
   * Integrates with snapshot generation to ensure offline-first data consistency
   * when games are modified or completed.
   */
  if (path === "/games") {
    if (method === "GET") {
      const teamId = event.queryStringParameters?.teamId;
      if (!isValidUuid(teamId)) {
        return badRequest("Valid teamId (UUID) is required");
      }
      return await getItems(`TEAM#${teamId}`, tableName, docClient);
    }
    if (method === "POST") {
      const error = validateGameMetadata(body);
      if (error) return badRequest(error);

      const resp = await createItem(
        "GAME",
        "METADATA",
        Keys.team(body.teamId as string),
        body,
        tableName,
        docClient,
      );
      if (resp.statusCode !== 201 || !resp.body) return resp;
      const newItem = JSON.parse(resp.body);
      await snapshotTeamGames(newItem.teamId, tableName, docClient);
      if (newItem.completed)
        await snapshotGameStats(newItem.id, tableName, docClient);
      return resp;
    }
  }

  const gameId = extractIdFromPath(path, "/games/");
  if (gameId) {
    if (!isValidUuid(gameId)) {
      return badRequest("Invalid gameId format (UUID required)");
    }
    const gameKey = { PK: Keys.game(gameId), SK: Keys.metadata(gameId) };

    if (method === "DELETE") {
      const getResp = await docClient.send(
        new GetCommand({ TableName: tableName, Key: gameKey }),
      );
      const resp = await softDeleteItem(
        "GAME",
        "METADATA",
        gameId,
        tableName,
        docClient,
      );
      if (resp.statusCode === 200 && getResp.Item) {
        await snapshotTeamGames(getResp.Item.teamId, tableName, docClient);
        await deleteGameSnapshots(gameId);
      }
      return resp;
    }

    if (method === "PATCH" && body.deletedAt === null) {
      const getResp = await docClient.send(
        new GetCommand({ TableName: tableName, Key: gameKey }),
      );
      const resp = await restoreItem(
        "GAME",
        "METADATA",
        gameId,
        false,
        tableName,
        docClient,
      );
      if (resp.statusCode === 200 && getResp.Item) {
        await snapshotTeamGames(getResp.Item.teamId, tableName, docClient);
        if (getResp.Item.completed)
          await snapshotGameStats(gameId, tableName, docClient);
      }
      return resp;
    }
  }

  if (
    path.startsWith("/games/") &&
    path.endsWith("/complete") &&
    method === "POST"
  ) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const gId = parts[2];
    if (!isValidUuid(gId)) {
      return badRequest("Invalid gameId format (UUID required)");
    }
    const gameKey = { PK: Keys.game(gId), SK: Keys.metadata(gId) };
    const getResp = await docClient.send(
      new GetCommand({ TableName: tableName, Key: gameKey }),
    );
    if (!getResp.Item) return notFound("Game not found");

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: gameKey,
        UpdateExpression: "SET completed = :c",
        ExpressionAttributeValues: { ":c": 1 },
        ConditionExpression: "attribute_exists(PK)",
      }),
    );
    await snapshotGameStats(gId, tableName, docClient);
    await snapshotTeamGames(getResp.Item.teamId, tableName, docClient);
    return ok({ message: "Game completed" });
  }

  if (path.startsWith("/games/") && path.endsWith("/stats")) {
    return await handleGameStats(method, path, body, tableName, docClient);
  }

  return null;
}
