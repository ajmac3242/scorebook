/**
 * @file syncService.ts
 * @description Provides logic for bidirectional synchronization between local IndexedDB and the backend API.
 * Implements push (local-to-remote) and pull (remote-to-local via API and S3 snapshots) functionality.
 */

import { db, Game, TeamPlayer, StatEvent, Team } from "../db";
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
    try {
      const tables = [db.teams, db.players, db.teamPlayers, db.games, db.stats];
      // Optimization: Check tables sequentially and return early if any unsynced items are found.
      // Use .limit(1).count() to avoid scanning all records when only existence is needed.
      for (const table of tables) {
        const count = await table.where("synced").equals(0).limit(1).count();
        if (count > 0) return true;
      }
      return false;
    } catch (e) {
      logger.error("Error checking for unsynced changes:", e);
      return false;
    }
  }

  /**
   * Helper to push all unsynced items of a specific entity type to the API.
   * @param {Record<string, any>} table - Dexie table.
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

    for (const item of items) {
      try {
        const url = typeof endpoint === "function" ? endpoint(item) : endpoint;
        const res = await this.fetchApi(url, {
          method: "POST",
          body: JSON.stringify(item),
        });
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await table.update(item.id!, { synced: 1 } as any);
          if (onSuccess) await onSuccess(item);
        } else {
          logger.error(`Failed to push ${entityName} ${item.id}:`, res.status);
        }
      } catch (err) {
        logger.error(`Failed to push ${entityName} ${item.id}:`, err);
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
          for (const g of data.games) {
            await db.games.put({ ...g, id: g.id as string, synced: 1 } as Game);
          }
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

        for (const p of data.players) {
          await db.players.put({
            id: p.id as string,
            name: p.name as string,
            avatarColor: p.avatarColor as string,
            synced: 1,
          });
          await db.teamPlayers.put({
            ...p,
            teamId: teamId,
            playerId: p.id as string,
            synced: 1,
          } as TeamPlayer);
        }
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

      for (const s of data.stats) {
        await db.stats.put({
          ...s,
          id: s.id as string,
          synced: 1,
        } as StatEvent);
      }
    });
  }

  /**
   * Triggers a sync of all roster, games, and stats for a specific team.
   * @param {string} teamId - The team ID.
   */
  async syncAllForTeam(teamId: string) {
    // Sync Roster
    await this.syncTeamRoster(teamId);

    // Sync Games list to discover new games
    await this.syncTeamGamesList(teamId);

    // Sync stats for each completed game
    const games = await db.games.where("teamId").equals(teamId).toArray();
    for (const game of games) {
      if (game.completed) {
        await this.syncGameStats(game.id!.toString());
      }
    }
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
      // 1. Pull all Teams
      const teamsRes = await this.fetchApi("/api/teams");
      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        await db.transaction("rw", [db.teams], async () => {
          for (const t of teams) {
            await db.teams.put({ ...t, id: t.id, synced: 1 });
          }
        });

        // 2. Pull Team Details (Roster, Games) for each team
        for (const t of teams) {
          await this.syncTeamRoster(t.id);
          await this.syncTeamGamesList(t.id);
        }
      }

      // 4. Pull all global players
      const playersRes = await this.fetchApi("/api/players");
      if (playersRes.ok) {
        const players = await playersRes.json();
        await db.transaction("rw", [db.players], async () => {
          for (const p of players) {
            await db.players.put({ ...p, id: p.id, synced: 1 });
          }
        });
      }

      // 5. Pull stats for all completed games discovered
      const completedGames = await db.games
        .where("completed")
        .equals(1)
        .toArray();
      for (const g of completedGames) {
        await this.syncGameStats(g.id!.toString());
      }

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
