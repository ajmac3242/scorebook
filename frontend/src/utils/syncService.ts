/**
 * @file syncService.ts
 * @description Provides logic for bidirectional synchronization between local IndexedDB and the backend API.
 * Implements push (local-to-remote) and pull (remote-to-local via API and S3 snapshots) functionality.
 */

import { db } from "../db";
import { UserPool } from "../UserPool";

/**
 * Interface representing the team roster snapshot structure from S3.
 */
interface RosterSnapshot {
  team: any;
  players: any[];
}

/**
 * Interface representing the game stats snapshot structure from S3.
 */
interface GameSnapshot {
  game: any;
  stats: any[];
}

/**
 * Service class for handling all data synchronization tasks.
 */
class SyncService {
  private isSyncing = false;

  /**
   * Helper function to get authorization headers for API requests.
   * @returns {Promise<Record<string, string>>} Headers object with Authorization token.
   * @private
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const user = UserPool.getCurrentUser();
    if (!user) return { "Content-Type": "application/json" };

    return new Promise((resolve) => {
      user.getSession((err: any, session: any) => {
        if (err || !session || !session.isValid()) {
          resolve({ "Content-Type": "application/json" });
        } else {
          resolve({
            Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`,
            "Content-Type": "application/json",
          });
        }
      });
    });
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
      const counts = await Promise.all([
        db.seasons.where("synced").equals(0).count(),
        db.teams.where("synced").equals(0).count(),
        db.players.where("synced").equals(0).count(),
        db.teamPlayers.where("synced").equals(0).count(),
        db.games.where("synced").equals(0).count(),
        db.stats.where("synced").equals(0).count(),
      ]);
      return counts.some((count) => count > 0);
    } catch (e) {
      console.error("Error checking for unsynced changes:", e);
      return false;
    }
  }

  /**
   * Helper to push all unsynced items of a specific entity type to the API.
   * @param {any} table - Dexie table.
   * @param {string} endpoint - API endpoint or a function that returns an endpoint.
   * @param {string} entityName - Name for logging.
   * @param {Record<string, string>} headers - Auth headers.
   * @param {(item: any) => Promise<void>} [onSuccess] - Optional callback after successful push.
   * @private
   */
  private async pushEntity<T extends { id?: string | number }>(
    table: any,
    endpoint: string | ((item: T) => string),
    entityName: string,
    onSuccess?: (item: T) => Promise<void>,
  ) {
    if (!table) return;
    const query = table.where("synced").equals(0);
    let items;
    try {
      items = await (query.toArray ? query.toArray() : query);
    } catch (e) {
      return;
    }
    if (!items || !Array.isArray(items)) return;

    for (const item of items) {
      try {
        const url = typeof endpoint === "function" ? endpoint(item) : endpoint;
        const res = await this.fetchApi(url, {
          method: "POST",
          body: JSON.stringify(item),
        });
        if (res.ok) {
          await table.update(item.id!, { synced: 1 });
          if (onSuccess) await onSuccess(item);
        }
      } catch (err) {
        console.error(`Failed to push ${entityName} ${item.id}:`, err);
      }
    }
  }

  /**
   * Pushes all local, unsynced changes to the backend API.
   * Iterates through all entities and updates their synced status upon success.
   */
  async pushUpdates() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting push updates...");

