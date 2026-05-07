/**
 * @file opponent.ts
 * @description Interface representing a persistent opponent team for scouting.
 */

export interface Opponent {
  id: string;
  name: string;
  logoUrl?: string;
  roster: string[]; // List of jersey numbers identified for this opponent
  synced?: number;
}
