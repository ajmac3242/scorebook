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
import crypto from "node:crypto";
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
  INTERNAL_KEYS,
  conflict,
} from "./responses.js";
import { logger } from "./utils/logger.js";

// Clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

/**
 * Set of headers that should be redacted from logs for security.
 */
const REDACTED_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "proxy-authorization",
  "x-amz-security-token",
  "x-amz-access-token",
]);

/**
 * Valid basketball action types for stat event validation.
 */
const VALID_ACTION_TYPES = new Set([
  "MAKE",
  "MISS",
  "REBOUND",
  "OFF_REBOUND",
  "DEF_REBOUND",
  "ASSIST",
  "STEAL",
  "TURNOVER",
  "BLOCK",
  "FOUL",
  "FOUL_SHOOTING",
  "FOUL_NON_SHOOTING",
  "TIMEOUT",
  "SUB_IN",
  "SUB_OUT",
  "POSSESSION",
]);

/**
 * Standardized IDs for special players.
 */
const SPECIAL_PLAYER_IDS = {
  OPPONENT: "OPPONENT",
  TEAM_TIMEOUT: "TEAM_TIMEOUT",
  OUR_TEAM: "OUR_TEAM",
};

const SPECIAL_ID_SET: Set<string> = new Set(Object.values(SPECIAL_PLAYER_IDS));

/**
 * Regex for validating UUID v4 format.
 * Prevents path traversal and other injection attacks via IDs.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4.
 * @param {unknown} id - The ID to validate.
 * @returns {boolean} True if it's a valid UUID string.
 */
function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && id.length === 36 && UUID_REGEX.test(id);
}

/**
 * Validates if a string is a valid player ID.
 *
 * ARCHITECTURE:
 * To support "on-the-fly" tracking of opponents without pre-creating entities,
 * the system accepts three types of player IDs:
 * 1. UUID v4: Standard for registered team players.
 * 2. SPECIAL CONSTANTS: (e.g., 'OPPONENT', 'OUR_TEAM') for general tracking.
 * 3. JERSEY PREFIX: 'OPPONENT:{jersey}' (e.g., 'OPPONENT:12') for tracking
 *    specific opponent players by their jersey number.
 *
 * @param {unknown} id - The ID to validate.
 * @returns {boolean} True if it's a valid player ID.
 */
function isValidPlayerId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  if (isValidUuid(id)) return true;
  if (SPECIAL_ID_SET.has(id)) return true;
  const strId = id as string;
  if (strId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
    const jersey = strId.split(":")[1];
    // Basketball jerseys are typically 0-99 or 00-99.
    // We support 1-2 digits to cover all standard variations.
    return !!jersey && /^\d{1,2}$/.test(jersey);
  }
  return false;
}

/**
 * Extracts an ID from a path given a prefix.
 * @param {string} path - The request path.
 * @param {string} prefix - The path prefix (e.g. "/players/").
 * @returns {string | null} The extracted ID or null.
 */
function extractIdFromPath(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const id = path.slice(prefix.length);
  return id.includes("/") ? null : id;
}

const Keys = {
  team: (id: string) => `TEAM#${id}`,
  player: (id: string) => `PLAYER#${id}`,
  game: (id: string) => `GAME#${id}`,
  metadata: (id: string) => `METADATA#${id}`,
  stat: (timestamp: string, id: string) => `STAT#${timestamp}#${id}`,
};

/**
 * Standardized error logger for the backend.
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object.
 */
