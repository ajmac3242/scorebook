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

        await db.transaction("rw", [db.teams, db.players, db.teamPlayers], async () => {
          await db.teams.put({
            ...data.team,
            id: data.team.id,
            synced: 1
          });

          for (const p of data.players) {
              await db.players.put({
                  id: p.id,
                  name: p.name,
                  synced: 1
              });
              await db.teamPlayers.put({
                  teamId: teamId,
                  playerId: p.id,
                  jerseyNumber: p.jerseyNumber,
                  synced: 1
              });
          }
        });
      }
    } catch (error) {
      console.error("Sync team roster failed:", error);
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
            synced: 1
          });

          for (const s of data.stats) {
              await db.stats.put({
                  ...s,
                  id: s.id,
                  synced: 1
              });
          }
        });
      }
    } catch (error) {
      console.error("Sync game stats failed:", error);
    }
  }

  async syncAllForTeam(teamId: string) {
      await this.syncTeamRoster(teamId);
      const games = await db.games.where("teamId").equals(teamId).toArray();
      for (const game of games) {
          if (game.completed) {
              await this.syncGameStats(game.id!.toString());
          }
      }
  }
}

export const syncService = new SyncService();
