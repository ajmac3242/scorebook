import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: any) => {
  console.log("Event:", JSON.stringify(event));
  const { routeKey, pathParameters, body } = event;
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
      if (method === "POST") {
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
      if (method === "POST") {
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
      if (method === "POST") {
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
      if (method === "POST") {
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
      if (method === "POST") {
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
  } catch (error: any) {
    console.error(error);
    return response(500, { message: error.message });
  }
};

const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
