/**
 * @file db.ts
 * @description Local-first database configuration using Dexie.js (IndexedDB).
 * Defines schemas and interfaces for seasons, teams, players, and game stats.
 */

import Dexie, { type Table } from "dexie";

/**
 * Interface representing a basketball season.
 */
export interface Season {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  synced?: number; // 0 (not synced) or 1 (synced)
}

/**
 * Interface representing a basketball team.
 */
export interface Team {
  id?: number;
  seasonId: number | string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  synced?: number;
}

/**
 * Interface representing a master player record.
 */
export interface Player {
  id?: number;
  name: string;
  avatarColor?: string;
  synced?: number;
}

/**
 * Junction table interface linking players to specific teams with season-specific data.
 */
export interface TeamPlayer {
  id?: number;
  teamId: number | string;
  playerId: number | string;
  name?: string;
  avatarColor?: string;
  jerseyNumber?: string;
  synced?: number;
}

/**
 * Interface representing a single basketball game.
 */
export interface Game {
  id?: number;
  teamId: number | string;
  opponent: string;
  date: string;
  location: string;
  completed?: number; // 0 (incomplete) or 1 (completed)
  synced?: number;
}

/**
 * Interface representing an individual statistical event during a game.
 */
export interface StatEvent {
  id?: number;
  gameId: number | string;
  playerId: number | string;
  type: string; // e.g., 'PTS', 'REB', 'AST'
  points?: number;
  locationX?: number;
  locationY?: number;
  timestamp: string;
  synced?: number;
}

/**
 * AppDatabase class extending Dexie to manage the local IndexedDB instance.
 */
export class AppDatabase extends Dexie {
  seasons!: Table<Season>;
  teams!: Table<Team>;
  players!: Table<Player>;
  teamPlayers!: Table<TeamPlayer>;
  games!: Table<Game>;
  stats!: Table<StatEvent>;

  constructor() {
    super("BasketballStatsDB");

    // Define the database schema with primary keys and indexes
    this.version(5).stores({
      seasons: "++id, synced",
      teams: "++id, seasonId, synced",
      players: "++id, synced",
      teamPlayers: "++id, [teamId+playerId], teamId, playerId, synced",
      games: "++id, teamId, completed, synced",
      stats: "++id, gameId, playerId, synced",
    });
  }
}

/**
 * Exported database instance.
 */
export const db = new AppDatabase();
