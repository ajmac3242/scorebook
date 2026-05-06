import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { ok, created, badRequest, filterActive } from "./responses.js";
import { isValidUuid } from "./validation.js";
import { stripLocalFields } from "./utils.js";

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 *
 * @param tableName - The name of the DynamoDB table.
 * @param gsiPrefix - The prefix for the GSI1PK.
 * @param docClient - DynamoDB Document Client.
 * @returns The HTTP response with the items.
 */
export async function getItems(
  tableName: string,
  gsiPrefix: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    }),
  );
  return ok(filterActive(result.Items));
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 *
 * @param gsiPk - The GSI1PK value.
 * @param tableName - The name of the DynamoDB table.
 * @param docClient - DynamoDB Document Client.
 * @returns The HTTP response with the items.
 */
export async function getItemsByGSI(
  gsiPk: string,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyStructuredResultV2> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    }),
  );
  return ok(filterActive(result.Items));
}

/**
 * Creates a new item in DynamoDB.
 *
 * @param type - The item type (e.g., SEASON, TEAM).
 * @param skPrefix - The prefix for the SK.
 * @param gsiPk - The GSI1PK value.
 * @param data - The item data.
 * @param tableName - The name of the DynamoDB table.
 * @param docClient - DynamoDB Document Client.
 * @returns The HTTP response with the created item.
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
  const cleanData = stripLocalFields(data) as Record<string, unknown>;
  const item = {
    ...cleanData,
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
 *
 * @param tableName - The DynamoDB table name.
 * @param item - The item to create.
 * @param docClient - DynamoDB Document Client.
 * @returns Promise.
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
 *
 * @param type - Item type.
 * @param skPrefix - SK prefix.
 * @param id - Item ID.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response.
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
