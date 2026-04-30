/**
 * @file index.ts
 * @description Main Lambda handler for the Basketball Stats API.
 * Provides RESTful endpoints for managing Seasons, Teams, Players, Games, and Stats.
 */

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import {
  badRequest,
  notFound,
  serverError,
  response,
} from "./responses.js";
import {
  logError,
  logInfo,
  maskEvent,
  extractRequestMetadata,
  getHeader,
} from "./utils.js";
import { docClient } from "./db.js";
import { handleCleanup } from "./handlers/cleanup.js";
import { handlePlayers } from "./handlers/players.js";
import { handleGames } from "./handlers/games.js";
import { handleTeams } from "./handlers/teams.js";

/**
 * Parses the request body as JSON.
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

const MAX_BODY_SIZE = 512 * 1024;
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

/**
 * Main Lambda handler for the Basketball Stats API.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;
  const logLabel = (label: string) => `[${requestId}] ${label}`;

  logInfo(logLabel("Event"), maskEvent(event));

  const { method, path } = extractRequestMetadata(event);
  logInfo(logLabel("Routing"), { method, path });

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
        {
          message: "Unsupported Media Type: application/json required",
        },
        {},
        requestId,
      );
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = parseBody(event.body);
  } catch (e) {
    return badRequest("Invalid JSON body", requestId);
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    const res =
      (await handleTeams(method, path, body, event, TABLE_NAME, requestId, docClient)) ||
      (await handlePlayers(method, path, body, event, TABLE_NAME, requestId, docClient)) ||
      (await handleGames(method, path, body, event, TABLE_NAME, requestId, docClient)) ||
      (await handleCleanup(
        method,
        path,
        event,
        TABLE_NAME,
        requestId,
        docClient,
      ));

    if (res) {
      if (typeof res !== "string" && res.headers) {
        res.headers["X-Request-Id"] = requestId;
        res.headers["Access-Control-Expose-Headers"] = "X-Request-Id";
      }
      return res;
    }

    return notFound("Route not found", requestId);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      if (method === "POST") {
        return response(409, { message: "Item already exists" }, {}, requestId);
      }
      return notFound("Item not found", requestId);
    }
    logError(logLabel("Handler Error"), error);
    return serverError(requestId);
  }
};
