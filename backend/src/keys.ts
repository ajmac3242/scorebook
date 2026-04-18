/**
 * @file keys.ts
 * @description Centralized DynamoDB key patterns for the Basketball Stats API.
 */

/**
 * 🔐 Keys: Centralized Key Management
 *
 * WHY: This object centralizes the construction of DynamoDB Partition Keys (PK)
 * and Sort Keys (SK). This approach provides several critical benefits:
 * 1. CONSISTENCY: Ensures that the same key patterns are used across all Lambda
 *    functions, preventing data silos or "lost" records due to minor string mismatches.
 * 2. REFACTORABILITY: Allows changing the underlying data model (e.g., prefixing
 *    IDs or changing delimiter characters) in one place instead of searching
 *    the entire codebase for magic strings.
 * 3. ABSTRACTION: Decouples the business logic (e.g., "get a team") from the
 *    infrastructure implementation (e.g., "query PK=TEAM#{id}").
 */
export const Keys = {
  team: (id: string) => `TEAM#${id}`,
  player: (id: string) => `PLAYER#${id}`,
  game: (id: string) => `GAME#${id}`,
  metadata: (id: string) => `METADATA#${id}`,
  stat: (timestamp: string, id: string) => `STAT#${timestamp}#${id}`,
};
