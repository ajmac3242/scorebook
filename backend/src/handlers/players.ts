import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Keys } from "../keys.js";
import { badRequest, ok, response, created, notFound } from "../responses.js";
import { isValidUuid, isValidJerseyNumber } from "../validation.js";
import { extractIdFromPath, stripLocalFields } from "../utils.js";
import { getItems, createItem, softDeleteItem } from "../index.js";

/**
 * Handlers for Players endpoints.
 * @param {string} method - HTTP Method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @param {string} requestId - The unique request ID.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
export async function handlePlayers(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  requestId: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  // Collection endpoints: /players
  if (path === "/players") {
    if (method === "GET") return await getItems(tableName, "PLAYER", requestId);
    if (method === "POST") {
      if (
        !body?.name ||
        typeof body.name !== "string" ||
        body.name.trim().length === 0 ||
        body.name.length > 100
      ) {
        return badRequest(
          "Player name is required and must be under 100 characters",
          requestId,
        );
      }
      if (
        body.defaultNumber !== undefined &&
        !isValidJerseyNumber(body.defaultNumber)
      ) {
        return badRequest("Default jersey number must be 1-3 digits", requestId);
      }
      return await createItem(
        "PLAYER",
        "METADATA",
        "PLAYER",
        body,
        tableName,
        requestId,
      );
    }
  }

  // Member endpoints: /players/{playerId}
  const playerId = extractIdFromPath(path, "/players/");
  if (!playerId) return null;

  if (!isValidUuid(playerId)) {
    return badRequest("Invalid playerId format (UUID required)", requestId);
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
      return ok({ message: "Player archived" }, requestId);
    }
    return await softDeleteItem(
      "PLAYER",
      "METADATA",
      playerId,
      tableName,
      requestId,
    );
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
    return ok({ message: "Player restored from archive" }, requestId);
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
    return ok({ message: "Player restored" }, requestId);
  }

  return null;
}
