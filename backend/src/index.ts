/**
 * @file index.ts
 * @description Main Lambda handler for the Basketball Stats API.
 * Provides RESTful endpoints for managing Seasons, Teams, Players, Games, and Stats.
 * Implements an offline-first synchronization strategy with S3 snapshot generation.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import crypto from "node:crypto";
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
    // 🛡️ Sentinel: Ensure parsed body is a non-null object and not an array
    // to prevent downstream logic from failing or being bypassed.
    // Enhanced: check maximum property count to mitigate DoS.
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length <= 100
    ) {
      return parsed as Record<string, unknown>;
    }
    return {};
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
  const requestId =
    getHeader(event.headers, "x-request-id") ||
    event.requestContext?.requestId ||
    `req-${crypto.randomUUID().split("-")[0]}`;

  logInfo(`[${requestId}] Event`, maskEvent(event));

  const { method, path } = extractRequestMetadata(event);
  logInfo(`[${requestId}] Routing`, { method, path });

  if (!ALLOWED_METHODS.has(method)) {
    return response(
      405,
      { message: `Method ${method} not allowed` },
      {},
      requestId,
    );
  }

  if (event.body && event.body.length > MAX_BODY_SIZE) {
    return response(413, { message: "Payload too large" }, {}, requestId);
  }

  if (["POST", "PUT", "PATCH"].includes(method) && event.body) {
    const contentType = getHeader(event.headers, "content-type");
    if (!contentType?.toLowerCase().includes("application/json")) {
      return response(
        415,
        { message: "Unsupported Media Type: application/json required" },
        {},
        requestId,
      );
    }
  }

  let body: Record<string, unknown> = {};
  try {
    const rawBody = event.body;
    // 🛡️ Sentinel Enhancement 2: Protect against prototype pollution
    // by rejecting raw strings that contain forbidden keys before parsing.
    if (
      rawBody &&
      (rawBody.includes('"__proto__"') ||
        rawBody.includes('"constructor"') ||
        rawBody.includes('"prototype"'))
    ) {
      logError(
        `[${requestId}] Security Violation`,
        "Prototype pollution attempt detected",
      );
      return response(400, { message: "Invalid request body" }, {}, requestId);
    }
    body = parseBody(rawBody);
  } catch (e) {
    return response(400, { message: "Invalid JSON body" }, {}, requestId);
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    const res =
      (await handleTeams(method, path, body, event, TABLE_NAME, docClient)) ||
      (await handlePlayers(method, path, body, event, TABLE_NAME, docClient)) ||
      (await handleGames(method, path, body, event, TABLE_NAME, docClient)) ||
      (await handleCleanup(method, path, event, TABLE_NAME, docClient));

    if (res) {
      // 🛡️ Sentinel: Safe header injection for auditability
      if (typeof res === "object") {
        if (res.headers) {
          res.headers["X-Request-ID"] = requestId;
        } else {
          res.headers = { "X-Request-ID": requestId };
        }
      }
      return res;
    }
    return response(404, { message: "Route not found" }, {}, requestId);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      if (method === "POST") {
        return response(409, { message: "Item already exists" }, {}, requestId);
      }
      return response(404, { message: "Item not found" }, {}, requestId);
    }
    logError(`[${requestId}] Handler Error`, error);
    return response(500, { message: "Internal Server Error" }, {}, requestId);
  }
};
