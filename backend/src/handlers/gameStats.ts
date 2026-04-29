import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { Keys } from "../keys.js";
import { badRequest, ok, created, filterActive } from "../responses.js";
import { isValidUuid, validateStatEvent } from "../validation.js";
import { stripLocalFields } from "../utils.js";
import { putNewItem } from "../index.js";
import { snapshotGameStats } from "../snapshots.js";

/**
 * Handlers for Game Stats sub-endpoints: /games/{gameId}/stats.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {string} tableName - DynamoDB table name.
 * @param {string} requestId - The unique request ID.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} Response.
 */
export async function handleGameStats(
  method: string,
  path: string,
  body: Record<string, unknown>,
  tableName: string,
  requestId: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  const parts = path.split("/");
  if (parts.length !== 4) return null;
  const gameId = parts[2];
  if (!isValidUuid(gameId)) {
    return badRequest("Invalid gameId format (UUID required)", requestId);
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
        // ⚡ Bolt: Use ProjectionExpression to exclude large internal keys and redundant GSIs.
        // This reduces Lambda memory usage, network bandwidth, and serialization overhead.
        ProjectionExpression: "id, #ts, #type, playerId, points, clockTime, period, gameId, locationX, locationY, shotQuality, playType, relatedPlayerId, subInPlayerId, subOutPlayerId, deletedAt",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
          "#type": "type",
        },
      }),
    );
    return ok(filterActive(result.Items), requestId);
  }

  if (method === "POST") {
    const error = validateStatEvent(body);
    if (error) return badRequest(error, requestId);

    const id = (body?.id as string) || uuidv4();
    if (!isValidUuid(id)) {
      return badRequest("Invalid stat id format (UUID required)", requestId);
    }

    const timestamp = (body?.timestamp as string) || new Date().toISOString();
    if (
      typeof timestamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(timestamp)
    ) {
      return badRequest("Invalid timestamp format", requestId);
    }

    const cleanBody = stripLocalFields(body);
    const item = {
      ...(cleanBody as Record<string, unknown>),
      PK: Keys.game(gameId),
      SK: Keys.stat(timestamp as string, id as string),
      GSI1PK: Keys.game(gameId),
      GSI1SK: Keys.stat(timestamp as string, id as string),
      id,
      timestamp,
    };
    await putNewItem(tableName, item);
    await snapshotGameStats(gameId, tableName, docClient);
    return created(item, requestId);
  }

  return null;
}
