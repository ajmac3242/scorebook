/**
 * @file db.ts
 * @description Local-first database configuration using Dexie.js (IndexedDB).
 * Defines schemas and interfaces for teams, players, and game stats.
 */

import Dexie, { type Table } from "dexie";
import { SCHEMA_VERSION, DB_SCHEMA } from "./db/schema";
import { Team } from "./types/team";
import { Player } from "./types/player";
import { TeamPlayer } from "./types/teamPlayer";
import { Opponent } from "./types/opponent";
import { Game } from "./types/game";
import { StatEvent } from "./types/stat";

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

  constructor() {
    super("ScorebookDB");

    // Define the database schema with primary keys and indexes
    this.version(SCHEMA_VERSION).stores(DB_SCHEMA);
  }
}

/**
 * Exported database instance.
 */
export const db = new AppDatabase();
