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
  foulsToFoulOut?: number;
  teamFoulsToBonus?: number;
  teamFoulsToDoubleBonus?: number;
  timeoutsPerTeam?: number;
  timeoutScope?: "HALF" | "GAME";
  deletedAt?: string;
  synced?: number;
  isFavorite?: number; // 0 or 1
  isArchived?: number; // 0 or 1
  defaultPeriodLength?: number;
  defaultTimeoutLimit?: number;
  defaultFoulLimit?: number;
  defaultOvertimeLength?: number;
  maxStintDuration?: number; // In minutes
  playbook?: string[];
  foulWarningThresholds?: Record<string, number>;
}

/**
 * Interface representing a master player record.
 */
export interface Player {
  id?: string;
  name: string;
  avatarColor?: string;
  isArchived?: number; // 0 or 1
  isStar?: number; // 0 or 1
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
 * Interface representing a persistent opponent team for scouting.
 */
export interface Opponent {
  id: string;
  name: string;
  logoUrl?: string;
  roster: string[]; // List of jersey numbers identified for this opponent
  synced?: number;
  isArchived?: number; // 0 or 1
}

/**
 * Interface representing a single basketball game.
 */
export interface Game {
  id?: string;
  teamId: string;
  opponent: string;
  opponentId?: string; // Reference to persistent opponent record
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
  matchups?: Record<string, string>; // Opponent Player ID -> Our Player ID
  activeDefensiveScheme?: "MAN" | "ZONE" | "PRESS" | "DOUBLE";
  tacticalKpis?: string[]; // Selected KPIs for Identity HUD
  teamScore?: number; // Denormalized final score — written at game completion
  oppScore?: number; // Denormalized opponent score — written at game completion
  possessionArrow?: "OUR_TEAM" | "OPPONENT";
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
  shotQuality?: string;
  shotClockPhase?: "EARLY" | "MID" | "LATE";
  primaryDefenderId?: string;
  breakdownReason?: string;
  situation?: string; // 'ATO', 'SLOB', 'BLOB', 'EOP'
  defensiveScheme?: "MAN" | "ZONE" | "PRESS" | "DOUBLE";
  opponentPlayType?: "PnR" | "ISO" | "POST" | "TRANSITION" | "OFF_SCREEN";
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
  opponents!: Table<Opponent>;

  /**
   * @param name - Optional name for the database (defaults to 'ScorebookDB')
   */
  constructor(name: string = "ScorebookDB") {
    super(name);

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
    // v18:    Added 'opponents' table and 'opponentId' to Game for persistent scouting.
    // v19:    Added 'name' index to 'opponents' table.
    // v20:    Added 'isStar' to Player schema.
    // v21:    Added 'matchups' to Game and 'primaryDefenderId', 'shotClockPhase' to StatEvent.
    // v22:    Added 'activeDefensiveScheme' to Game and 'defensiveScheme', 'opponentPlayType' to StatEvent.
    // v23:    Added 'breakdownReason' to StatEvent.
    // v24:    Added 'tacticalKpis' to Game for Identity HUD.
    // v25:    Added denormalized 'teamScore' and 'oppScore' to Game.
    // v26:    Added 'isArchived' to Team schema and index.
    // v27:    Added 'isArchived' to Opponent schema and index.
    this.version(25).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced",
    });

    this.version(26).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced",
    });

    this.version(27).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced, isArchived",
    });

    this.version(28).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced, isArchived",
    });
  }
}

/**
 * Exported database instance.
 */
export const db = new AppDatabase();
