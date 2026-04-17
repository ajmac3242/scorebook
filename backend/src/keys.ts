/**
 * @file keys.ts
 * @description Centralized DynamoDB key patterns for the Basketball Stats API.
 */

export const Keys = {
  team: (id: string) => `TEAM#${id}`,
  player: (id: string) => `PLAYER#${id}`,
  game: (id: string) => `GAME#${id}`,
  metadata: (id: string) => `METADATA#${id}`,
  stat: (timestamp: string, id: string) => `STAT#${timestamp}#${id}`,
};
