/**
 * @file teamPlayer.ts
 * @description Junction table interface linking players to specific teams.
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