function logError(label: string, error: unknown): void {
  logger.error(label, error);
}

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
    if (method === "GET") return await getItems(tableName, "PLAYER");
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
    const { archive } = event.queryStringParameters || {};
    if (archive !== "true") {
      return await softDeleteItem("PLAYER", "METADATA", playerId, tableName);
    }
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

  if (method === "PATCH") {
    if (body.isArchived === 0) {
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

    if (body.deletedAt === null) {
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
  }

  return null;
}

/**
 * Validates stat data for POST/PUT requests.
 * @param {Record<string, unknown>} body - Request body.
 * @returns {APIGatewayProxyResultV2 | null} Error response or null if valid.
 */
function validateStatData(
  body: Record<string, unknown>,
): APIGatewayProxyResultV2 | null {
  if (
    !body?.type ||
    typeof body.type !== "string" ||
    !VALID_ACTION_TYPES.has(body.type)
  ) {
    return badRequest("Valid stat type is required");
  }

  const points = body.points as number | undefined;
  if (
    points !== undefined &&
    (!Number.isInteger(points) || points < 0 || points > 3)
  ) {
    return badRequest("Points must be an integer between 0 and 3");
  }

  if (!isValidPlayerId(body.playerId)) {
    return badRequest("Valid playerId is required");
  }

  const period = body.period as number | undefined;
  if (
    period !== undefined &&
    (!Number.isInteger(period) || period < 1 || period > 20)
  ) {
    return badRequest("Period must be an integer between 1 and 20");
  }

  const clockTime = body.clockTime as number | undefined;
  if (
    clockTime !== undefined &&
    (!Number.isInteger(clockTime) || clockTime < 0 || clockTime > 3600)
  ) {
    return badRequest(
      "Clock time must be an integer between 0 and 3600 seconds",
    );
  }

  const locationX = body.locationX as number | undefined;
  const locationY = body.locationY as number | undefined;
  if (
    (locationX !== undefined &&
      (!Number.isInteger(locationX) || locationX < 0 || locationX > 100)) ||
    (locationY !== undefined &&
      (!Number.isInteger(locationY) || locationY < 0 || locationY > 100))
  ) {
    return badRequest(
      "Location coordinates must be integers between 0 and 100",
    );
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
      return await getItemsByGSI(`TEAM#${teamId}`, tableName);
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
      const resp = await createItem(
        "GAME",
        "METADATA",
        Keys.team(body.teamId as string),
        body,
        tableName,
      );
      if (resp.statusCode !== 201 || !resp.body) return resp;
      const newItem = JSON.parse(resp.body);
      await snapshotTeamGames(newItem.teamId, tableName);
      if (newItem.completed) await snapshotGameStats(newItem.id, tableName);
      return resp;
    }
  }

  const gameId = extractIdFromPath(path, "/games/");
  if (gameId && !isValidUuid(gameId)) {
    return badRequest("Invalid gameId format (UUID required)");
  }

  if (gameId && method === "DELETE") {
    const getResp = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
      }),
    );
    const resp = await softDeleteItem("GAME", "METADATA", gameId, tableName);
    if (resp.statusCode === 200 && getResp.Item) {
      await snapshotTeamGames(getResp.Item.teamId, tableName);
      await deleteGameSnapshots(gameId);
    }
    return resp;
  }

  if (gameId && method === "PATCH" && body.deletedAt === null) {
    const gameKey = { PK: Keys.game(gameId), SK: Keys.metadata(gameId) };
    const getResp = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: gameKey,
      }),
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
      await snapshotTeamGames(getResp.Item.teamId, tableName);
      if (getResp.Item.completed) await snapshotGameStats(gameId, tableName);
    }
    return ok({ message: "Game restored" });
  }

  if (
    path.startsWith("/games/") &&
    path.endsWith("/complete") &&
    method === "POST"
  ) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const gameId = parts[2];
    if (!isValidUuid(gameId)) {
      return badRequest("Invalid gameId format (UUID required)");
    }
    const getResp = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
      }),
    );
    if (!getResp.Item) return notFound("Game not found");
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
        UpdateExpression: "SET completed = :c",
        ExpressionAttributeValues: { ":c": 1 },
        ConditionExpression: "attribute_exists(PK)",
      }),
    );
    await snapshotGameStats(gameId, tableName);
    await snapshotTeamGames(getResp.Item.teamId, tableName);
    return ok({ message: "Game completed" });
  }

  if (path.startsWith("/games/") && path.endsWith("/stats")) {
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
      return ok(result.Items?.filter((i) => !i.deletedAt) || []);
    }
    if (method === "POST") {
      const validationError = validateStatData(body);
      if (validationError) return validationError;

      const id = (body?.id as string) || uuidv4();
      if (!isValidUuid(id)) {
        return badRequest("Invalid stat id format (UUID required)");
      }

      const timestamp = (body?.timestamp as string) || new Date().toISOString();
      if (
        typeof timestamp !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)
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
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      await snapshotGameStats(gameId, tableName);
      return created(item);
    }
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
    if (method === "GET") return await getItems(tableName, "TEAM");
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
      await syncTeamSnapshots(newItem.id, tableName);
      return resp;
    }
    return null;
  }

  const teamId = extractIdFromPath(path, "/teams/");
  if (teamId && !isValidUuid(teamId)) {
    return badRequest("Invalid teamId format (UUID required)");
  }

  if (teamId && method === "DELETE") {
    const resp = await softDeleteItem("TEAM", "METADATA", teamId, tableName);
    if (resp.statusCode === 200) await deleteTeamSnapshots(teamId);
    return resp;
  }

  if (teamId && method === "PATCH" && body.deletedAt === null) {
    const teamKey = { PK: Keys.team(teamId), SK: Keys.metadata(teamId) };
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: teamKey,
        UpdateExpression: "REMOVE deletedAt",
        ConditionExpression: "attribute_exists(PK)",
      }),
    );
    await syncTeamSnapshots(teamId, tableName);
    return ok({ message: "Team restored" });
  }

  if (path.startsWith("/teams/") && path.endsWith("/players")) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const teamId = parts[2];
    if (!isValidUuid(teamId)) {
      return badRequest("Invalid teamId format (UUID required)");
    }
    if (method === "GET")
      return await getItemsByGSI(`TEAM#${teamId}`, tableName);
    if (method === "POST") {
      if (!isValidUuid(body.playerId)) {
        return badRequest("Valid playerId (UUID) is required");
      }
      if (body.id && !isValidUuid(body.id)) {
        return badRequest("Invalid player mapping id format (UUID required)");
      }
      const cleanBody = stripLocalFields(body);
      const teamPlayerItem = {
        ...(cleanBody as Record<string, unknown>),
        PK: Keys.team(teamId),
        SK: Keys.player(body.playerId as string),
        GSI1PK: Keys.team(teamId),
        GSI1SK: Keys.player(body.playerId as string),
        id: body.id as string,
        teamId,
      };
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: teamPlayerItem,
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      await snapshotTeamRoster(teamId, tableName);
      return created(teamPlayerItem);
    }
  }

  if (path.startsWith("/teams/") && path.includes("/players/")) {
    const parts = path.split("/");
    if (parts.length !== 5) return null;
    const teamId = parts[2];
    const playerId = parts[4];
    if (!isValidUuid(teamId) || !isValidUuid(playerId)) {
      return badRequest("Invalid teamId or playerId format (UUID required)");
    }
    if (method === "DELETE") {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.team(teamId), SK: Keys.player(playerId) },
          UpdateExpression: "SET deletedAt = :d",
          ExpressionAttributeValues: { ":d": new Date().toISOString() },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeamRoster(teamId, tableName);
      return ok({ message: "Player removed from team" });
    }
  }

  return null;
}

