/**
 * @file game.ts
 * @description Interface representing a single basketball game.
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
}
