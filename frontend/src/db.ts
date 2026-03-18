import Dexie, { type Table } from "dexie";

export interface Season {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  synced?: number; // 0 or 1
}

export interface Team {
  id?: string;
  seasonId: string;
  name: string;
  synced?: number;
}

export interface Player {
  id?: string;
  name: string;
  defaultNumber: string;
  synced?: number;
}

export interface TeamPlayer {
  id?: string;
  teamId: string;
  playerId: string;
  jerseyNumber?: string;
  synced?: number;
}

export interface Game {
  id?: string;
  teamId: string;
  opponent: string;
  date: string;
  location: string;
  synced?: number;
}

export interface StatEvent {
  id?: string;
  gameId: string;
  playerId: string;
  type: string;
  points?: number;
  locationX?: number;
  locationY?: number;
  timestamp: string;
  synced?: number;
}

export class AppDatabase extends Dexie {
  seasons!: Table<Season>;
  teams!: Table<Team>;
  players!: Table<Player>;
  teamPlayers!: Table<TeamPlayer>;
  games!: Table<Game>;
  stats!: Table<StatEvent>;

  constructor() {
    super("BasketballStatsDB");
    this.version(2).stores({
      seasons: "++id, synced",
      teams: "++id, seasonId, synced",
      players: "++id, synced",
      teamPlayers: "++id, teamId, playerId, synced",
      games: "++id, teamId, synced",
      stats: "++id, gameId, playerId, synced",
    });
  }
}

export const db = new AppDatabase();
