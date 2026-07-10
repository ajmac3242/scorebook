import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { ok, created, badRequest, forbidden } from "../responses.js";
import { isValidUuid, validateStatEvent } from "../validation.js";
import { Keys } from "../keys.js";
import { stripLocalFields } from "../utils.js";
import { putNewItem } from "../database.js";
import { snapshotGameStats } from "../snapshots.js";

/**
 * Handlers for Game Stats sub-endpoints: /games/{gameId}/stats.
 * @param method - HTTP method.
 * @param path - Request path.
 * @param body - Parsed JSON body.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response or null.
 *
 * @security High-frequency endpoint for recording statistics.
 * Enforces strict schema validation for every statistical event.
 * Validates player IDs and coordinates to prevent out-of-bounds data.
 * Protects against timestamp manipulation by validating ISO format.
 */
export async function handleGameStats(
  method: string,
  path: string,
  body: Record<string, unknown>,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  /**
   * 🏀 Game Stats Handler
   *
   * WHY: High-frequency endpoint for recording and retrieving live game events.
   * Enforces strict validation and schema normalization for all statistical events
   * and triggers immediate game-level snapshots for real-time visibility.
   */
  const parts = path.split("/");
  if (parts.length !== 4) return null;
  const gameId = parts[2];
  if (!isValidUuid(gameId)) {
    return badRequest("Invalid gameId format (UUID required)");
  }

  if (method === "GET") {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": Keys.game(gameId),
          ":sk": "STAT#",
        },
      }),
    );
    return ok(result.Items);
  }

  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    // 🛡️ Sentinel: Enforce data immutability for finalized games.
    const gameKey = { PK: Keys.game(gameId), SK: Keys.metadata(gameId) };
    const getResp = await docClient.send(
      new GetCommand({ TableName: tableName, Key: gameKey }),
    );
    if (getResp?.Item?.completed === 1) {
      return forbidden("Cannot modify stats for a finalized game.");
    }
  }

  if (method === "POST") {
    const error = validateStatEvent(body);
    if (error) return badRequest(error);

    const id = (body?.id as string) || uuidv4();
    if (!isValidUuid(id)) {
      return badRequest("Invalid stat id format (UUID required)");
    }

    const timestamp = (body?.timestamp as string) || new Date().toISOString();
    if (
      typeof timestamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(timestamp)
    ) {
      return badRequest("Invalid timestamp format");
    }

    const cleanBody = stripLocalFields(body) as Record<string, unknown>;
    const item = {
      ...cleanBody,
      PK: Keys.game(gameId),
      SK: Keys.stat(timestamp as string, id as string),
      GSI1PK: Keys.game(gameId),
      GSI1SK: Keys.stat(timestamp as string, id as string),
      id,
      timestamp,
    };
    await putNewItem(tableName, item, docClient);
    await snapshotGameStats(gameId, tableName, docClient);
    return created(item);
  }

  return null;
}
