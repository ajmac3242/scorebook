/**
 * @file syncService.ts
 * @description Provides logic for bidirectional synchronization between local IndexedDB and the backend API.
 * Implements push (local-to-remote) and pull (remote-to-local via API and S3 snapshots) functionality.
 */

import { db, Game, TeamPlayer, StatEvent, Team, Player } from "../db";
import { UserPool } from "../UserPool";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import { type Table } from "dexie";
import { logger } from "./logger";

/**
 * Interface representing the team roster snapshot structure from S3.
 */
interface RosterSnapshot {
  team: Record<string, unknown>;
  players: Record<string, unknown>[];
}

/**
 * Interface representing the game stats snapshot structure from S3.
 */
interface GameSnapshot {
  game: Record<string, unknown>;
  stats: Record<string, unknown>[];
}

/**
 * Service class for handling all data synchronization tasks.
 *
 * WHY: This service implements an "Offline-First" architecture.
 * 1. Data is always written to IndexedDB first (via Dexie).
 * 2. 'pushUpdates' asynchronously sends local changes to the API.
 * 3. 'pullAll' and 'sync*' methods retrieve data using a hybrid API/S3 strategy.
 * 4. ETag-based caching (via If-None-Match) is used for S3 snapshots to minimize
 *    bandwidth and processing of large datasets (like rosters and game stats).
 */
class SyncService {
  private isSyncing = false;
  private listeners: ((_status: boolean) => void)[] = [];

