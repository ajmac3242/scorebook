/**
 * @file player.ts
 * @description Interface representing a master player record.
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