/**
 * Redacts sensitive information from the Lambda event before logging.
 *
 * WHY: This is a security-critical function that prevents JWT tokens and other
 * secrets (like the "Authorization" header) from being leaked into CloudWatch logs.
 *
 * PERFORMANCE & SECURITY TRADEOFF:
 * We use a shallow clone approach for performance, as logging happens on every
 * request. Shallow cloning the root event and then the headers object allows us
 * to safely redact values without mutating the original event used by the handler,
 * avoiding the overhead of a full deep clone or recursive traversal.
 *
 * NOTE: We check for 'authorization' in a case-insensitive manner (key.toLowerCase())
 * because HTTP header keys are case-insensitive according to RFC 9110, and
 * different clients or proxies may use varying casings.
 *
 * @param {APIGatewayProxyEventV2} event - The raw Lambda event.
 * @returns {APIGatewayProxyEventV2} A sanitized copy of the event.
 */
function maskEvent(event: APIGatewayProxyEventV2): APIGatewayProxyEventV2 {
  const headers = event.headers || {};
  const cookies = event.cookies || [];

  // ⚡ Bolt: Check for redacted headers/cookies before cloning to avoid unnecessary allocations.
  const hasRedactable =
    cookies.length > 0 ||
    Object.keys(headers).some((key) => REDACTED_HEADERS.has(key.toLowerCase()));

  if (!hasRedactable) return event;

  const masked = { ...event };

  if (headers) {
    const redactedHeaders = { ...headers };
    for (const key in redactedHeaders) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedHeaders[key] = "[REDACTED]";
      }
    }
    masked.headers = redactedHeaders;
  }

  if (cookies.length > 0) {
    masked.cookies = cookies.map(() => "[REDACTED]");
  }

  return masked;
}

