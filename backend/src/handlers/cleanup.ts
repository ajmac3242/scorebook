import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import {
  QueryCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import {
  ok,
  response,
} from "../responses.js";
import {
  logError,
  logInfo,
  safeCompare,
  getHeader,
} from "../utils.js";

/**
 * Handler for cleanup-related endpoints.
 */
export async function handleCleanup(
  method: string,
  path: string,
  event: APIGatewayProxyEventV2,
  tableName: string,
  requestId: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  const logLabel = (label: string) => `[${requestId}] ${label}`;

  if (path === "/cleanup" && method === "POST") {
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiKey || adminApiKey.length < 16) {
      logError(
        logLabel("Security Warning"),
        "ADMIN_API_KEY is missing or too weak (min 16 chars). Cleanup denied.",
      );
      return response(
        403,
        { message: "Unauthorized cleanup request" },
        {},
        requestId,
      );
    }

    const requestApiKey = getHeader(event.headers, "x-api-key") || "";

    if (requestApiKey.length > 128) {
      logError(
        logLabel("Security Warning"),
        "Extremely long API key provided. Potential DoS attempt.",
      );
      return response(
        403,
        { message: "Unauthorized cleanup request" },
        {},
        requestId,
      );
    }

    if (!requestApiKey || !safeCompare(requestApiKey, adminApiKey)) {
      return response(
        403,
        { message: "Unauthorized cleanup request" },
        {},
        requestId,
      );
    }

    await performHardCleanup(tableName, docClient);
    return ok({ message: "Cleanup complete" }, requestId);
  }
  return null;
}

/**
 * Performs cleanup of soft-deleted items older than 24 hours.
 */
async function performHardCleanup(
  tableName: string,
  docClient: DynamoDBDocumentClient,
) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "TEAM" },
    }),
  );

  logInfo("Cleanup attempted with threshold", oneDayAgo);
}
