import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { Keys } from "../keys.js";
import { badRequest, ok, created } from "../responses.js";
import { isValidUuid, isValidJerseyNumber } from "../validation.js";
import { extractIdFromPath, stripLocalFields } from "../utils.js";
import {
  getItems,
  getItemsByGSI,
  createItem,
  softDeleteItem,
  putNewItem,
} from "../db.js";
import {
  snapshotTeam,
  snapshotTeamRoster,
  deleteTeamSnapshots,
} from "../snapshots.js";

/**
 * Handlers for Teams endpoints.
 * @param {string} method - HTTP Method.
 * @param {string} path - Request path.
 * @param {Record<string, unknown>} body - Parsed JSON body.
 * @param {APIGatewayProxyEventV2} event - The full Lambda event.
 * @param {string} tableName - DynamoDB table name.
 * @param {string} requestId - The unique request ID.
 * @param {DynamoDBDocumentClient} docClient - The DynamoDB document client.
 * @returns {Promise<APIGatewayProxyResultV2 | null>} The response or null if not handled.
 */
export async function handleTeams(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  requestId: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  if (path === "/teams") {
    if (method === "GET") {
      return await getItems(tableName, "TEAM", requestId);
    }
    if (method === "POST") {
      if (
        !body?.name ||
        typeof body.name !== "string" ||
        body.name.trim().length === 0 ||
        body.name.length > 100
      ) {
        return badRequest(
          "Team name is required and must be under 100 characters",
          requestId,
        );
      }
      const resp = await createItem(
        "TEAM",
        "METADATA",
        "TEAM",
        body,
        tableName,
        requestId,
      );
      if (resp.statusCode !== 201 || !resp.body) return resp;
      const newItem = JSON.parse(resp.body);
      await snapshotTeam(newItem.id, tableName, docClient);
      return resp;
    }
  }

  const teamId = extractIdFromPath(path, "/teams/");
  if (teamId) {
    if (!isValidUuid(teamId)) {
      return badRequest("Invalid teamId format (UUID required)", requestId);
    }
    const teamKey = { PK: Keys.team(teamId), SK: Keys.metadata(teamId) };

    if (method === "DELETE") {
      const resp = await softDeleteItem(
        "TEAM",
        "METADATA",
        teamId,
        tableName,
        requestId,
      );
      if (resp.statusCode === 200) await deleteTeamSnapshots(teamId);
      return resp;
    }

    if (method === "PATCH" && body.deletedAt === null) {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: teamKey,
          UpdateExpression: "REMOVE deletedAt",
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeam(teamId, tableName, docClient);
      return ok({ message: "Team restored" }, requestId);
    }
  }

  if (path.startsWith("/teams/") && path.endsWith("/players")) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const tId = parts[2];
    if (!isValidUuid(tId))
      return badRequest("Invalid teamId format (UUID required)", requestId);

    if (method === "GET")
      return await getItemsByGSI(`TEAM#${tId}`, tableName, requestId);

    if (method === "POST") {
      if (!isValidUuid(body.playerId))
        return badRequest("Valid playerId (UUID) is required", requestId);
      if (
        body.jerseyNumber !== undefined &&
        !isValidJerseyNumber(body.jerseyNumber)
      ) {
        return badRequest("Jersey number must be 1-3 digits", requestId);
      }
      const id = (body?.id as string) || uuidv4();
      if (!isValidUuid(id)) {
        return badRequest(
          "Invalid team-player association id (UUID required)",
          requestId,
        );
      }

      const cleanBody = stripLocalFields(body);
      const teamPlayerItem = {
        ...(cleanBody as Record<string, unknown>),
        PK: Keys.team(tId),
        SK: Keys.player(body.playerId as string),
        GSI1PK: Keys.team(tId),
        GSI1SK: Keys.player(body.playerId as string),
        id,
        teamId: tId,
      };
      await putNewItem(tableName, teamPlayerItem);
      await snapshotTeamRoster(tId, tableName, docClient);
      return created(teamPlayerItem, requestId);
    }
  }

  if (path.startsWith("/teams/") && path.includes("/players/")) {
    const parts = path.split("/");
    if (parts.length !== 5) return null;
    const tId = parts[2];
    const pId = parts[4];
    if (!isValidUuid(tId) || !isValidUuid(pId)) {
      return badRequest(
        "Invalid teamId or playerId format (UUID required)",
        requestId,
      );
    }
    if (method === "DELETE") {
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: Keys.team(tId), SK: Keys.player(pId) },
          UpdateExpression: "SET deletedAt = :d",
          ExpressionAttributeValues: { ":d": new Date().toISOString() },
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      await snapshotTeamRoster(tId, tableName, docClient);
      return ok({ message: "Player removed from team" }, requestId);
    }
  }

  return null;
}