  /**
   * Subscribes to synchronization status changes.
   * @param {(_status: boolean) => void} callback - The callback function.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(callback: (_status: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notifies all subscribers of a status change.
   * @private
   */
  private notify() {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](this.isSyncing);
    }
  }

  /**
   * Sets the synchronization status and notifies listeners.
   * @param {boolean} status - New sync status.
   * @private
   */
  private setSyncing(status: boolean) {
    if (this.isSyncing !== status) {
      this.isSyncing = status;
      this.notify();
    }
  }

  /**
   * Helper to retrieve an ETag from localStorage.
   * @param {string} type - Entity type (team, game, team_games).
   * @param {string | number} id - Entity ID.
   * @returns {string | null} The ETag or null.
   * @private
   */
  private getETag(type: string, id: string | number): string | null {
    return localStorage.getItem(`etag_${type}_${id}`);
  }

  /**
   * Helper to store an ETag in localStorage.
   * @param {string} type - Entity type (team, game, team_games).
   * @param {string | number} id - Entity ID.
   * @param {string | null} etag - The ETag to store.
   * @private
   */
  private setETag(type: string, id: string | number, etag: string | null) {
    if (etag) {
      localStorage.setItem(`etag_${type}_${id}`, etag);
    }
  }

  /**
   * Promisified helper to get the current user session token.
   * @returns {Promise<string | null>} The JWT token or null.
   * @private
   */
  private async getSessionToken(): Promise<string | null> {
    const user = UserPool.getCurrentUser();
    if (!user) return null;

    return new Promise((resolve) => {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            resolve(null);
          } else {
            resolve(session.getAccessToken().getJwtToken());
          }
        },
      );
    });
  }

  /**
   * Helper function to get authorization headers for API requests.
   * @returns {Promise<Record<string, string>>} Headers object with Authorization token.
   * @private
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getSessionToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Helper function to perform a fetch with authorization headers.
   * @param {string} url - The URL to fetch.
   * @param {RequestInit} [options] - Fetch options.
   * @returns {Promise<Response>} The fetch response.
   * @private
   */
  private async fetchApi(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = await this.getHeaders();
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  }

  /**
   * Checks if there are any records in IndexedDB marked as unsynced (synced: 0).
   * @returns {Promise<boolean>} True if unsynced changes exist.
   */
  async hasUnsyncedChanges(): Promise<boolean> {
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
   * Helper to push all unsynced items of a specific entity type to the API.
   *
   * WHY: This function handles the "Offline-to-Online" transition by uploading local changes.
   *
   * CONCURRENCY & THROUGHPUT:
   * We process items in concurrent chunks (CHUNK_SIZE = 5). This provides a balance
   * between high throughput (faster than one-by-one) and server safety (not
   * overwhelming the Lambda backend or DynamoDB with hundreds of simultaneous requests).
   *
   * THROUGHPUT DESIGN: The CHUNK_SIZE of 5 is tuned for typical mobile bandwidth
   * and AWS Lambda concurrency limits. Increasing this may lead to 429 Throttle
   * responses from the backend or DynamoDB provisioned throughput exceptions.
   *
   * TRANSACTION SAFETY:
   * Only after a chunk of items is successfully acknowledged by the API do we
   * update their 'synced' status in IndexedDB using a single batched transaction.
   *
   * @param {Table<T, unknown>} table - Dexie table.
   * @param {string | ((item: T) => string)} endpoint - API endpoint or a function that returns an endpoint.
   * @param {string} entityName - Name for logging.
   * @param {(item: T) => Promise<void>} [onSuccess] - Optional callback after successful push.
   * @private
   */
  private async pushEntity<T extends { id?: string | number; synced?: number }>(
    table: Table<T, unknown>,
    endpoint: string | ((_item: T) => string),
    entityName: string,
    onSuccess?: (_item: T) => Promise<void>,
  ) {
    if (!table) return;
    const items = await table.where("synced").equals(0).toArray();

    // ⚡ Bolt: Process items in concurrent chunks to improve throughput.
    // Sequential pushing is slow for large datasets (e.g. game stats).
    const CHUNK_SIZE = 5;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const successIds: (string | number)[] = [];

      await Promise.all(
        chunk.map(async (item) => {
          try {
            const url =
              typeof endpoint === "function" ? endpoint(item) : endpoint;
            const res = await this.fetchApi(url, {
              method: "POST",
              body: JSON.stringify(item),
            });
            if (res.ok) {
              successIds.push(item.id!);
              if (onSuccess) await onSuccess(item);
            } else {
              const errorBody = await res.text();
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

      // ⚡ Bolt: Batch database updates in a single transaction for efficiency.
      // Reducing transaction overhead significantly improves performance on low-end devices.
      if (successIds.length > 0) {
        await db.transaction("rw", table, async () => {
          for (let j = 0; j < successIds.length; j++) {
            await table.update(successIds[j], { synced: 1 } as any);
          }
        });
      }
    }
  }

  /**
   * Pushes all local, unsynced changes to the backend API.
   * Iterates through all entities and updates their synced status upon success.
   */
  async pushUpdates() {
    if (this.isSyncing) return;
    this.setSyncing(true);
    logger.info("Starting push updates...");

    try {
      await this.pushEntity(db.teams, "/api/teams", "team");
      await this.pushEntity(db.players, "/api/players", "player");
      await this.pushEntity<TeamPlayer>(
        db.teamPlayers,
        (tp) => `/api/teams/${tp.teamId}/players`,
        "teamPlayer",
      );
      await this.pushEntity<Game>(db.games, "/api/games", "game", async (g) => {
        if (g.completed) {
          await this.fetchApi(`/api/games/${g.id}/complete`, {
            method: "POST",
          });
        }
      });
      await this.pushEntity<StatEvent>(
        db.stats,
        (s) => `/api/games/${s.gameId}/stats`,
        "stat",
      );

      logger.info("Push updates complete.");
    } catch (e) {
      logger.error("Push updates failed:", e);
    } finally {
      this.setSyncing(false);
    }
  }

  /**
   * Helper to handle ETag-based snapshot responses.
   * @param {string} type - Entity type.
   * @param {string | number} id - Entity ID.
   * @param {string} url - API URL.
   * @param {string | null} etag - Cached ETag.
   * @param {(data: T) => Promise<void>} onSuccess - Success callback.
   * @param {string} label - Log label.
   * @private
   */
  private async handleEtagResponse<T>(
    type: string,
    id: string | number,
    url: string,
    etag: string | null,
    onSuccess: (_data: T) => Promise<void>,
    label: string,
  ) {
    try {
      const response = await this.fetchApi(url, {
        headers: { "If-None-Match": etag || "" },
      });

      if (response.status === 304) {
        // WHY: 304 Not Modified indicates our local ETag matches the server's,
        // so we don't need to re-download or re-persist the same data.
        logger.info(`${label} is up to date.`);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        this.setETag(type, id, response.headers?.get("ETag"));
        await onSuccess(data);
      }
    } catch (error) {
      logger.error(`Sync ${label} failed:`, error);
    }
  }

  /**
   * Syncs the team roster using the JSON snapshot from S3.
   * Utilizes If-None-Match ETag for caching.
   * @param {string} teamId - The team ID to sync.
   */
  async syncTeamRoster(teamId: string) {
    const localTeam = await db.teams.get(teamId);
    const etag = localTeam ? this.getETag("team", teamId) : null;

    await this.handleEtagResponse<RosterSnapshot>(
      "team",
      teamId,
      `/data/teams/${teamId}/roster.json`,
      etag,
      (data) => this.persistRoster(teamId, data),
      `Team ${teamId}`,
    );
  }

  /**
   * Syncs the list of games for a specific team using the JSON snapshot.
   * @param {string} teamId - The team ID.
   */
  async syncTeamGamesList(teamId: string) {
    const localGamesCount = await db.games
      .where("teamId")
      .equals(teamId)
      .count();
    const etag =
      localGamesCount > 0 ? this.getETag("team_games", teamId) : null;

    await this.handleEtagResponse<{ games: Record<string, unknown>[] }>(
      "team_games",
      teamId,
      `/data/teams/${teamId}/games.json`,
      etag,
      async (data) => {
        await db.transaction("rw", [db.games], async () => {
          const gamesToPut = data.games.map(
            (g) => ({ ...g, id: g.id as string, synced: 1 }) as Game,
          );
          await db.games.bulkPut(gamesToPut);
        });
      },
      `Games list for team ${teamId}`,
    );
  }

  /**
   * Syncs the stats for a specific completed game using the JSON snapshot.
   * @param {string} gameId - The game ID.
   */
  async syncGameStats(gameId: string) {
    const localGame = await db.games.get(gameId);
    const etag = localGame?.completed ? this.getETag("game", gameId) : null;

    await this.handleEtagResponse<GameSnapshot>(
      "game",
      gameId,
      `/data/games/${gameId}/stats.json`,
      etag,
      (data) => this.persistGameStats(data),
      `Game ${gameId}`,
    );
  }

  /**
   * 🏀 Assistant Coach: Live Game Syncing
   * Fetches latest stats for an active game directly from the API.
   * @param {string} gameId - The game ID.
   */
  async pullLiveStats(gameId: string) {
    try {
      const res = await this.fetchApi(`/api/games/${gameId}/stats`);
      if (res.ok) {
        const stats = await res.json();
        if (Array.isArray(stats)) {
          await db.transaction("rw", [db.stats], async () => {
            const statsToPut = stats.map(
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
      }
    } catch (e) {
      logger.error(`Live sync failed for game ${gameId}:`, e);
    }
  }

  /**
   * Persists roster snapshot data to local IndexedDB.
   * @param {string} teamId - Team ID.
   * @param {RosterSnapshot} data - Snapshot data.
   * @private
   */
  private async persistRoster(teamId: string, data: RosterSnapshot) {
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

  /**
   * Persists game stats snapshot data to local IndexedDB.
   * @param {GameSnapshot} data - Snapshot data.
   * @private
   */
  private async persistGameStats(data: GameSnapshot) {
    await db.transaction("rw", [db.games, db.stats], async () => {
      await db.games.put({
        ...data.game,
        id: data.game.id as string,
        synced: 1,
      } as Game);

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

  /**
   * Triggers a sync of all roster, games, and stats for a specific team.
   * @param {string} teamId - The team ID.
   */
  async syncAllForTeam(teamId: string) {
    // ⚡ Bolt: Parallelize independent team-level sync operations to reduce total latency.
    await Promise.all([
      this.syncTeamRoster(teamId),
      this.syncTeamGamesList(teamId),
    ]);

    // Sync stats for each completed game
    const games = await db.games.where("teamId").equals(teamId).toArray();
    const gameStatsPromises = games
      .filter((game) => game.completed)
      .map((game) => this.syncGameStats(game.id!.toString()));
    await Promise.all(gameStatsPromises);
  }

  /**
   * Performs a full pull synchronization for the entire application.
   * Fetches teams, rosters, and completed game stats.
   */
  async pullAll() {
    if (this.isSyncing) return;
    this.setSyncing(true);
    logger.info("Starting full pull sync...");

    try {
      // ⚡ Bolt: Fetch global entities in parallel to maximize network utilization.
      const [teamsRes, playersRes] = await Promise.all([
        this.fetchApi("/api/teams"),
        this.fetchApi("/api/players"),
      ]);

      // 1. Process Teams
      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        await db.transaction("rw", [db.teams], async () => {
          const teamsToPut = teams.map((t: Team) => ({
            ...t,
            id: t.id,
            synced: 1,
          }));
          await db.teams.bulkPut(teamsToPut);
        });

        // 2. Pull Team Details (Roster, Games) for each team in parallel
        const teamPromises = teams.flatMap((t: Team) => [
          this.syncTeamRoster(t.id!),
          this.syncTeamGamesList(t.id!),
        ]);
        await Promise.all(teamPromises);
      }

      // 4. Process all global players
      if (playersRes.ok) {
        const players = await playersRes.json();
        await db.transaction("rw", [db.players], async () => {
          const playersToPut = players.map((p: Player) => ({
            ...p,
            id: p.id,
            synced: 1,
          }));
          await db.players.bulkPut(playersToPut);
        });
      }

      // 5. Pull stats for all completed games discovered in parallel
      const completedGames = await db.games
        .where("completed")
        .equals(1)
        .toArray();
      const completedGamePromises = completedGames.map((g) =>
        this.syncGameStats(g.id!.toString()),
      );
      await Promise.all(completedGamePromises);

      logger.info("Full pull sync complete.");
    } catch (e) {
      logger.error("Full pull sync failed:", e);
    } finally {
      this.setSyncing(false);
    }
  }

  /**
   * Returns whether a synchronization process is currently active.
   * @returns {boolean} True if syncing.
   */
  getSyncingStatus() {
    return this.isSyncing;
  }
}

/**
 * Exported singleton instance of SyncService.
 */
export const syncService = new SyncService();
