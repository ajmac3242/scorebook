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
  const fallback = () => Object.create(null);
  if (!body) return fallback();

  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;

    // 🛡️ Sentinel: Ensure parsed body is a non-null object and not an array.
    // Enhanced: check maximum property count to mitigate DoS.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fallback();
    }

    const keys = Object.keys(parsed);
    if (keys.length > 100) return fallback();

    // 🛡️ Sentinel Enhancement 5: Limit JSON property name length
    if (keys.some((key) => key.length > 128)) return fallback();

    // 🛡️ Sentinel: Use null-prototype object to prevent downstream prototype pollution
    return Object.assign(fallback(), parsed);
  } catch {
    return fallback();
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
  let requestId =
    getHeader(event.headers, "x-request-id") ||
    event.requestContext?.requestId ||
    `req-${crypto.randomUUID().split("-")[0]}`;

  // 🛡️ Sentinel Enhancement 2: Validate Request ID format to prevent log injection
  if (!/^[a-zA-Z0-9\-_]{1,64}$/.test(requestId)) {
    requestId = `req-fallback-${crypto.randomUUID().split("-")[0]}`;
  }

  logInfo(`[${requestId}] Event`, maskEvent(event));

  // 🛡️ Sentinel: Mitigate DoS via header processing
  if (event.headers && Object.keys(event.headers).length > 100) {
    return response(400, { message: "Too many headers" }, {}, requestId);
  }

  // 🛡️ Sentinel: Mitigate DoS via query parameters count processing
  if (
    event.queryStringParameters &&
    Object.keys(event.queryStringParameters).length > 50
  ) {
    return response(
      400,
      { message: "Too many query parameters" },
      {},
      requestId,
    );
  }

  const { method, path } = extractRequestMetadata(event);
  logInfo(`[${requestId}] Routing`, { method, path });

  // 🛡️ Sentinel: Mitigate DoS via request path length processing
  if (path && path.length > 512) {
    return response(400, { message: "Request path too long" }, {}, requestId);
  }

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