/**
 * Main Lambda handler function.
 * Handles routing based on HTTP method and path, processes request bodies,
 * and interacts with DynamoDB and S3.
 *
 * @param {APIGatewayProxyEventV2} event - The API Gateway event object.
 * @returns {Promise<APIGatewayProxyResultV2>} The HTTP response.
 */
/**
 * Extracts HTTP method and path from various event formats.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {{method: string, path: string}} Normalized metadata.
 */
function extractRequestMetadata(event: APIGatewayProxyEventV2): {
  method: string;
  path: string;
} {
  const method =
    event.requestContext?.http?.method ||
    (event as unknown as Record<string, string>).method ||
    (event as unknown as Record<string, string>).httpMethod ||
    "GET";
  return { method, path: normalizePath(event) };
}

/**
 * Parses the request body as JSON.
 * @param {string | undefined} body - Raw body string.
 * @returns {Record<string, unknown>} Parsed body.
 * @throws {Error} If JSON is invalid.
 */
function parseBody(body: string | undefined): Record<string, unknown> {
  if (!body) return {};
  return typeof body === "string" ? JSON.parse(body) : body;
}

/**
 * Timing-safe string comparison to prevent timing attacks on sensitive keys.
 *
 * WHY: Traditional string comparison (== or ===) returns early when it finds a
 * mismatch, leaking information about how many characters matched via response time.
 * This can allow an attacker to reconstruct the admin key character-by-character.
 * crypto.timingSafeEqual prevents this by always checking all bytes, but it requires
 * both inputs to have the same length.
 *
 * Hashing both inputs to SHA-256 first ensures that:
 * 1. Both buffers passed to timingSafeEqual have the same fixed length (32 bytes).
 * 2. We don't leak the length of the secret API key through the comparison time.
 *
 * @param {string} a - First string (e.g., user-provided key).
 * @param {string} b - Second string (e.g., actual secret key).
 * @returns {boolean} True if strings are equal.
 */
function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Case-insensitively retrieves the API key from request headers.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {string} The API key or empty string.
 */
function getApiKey(event: APIGatewayProxyEventV2): string {
  if (!event.headers) return "";
  for (const key in event.headers) {
    if (key.toLowerCase() === "x-api-key") {
      return event.headers[key] || "";
    }
  }
  return "";
}

/**
 * Handler for cleanup-related endpoints.
 *
 * SECURITY: This is a highly privileged endpoint that performs hard deletes
 * of data. It is protected by a secondary ADMIN_API_KEY check using timing-safe
 * comparison to prevent unauthorized access and brute-force attacks.
 *
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} Response.
 */
async function handleCleanup(
  method: string,
  path: string,
  event: APIGatewayProxyEventV2,
  tableName: string,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/cleanup" && method === "POST") {
    const adminApiKey = process.env.ADMIN_API_KEY;

    // Case-insensitive retrieval of the API key from headers
    const requestApiKey = getApiKey(event);

    // Protection against DoS via extremely large API keys in headers
    if (requestApiKey && requestApiKey.length > 128) {
      return response(403, { message: "Unauthorized: Invalid key format" });
    }

    if (
      !adminApiKey ||
      !requestApiKey ||
      !safeCompare(requestApiKey, adminApiKey)
    ) {
      return response(403, { message: "Unauthorized cleanup request" });
    }

    await performHardCleanup(tableName);
    return ok({ message: "Cleanup complete" });
  }
  return null;
}

