import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ok, badRequest } from "../responses.js";
import { isValidUuid, validatePlayerMetadata } from "../validation.js";
import { Keys } from "../keys.js";
import { extractIdFromPath } from "../utils.js";
import {
  getItems,
  createItem,
  softDeleteItem,
  restoreItem,
} from "../database.js";

/**
 * Handlers for Players endpoints.
 * @param method - HTTP Method.
 * @param path - Request path.
 * @param body - Parsed JSON body.
 * @param event - The full Lambda event.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response or null.
 *
 * @security Manages player lifecycle.
 * Enforces strict UUID validation for player IDs.
 * Implements soft deletion and archiving with authorized restoration paths.
 * Protects against mass assignment via metadata validation.
 */
export async function handlePlayers(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  /**
   * 🏀 Players Handler
   *
   * WHY: Manages player lifecycle (CRUD, Archiving, Restoration).
   * This handler is separated from the main router to keep the API surface modular
   * and easier to maintain.
   */
  // Collection endpoints: /players
  if (path === "/players") {
    if (method === "GET") return await getItems("PLAYER", tableName, docClient);
    if (method === "POST") {
      const error = validatePlayerMetadata(body);
      if (error) return badRequest(error);
      return await createItem(
        "PLAYER",
        "METADATA",
        "PLAYER",
        body,
        tableName,
        docClient,
      );
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
    return await softDeleteItem(
      "PLAYER",
      "METADATA",
      playerId,
      tableName,
      docClient,
    );
  }

  if (method === "PATCH") {
    if (body.isArchived === 0) {
      return await restoreItem(
        "PLAYER",
        "METADATA",
        playerId,
        true,
        tableName,
        docClient,
      );
    }
    if (body.deletedAt === null) {
      return await restoreItem(
        "PLAYER",
        "METADATA",
        playerId,
        false,
        tableName,
        docClient,
      );
    }
  }

  return null;
}
