/**
 * @file syncSanitizer.ts
 * @description Data sanitization utilities and type interfaces for synchronization snapshots.
 */

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

/**
 * Strips forbidden prototype pollution keys from remote data objects or arrays.
 *
 * WHY: Remote JSON snapshots or API payloads could contain malicious keys
 * like '__proto__', 'constructor', or 'prototype'. Cleaning data prior to IndexedDB storage
 * prevents prototype pollution vulnerabilities in client-side state.
 *
 * @param {unknown} data - Data to sanitize.
 * @param {number} depth - Recursion depth limit.
 * @returns {unknown} Sanitized data.
 */
export function sanitizeRemoteData<T>(data: T, depth = 0): T {
  if (data === null || typeof data !== "object") return data;
  if (depth > 10) return (Array.isArray(data) ? [] : {}) as unknown as T;

  if (Array.isArray(data)) {
    return data.map((item) =>
      sanitizeRemoteData(item, depth + 1),
    ) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!FORBIDDEN_KEYS.has(key)) {
      sanitized[key] = sanitizeRemoteData(value, depth + 1);
    }
  }
  return sanitized as T;
}

/**
 * Interface representing the team roster snapshot structure from S3.
 */
export interface RosterSnapshot {
  team: Record<string, unknown>;
  players: Record<string, unknown>[];
}

/**
 * Interface representing the game stats snapshot structure from S3.
 */
export interface GameSnapshot {
  game: Record<string, unknown>;
  stats: Record<string, unknown>[];
}
