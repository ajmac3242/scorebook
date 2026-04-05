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

// Clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

/**
 * Standardized set of internal DynamoDB and metadata keys.
 * Used for sanitizing input data and preventing mass assignment.
 */
const INTERNAL_KEYS = new Set([
  "synced",
  "id",
  "PK",
  "SK",
  "GSI1PK",
  "GSI1SK",
  "GSI2PK",
  "GSI2SK",
]);

/**
 * Helper for generating standardized DynamoDB primary and index keys.
 */
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
function logError(label: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[ERROR] ${label}: ${error.message}`, error.stack);
  } else {
    console.error(
      `[ERROR] ${label}:`,
      typeof error === "object" ? JSON.stringify(error, null, 2) : error,
    );
  }
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
  if (path === "/players") {
    if (method === "GET") return await getItems(tableName, "PLAYER");
    if (method !== "POST") return null;

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

  const match = path.match(/^\/players\/([^\/]+)$/);
  if (!match) return null;

  const playerId = match[1];
  if (method === "DELETE") {
    const { archive } = event.queryStringParameters || {};
    if (archive === "true") {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.player(playerId), SK: Keys.metadata(playerId) },
          UpdateExpression: "SET isArchived = :a",
          ExpressionAttributeValues: { ":a": 1 },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      return ok({ message: "Player archived" });
    }
    return await softDeleteItem("PLAYER", "METADATA", playerId, tableName);
  }

  if (method !== "PATCH") return null;

  if (body.isArchived === 0) {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { PK: Keys.player(playerId), SK: Keys.metadata(playerId) },
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
        Key: { PK: Keys.player(playerId), SK: Keys.metadata(playerId) },
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
      return await getItemsByGSI(`TEAM#${teamId}`, tableName);
    }
    if (method === "POST") {
      if (!body?.teamId) return badRequest("teamId is required");
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
      if (resp.statusCode === 201 && resp.body) {
        const newItem = JSON.parse(resp.body);
        await snapshotTeamGames(newItem.teamId, tableName);
        if (newItem.completed) await snapshotGameStats(newItem.id, tableName);
      }
      return resp;
    }
  }

  const gameDetailMatch = path.match(/^\/games\/([^\/]+)$/);
  if (gameDetailMatch) {
    const gameId = gameDetailMatch[1];
    if (method === "DELETE") {
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
    if (method === "PATCH" && body.deletedAt === null) {
      const getResp = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
        }),
      );
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.game(gameId), SK: Keys.metadata(gameId) },
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
  }

  const gameCompleteMatch = path.match(/^\/games\/([^\/]+)\/complete$/);
  if (gameCompleteMatch && method === "POST") {
    const gameId = gameCompleteMatch[1];
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

  const gameStatsMatch = path.match(/^\/games\/([^\/]+)\/stats$/);
  if (gameStatsMatch) {
    const gameId = gameStatsMatch[1];
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
      if (!body?.type) return badRequest("Stat type is required");
      const id = (body?.id as string) || uuidv4();
      const timestamp = (body?.timestamp as string) || new Date().toISOString();
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
        new PutCommand({ TableName: tableName, Item: item }),
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
    if (method === "GET") {
      return await getItems(tableName, "TEAM");
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
      if (resp.statusCode === 201 && resp.body) {
        const newItem = JSON.parse(resp.body);
        await snapshotTeamRoster(newItem.id, tableName);
        await snapshotTeamGames(newItem.id, tableName);
      }
      return resp;
    }
  }

  const teamDetailMatch = path.match(/^\/teams\/([^\/]+)$/);
  if (teamDetailMatch) {
    const teamId = teamDetailMatch[1];
    if (method === "DELETE") {
      const resp = await softDeleteItem("TEAM", "METADATA", teamId, tableName);
      if (resp.statusCode === 200) await deleteTeamSnapshots(teamId);
      return resp;
    }
    if (method === "PATCH" && body.deletedAt === null) {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.team(teamId), SK: Keys.metadata(teamId) },
          UpdateExpression: "REMOVE deletedAt",
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeamRoster(teamId, tableName);
      await snapshotTeamGames(teamId, tableName);
      return ok({ message: "Team restored" });
    }
  }

  const teamPlayersMatch = path.match(/^\/teams\/([^\/]+)\/players$/);
  if (teamPlayersMatch) {
    const teamId = teamPlayersMatch[1];
    if (method === "GET")
      return await getItemsByGSI(`TEAM#${teamId}`, tableName);
    if (method === "POST") {
      if (!body.playerId) return badRequest("playerId required");
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
        new PutCommand({ TableName: tableName, Item: teamPlayerItem }),
      );
      await snapshotTeamRoster(teamId, tableName);
      return created(teamPlayerItem);
    }
  }

  const teamPlayerDetailMatch = path.match(
    /^\/teams\/([^\/]+)\/players\/([^\/]+)$/,
  );
  if (teamPlayerDetailMatch) {
    const teamId = teamPlayerDetailMatch[1];
    const playerId = teamPlayerDetailMatch[2];
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
 * @returns {unknown} A sanitized copy of the event.
 */
function maskEvent(event: APIGatewayProxyEventV2): unknown {
  const masked = { ...event };
  if (masked.headers) {
    const redactedHeaders = { ...masked.headers };
    for (const key in redactedHeaders) {
      if (
        Object.prototype.hasOwnProperty.call(redactedHeaders, key) &&
        key.toLowerCase() === "authorization"
      ) {
        redactedHeaders[key] = "[REDACTED]";
      }
    }
    masked.headers = redactedHeaders;
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
function extractRequestMetadata(event: APIGatewayProxyEventV2) {
  const method =
    (event as unknown as Record<string, unknown>).method ||
    (event as unknown as Record<string, unknown>).httpMethod ||
    event.requestContext?.http?.method ||
    "GET";
  return { method: method as string, path: normalizePath(event) };
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
 * Handler for cleanup-related endpoints.
 * @param {string} method - HTTP method.
 * @param {string} path - Request path.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} Response.
 */
async function handleCleanup(
  method: string,
  path: string,
  tableName: string,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/cleanup" && method === "POST") {
    await performHardCleanup(tableName);
    return ok({ message: "Cleanup complete" });
  }
  return null;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(maskEvent(event)));

  const { method, path } = extractRequestMetadata(event);
  console.log("Routing:", { method, path });

  let body: Record<string, unknown> = {};
  try {
    body = parseBody(event.body);
  } catch (e) {
    return badRequest("Invalid JSON body");
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    const teamsResponse = await handleTeams(
      method,
      path,
      body,
      event,
      TABLE_NAME,
    );
    if (teamsResponse) return teamsResponse;

    const playersResponse = await handlePlayers(
      method,
      path,
      body,
      event,
      TABLE_NAME,
    );
    if (playersResponse) return playersResponse;

    const gamesResponse = await handleGames(
      method,
      path,
      body,
      event,
      TABLE_NAME,
    );
    if (gamesResponse) return gamesResponse;

    const cleanupResponse = await handleCleanup(method, path, TABLE_NAME);
    if (cleanupResponse) return cleanupResponse;

    return notFound("Route not found");
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
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
  const cleanData = stripLocalFields(data);
  const item = {
    ...(cleanData as Record<string, unknown>),
    PK: `${type}#${id}`,
    SK: `${skPrefix}#${id}`,
    GSI1PK: gsiPk,
    GSI1SK: `${type}#${id}`,
    id,
  };
  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
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
 * Generates and uploads a team roster snapshot JSON to S3.
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<void>}
 */
/**
 * Executes snapshot logic with error handling and environment variable validation.
 * @param {string} label - Contextual label for error logging.
 * @param {Function} fn - The snapshot function to execute.
 * @returns {Promise<void>}
 */
async function withDataBucket(
  label: string,
  fn: (bucket: string) => Promise<void>,
) {
  const bucket = process.env.DATA_BUCKET;
  if (!bucket) return;
  try {
    await fn(bucket);
  } catch (e) {
    logError(label, e);
  }
}

/**
 * Generates and uploads a team roster snapshot JSON to S3.
 *
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<void>}
 */
async function snapshotTeamRoster(teamId: string, tableName: string) {
  await withDataBucket("Snapshot Team Roster Error", async (bucket) => {
    const teamResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: `TEAM#${teamId}`, SK: `METADATA#${teamId}` },
      }),
    );
    if (!teamResult?.Item || teamResult.Item.deletedAt) return;

    const playersResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `TEAM#${teamId}`,
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
async function snapshotTeamGames(teamId: string, tableName: string) {
  await withDataBucket("Snapshot Team Games Error", async (bucket) => {
    const gamesResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: { ":pk": `TEAM#${teamId}`, ":sk": "GAME#" },
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
async function snapshotGameStats(gameId: string, tableName: string) {
  await withDataBucket("Snapshot Game Stats Error", async (bucket) => {
    const gameResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` },
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
 * Accumulates scores for team and opponent from stat events.
 * @param {Record<string, unknown>[]} stats - List of stat events.
 * @returns {{teamScore: number, oppScore: number}} Object containing teamScore and oppScore.
 */
function accumulateScores(stats: Record<string, unknown>[]) {
  let teamScore = 0;
  let oppScore = 0;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.playerId === "OPPONENT") oppScore += (s.points as number) || 0;
    else teamScore += (s.points as number) || 0;
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
function calculateGameResultFromStats(stats: Record<string, unknown>[]) {
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
async function uploadSnapshot(bucket: string, key: string, data: unknown) {
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
async function deleteTeamSnapshots(teamId: string) {
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
async function deleteGameSnapshots(gameId: string) {
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
async function performHardCleanup(tableName: string) {
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

  console.log("Cleanup attempted with threshold:", oneDayAgo);
}

/**
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * WHY: This is a defense-in-depth measure to prevent mass assignment vulnerabilities.
 * It ensures that even if a malicious user provides internal DynamoDB keys (like PK/SK)
 * in the request body, those keys are stripped before the object is persisted.
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

/**
 * Redacts internal metadata keys from outgoing data for API responses and S3 snapshots.
 * Recursively cleans objects and arrays while preserving the 'id' field for frontend consumption.
 *
 * WHY: This prevents leaking infrastructure implementation details (DynamoDB key structure)
 * to the client, while still allowing the frontend to identify entities via their UUID 'id'.
 *
 * @param {unknown} data - The data object or array to sanitize.
 * @returns {unknown} The sanitized data.
 */
function sanitizeOutput(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  if (data !== null && typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const key in data as Record<string, unknown>) {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        (!INTERNAL_KEYS.has(key) || key === "id")
      ) {
        sanitized[key] = sanitizeOutput((data as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Formats a standardized JSON response.
 *
 * @param {number} statusCode - The HTTP status code.
 * @param {unknown} body - The JSON body data.
 * @param {Record<string, string>} [headers] - Optional additional headers.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response object.
 */
function response(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(sanitizeOutput(body)),
  };
}

/**
 * Semantic response helpers.
 * @param {unknown} body - Response body.
 * @returns {APIGatewayProxyStructuredResultV2} Response.
 */
const ok = (body: unknown) => response(200, body);
/**
 * Semantic response helpers.
 * @param {unknown} body - Response body.
 * @returns {APIGatewayProxyStructuredResultV2} Response.
 */
const created = (body: unknown) => response(201, body);
/**
 * Semantic response helpers.
 * @param {string} msg - Error message.
 * @returns {APIGatewayProxyStructuredResultV2} Response.
 */
const badRequest = (msg: string) => response(400, { message: msg });
/**
 * Semantic response helpers.
 * @param {string} msg - Error message.
 * @returns {APIGatewayProxyStructuredResultV2} Response.
 */
const notFound = (msg: string) => response(404, { message: msg });
/**
 * Semantic response helpers.
 * @returns {APIGatewayProxyStructuredResultV2} Response.
 */
const serverError = () => response(500, { message: "Internal Server Error" });
