import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event));
  const { method, path } = event.requestContext.http;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // Seasons
    if (path === "/seasons") {
      if (method === "GET") return await getItems("SEASON", "SEASON");
      if (method === "POST") return await createItem("SEASON", "METADATA", "SEASON", body);
    }

    // Teams
    if (path === "/teams") {
      if (method === "GET") {
        const seasonId = event.queryStringParameters?.seasonId;
        return await getItemsByGSI(`SEASON#${seasonId}`);
      }
      if (method === "POST") return await createItem("TEAM", "METADATA", `SEASON#${body.seasonId}`, body);
    }

    // Players
    if (path === "/players") {
      if (method === "GET") return await getItems("PLAYER", "PLAYER");
      if (method === "POST") return await createItem("PLAYER", "METADATA", "PLAYER", body);
    }

    // Games
    if (path === "/games") {
      if (method === "GET") {
        const teamId = event.queryStringParameters?.teamId;
        return await getItemsByGSI(`TEAM#${teamId}`);
      }
      if (method === "POST") return await createItem("GAME", "METADATA", `TEAM#${body.teamId}`, body);
    }

    // Stats
    if (path.startsWith("/games/") && path.endsWith("/stats")) {
      const gameId = path.split("/")[2];
      if (method === "GET") {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: { ":pk": `GAME#${gameId}`, ":sk": "STAT#" },
          })
        );
        return response(200, result.Items);
      }
      if (method === "POST") {
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        const item = {
          PK: `GAME#${gameId}`,
          SK: `STAT#${timestamp}#${id}`,
          ...body,
          id,
          timestamp,
        };
        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        return response(201, item);
      }
    }

    return response(404, { message: "Route not found" });
  } catch (error: any) {
    console.error(error);
    return response(500, { message: error.message });
  }
};

const getItems = async (pkPrefix: string, gsiPrefix: string) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    })
  );
  return response(200, result.Items);
};

const getItemsByGSI = async (gsiPk: string) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    })
  );
  return response(200, result.Items);
};

const createItem = async (type: string, skPrefix: string, gsiPk: string, data: any) => {
  const id = uuidv4();
  const item = {
    PK: `${type}#${id}`,
    SK: `${skPrefix}#${id}`,
    GSI1PK: gsiPk,
    GSI1SK: `${type}#${id}`,
    ...data,
    id,
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return response(201, item);
};

const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
