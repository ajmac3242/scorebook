import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Keys } from "../keys.js";
import { badRequest, ok, notFound } from "../responses.js";
import { isValidUuid, validateGame } from "../validation.js";
import { extractIdFromPath } from "../utils.js";
import { getItemsByGSI, createItem, softDeleteItem } from "../db.js";
import {
  snapshotTeamGames,
  snapshotGameStats,
  deleteGameSnapshots,
} from "../snapshots.js";
import { handleGameStats } from "./gameStats.js";

/**
 * Handlers for Games endpoints.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @param {string} requestId - The unique request ID.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
export async function handleGames(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  requestId: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/games") {
    if (method === "GET") {
      const teamId = event.queryStringParameters?.teamId;
      if (!isValidUuid(teamId)) {
        return badRequest("Valid teamId (UUID) is required", requestId);
      }
      return await getItemsByGSI(`TEAM#${teamId}`, tableName, requestId);
    }
    if (method === "POST") {
      const error = validateGame(body);
      if (error) return badRequest(error, requestId);

      const resp = await createItem(
        "GAME",
        "METADATA",
        Keys.team(body.teamId as string),
        body,
        tableName,
        requestId,
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
      return badRequest("Invalid gameId format (UUID required)", requestId);
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
        requestId,
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
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: gameKey,
          UpdateExpression: "REMOVE deletedAt",
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      if (getResp.Item) {
        await snapshotTeamGames(getResp.Item.teamId, tableName, docClient);
        if (getResp.Item.completed)
          await snapshotGameStats(gameId, tableName, docClient);
      }
      return ok({ message: "Game restored" }, requestId);
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
      return badRequest("Invalid gameId format (UUID required)", requestId);
    }
    const gameKey = { PK: Keys.game(gId), SK: Keys.metadata(gId) };
    const getResp = await docClient.send(
      new GetCommand({ TableName: tableName, Key: gameKey }),
    );
    if (!getResp.Item) return notFound("Game not found", requestId);

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
    return ok({ message: "Game completed" }, requestId);
  }

  if (path.startsWith("/games/") && path.endsWith("/stats")) {
    return await handleGameStats(
      method,
      path,
      body,
      tableName,
      requestId,
      docClient,
    );
  }

  return null;
}
