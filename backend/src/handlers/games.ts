import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  ok,
  created,
  badRequest,
  notFound,
  filterActive,
} from "../responses.js";
import { isValidUuid, validateStatEvent } from "../validation.js";
import { Keys } from "../keys.js";
import { extractIdFromPath, stripLocalFields } from "../utils.js";
import {
  snapshotTeamGames,
  snapshotGameStats,
  deleteGameSnapshots,
} from "../snapshots.js";
import {
  getItemsByGSI,
  createItem,
  softDeleteItem,
  putNewItem,
} from "../database.js";

/**
 * Handlers for Games endpoints.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @param {DynamoDBDocumentClient} docClient - DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
export async function handleGames(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/games") {
    if (method === "GET") {
      const teamId = event.queryStringParameters?.teamId;
      if (!isValidUuid(teamId)) {
        return badRequest("Valid teamId (UUID) is required");
      }
      return await getItemsByGSI(
        `TEAM#${teamId}`,
        tableName,
        docClient,
        "id, teamId, opponent, opponentId, opponentLogoUrl, #d, #t, #l, completed, periodLength, timeoutLimit, foulLimit, periodType, deletedAt, #n, avatarColor, jerseyNumber",
        {
          "#d": "date",
          "#t": "time",
          "#l": "location",
          "#n": "name",
        },
      );
    }
    if (method === "POST") {
      if (!isValidUuid(body?.teamId)) {
        return badRequest("Valid teamId (UUID) is required");
      }
      if (
        !body?.opponent ||
        typeof body.opponent !== "string" ||
        body.opponent.length > 100
      ) {
        return badRequest(
          "Opponent name is required and must be under 100 characters",
        );
      }
      if (
        body.location !== undefined &&
        (typeof body.location !== "string" || body.location.length > 100)
      ) {
        return badRequest("Location must be a string under 100 characters");
      }
      if (
        body.date !== undefined &&
        (typeof body.date !== "string" || body.date.length > 50)
      ) {
        return badRequest("Date must be a string under 50 characters");
      }
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
      return ok({ message: "Game restored" });
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

/**
 * Handlers for Game Stats sub-endpoints: /games/{gameId}/stats.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {string} tableName - DynamoDB table name.
 * @param {DynamoDBDocumentClient} docClient - DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} Response.
 */
async function handleGameStats(
  method: string,
  path: string,
  body: Record<string, unknown>,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
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
        ProjectionExpression:
          "id, gameId, playerId, #t, points, locationX, locationY, period, clockTime, playName, shotQuality, situation, #ts, deletedAt",
        ExpressionAttributeNames: {
          "#t": "type",
          "#ts": "timestamp",
        },
      }),
    );
    return ok(filterActive(result.Items as Record<string, unknown>[]));
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
    await putNewItem(tableName, item, docClient);
    await snapshotGameStats(gameId, tableName, docClient);
    return created(item);
  }

  return null;
}
