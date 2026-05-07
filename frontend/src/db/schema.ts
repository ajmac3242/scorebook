/**
 * @file schema.ts
 * @description Dexie database schema and version history.
 */

export const SCHEMA_VERSION = 20;

export const DB_SCHEMA = {
  teams: "id, synced, deletedAt, isFavorite",
  players: "id, synced, isArchived, deletedAt",
  teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
  games: "id, teamId, opponentId, completed, synced, deletedAt",
  stats: "id, gameId, playerId, synced, deletedAt",
  opponents: "id, name, synced",
};
