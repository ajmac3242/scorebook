/**
 * @file stat.ts
 * @description Interface representing an individual statistical event during a game.
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
  situation?: string; // 'ATO', 'SLOB', 'BLOB', 'EOP'
  timestamp: string;
  deletedAt?: string;
  synced?: number;
}
