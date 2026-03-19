import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Main Lambda handler for the Basketball Stats API.
 * Handles seasons, teams, players, games, and stats.
 *
 * @param event - The API Gateway proxy event (v2).
 * @returns The API Gateway proxy result (v2).
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event));
  const body = event.body;
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // SEASONS
    if (path === "/seasons") {
      if (method === "GET") {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: { ":pk": "SEASON" },
          }),
        );
        return response(200, result.Items);
      }
      if (method === "POST" && body) {
        const data = JSON.parse(body);
        const id = uuidv4();
        const item = {
          PK: `SEASON#${id}`,
          SK: `METADATA#${id}`,
          GSI1PK: "SEASON",
          GSI1SK: `SEASON#${id}`,
          ...data,
          id,
        };
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: item }),
        );
        return response(201, item);
      }
    }

    // TEAMS
    if (path === "/teams") {
      if (method === "GET") {
        const seasonId = event.queryStringParameters?.seasonId;
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: { ":pk": `SEASON#${seasonId}` },
          }),
        );
        return response(200, result.Items);
      }
      if (method === "POST" && body) {
        const data = JSON.parse(body);
        const id = uuidv4();
        const item = {
          PK: `TEAM#${id}`,
          SK: `METADATA#${id}`,
          GSI1PK: `SEASON#${data.seasonId}`,
          GSI1SK: `TEAM#${id}`,
          ...data,
          id,
        };
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: item }),
        );
        return response(201, item);
      }
    }

    // PLAYERS
    if (path === "/players") {
      if (method === "GET") {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: { ":pk": "PLAYER" },
          }),
        );
        return response(200, result.Items);
      }
      if (method === "POST" && body) {
        const data = JSON.parse(body);
        const id = uuidv4();
        const item = {
          PK: `PLAYER#${id}`,
          SK: `METADATA#${id}`,
          GSI1PK: "PLAYER",
          GSI1SK: `PLAYER#${id}`,
          ...data,
          id,
        };
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: item }),
        );
        return response(201, item);
      }
    }

    // GAMES
    if (path === "/games") {
      if (method === "GET") {
        const teamId = event.queryStringParameters?.teamId;
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: { ":pk": `TEAM#${teamId}` },
          }),
        );
        return response(200, result.Items);
      }
      if (method === "POST" && body) {
        const data = JSON.parse(body);
        const id = uuidv4();
        const item = {
          PK: `GAME#${id}`,
          SK: `METADATA#${id}`,
          GSI1PK: `TEAM#${data.teamId}`,
          GSI1SK: `GAME#${id}`,
          ...data,
          id,
        };
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: item }),
        );
        return response(201, item);
      }
    }

    // STATS
    if (path.startsWith("/games/") && path.endsWith("/stats")) {
      const gameId = path.split("/")[2];
      if (method === "GET") {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `GAME#${gameId}`,
              ":sk": "STAT#",
            },
          }),
        );
        return response(200, result.Items);
      }
      if (method === "POST" && body) {
        const data = JSON.parse(body);
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        const item = {
          PK: `GAME#${gameId}`,
          SK: `STAT#${timestamp}#${id}`,
          ...data,
          id,
          timestamp,
        };
        await docClient.send(
          new PutCommand({ TableName: TABLE_NAME, Item: item }),
        );
        return response(201, item);
      }
    }

    return response(404, { message: "Route not found" });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response(500, { message });
  }
};

/**
 * Helper to construct an APIGatewayProxyStructuredResultV2.
 *
 * @param statusCode - The HTTP status code.
 * @param body - The body to be JSON stringified.
 * @returns The APIGatewayProxyStructuredResultV2.
 */
const response = (
  statusCode: number,
  body: unknown,
): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
