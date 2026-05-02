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
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
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
  filterActive,
} from "./responses.js";
import {
  isValidUuid,
} from "./validation.js";
import {
  logError,
  logInfo,
  maskEvent,
  extractRequestMetadata,
  normalizePath,
  extractIdFromPath,
  stripLocalFields,
  getHeader,
} from "./utils.js";
import { handleCleanup } from "./handlers/cleanup.js";
import { handlePlayers } from "./handlers/players.js";
import { handleGames } from "./handlers/games.js";
import { handleTeams } from "./handlers/teams.js";

// Clients
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);
export const s3Client = new S3Client({});

/**
 * Maximum allowed request body size (512KB).
 * Prevents memory exhaustion attacks and large data injection.
 */
const MAX_BODY_SIZE = 512 * 1024;

/**
 * Whitelist of allowed HTTP methods for this API.
 */
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/**
 * Main Lambda handler routing requests to specialized domain handlers.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @returns {Promise<APIGatewayProxyResultV2>} The response.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logInfo("Event", maskEvent(event));

  const { method, path } = extractRequestMetadata(event);
  logInfo("Routing", { method, path });

  if (!ALLOWED_METHODS.has(method)) {
    return response(405, { message: `Method ${method} not allowed` });
  }

  if (event.body && event.body.length > MAX_BODY_SIZE) {
    return response(413, { message: "Payload too large" });
  }

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
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch {
    return badRequest("Invalid JSON body");
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    const res =
      (await handleTeams(method, path, body, event, TABLE_NAME, docClient)) ||
      (await handlePlayers(method, path, body, event, TABLE_NAME, docClient)) ||
      (await handleGames(method, path, body, event, TABLE_NAME, docClient)) ||
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
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} gsiPrefix - The prefix for the GSI1PK.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
export async function getItems(
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
  return ok(filterActive(result.Items as Record<string, unknown>[]));
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 * @param {string} gsiPk - The GSI1PK value.
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
export async function getItemsByGSI(
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
  return ok(filterActive(result.Items as Record<string, unknown>[]));
}

/**
 * Creates a new item in DynamoDB.
 * @param {string} type - The item type (e.g., SEASON, TEAM).
 * @param {string} skPrefix - The prefix for the SK.
 * @param {string} gsiPk - The GSI1PK value.
 * @param {Record<string, unknown>} data - The item data.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the created item.
 */
export async function createItem(
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
 * @param {string} tableName - The DynamoDB table name.
 * @param {Record<string, unknown>} item - The item to create.
 * @returns {Promise<void>}
 */
export async function putNewItem(tableName: string, item: Record<string, unknown>) {
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
 * @param {string} type - Item type.
 * @param {string} skPrefix - SK prefix.
 * @param {string} id - Item ID.
 * @param {string} tableName - DynamoDB table name.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} Response.
 */
export async function softDeleteItem(
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
