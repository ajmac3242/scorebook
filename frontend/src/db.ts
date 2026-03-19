import Dexie, { type Table } from "dexie";

export interface Season {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  synced?: number; // 0 or 1
}

export interface Team {
  id?: number;
  seasonId: number | string;
  name: string;
  synced?: number;
}

export interface Player {
  id?: number;
  name: string;
  avatarColor?: string;
  synced?: number;
}

export interface TeamPlayer {
  id?: number;
  teamId: number | string;
  playerId: number | string;
  jerseyNumber?: string;
  synced?: number;
}

export interface Game {
  id?: number;
  teamId: number | string;
  opponent: string;
  date: string;
  location: string;
  synced?: number;
}

export interface StatEvent {
  id?: number;
  gameId: number | string;
  playerId: number | string;
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
    this.version(4).stores({
      seasons: "++id, synced",
      teams: "++id, seasonId, synced",
      players: "++id, synced",
      teamPlayers: "++id, [teamId+playerId], teamId, playerId, synced",
      games: "++id, teamId, synced",
      stats: "++id, gameId, playerId, synced",
    });
  }
}

export const db = new AppDatabase();
