/**
 * @file index.ts
 * @description Main Lambda handler for the Basketball Stats API.
 * Provides RESTful endpoints for managing Seasons, Teams, Players, Games, and Stats.
 * Implements an offline-first synchronization strategy with S3 snapshot generation.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import {
  ok,
  created,
  badRequest,
  notFound,
  serverError,
  response,
  sanitizeOutput,
  filterActive,
} from "./responses.js";
import {
  isValidUuid,
  isValidPlayerId,
  SPECIAL_PLAYER_IDS,
  validateStatEvent,
} from "./validation.js";
import { Keys } from "./keys.js";
import {
  logError,
  logInfo,
  maskEvent,
  extractRequestMetadata,
  safeCompare,
  normalizePath,
  extractIdFromPath,
  stripLocalFields,
  getHeader,
} from "./utils.js";
import { calculateGameResultFromStats } from "./scoring.js";
import {
  snapshotTeamRoster,
  snapshotTeamGames,
  snapshotTeam,
  snapshotGameStats,
  deleteTeamSnapshots,
  deleteGameSnapshots,
} from "./snapshots.js";
import { handleCleanup } from "./handlers/cleanup.js";

// Clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

/**
 * Handlers for Players endpoints.
 * @param {string} method - HTTP Method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
async function handlePlayers(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
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

/**
 * Handlers for Games endpoints.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
async function handleGames(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
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
      const resp = await softDeleteItem("GAME", "METADATA", gameId, tableName);
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
    return await handleGameStats(method, path, body, tableName);
  }

  return null;
}

/**
 * Handlers for Game Stats sub-endpoints: /games/{gameId}/stats.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} Response.
 */
async function handleGameStats(
  method: string,
  path: string,
  body: Record<string, unknown>,
  tableName: string,
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
    return ok(filterActive(result.Items as any));
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
    await putNewItem(tableName, item);
    await snapshotGameStats(gameId, tableName, docClient);
    return created(item);
  }

  return null;
}

/**
 * Handlers for Teams endpoints.
 * @param {string} method - HTTP Method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
async function handleTeams(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/teams") {
    if (method === "GET") {
      return await getItems(
        tableName,
        "TEAM",
        "id, #n, description, logoUrl, primaryColor, periodType, fouls, deletedAt",
        { "#n": "name" },
      );
    }
    if (method === "POST") {
      if (
        !body?.name ||
        typeof body.name !== "string" ||
        body.name.length > 100
      ) {
        return badRequest(
          "Team name is required and must be under 100 characters",
        );
      }
      const resp = await createItem(
        "TEAM",
        "METADATA",
        "TEAM",
        body,
        tableName,
      );
      if (resp.statusCode !== 201 || !resp.body) return resp;
      const newItem = JSON.parse(resp.body);
      await snapshotTeam(newItem.id, tableName, docClient);
      return resp;
    }
  }

  const teamId = extractIdFromPath(path, "/teams/");
  if (teamId) {
    if (!isValidUuid(teamId)) {
      return badRequest("Invalid teamId format (UUID required)");
    }
    const teamKey = { PK: Keys.team(teamId), SK: Keys.metadata(teamId) };

    if (method === "DELETE") {
      const resp = await softDeleteItem("TEAM", "METADATA", teamId, tableName);
      if (resp.statusCode === 200) await deleteTeamSnapshots(teamId);
      return resp;
    }

    if (method === "PATCH" && body.deletedAt === null) {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: teamKey,
          UpdateExpression: "REMOVE deletedAt",
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeam(teamId, tableName, docClient);
      return ok({ message: "Team restored" });
    }
  }

  if (path.startsWith("/teams/") && path.endsWith("/players")) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const tId = parts[2];
    if (!isValidUuid(tId))
      return badRequest("Invalid teamId format (UUID required)");

    if (method === "GET")
      return await getItemsByGSI(
        `TEAM#${tId}`,
        tableName,
        "id, teamId, playerId, #n, avatarColor, jerseyNumber, deletedAt",
        { "#n": "name" },
      );

    if (method === "POST") {
      if (!isValidUuid(body.playerId))
        return badRequest("Valid playerId (UUID) is required");
      if (
        body.jerseyNumber !== undefined &&
        (typeof body.jerseyNumber !== "string" ||
          !/^\d{1,3}$/.test(body.jerseyNumber))
      ) {
        return badRequest("Jersey number must be 1-3 digits");
      }
      const id = (body?.id as string) || uuidv4();
      if (!isValidUuid(id)) {
        return badRequest("Invalid team-player association id (UUID required)");
      }

      const cleanBody = stripLocalFields(body);
      const teamPlayerItem = {
        ...(cleanBody as Record<string, unknown>),
        PK: Keys.team(tId),
        SK: Keys.player(body.playerId as string),
        GSI1PK: Keys.team(tId),
        GSI1SK: Keys.player(body.playerId as string),
        id,
        teamId: tId,
      };
      await putNewItem(tableName, teamPlayerItem);
      await snapshotTeamRoster(tId, tableName, docClient);
      return created(teamPlayerItem);
    }
  }

  if (path.startsWith("/teams/") && path.includes("/players/")) {
    const parts = path.split("/");
    if (parts.length !== 5) return null;
    const tId = parts[2];
    const pId = parts[4];
    if (!isValidUuid(tId) || !isValidUuid(pId)) {
      return badRequest("Invalid teamId or playerId format (UUID required)");
    }
    if (method === "DELETE") {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.team(tId), SK: Keys.player(pId) },
          UpdateExpression: "SET deletedAt = :d",
          ExpressionAttributeValues: { ":d": new Date().toISOString() },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeamRoster(tId, tableName, docClient);
      return ok({ message: "Player removed from team" });
    }
  }

  return null;
}

/**
 * Parses the request body as JSON.
 * @param {string | undefined} body - Raw body string.
 * @returns {Record<string, unknown>} Parsed body.
 * @throws {Error} If JSON is invalid.
 */
