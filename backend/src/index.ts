/**
 * @file index.ts
 * @description Main Lambda handler for the Basketball Stats API.
 * Provides RESTful endpoints for managing Seasons, Teams, Players, Games, and Stats.
 * Implements an offline-first synchronization strategy with S3 snapshot generation.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { badRequest, notFound, serverError, response } from "./responses.js";
import {
  logError,
  logInfo,
  maskEvent,
  extractRequestMetadata,
  getHeader,
} from "./utils.js";
import { handlePlayers } from "./handlers/players.js";
import { handleGames } from "./handlers/games.js";
import { handleTeams } from "./handlers/teams.js";
import { handleCleanup } from "./handlers/cleanup.js";

// Clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Parses the request body as JSON.
 * @param body - Raw body string.
 * @returns Parsed body.
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
    body = parseBody(event.body);
  } catch (e) {
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
