import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { ok, created, filterActive, badRequest } from "./responses.js";
import { isValidUuid } from "./validation.js";
import { stripLocalFields } from "./security.js";

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 * @param {string} tableName - The name of the DynamoDB table.
 * @param {string} gsiPrefix - The prefix for the GSI1PK.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
export async function getItems(
  tableName: string,
  gsiPrefix: string,
  docClient: DynamoDBDocumentClient,
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
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @param {string} [projection] - Optional projection expression.
 * @param {Record<string, string>} [expressionAttributeNames] - Optional attribute name mappings.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the items.
 */
export async function getItemsByGSI(
  gsiPk: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
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
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} The HTTP response with the created item.
 */
export async function createItem(
  type: string,
  skPrefix: string,
  gsiPk: string,
  data: Record<string, unknown>,
  tableName: string,
  docClient: DynamoDBDocumentClient,
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
  await putNewItem(tableName, item, docClient);
  return created(item);
}

/**
 * Idempotently creates a new item in DynamoDB if it doesn't already exist.
 * @param {string} tableName - The DynamoDB table name.
 * @param {Record<string, unknown>} item - The item to create.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<void>}
 */
export async function putNewItem(
  tableName: string,
  item: Record<string, unknown>,
  docClient: DynamoDBDocumentClient,
) {
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
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyStructuredResultV2>} Response.
 */
export async function softDeleteItem(
  type: string,
  skPrefix: string,
  id: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
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
