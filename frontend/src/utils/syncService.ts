import { db } from "../db";
import { UserPool } from "../UserPool";

interface RosterSnapshot {
  team: any;
  players: any[];
}

interface GameSnapshot {
  game: any;
  stats: any[];
}

class SyncService {
  private isSyncing = false;

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

  async pushUpdates() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting push updates...");

    try {
      const headers = await this.getHeaders();

      // Push Seasons
      const seasons = await db.seasons.where("synced").equals(0).toArray();
      for (const s of seasons) {
        const res = await fetch("/seasons", {
          method: "POST",
          headers,
          body: JSON.stringify(s),
        });
        if (res.ok) await db.seasons.update(s.id!, { synced: 1 });
      }

      // Push Teams
      const teams = await db.teams.where("synced").equals(0).toArray();
      for (const t of teams) {
        const res = await fetch("/teams", {
          method: "POST",
          headers,
          body: JSON.stringify(t),
        });
        if (res.ok) await db.teams.update(t.id!, { synced: 1 });
      }

      // Push Players
      const players = await db.players.where("synced").equals(0).toArray();
      for (const p of players) {
        const res = await fetch("/players", {
          method: "POST",
          headers,
          body: JSON.stringify(p),
        });
        if (res.ok) await db.players.update(p.id!, { synced: 1 });
      }

      // Push TeamPlayers
      const tp = await db.teamPlayers.where("synced").equals(0).toArray();
      for (const item of tp) {
        const res = await fetch(`/teams/${item.teamId}/players`, {
          method: "POST",
          headers,
          body: JSON.stringify(item),
        });
        if (res.ok) await db.teamPlayers.update(item.id!, { synced: 1 });
      }

      // Push Games
      const games = await db.games.where("synced").equals(0).toArray();
      for (const g of games) {
        const res = await fetch("/games", {
          method: "POST",
          headers,
          body: JSON.stringify(g),
        });
        if (res.ok) {
          await db.games.update(g.id!, { synced: 1 });
          if (g.completed) {
            await fetch(`/games/${g.id}/complete`, { method: "POST", headers });
          }
        }
      }

      // Push Stats
      const stats = await db.stats.where("synced").equals(0).toArray();
      for (const st of stats) {
        const res = await fetch(`/games/${st.gameId}/stats`, {
          method: "POST",
          headers,
          body: JSON.stringify(st),
        });
        if (res.ok) await db.stats.update(st.id!, { synced: 1 });
      }

      console.log("Push updates complete.");
    } catch (e) {
      console.error("Push updates failed:", e);
    } finally {
      this.isSyncing = false;
    }
  }

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

  async syncAllForTeam(teamId: string) {
    // 2. Sync Roster
    await this.syncTeamRoster(teamId);

    // 3. Sync Games list to discover new games
    await this.syncTeamGamesList(teamId);

    // 4. Sync stats for each completed game
    const games = await db.games.where("teamId").equals(teamId).toArray();
    for (const game of games) {
      if (game.completed) {
        await this.syncGameStats(game.id!.toString());
      }
    }
  }

  async pullAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting full pull sync...");

    try {
      const headers = await this.getHeaders();

      // 1. Pull Seasons
      const seasonsRes = await fetch("/seasons", { headers });
      if (seasonsRes.ok) {
        const seasons = await seasonsRes.json();
        await db.transaction("rw", [db.seasons], async () => {
          for (const s of seasons) {
            await db.seasons.put({ ...s, id: s.id, synced: 1 });
          }
        });

        // 2. Pull Teams for each season
        for (const s of seasons) {
          const teamsRes = await fetch(`/teams?seasonId=${s.id}`, { headers });
          if (teamsRes.ok) {
            const teams = await teamsRes.json();
            await db.transaction("rw", [db.teams], async () => {
              for (const t of teams) {
                await db.teams.put({ ...t, id: t.id, synced: 1 });
              }
            });

            // 3. Pull Team Details (Roster, Games, Stats)
            for (const t of teams) {
              await this.syncTeamRoster(t.id);
              await this.syncTeamGamesList(t.id);
            }
          }
        }
      }

      // 4. Pull all players (to be sure we have them all)
      const playersRes = await fetch("/players", { headers });
      if (playersRes.ok) {
        const players = await playersRes.json();
        await db.transaction("rw", [db.players], async () => {
          for (const p of players) {
            await db.players.put({ ...p, id: p.id, synced: 1 });
          }
        });
      }

      // 5. Pull stats for all completed games found
      const completedGames = await db.games.where("completed").equals(1).toArray();
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

  getSyncingStatus() {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
