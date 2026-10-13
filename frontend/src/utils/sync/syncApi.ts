/**
 * @file syncApi.ts
 * @description Network synchronization execution, API authorization headers, ETag caching, and remote snapshot persistence.
 */

import { db, Game, StatEvent, Team, TeamPlayer } from "../../db";
import { getAccessToken } from "../../api/authApi";
import { logger } from "../logger";
import {
  sanitizeRemoteData,
  RosterSnapshot,
  GameSnapshot,
} from "./syncSanitizer";

export function getETag(type: string, id: string | number): string | null {
  return localStorage.getItem(`etag_${type}_${id}`);
}

export function setETag(type: string, id: string | number, etag: string | null) {
  if (etag) {
    localStorage.setItem(`etag_${type}_${id}`, etag);
  }
}

export async function getHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchApi(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = await getHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
}

export async function handleEtagResponse<T>(
  type: string,
  id: string | number,
  url: string,
  etag: string | null,
  onSuccess: (_data: T) => Promise<void>,
  label: string,
) {
  try {
    const response = await fetchApi(url, {
      headers: { "If-None-Match": etag || "" },
    });

    if (response.status === 304) {
      logger.info(`${label} is up to date.`);
      return;
    }

    if (response.ok) {
      const rawData = await response.json();
      const data = sanitizeRemoteData(rawData);
      setETag(type, id, response.headers?.get("ETag"));
      await onSuccess(data);
    }
  } catch (error) {
    logger.error(`Sync ${label} failed:`, error);
  }
}

export async function persistRoster(teamId: string, data: RosterSnapshot) {
  await db.transaction(
    "rw",
    [db.teams, db.players, db.teamPlayers],
    async () => {
      await db.teams.put({
        ...data.team,
        id: data.team.id as string,
        synced: 1,
      } as Team);

      const playersToPut = data.players.map((p) => ({
        id: p.playerId as string,
        name: p.name as string,
        avatarColor: p.avatarColor as string,
        synced: 1,
      }));
      await db.players.bulkPut(playersToPut);

      const teamPlayersToPut = data.players.map(
        (p) =>
          ({
            ...p,
            teamId: teamId,
            playerId: p.playerId as string,
            synced: 1,
          }) as TeamPlayer,
      );
      await db.teamPlayers.bulkPut(teamPlayersToPut);
    },
  );
}

export async function persistGameStats(data: GameSnapshot) {
  await db.transaction("rw", [db.games, db.stats], async () => {
    const incomingGame = {
      ...data.game,
      id: data.game.id as string,
      synced: 1,
    } as Game;

    if (incomingGame.id) {
      const localGame = await db.games.get(incomingGame.id);
      if (localGame && (!localGame.completed || localGame.completed === 0)) {
        incomingGame.clockTime =
          localGame.clockTime ?? incomingGame.clockTime;
        incomingGame.currentPeriod =
          localGame.currentPeriod ?? incomingGame.currentPeriod;
        incomingGame.onCourtIds =
          localGame.onCourtIds ?? incomingGame.onCourtIds;
        incomingGame.possessionArrow =
          localGame.possessionArrow ?? incomingGame.possessionArrow;
      }
    }

    await db.games.put(incomingGame);

    const statsToPut = data.stats.map(
      (s) =>
        ({
          ...s,
          id: s.id as string,
          synced: 1,
        }) as StatEvent,
    );
    await db.stats.bulkPut(statsToPut);
  });
}
