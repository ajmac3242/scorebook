/**
 * @file db.ts
 * @description Local-first database configuration using Dexie.js (IndexedDB).
 * Defines schemas and interfaces for teams, players, and game stats.
 */

import Dexie, { type Table } from "dexie";

/**
 * Interface representing a basketball team.
 */
export interface Team {
  id?: string;
  name: string;
  description?: string;
  periodType: "QUARTERS" | "HALVES";
  logoUrl?: string;
  primaryColor?: string;
  fouls?: number;
  deletedAt?: string;
  synced?: number;
  isFavorite?: number; // 0 or 1
  defaultPeriodLength?: number;
  defaultTimeoutLimit?: number;
  defaultFoulLimit?: number;
  defaultOvertimeLength?: number;
  maxStintDuration?: number; // In minutes
  playbook?: string[];
}

/**
 * Interface representing a master player record.
 */
export interface Player {
  id?: string;
  name: string;
  avatarColor?: string;
  isArchived?: number; // 0 or 1
  deletedAt?: string;
  synced?: number;
}

/**
 * Junction table interface linking players to specific teams.
 */
export interface TeamPlayer {
  id?: string;
  teamId: string;
  playerId: string;
  name?: string;
  avatarColor?: string;
  jerseyNumber?: string;
  synced?: number;
}

/**
 * Interface representing a single basketball game.
 */
export interface Game {
  id?: string;
  teamId: string;
  opponent: string;
  opponentLogoUrl?: string;
  date: string;
  time?: string;
  location: string;
  completed?: number; // 0 (incomplete) or 1 (completed)
  currentPeriod?: number;
  clockTime?: number; // Current seconds remaining in period
  periodLength?: number; // Configured length in minutes
  timeoutLimit?: number;
  foulLimit?: number;
  periodType?: "QUARTERS" | "HALVES";
  deletedAt?: string;
  synced?: number;
}

/**
 * Interface representing an individual statistical event during a game.
 */
export interface StatEvent {
  id?: string;
  gameId: string;
  playerId: string;
  type: string; // e.g., 'PTS', 'REB', 'AST'
  points?: number;
  locationX?: number;
  locationY?: number;
  period: number; // 1, 2, 3, 4 for Quarters; 1, 2 for Halves; 5+ or 3+ for OT
  clockTime?: number; // Seconds remaining in the period when event occurred
  playName?: string;
  timestamp: string;
  deletedAt?: string;
  synced?: number;
}

/**
 * AppDatabase class extending Dexie to manage the local IndexedDB instance.
 */
export class AppDatabase extends Dexie {
  teams!: Table<Team>;
  players!: Table<Player>;
  teamPlayers!: Table<TeamPlayer>;
  games!: Table<Game>;
  stats!: Table<StatEvent>;

  /**
   *
   */
  constructor() {
    super("ScorebookDB");

    // Define the database schema with primary keys and indexes
    //
    // SCHEMA EVOLUTION:
    // v1-v8:  Initial schema for teams, players, team_players, games, and stats.
    // v9:     Added 'opponentLogoUrl' to the Game table.
    // v10:    Added optional 'time' field to the Game table to support game scheduling.
    // v11:    Added 'fouls' to Team for configurable timeouts.
    // v12:    Added 'currentPeriod' to Game.
    // v13:    Added 'clockTime' and 'periodLength' to Game, and 'clockTime' to StatEvent.
    // v14:    Added 'isFavorite', 'defaultPeriodLength', 'defaultTimeoutLimit', 'defaultFoulLimit' to Team.
    // v15:    Added 'defaultOvertimeLength' to Team.
    // v16:    Added 'maxStintDuration' to Team.
    // v17:    Added 'playbook' to Team and 'playName' to StatEvent.
    this.version(17).stores({
      teams: "id, synced, deletedAt, isFavorite",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
    });
  }
}

/**
 * Exported database instance.
 */
export const db = new AppDatabase();
