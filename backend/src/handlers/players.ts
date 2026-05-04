import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ok, badRequest } from "../responses.js";
import { isValidUuid } from "../validation.js";
import { Keys } from "../keys.js";
import { extractIdFromPath } from "../utils.js";
import { getItems, createItem, softDeleteItem } from "../index.js";

/**
 * Handlers for Players endpoints.
 * @param {string} method - HTTP Method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @param {DynamoDBDocumentClient} docClient - DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
export async function handlePlayers(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  // Collection endpoints: /players
  if (path === "/players") {
    if (method === "GET")
      return await getItems(
        tableName,
        "PLAYER",
        "id, #n, avatarColor, isArchived, deletedAt",
        { "#n": "name" },
      );
    if (method === "POST") {
      if (
        !body?.name ||
        typeof body.name !== "string" ||
        body.name.length > 100
      ) {
        return badRequest(
          "Player name is required and must be under 100 characters",
        );
      }
      return await createItem("PLAYER", "METADATA", "PLAYER", body, tableName);
    }
    return null;
  }

  // Member endpoints: /players/{playerId}
  const playerId = extractIdFromPath(path, "/players/");
  if (!playerId) return null;
  if (!isValidUuid(playerId)) {
    return badRequest("Invalid playerId format (UUID required)");
  }
  const playerKey = { PK: Keys.player(playerId), SK: Keys.metadata(playerId) };

  if (method === "DELETE") {
    const isArchive = event.queryStringParameters?.archive === "true";
    if (isArchive) {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: playerKey,
          UpdateExpression: "SET isArchived = :a",
          ExpressionAttributeValues: { ":a": 1 },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      return ok({ message: "Player archived" });
    }
    return await softDeleteItem("PLAYER", "METADATA", playerId, tableName);
  }

  if (method === "PATCH" && body.isArchived === 0) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: playerKey,
        UpdateExpression: "SET isArchived = :a",
        ExpressionAttributeValues: { ":a": 0 },
        ConditionExpression: "attribute_exists(PK)",
      }),
    );
    return ok({ message: "Player restored from archive" });
  }

  if (method === "PATCH" && body.deletedAt === null) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: playerKey,
        UpdateExpression: "REMOVE deletedAt",
        ConditionExpression: "attribute_exists(PK)",
      }),
    );
    return ok({ message: "Player restored" });
  }

  return null;
}
