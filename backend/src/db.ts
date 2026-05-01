import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  ok,
  created,
  badRequest,
  filterActive,
} from "./responses.js";
import {
  isValidUuid,
} from "./validation.js";
import {
  stripLocalFields,
} from "./utils/data.js";
import {
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

// Clients
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 *
 * @param tableName - The name of the DynamoDB table.
 * @param gsiPrefix - The GSI1PK prefix to query.
 * @param requestId - Optional request ID for response tracking.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The API Gateway response containing items.
 */
export async function getItems(
  tableName: string,
  gsiPrefix: string,
  requestId?: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    }),
  );
  return ok(filterActive(result.Items), requestId);
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 *
 * @param gsiPk - The exact GSI1PK value to query.
 * @param tableName - The name of the DynamoDB table.
 * @param requestId - Optional request ID for response tracking.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The API Gateway response containing items.
 */
export async function getItemsByGSI(
  gsiPk: string,
  tableName: string,
  requestId?: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    }),
  );
  return ok(filterActive(result.Items), requestId);
}

/**
 * Creates a new item in DynamoDB.
 *
 * @param type - The entity type (e.g., 'TEAM', 'PLAYER').
 * @param skPrefix - The prefix for the Sort Key.
 * @param gsiPk - The partition key for GSI1.
 * @param data - The item data to store.
 * @param tableName - The name of the DynamoDB table.
 * @param requestId - Optional request ID for response tracking.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The API Gateway response containing the created item.
 */
export async function createItem(
  type: string,
  skPrefix: string,
  gsiPk: string,
  data: Record<string, unknown>,
  tableName: string,
  requestId?: string,
): Promise<APIGatewayProxyStructuredResultV2> {
  const id = (data?.id as string) || uuidv4();
  if (!isValidUuid(id)) {
    return badRequest(
      `Invalid ${type.toLowerCase()} id format (UUID required)`,
      requestId,
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
  return created(item, requestId);
}

/**
 * Idempotently creates a new item in DynamoDB if it doesn't already exist.
 *
 * @param tableName - The name of the DynamoDB table.
 * @param item - The full item record to put.
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
 *
 * @param type - The entity type.
 * @param skPrefix - The Sort Key prefix.
 * @param id - The unique ID of the item.
 * @param tableName - The name of the DynamoDB table.
 * @param requestId - Optional request ID for response tracking.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The API Gateway response.
 */
export async function softDeleteItem(
  type: string,
  skPrefix: string,
  id: string,
  tableName: string,
  requestId?: string,
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
  return ok({ message: "Item soft deleted", deletedAt: timestamp }, requestId);
}
