/**
 * @file index.ts
 * @description Main Lambda handler for the Basketball Stats API.
 * Provides RESTful endpoints for managing Seasons, Teams, Players, Games, and Stats.
 * Implements an offline-first synchronization strategy with S3 snapshot generation.
 */

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

// Clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

/**
 * Main Lambda handler function.
 * Handles routing based on HTTP method and path, processes request bodies,
 * and interacts with DynamoDB and S3.
 *
 * @param {APIGatewayProxyEventV2} event - The API Gateway event object.
 * @returns {Promise<APIGatewayProxyResultV2>} The HTTP response.
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event));

  // Extract HTTP method and path with normalization for different event formats
  const method =
    (event as any).method ||
    (event as any).httpMethod ||
    event.requestContext?.http?.method ||
    "GET";
  let rawPath =
    event.rawPath ||
    (event as any).path ||
    event.requestContext?.http?.path ||
    "/";

  // Normalize path: strip stage, strip /api prefix, ensure leading slash, remove trailing slash
  let path = rawPath.replace(/^\/\$default/, "").replace(/^\/api/, "");
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  console.log("Routing:", { method, path });

  // Parse JSON body if present
  let body: any = {};
  if (event.body) {
    try {
      body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return response(400, { message: "Invalid JSON body" });
    }
  }

  try {
    const TABLE_NAME = process.env.TABLE_NAME || "BasketballStats";

    // --- Seasons Endpoints ---
    if (path === "/seasons") {
      if (method === "GET")
        return await getItems("SEASON", "SEASON", TABLE_NAME);
      if (method === "POST")
        return await createItem(
          "SEASON",
          "METADATA",
          "SEASON",
          body,
          TABLE_NAME,
        );
    }

    // --- Teams Endpoints ---
    if (path === "/teams") {
      if (method === "GET") {
        const seasonId = event.queryStringParameters?.seasonId;
        return await getItemsByGSI(`SEASON#${seasonId}`, TABLE_NAME);
      }
      if (method === "POST") {
        if (!body || Object.keys(body).length === 0) {
          return response(400, { message: "Body required" });
        }
        const resp = await createItem(
          "TEAM",
          "METADATA",
          `SEASON#${body?.seasonId}`,
          body,
          TABLE_NAME,
        );
        if (resp.statusCode === 201) {
          const newItem = JSON.parse(resp.body);
          // After creating a team, update relevant snapshots
          await snapshotTeamRoster(newItem.id, TABLE_NAME);
          await snapshotTeamGames(newItem.id, TABLE_NAME);
        }
        return resp;
      }
    }

    // --- Team Players Endpoints (e.g., /teams/123/players) ---
    const teamPlayersMatch = path.match(/^\/teams\/([^\/]+)\/players$/);
    if (teamPlayersMatch) {
      const teamId = teamPlayersMatch[1];
      if (method === "GET")
        return await getItemsByGSI(`TEAM#${teamId}`, TABLE_NAME);
      if (method === "POST") {
        // Create the player record and associate it with the team in a junction table
        const resp = await createItem(
          "PLAYER",
          "METADATA",
          "PLAYER",
          body,
          TABLE_NAME,
        );
        if (resp.statusCode === 201) {
          const player = JSON.parse(resp.body);
          const teamPlayerItem = {
            PK: `TEAM#${teamId}`,
            SK: `PLAYER#${player.id}`,
            GSI1PK: `TEAM#${teamId}`,
            GSI1SK: `PLAYER#${player.id}`,
            jerseyNumber: body?.jerseyNumber,
            id: player.id,
            teamId,
          };
          await docClient.send(
            new PutCommand({ TableName: TABLE_NAME, Item: teamPlayerItem }),
          );
          // Update team roster snapshot after adding a player
          await snapshotTeamRoster(teamId, TABLE_NAME);
          return response(201, teamPlayerItem);
        }
        return resp;
      }
    }

    // --- Global Players Endpoints ---
    if (path === "/players") {
      if (method === "GET")
        return await getItems("PLAYER", "PLAYER", TABLE_NAME);
      if (method === "POST")
        return await createItem(
          "PLAYER",
          "METADATA",
          "PLAYER",
          body,
          TABLE_NAME,
        );
    }

    // --- Games Endpoints ---
    if (path === "/games") {
      if (method === "GET") {
        const teamId = event.queryStringParameters?.teamId;
        return await getItemsByGSI(`TEAM#${teamId}`, TABLE_NAME);
      }
      if (method === "POST") {
        const resp = await createItem(
          "GAME",
          "METADATA",
          `TEAM#${body?.teamId}`,
          body,
          TABLE_NAME,
        );
        if (resp.statusCode === 201) {
          const newItem = JSON.parse(resp.body);
          // Update the team's games snapshot after creating a new game
          await snapshotTeamGames(newItem.teamId, TABLE_NAME);
        }
        return resp;
      }
    }

    // --- Game Completion Endpoint (e.g., /games/123/complete) ---
    const gameCompleteMatch = path.match(/^\/games\/([^\/]+)\/complete$/);
    if (gameCompleteMatch) {
      const gameId = gameCompleteMatch[1];
      if (method === "POST") {
        // Check if game exists
        const getResp = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` },
          }),
        );
        if (!getResp.Item) return response(404, { message: "Game not found" });

        // Mark game as completed in DynamoDB
        await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` },
            UpdateExpression: "SET completed = :c",
            ExpressionAttributeValues: { ":c": 1 },
          }),
        );

        // Finalize snapshots for the completed game
        await snapshotGameStats(gameId, TABLE_NAME);
        await snapshotTeamGames(getResp.Item.teamId, TABLE_NAME);
        return response(200, { message: "Game completed" });
      }
    }

    // --- Game Stats Endpoints (e.g., /games/123/stats) ---
    const gameStatsMatch = path.match(/^\/games\/([^\/]+)\/stats$/);
    if (gameStatsMatch) {
      const gameId = gameStatsMatch[1];
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
        return response(200, result.Items || []);
      }
      if (method === "POST") {
        // Create individual stat event record
        const id = body?.id || uuidv4();
        const timestamp = body?.timestamp || new Date().toISOString();
        const item = {
          PK: `GAME#${gameId}`,
          SK: `STAT#${timestamp}#${id}`,
          GSI1PK: `GAME#${gameId}`,
          GSI1SK: `STAT#${timestamp}#${id}`,
          ...body,
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
    console.error("Handler Error:", error);
    return response(500, { message: error.message });
  }
};

/**
 * Retrieves items from DynamoDB based on PK prefix and GSI1PK.
 *
 * @param {string} pkPrefix - The prefix for the PK.
 * @param {string} gsiPrefix - The prefix for the GSI1PK.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyResultV2>} The HTTP response with the items.
 */
