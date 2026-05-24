import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { ok, created, badRequest } from "../responses.js";
import {
  isValidUuid,
  validateStringLengths,
  validateObjectDepthAndSize,
} from "../validation.js";
import { Keys } from "../keys.js";
import { extractIdFromPath, stripLocalFields } from "../utils.js";
import {
  getItems,
  createItem,
  getItemsByGSI,
  softDeleteItem,
  putNewItem,
} from "../database.js";
import {
  snapshotTeamRoster,
  snapshotTeam,
  deleteTeamSnapshots,
} from "../snapshots.js";

/**
 * Handlers for Teams endpoints.
 * @param method - HTTP Method.
 * @param path - Request path.
 * @param body - Parsed JSON body.
 * @param event - The full Lambda event.
 * @param tableName - DynamoDB table name.
 * @param docClient - DynamoDB Document Client.
 * @returns Response or null.
 */
export async function handleTeams(
  method: string,
  path: string,
  body: Record<string, unknown>,
  event: APIGatewayProxyEventV2,
  tableName: string,
  docClient: DynamoDBDocumentClient,
): Promise<APIGatewayProxyResultV2 | null> {
  /**
   * 🏀 Teams Handler
   *
   * WHY: Manages team lifecycle and roster associations.
   * Orchestrates team snapshots when metadata or rosters change to support
   * efficient client-side synchronization.
   */
  if (path === "/teams") {
    if (method === "GET") {
      return await getItems(tableName, "TEAM", docClient);
    }
    if (method === "POST") {
      if (
        !body?.name ||
        typeof body.name !== "string" ||
        body.name.length > 100
      ) {
        return badRequest(
          "Team name is required and must be under 100 characters",
        );
      }
      const depthError = validateObjectDepthAndSize(body);
      if (depthError) return badRequest(depthError);

      const error = validateStringLengths(body, 128);
      if (error) return badRequest(error);

      const resp = await createItem(
        "TEAM",
        "METADATA",
        "TEAM",
        body,
        tableName,
        docClient,
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
      return badRequest("Invalid teamId format (UUID required)");
    }
    const teamKey = { PK: Keys.team(teamId), SK: Keys.metadata(teamId) };

    if (method === "DELETE") {
      const resp = await softDeleteItem(
        "TEAM",
        "METADATA",
        teamId,
        tableName,
        docClient,
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
      return ok({ message: "Team restored" });
    }
  }

  if (path.startsWith("/teams/") && path.endsWith("/players")) {
    const parts = path.split("/");
    if (parts.length !== 4) return null;
    const tId = parts[2];
    if (!isValidUuid(tId))
      return badRequest("Invalid teamId format (UUID required)");

    if (method === "GET")
      return await getItemsByGSI(`TEAM#${tId}`, tableName, docClient);

    if (method === "POST") {
      if (!isValidUuid(body.playerId))
        return badRequest("Valid playerId (UUID) is required");
      if (
        body.jerseyNumber !== undefined &&
        (typeof body.jerseyNumber !== "string" ||
          !/^\d{1,3}$/.test(body.jerseyNumber))
      ) {
        return badRequest("Jersey number must be 1-3 digits");
      }
      const id = (body?.id as string) || uuidv4();
      if (!isValidUuid(id)) {
        return badRequest("Invalid team-player association id (UUID required)");
      }

      const cleanBody = stripLocalFields(body) as Record<string, unknown>;
      delete cleanBody.id;

      const teamPlayerItem = {
        ...cleanBody,
        PK: Keys.team(tId),
        SK: Keys.player(body.playerId as string),
        GSI1PK: Keys.team(tId),
        GSI1SK: Keys.player(body.playerId as string),
        id,
        teamId: tId,
      };
      await putNewItem(tableName, teamPlayerItem, docClient);
      await snapshotTeamRoster(tId, tableName, docClient);
      return created(teamPlayerItem);
    }
  }

  if (path.startsWith("/teams/") && path.includes("/players/")) {
    const parts = path.split("/");
    if (parts.length !== 5) return null;
    const tId = parts[2];
    const pId = parts[4];
    if (!isValidUuid(tId) || !isValidUuid(pId)) {
      return badRequest("Invalid teamId or playerId format (UUID required)");
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
      return ok({ message: "Player removed from team" });
    }
  }

  return null;
}