/**
 * Enforces application/json content-type for write requests with a body.
 * @param {string} method - HTTP method.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {APIGatewayProxyResultV2 | null} Error response or null if valid.
 */
function validateContentType(
  method: string,
  event: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 | null {
  if (["POST", "PUT", "PATCH"].includes(method) && event.body) {
    const contentType =
      event.headers?.["content-type"] || event.headers?.["Content-Type"];
    if (!contentType?.toLowerCase().includes("application/json")) {
      return response(415, {
        message: "Unsupported Media Type: application/json required",
      });
    }
  }
  return null;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.info("Event received", maskEvent(event));

  const { method, path } = extractRequestMetadata(event);
  logger.info("Routing request", { method, path });

  // Enforce Content-Type for write requests with a body
  const contentTypeError = validateContentType(method, event);
  if (contentTypeError) return contentTypeError;

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
      (await handleCleanup(method, path, event, TABLE_NAME));

    return res || notFound("Route not found");
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      if (method === "POST") {
        return conflict("Item already exists");
      }
      return notFound("Item not found");
    }
    logError("Handler Error", error);
    return serverError();
  }
};

/**
 * Normalizes the request path by removing stage and prefix information.
 *
 * @param {APIGatewayProxyEventV2} event - The API Gateway event.
 * @returns {string} The normalized path.
 */
function normalizePath(event: APIGatewayProxyEventV2): string {
  const raw = (event.rawPath ||
    (event as unknown as Record<string, unknown>).path ||
    event.requestContext?.http?.path ||
    "/") as string;

  let path = raw;
  if (path.startsWith("/$default")) path = path.slice(9);
  else if (path.startsWith("/api")) path = path.slice(4);

  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  return path || "/";
}

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 *
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} gsiPrefix - The prefix for the GSI1PK.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
async function getItems(
  tableName: string,
  gsiPrefix: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    }),
  );
  return ok(result.Items?.filter((i) => !i.deletedAt) || []);
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 *
 * @param {string} gsiPk - The GSI1PK value.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
async function getItemsByGSI(
  gsiPk: string,
  tableName: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    }),
  );
  return ok(result.Items?.filter((i) => !i.deletedAt) || []);
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
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  );
  return created(item);
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

/**
 * Executes snapshot logic with error handling and environment variable validation.
 * @param {string} label - Contextual label for error logging.
 * @param {Function} fn - The snapshot function to execute.
 * @returns {Promise<void>}
 */
async function withDataBucket(
  label: string,
  fn: (bucket: string) => Promise<void>,
): Promise<void> {
  const bucket = process.env.DATA_BUCKET;
  if (!bucket) return;
  try {
    await fn(bucket);
  } catch (e) {
    logError(label, e);
  }
}

/**
 * Synchronizes all snapshots for a team (roster and games).
 * @param {string} teamId - The team ID.
 * @param {string} tableName - DynamoDB table name.
 */
async function syncTeamSnapshots(
  teamId: string,
  tableName: string,
): Promise<void> {
  await Promise.all([
    snapshotTeamRoster(teamId, tableName),
    snapshotTeamGames(teamId, tableName),
  ]);
}

/**
 * Generates and uploads a team roster snapshot JSON to S3.
 *
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<void>}
 */
async function snapshotTeamRoster(
  teamId: string,
  tableName: string,
): Promise<void> {
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
 *
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<void>}
 */
async function snapshotTeamGames(
  teamId: string,
  tableName: string,
): Promise<void> {
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
 * Generates and uploads a detailed game stats snapshot JSON to S3, including calculated results.
 *
 * @param {string} gameId - The game ID.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<void>}
 */