    try {
      await this.pushEntity(db.seasons, "/api/seasons", "season");
      await this.pushEntity(db.teams, "/api/teams", "team");
      await this.pushEntity(db.players, "/api/players", "player");
      await this.pushEntity(
        db.teamPlayers,
        (tp: any) => `/api/teams/${tp.teamId}/players`,
        "teamPlayer",
      );
      await this.pushEntity(db.games, "/api/games", "game", async (g) => {
        if (g.completed) {
          await this.fetchApi(`/api/games/${g.id}/complete`, {
            method: "POST",
          });
        }
      });
      await this.pushEntity(
        db.stats,
        (s: any) => `/api/games/${s.gameId}/stats`,
        "stat",
      );

      console.log("Push updates complete.");
    } catch (e) {
      console.error("Push updates failed:", e);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Syncs the team roster using the JSON snapshot from S3.
   * Utilizes If-None-Match ETag for caching.
   * @param {string} teamId - The team ID to sync.
   */
  async syncTeamRoster(teamId: string) {
    // Check if we have the team in our local database before relying on the ETag
    const localTeam = await db.teams.get(teamId as any);
    const etag = localTeam ? localStorage.getItem(`etag_team_${teamId}`) : null;

    try {
      const response = await this.fetchApi(`/data/teams/${teamId}/roster.json`, {
        headers: {
          "If-None-Match": etag || "",
        },
      });

      if (response.status === 304) {
        console.log(`Team ${teamId} is up to date.`);
        return;
      }

      if (response.ok) {
        const data: RosterSnapshot = await response.json();
        const newEtag = response.headers.get("ETag");
        if (newEtag) localStorage.setItem(`etag_team_${teamId}`, newEtag);

        await this.persistRoster(teamId, data);
      }
    } catch (error) {
      console.error("Sync team roster failed:", error);
    }
  }

  /**
   * Syncs the list of games for a specific team using the JSON snapshot.
   * @param {string} teamId - The team ID.
   */
  async syncTeamGamesList(teamId: string) {
    // Check if we have any games for this team before relying on the ETag
    const localGamesCount = await db.games
      .where("teamId")
      .equals(teamId)
      .count();
    const etag =
      localGamesCount > 0
        ? localStorage.getItem(`etag_team_games_${teamId}`)
        : null;

    try {
      const response = await this.fetchApi(`/data/teams/${teamId}/games.json`, {
        headers: {
          "If-None-Match": etag || "",
        },
      });

      if (response.status === 304) {
        console.log(`Games list for team ${teamId} is up to date.`);
        return;
      }

      if (response.ok) {
        const data: { games: any[] } = await response.json();
        const newEtag = response.headers.get("ETag");
        if (newEtag) localStorage.setItem(`etag_team_games_${teamId}`, newEtag);

        await db.transaction("rw", [db.games], async () => {
          for (const g of data.games) {
            await db.games.put({
              ...g,
              id: g.id,
              synced: 1,
            });
          }
        });
      }
    } catch (error) {
      console.error("Sync team games list failed:", error);
    }
  }

  /**
   * Syncs the stats for a specific completed game using the JSON snapshot.
   * @param {string} gameId - The game ID.
   */
  async syncGameStats(gameId: string) {
    // Check if we have the game in our local database before relying on the ETag
    const localGame = await db.games.get(gameId as any);
    const etag = localGame?.completed
      ? localStorage.getItem(`etag_game_${gameId}`)
      : null;

    try {
      const response = await this.fetchApi(`/data/games/${gameId}/stats.json`, {
        headers: {
          "If-None-Match": etag || "",
        },
      });

      if (response.status === 304) {
        console.log(`Game ${gameId} is up to date.`);
        return;
      }

      if (response.ok) {
        const data: GameSnapshot = await response.json();
        const newEtag = response.headers.get("ETag");
        if (newEtag) localStorage.setItem(`etag_game_${gameId}`, newEtag);

        await this.persistGameStats(data);
      }
    } catch (error) {
      console.error("Sync game stats failed:", error);
    }
  }

  /**
   * Persists roster snapshot data to local IndexedDB.
   * @param {string} teamId
   * @param {RosterSnapshot} data
   * @private
   */
  private async persistRoster(teamId: string, data: RosterSnapshot) {
    await db.transaction(
      "rw",
      [db.teams, db.players, db.teamPlayers],
      async () => {
        await db.teams.put({
          ...data.team,
          id: data.team.id,
          synced: 1,
        });

        for (const p of data.players) {
          await db.players.put({
            id: p.id,
            name: p.name,
            avatarColor: p.avatarColor,
            synced: 1,
          });
          await db.teamPlayers.put({
            ...p,
            teamId: teamId,
            playerId: p.id,
            synced: 1,
          });
        }
      },
    );
  }

  /**
   * Persists game stats snapshot data to local IndexedDB.
   * @param {GameSnapshot} data
   * @private
   */
  private async persistGameStats(data: GameSnapshot) {
    await db.transaction("rw", [db.games, db.stats], async () => {
      await db.games.put({
        ...data.game,
        id: data.game.id,
        synced: 1,
      });

      for (const s of data.stats) {
        await db.stats.put({
          ...s,
          id: s.id,
          synced: 1,
        });
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
   * Fetches seasons, teams, rosters, and completed game stats.
   */
  async pullAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting full pull sync...");

    try {
      // 1. Pull all Seasons
      const seasonsRes = await this.fetchApi("/api/seasons");
      if (seasonsRes.ok) {
        const seasons = await seasonsRes.json();
        await db.transaction("rw", [db.seasons], async () => {
          for (const s of seasons) {
            await db.seasons.put({ ...s, id: s.id, synced: 1 });
          }
        });

        // 2. Pull Teams for each season
        for (const s of seasons) {
          const teamsRes = await this.fetchApi(`/api/teams?seasonId=${s.id}`);
          if (teamsRes.ok) {
            const teams = await teamsRes.json();
            await db.transaction("rw", [db.teams], async () => {
              for (const t of teams) {
                await db.teams.put({ ...t, id: t.id, synced: 1 });
              }
            });

            // 3. Pull Team Details (Roster, Games) for each team
            for (const t of teams) {
              await this.syncTeamRoster(t.id);
              await this.syncTeamGamesList(t.id);
            }
          }
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

      console.log("Full pull sync complete.");
    } catch (e) {
      console.error("Full pull sync failed:", e);
    } finally {
      this.isSyncing = false;
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
