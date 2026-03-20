import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event));

  const method = (event as any).method || (event as any).httpMethod || event.requestContext?.http?.method || "GET";
  let path = event.rawPath || (event as any).path || event.requestContext?.http?.path || "/";

  if (path.startsWith("/$default")) {
    path = path.replace("/$default", "");
  }
  if (!path.startsWith("/")) path = "/" + path;

  // Normalize path by removing trailing slash if not root
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  console.log("Routing:", { method, path });

  let body: any = {};
  if (event.body) {
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
        return response(400, { message: "Invalid JSON body" });
    }
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    // Seasons
    if (path === "/seasons") {
      if (method === "GET") return await getItems("SEASON", "SEASON", TABLE_NAME);
      if (method === "POST") return await createItem("SEASON", "METADATA", "SEASON", body, TABLE_NAME);
    }

    // Teams
    if (path === "/teams") {
      if (method === "GET") {
        const seasonId = event.queryStringParameters?.seasonId;
        return await getItemsByGSI(`SEASON#${seasonId}`, TABLE_NAME);
      }
      if (method === "POST") {
        if (!body || Object.keys(body).length === 0) {
            return response(400, { message: "Body required" });
        }
        const resp = await createItem("TEAM", "METADATA", `SEASON#${body?.seasonId}`, body, TABLE_NAME);
        if (resp.statusCode === 201) {
            const newItem = JSON.parse(resp.body);
            await snapshotTeamRoster(newItem.id, TABLE_NAME);
        }
        return resp;
      }
    }

    // Team Players (e.g., /teams/123/players)
    const teamPlayersMatch = path.match(/^\/teams\/([^\/]+)\/players$/);
    if (teamPlayersMatch) {
        const teamId = teamPlayersMatch[1];
        if (method === "GET") return await getItemsByGSI(`TEAM#${teamId}`, TABLE_NAME);
        if (method === "POST") {
            const resp = await createItem("PLAYER", "METADATA", "PLAYER", body, TABLE_NAME);
            if (resp.statusCode === 201) {
                const player = JSON.parse(resp.body);
                const teamPlayerItem = {
                    PK: `TEAM#${teamId}`,
                    SK: `PLAYER#${player.id}`,
                    GSI1PK: `TEAM#${teamId}`,
                    GSI1SK: `PLAYER#${player.id}`,
                    jerseyNumber: body?.jerseyNumber,
                    id: player.id,
                    teamId
                };
                await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: teamPlayerItem }));
                await snapshotTeamRoster(teamId, TABLE_NAME);
                return response(201, teamPlayerItem);
            }
            return resp;
        }
    }

    // Players
    if (path === "/players") {
      if (method === "GET") return await getItems("PLAYER", "PLAYER", TABLE_NAME);
      if (method === "POST") return await createItem("PLAYER", "METADATA", "PLAYER", body, TABLE_NAME);
    }

    // Games
    if (path === "/games") {
      if (method === "GET") {
        const teamId = event.queryStringParameters?.teamId;
        return await getItemsByGSI(`TEAM#${teamId}`, TABLE_NAME);
      }
      if (method === "POST") return await createItem("GAME", "METADATA", `TEAM#${body?.teamId}`, body, TABLE_NAME);
    }

    // Game Completion (e.g., /games/123/complete)
    const gameCompleteMatch = path.match(/^\/games\/([^\/]+)\/complete$/);
    if (gameCompleteMatch) {
        const gameId = gameCompleteMatch[1];
        if (method === "POST") {
            await docClient.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` },
                UpdateExpression: "SET completed = :c",
                ExpressionAttributeValues: { ":c": 1 }
            }));
            await snapshotGameStats(gameId, TABLE_NAME);
            return response(200, { message: "Game completed" });
        }
    }

    // Game Stats (e.g., /games/123/stats)
    const gameStatsMatch = path.match(/^\/games\/([^\/]+)\/stats$/);
    if (gameStatsMatch) {
      const gameId = gameStatsMatch[1];
      if (method === "GET") {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: { ":pk": `GAME#${gameId}`, ":sk": "STAT#" },
          })
        );
        return response(200, result.Items || []);
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
    console.error("Handler Error:", error);
    return response(500, { message: error.message });
  }
};

async function getItems(pkPrefix: string, gsiPrefix: string, tableName: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    })
  );
  return response(200, result.Items || []);
}

async function getItemsByGSI(gsiPk: string, tableName: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    })
  );
  return response(200, result.Items || []);
}

async function createItem(type: string, skPrefix: string, gsiPk: string, data: any, tableName: string) {
  const id = data?.id || uuidv4();
  const item = {
    PK: `${type}#${id}`,
    SK: `${skPrefix}#${id}`,
    GSI1PK: gsiPk,
    GSI1SK: `${type}#${id}`,
    ...data,
    id,
  };
  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return response(201, item);
}

async function snapshotTeamRoster(teamId: string, tableName: string) {
    const DATA_BUCKET = process.env.DATA_BUCKET;
    if (!DATA_BUCKET) return;
    try {
        const teamResult = await docClient.send(new GetCommand({ TableName: tableName, Key: { PK: `TEAM#${teamId}`, SK: `METADATA#${teamId}` } }));
        const playersResult = await docClient.send(new QueryCommand({ TableName: tableName, IndexName: "GSI1", KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)", ExpressionAttributeValues: { ":pk": `TEAM#${teamId}`, ":sk": "PLAYER#" } }));
        if (teamResult.Item) {
            const snapshot = { team: teamResult.Item, players: playersResult.Items || [] };
            await s3Client.send(new PutObjectCommand({ Bucket: DATA_BUCKET, Key: `teams/${teamId}/roster.json`, Body: JSON.stringify(snapshot), ContentType: "application/json" }));
        }
    } catch (e) {
        console.error("Snapshot error:", e);
    }
}

async function snapshotGameStats(gameId: string, tableName: string) {
    const DATA_BUCKET = process.env.DATA_BUCKET;
    if (!DATA_BUCKET) return;
    try {
        const gameResult = await docClient.send(new GetCommand({ TableName: tableName, Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` } }));
        const statsResult = await docClient.send(new QueryCommand({ TableName: tableName, KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)", ExpressionAttributeValues: { ":pk": `GAME#${gameId}`, ":sk": "STAT#" } }));
        if (gameResult.Item) {
            const snapshot = { game: gameResult.Item, stats: statsResult.Items || [] };
            await s3Client.send(new PutObjectCommand({ Bucket: DATA_BUCKET, Key: `games/${gameId}/stats.json`, Body: JSON.stringify(snapshot), ContentType: "application/json" }));
        }
    } catch (e) {
        console.error("Snapshot error:", e);
    }
}

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