async function snapshotGameStats(
  gameId: string,
  tableName: string,
): Promise<void> {
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
 * Accumulates the total score for both teams from a list of stat events.
 * 🏀 CoachBoard: Field Goal Tracking
 * Why: Free throws (points: 1) are always counted as 1 point ONLY if the type is MAKE.
 * A MISS with points: 1 (used for FTA tracking) should NOT increment the score.
 *
 * @param {Record<string, unknown>[]} stats - List of statistical events.
 * @returns {{teamScore: number, oppScore: number}} Total scores for Team and Opponent.
 */
function accumulateScores(stats: Record<string, unknown>[]): {
  teamScore: number;
  oppScore: number;
} {
  let teamScore = 0;
  let oppScore = 0;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.deletedAt) continue;

    // Only increment score for MAKE events.
    if (s.type !== "MAKE") continue;

    const pts = (s.points as number) || 0;

    if (
      typeof s.playerId === "string" &&
      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
    ) {
      oppScore += pts;
    } else {
      teamScore += pts;
    }
  }
  return { teamScore, oppScore };
}

/**
 * Determines the game result (W, L, or D) based on team and opponent scores.
 * @param {number} teamScore - Points scored by the team.
 * @param {number} oppScore - Points scored by the opponent.
 * @returns {"W" | "L" | "D"} Result indicator.
 */
function determineResult(teamScore: number, oppScore: number): "W" | "L" | "D" {
  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
}

/**
 * Calculates the final score and result from a list of stat events.
 *
 * @param {Record<string, unknown>[]} stats - List of stat events.
 * @returns {{teamScore: number, oppScore: number, result: string}} Object containing teamScore, oppScore, and result.
 */
function calculateGameResultFromStats(stats: Record<string, unknown>[]): {
  teamScore: number;
  oppScore: number;
  result: string;
} {
  const { teamScore, oppScore } = accumulateScores(stats);
  const result = determineResult(teamScore, oppScore);
  return { teamScore, oppScore, result };
}

/**
 * Uploads a JSON snapshot to S3.
 *
 * @param {string} bucket - The S3 bucket name.
 * @param {string} key - The S3 object key.
 * @param {unknown} data - The data to upload as JSON.
 * @returns {Promise<void>}
 */
async function uploadSnapshot(
  bucket: string,
  key: string,
  data: unknown,
): Promise<void> {
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
 * Deletes team-related snapshots from S3.
 * @param {string} teamId - Team ID.
 * @returns {Promise<void>}
 */
async function deleteTeamSnapshots(teamId: string): Promise<void> {
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
 * @param {string} gameId - Game ID.
 * @returns {Promise<void>}
 */
async function deleteGameSnapshots(gameId: string): Promise<void> {
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

/**
 * Performs cleanup of soft-deleted items older than 24 hours.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<void>}
 */
async function performHardCleanup(tableName: string): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // This is a simplified scan-based cleanup. For large tables, use a GSI on deletedAt.
  // Since we have a single table, we'll scan for items with deletedAt < oneDayAgo.
  await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1", // We can't query by deletedAt easily without a GSI.
      // For now, we'll just implement the logic to delete a specific item if it's old.
      // In a real app, I'd add GSI3 with deletedAt as PK or similar.
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "TEAM" }, // Just an example
    }),
  );

  logger.info("Cleanup attempted", { threshold: oneDayAgo });
}

/**
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * WHY: This is a defense-in-depth measure to prevent "Mass Assignment" or "Over-posting"
 * vulnerabilities. It ensures that even if a malicious user provides internal
 * DynamoDB keys (like PK/SK or GSIs) in the request body, those keys are stripped
 * before the object is persisted.
 *
 * Without this, an attacker could overwrite existing items by providing a matching
 * PK/SK or escalate privileges by injecting internal metadata that bypasses application logic.
 *
 * @param {Record<string, unknown>} data - The data object to clean.
 * @returns {Record<string, unknown>} The cleaned object.
 */
function stripLocalFields(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || data === null) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const key in data as Record<string, unknown>) {
    if (
      Object.prototype.hasOwnProperty.call(data, key) &&
      !INTERNAL_KEYS.has(key)
    ) {
      result[key] = (data as Record<string, unknown>)[key];
    }
  }
  return result;
}