async function getItems(
  pkPrefix: string,
  gsiPrefix: string,
  tableName: string,
) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPrefix },
    }),
  );
  return response(200, result.Items || []);
}

/**
 * Retrieves items from DynamoDB using GSI1PK.
 *
 * @param {string} gsiPk - The GSI1PK value.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyResultV2>} The HTTP response with the items.
 */
async function getItemsByGSI(gsiPk: string, tableName: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": gsiPk },
    }),
  );
  return response(200, result.Items || []);
}

/**
 * Creates a new item in DynamoDB.
 *
 * @param {string} type - The item type (e.g., SEASON, TEAM).
 * @param {string} skPrefix - The prefix for the SK.
 * @param {string} gsiPk - The GSI1PK value.
 * @param {any} data - The item data.
 * @param {string} tableName - The name of the DynamoDB table.
 * @returns {Promise<APIGatewayProxyResultV2>} The HTTP response with the created item.
 */
async function createItem(
  type: string,
  skPrefix: string,
  gsiPk: string,
  data: any,
  tableName: string,
) {
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

/**
 * Generates and uploads a team roster snapshot JSON to S3.
 *
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 */
async function snapshotTeamRoster(teamId: string, tableName: string) {
  const DATA_BUCKET = process.env.DATA_BUCKET;
  if (!DATA_BUCKET) return;
  try {
    const teamResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: `TEAM#${teamId}`, SK: `METADATA#${teamId}` },
      }),
    );
    const playersResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `TEAM#${teamId}`,
          ":sk": "PLAYER#",
        },
      }),
    );
    if (teamResult.Item) {
      const snapshot = {
        team: teamResult.Item,
        players: playersResult.Items || [],
      };
      await s3Client.send(
        new PutObjectCommand({
          Bucket: DATA_BUCKET,
          Key: `teams/${teamId}/roster.json`,
          Body: JSON.stringify(snapshot),
          ContentType: "application/json",
        }),
      );
    }
  } catch (e) {
    console.error("Snapshot error:", e);
  }
}

/**
 * Generates and uploads a list of games for a team as a snapshot JSON to S3.
 *
 * @param {string} teamId - The team ID.
 * @param {string} tableName - The name of the DynamoDB table.
 */
async function snapshotTeamGames(teamId: string, tableName: string) {
  const DATA_BUCKET = process.env.DATA_BUCKET;
  if (!DATA_BUCKET) return;
  try {
    const gamesResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: { ":pk": `TEAM#${teamId}`, ":sk": "GAME#" },
      }),
    );
    const snapshot = { games: gamesResult.Items || [] };
    await s3Client.send(
      new PutObjectCommand({
        Bucket: DATA_BUCKET,
        Key: `teams/${teamId}/games.json`,
        Body: JSON.stringify(snapshot),
        ContentType: "application/json",
      }),
    );
  } catch (e) {
    console.error("Snapshot error:", e);
  }
}

/**
 * Generates and uploads a detailed game stats snapshot JSON to S3, including calculated results.
 *
 * @param {string} gameId - The game ID.
 * @param {string} tableName - The name of the DynamoDB table.
 */
async function snapshotGameStats(gameId: string, tableName: string) {
  const DATA_BUCKET = process.env.DATA_BUCKET;
  if (!DATA_BUCKET) return;
  try {
    const gameResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { PK: `GAME#${gameId}`, SK: `METADATA#${gameId}` },
      }),
    );
    const statsResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `GAME#${gameId}`, ":sk": "STAT#" },
      }),
    );
    if (gameResult.Item) {
      const stats = statsResult.Items || [];
      let teamScore = 0;
      let oppScore = 0;
      stats.forEach((s: any) => {
        if (s.playerId === "OPPONENT") oppScore += s.points || 0;
        else teamScore += s.points || 0;
      });
      const result =
        teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";

      const snapshot = {
        game: { ...gameResult.Item, teamScore, oppScore, result },
        stats,
      };
      await s3Client.send(
        new PutObjectCommand({
          Bucket: DATA_BUCKET,
          Key: `games/${gameId}/stats.json`,
          Body: JSON.stringify(snapshot),
          ContentType: "application/json",
        }),
      );
    }
  } catch (e) {
    console.error("Snapshot error:", e);
  }
}

/**
 * Formats a standardized JSON response.
 *
 * @param {number} statusCode - The HTTP status code.
 * @param {any} body - The JSON body data.
 * @returns {object} The formatted response object.
 */
function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
