/**
 * @file syncService.ts
 * @description Provides logic for bidirectional synchronization between local IndexedDB and the backend API.
 * Refactored façade module maintaining exact public API compatibility.
 */

import { db, Game, Team, Player } from "../db";
import { logger } from "./logger";
import { sanitizeRemoteData } from "./sync/syncSanitizer";
import { hasUnsyncedChanges, pushAllLocalUpdates } from "./sync/syncQueue";
import {
  getETag,
  fetchApi,
  handleEtagResponse,
  persistRoster,
  persistGameStats,
} from "./sync/syncApi";

export { sanitizeRemoteData };

class SyncService {
  private isSyncing = false;
  private listeners: ((_status: boolean) => void)[] = [];

  subscribe(callback: (_status: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](this.isSyncing);
    }
  }

  private setSyncing(status: boolean) {
    if (this.isSyncing !== status) {
      this.isSyncing = status;
      this.notify();
    }
  }

  async hasUnsyncedChanges(): Promise<boolean> {
    return hasUnsyncedChanges();
  }

  async pushUpdates() {
    if (this.isSyncing) return;
    this.setSyncing(true);
    logger.info("Starting push updates...");

    try {
      await pushAllLocalUpdates(fetchApi);
      logger.info("Push updates complete.");
    } catch (e) {
      logger.error("Push updates failed:", e);
    } finally {
      this.setSyncing(false);
    }
  }

  async syncTeamRoster(teamId: string) {
    const safeTeamId = encodeURIComponent(String(teamId));
    const localTeam = await db.teams.get(teamId);
    const etag = localTeam ? getETag("team", teamId) : null;

    await handleEtagResponse(
      "team",
      teamId,
      `/data/teams/${safeTeamId}/roster.json`,
      etag,
      (data) => persistRoster(teamId, data as Parameters<typeof persistRoster>[1]),
      `Team ${teamId}`,
    );
  }

  async syncTeamGamesList(teamId: string) {
    const safeTeamId = encodeURIComponent(String(teamId));
    const localGamesCount = await db.games
      .where("teamId")
      .equals(teamId)
      .count();
    const etag = localGamesCount > 0 ? getETag("team_games", teamId) : null;

    await handleEtagResponse<{ games: Record<string, unknown>[] }>(
      "team_games",
      teamId,
      `/data/teams/${safeTeamId}/games.json`,
      etag,
      async (data) => {
        await db.transaction("rw", [db.games], async () => {
          const gamesToPut: Game[] = [];
          for (const g of data.games) {
            const incomingGame = {
              ...g,
              id: g.id as string,
              synced: 1,
            } as Game;
            if (incomingGame.id) {
              const localGame = await db.games.get(incomingGame.id);
              if (
                localGame &&
                (!localGame.completed || localGame.completed === 0)
              ) {
                gamesToPut.push({
                  ...incomingGame,
                  clockTime: localGame.clockTime ?? incomingGame.clockTime,
                  currentPeriod:
                    localGame.currentPeriod ?? incomingGame.currentPeriod,
                  onCourtIds: localGame.onCourtIds ?? incomingGame.onCourtIds,
                  possessionArrow:
                    localGame.possessionArrow ?? incomingGame.possessionArrow,
                });
                continue;
              }
            }
            gamesToPut.push(incomingGame);
          }
          await db.games.bulkPut(gamesToPut);
        });
      },
      `Games list for team ${teamId}`,
    );
  }

  async syncGameStats(gameId: string) {
    const safeGameId = encodeURIComponent(String(gameId));
    const localGame = await db.games.get(gameId);
    const etag = localGame?.completed ? getETag("game", gameId) : null;

    await handleEtagResponse(
      "game",
      gameId,
      `/data/games/${safeGameId}/stats.json`,
      etag,
      (data) => persistGameStats(data as Parameters<typeof persistGameStats>[0]),
      `Game ${gameId}`,
    );
  }

  async syncAllForTeam(teamId: string) {
    await Promise.all([
      this.syncTeamRoster(teamId),
      this.syncTeamGamesList(teamId),
    ]);

    const games = await db.games.where("teamId").equals(teamId).toArray();
    const gameStatsPromises = games
      .filter((game) => game.completed)
      .map((game) => this.syncGameStats(game.id!.toString()));
    await Promise.all(gameStatsPromises);
  }

  async pullAll() {
    if (this.isSyncing) return;
    this.setSyncing(true);
    logger.info("Starting full pull sync...");

    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetchApi("/api/teams"),
        fetchApi("/api/players"),
      ]);

      if (teamsRes.ok) {
        const rawTeams = await teamsRes.json();
        const teams = sanitizeRemoteData(rawTeams);
        await db.transaction("rw", [db.teams], async () => {
          const teamsToPut = teams.map((t: Team) => ({
            ...t,
            id: t.id,
            synced: 1,
          }));
          await db.teams.bulkPut(teamsToPut);
        });

        const teamPromises = teams.flatMap((t: Team) => [
          this.syncTeamRoster(t.id!),
          this.syncTeamGamesList(t.id!),
        ]);
        await Promise.all(teamPromises);
      }

      if (playersRes.ok) {
        const rawPlayers = await playersRes.json();
        const players = sanitizeRemoteData(rawPlayers);
        await db.transaction("rw", [db.players], async () => {
          const playersToPut = players.map((p: Player) => ({
            ...p,
            id: p.id,
            synced: 1,
          }));
          await db.players.bulkPut(playersToPut);
        });
      }

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

  getSyncingStatus() {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
