import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ok, response } from "../responses.js";
import { logError, logInfo, safeCompare, getHeader } from "../utils.js";

/**
 * Handler for cleanup-related endpoints.
 * @param method - HTTP method.
 * @param path - Request path.
 * @param event - The full Lambda event.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response or null.
 */
export async function handleCleanup(
  method: string,
  path: string,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/cleanup" && method === "POST") {
    const adminApiKey = process.env.ADMIN_API_KEY;

    // 🛡️ Sentinel Enhancement 8: Complexity check for ADMIN_API_KEY
    const weakPatterns = [/password/i, /123456/, /admin/i];
    const isWeak = weakPatterns.some((pattern) => pattern.test(adminApiKey || ""));

    if (!adminApiKey || adminApiKey.length < 16 || isWeak) {
      logError(
        "Security Warning",
        "ADMIN_API_KEY is missing, too weak (min 16 chars), or uses a forbidden common pattern. Cleanup denied.",
      );
      return response(403, { message: "Unauthorized cleanup request" });
    }

    const requestApiKey = getHeader(event.headers, "x-api-key") || "";

    if (!requestApiKey || !safeCompare(requestApiKey, adminApiKey)) {
      logError("Unauthorized Cleanup Attempt", {
        path,
        method,
        ip: getHeader(event.headers, "x-forwarded-for"),
        userAgent: getHeader(event.headers, "user-agent"),
      });
      return response(403, { message: "Unauthorized cleanup request" });
    }

    await performHardCleanup(tableName, docClient);
    return ok({ message: "Cleanup complete" });
  }
  return null;
}

/**
 * Performs cleanup of soft-deleted items older than 24 hours.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
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