function parseBody(body: string | undefined): Record<string, unknown> {
  if (!body) return {};
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Maximum allowed request body size (512KB).
 * Prevents memory exhaustion attacks and large data injection.
 */
const MAX_BODY_SIZE = 512 * 1024;

/**
 * Whitelist of allowed HTTP methods for this API.
 */
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logInfo("Event", maskEvent(event));

  const { method, path } = extractRequestMetadata(event);
  logInfo("Routing", { method, path });

  // 🛡️ Enhancement 8: HTTP Method Whitelisting
  if (!ALLOWED_METHODS.has(method)) {
    return response(405, { message: `Method ${method} not allowed` });
  }

  // 🛡️ Enhancement 9: Body Size Limit Enforcement
  if (event.body && event.body.length > MAX_BODY_SIZE) {
    return response(413, { message: "Payload too large" });
  }

  // Enforce Content-Type for write requests with a body
  if (["POST", "PUT", "PATCH"].includes(method) && event.body) {
    const contentType = getHeader(event.headers, "content-type");
    if (!contentType?.toLowerCase().includes("application/json")) {
      return response(415, {
        message: "Unsupported Media Type: application/json required",
      });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = parseBody(event.body);
  } catch (e) {
    return badRequest("Invalid JSON body");
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    const res =
      (await handleTeams(method, path, body, event, TABLE_NAME)) ||
      (await handlePlayers(method, path, body, event, TABLE_NAME)) ||
      (await handleGames(method, path, body, event, TABLE_NAME)) ||
      (await handleCleanup(method, path, event, TABLE_NAME, docClient));

    return res || notFound("Route not found");
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      if (method === "POST") {
        return response(409, { message: "Item already exists" });
      }
      return notFound("Item not found");
    }
    logError("Handler Error", error);
    return serverError();
  }
};

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} gsiPrefix - The prefix for the GSI1PK.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
async function getItems(
  tableName: string,
  gsiPrefix: string,
  projection?: string,
  expressionAttributeNames?: Record<string, string>,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
      ProjectionExpression: projection,
      ExpressionAttributeNames: expressionAttributeNames,
    }),
  );
  return ok(filterActive(result.Items as any));
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 *
 * @param {string} gsiPk - The GSI1PK value.
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
async function getItemsByGSI(
  gsiPk: string,
  tableName: string,
  projection?: string,
  expressionAttributeNames?: Record<string, string>,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
      ProjectionExpression: projection,
      ExpressionAttributeNames: expressionAttributeNames,
    }),
  );
  return ok(filterActive(result.Items as any));
}

/**
 * Creates a new item in DynamoDB.
 *
 * @param {string} type - The item type (e.g., SEASON, TEAM).
 * @param {string} skPrefix - The prefix for the SK.
 * @param {string} gsiPk - The GSI1PK value.
 * @param {Record<string, unknown>} data - The item data.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the created item.
 */
async function createItem(
  type: string,
  skPrefix: string,
  gsiPk: string,
  data: Record<string, unknown>,
  tableName: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const id = (data?.id as string) || uuidv4();
  if (!isValidUuid(id)) {
    return badRequest(
      `Invalid ${type.toLowerCase()} id format (UUID required)`,
    );
  }
  const cleanData = stripLocalFields(data);
  const item = {
    ...(cleanData as Record<string, unknown>),
    PK: `${type}#${id}`,
    SK: `${skPrefix}#${id}`,
    GSI1PK: gsiPk,
    GSI1SK: `${type}#${id}`,
    id,
  };
  await putNewItem(tableName, item);
  return created(item);
}

/**
 * Idempotently creates a new item in DynamoDB if it doesn't already exist.
 *
 * WHY: This prevents accidental overwriting of data (e.g., if a client reuses an ID
 * or multiple clients attempt to create the same resource). Using a condition
 * expression ensures that the write only succeeds if no item with the same PK exists.
 *
 * @param {string} tableName - The DynamoDB table name.
 * @param {object} item - The item to create.
 * @returns {Promise<void>}
 * @throws {Error} If the item already exists (ConditionalCheckFailedException).
 */
async function putNewItem(tableName: string, item: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  );
}

/**
 * Soft deletes an item by setting the deletedAt timestamp.
 *
 * @param {string} type - Item type.
 * @param {string} skPrefix - SK prefix.
 * @param {string} id - Item ID.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} Response.
 */
async function softDeleteItem(
  type: string,
  skPrefix: string,
  id: string,
  tableName: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const timestamp = new Date().toISOString();
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { PK: `${type}#${id}`, SK: `${skPrefix}#${id}` },
      UpdateExpression: "SET deletedAt = :d",
      ExpressionAttributeValues: { ":d": timestamp },
      ConditionExpression: "attribute_exists(PK)",
    }),
  );
  return ok({ message: "Item soft deleted", deletedAt: timestamp });
}
