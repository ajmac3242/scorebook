/**
 * @file syncQueue.ts
 * @description Provides offline queue management and IndexedDB push operations for synchronization.
 */

import { type Table } from "dexie";
import { db, Game, TeamPlayer, StatEvent } from "../../db";
import { logger } from "../logger";

export async function hasUnsyncedChanges(): Promise<boolean> {
  const tableNames: (keyof typeof db)[] = [
    "teams",
    "players",
    "teamPlayers",
    "games",
    "stats",
  ];

  try {
    const counts = await Promise.all(
      tableNames.map((name) =>
        (db[name] as Table).where("synced").equals(0).limit(1).count(),
      ),
    );
    return counts.some((count) => count > 0);
  } catch (e) {
    logger.error("Error checking for unsynced changes:", e);
    return false;
  }
}

/**
 * Pushes unsynced items of a specific entity table to the API.
 */
export async function pushEntity<
  T extends { id?: string | number; synced?: number },
>(
  table: Table<T, unknown>,
  endpoint: string | ((_item: T) => string),
  entityName: string,
  fetchApi: (_url: string, _options?: RequestInit) => Promise<Response>,
  onSuccess?: (_item: T) => Promise<void>,
): Promise<void> {
  if (!table) return;
  const items = await table.where("synced").equals(0).toArray();

  // ⚡ Bolt: Fast early return when table has no unsynced items
  if (items.length === 0) return;

  const CHUNK_SIZE = 5;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const successIds: (string | number)[] = [];

    await Promise.all(
      chunk.map(async (item) => {
        try {
          const url =
            typeof endpoint === "function" ? endpoint(item) : endpoint;
          const res = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify(item),
          });
          if (res.ok) {
            successIds.push(item.id!);
            if (onSuccess) await onSuccess(item);
          } else {
            const rawError = await res.text();
            const sanitizedError = rawError
              .replace(/\r/g, "\\r")
              .replace(/\n/g, "\\n")
              .replace(/\0/g, "\\0");
            const errorBody =
              sanitizedError.length > 512
                ? "[TRUNCATED_ERROR]"
                : sanitizedError;

            logger.error(
              `Failed to push ${entityName} ${item.id}: Status ${res.status}`,
              undefined,
              { errorBody },
            );
          }
        } catch (err) {
          logger.error(`Failed to push ${entityName} ${item.id}:`, err);
        }
      }),
    );

    if (successIds.length > 0) {
      await db.transaction("rw", table, async () => {
        for (let j = 0; j < successIds.length; j++) {
          await table.update(
            successIds[j],
            { synced: 1 } as unknown as Partial<T>,
          );
        }
      });
    }
  }
}

export async function pushAllLocalUpdates(
  fetchApi: (_url: string, _options?: RequestInit) => Promise<Response>,
): Promise<void> {
  await pushEntity(db.teams, "/api/teams", "team", fetchApi);
  await pushEntity(db.players, "/api/players", "player", fetchApi);
  await pushEntity<TeamPlayer>(
    db.teamPlayers,
    (tp) => `/api/teams/${encodeURIComponent(String(tp.teamId))}/players`,
    "teamPlayer",
    fetchApi,
  );
  await pushEntity<Game>(
    db.games,
    "/api/games",
    "game",
    fetchApi,
    async (g) => {
      if (g.completed) {
        await fetchApi(
          `/api/games/${encodeURIComponent(String(g.id))}/complete`,
          {
            method: "POST",
          },
        );
      }
    },
  );
  await pushEntity<StatEvent>(
    db.stats,
    (s) => `/api/games/${encodeURIComponent(String(s.gameId))}/stats`,
    "stat",
    fetchApi,
  );
}
