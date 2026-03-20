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
   * Pushes all local, unsynced changes to the backend API.
   * Iterates through all entities and updates their synced status upon success.
   */
  async pushUpdates() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting push updates...");

    try {
      const headers = await this.getHeaders();

      // --- Push Seasons ---
      const seasons = await db.seasons.where("synced").equals(0).toArray();
      for (const s of seasons) {
        try {
          const res = await fetch("/api/seasons", {
            method: "POST",
            headers,
            body: JSON.stringify(s),
          });
          if (res.ok) await db.seasons.update(s.id!, { synced: 1 });
        } catch (err) {
          console.error(`Failed to push season ${s.id}:`, err);
        }
      }

      // --- Push Teams ---
      const teams = await db.teams.where("synced").equals(0).toArray();
      for (const t of teams) {
        try {
          const res = await fetch("/api/teams", {
            method: "POST",
            headers,
            body: JSON.stringify(t),
          });
          if (res.ok) await db.teams.update(t.id!, { synced: 1 });
        } catch (err) {
          console.error(`Failed to push team ${t.id}:`, err);
        }
      }

      // --- Push Players ---
      const players = await db.players.where("synced").equals(0).toArray();
      for (const p of players) {
        try {
          const res = await fetch("/api/players", {
            method: "POST",
            headers,
            body: JSON.stringify(p),
          });
          if (res.ok) await db.players.update(p.id!, { synced: 1 });
        } catch (err) {
          console.error(`Failed to push player ${p.id}:`, err);
        }
      }

      // --- Push TeamPlayers ---
      const tp = await db.teamPlayers.where("synced").equals(0).toArray();
      for (const item of tp) {
        try {
          const res = await fetch(`/api/teams/${item.teamId}/players`, {
            method: "POST",
            headers,
            body: JSON.stringify(item),
          });
          if (res.ok) await db.teamPlayers.update(item.id!, { synced: 1 });
        } catch (err) {
          console.error(`Failed to push teamPlayer ${item.id}:`, err);
        }
      }

      // --- Push Games ---
      const games = await db.games.where("synced").equals(0).toArray();
      for (const g of games) {
        try {
          const res = await fetch("/api/games", {
            method: "POST",
            headers,
            body: JSON.stringify(g),
          });
          if (res.ok) {
            await db.games.update(g.id!, { synced: 1 });
            // If game is completed, send a separate completion signal
            if (g.completed) {
              await fetch(`/api/games/${g.id}/complete`, {
                method: "POST",
                headers,
              });
            }
          }
        } catch (err) {
          console.error(`Failed to push game ${g.id}:`, err);
        }
      }

      // --- Push Individual Stats ---
      const stats = await db.stats.where("synced").equals(0).toArray();
      for (const st of stats) {
        try {
          const res = await fetch(`/api/games/${st.gameId}/stats`, {
            method: "POST",
            headers,
            body: JSON.stringify(st),
          });
          if (res.ok) await db.stats.update(st.id!, { synced: 1 });
        } catch (err) {
          console.error(`Failed to push stat ${st.id}:`, err);
        }
      }

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
    const etag = localStorage.getItem(`etag_team_${teamId}`);
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`/data/teams/${teamId}/roster.json`, {
        headers: {
          ...headers,
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

        // Bulk update local database within a transaction
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
                synced: 1,
              });
              await db.teamPlayers.put({
                teamId: teamId,
                playerId: p.id,
                jerseyNumber: p.jerseyNumber,
                synced: 1,
              });
            }
          },
        );
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
    const etag = localStorage.getItem(`etag_team_games_${teamId}`);
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`/data/teams/${teamId}/games.json`, {
        headers: {
          ...headers,
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
    const etag = localStorage.getItem(`etag_game_${gameId}`);
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`/data/games/${gameId}/stats.json`, {
        headers: {
          ...headers,
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
    } catch (error) {
      console.error("Sync game stats failed:", error);
    }
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
      const headers = await this.getHeaders();

      // 1. Pull all Seasons
      const seasonsRes = await fetch("/api/seasons", { headers });
      if (seasonsRes.ok) {
        const seasons = await seasonsRes.json();
        await db.transaction("rw", [db.seasons], async () => {
          for (const s of seasons) {
            await db.seasons.put({ ...s, id: s.id, synced: 1 });
          }
        });

        // 2. Pull Teams for each season
        for (const s of seasons) {
          const teamsRes = await fetch(`/api/teams?seasonId=${s.id}`, {
            headers,
          });
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
      const playersRes = await fetch("/api/players", { headers });
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
