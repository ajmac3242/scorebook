/**
 * @file validation.ts
 * @description Validation utilities for the Basketball Stats API.
 */

/**
 * Standardized IDs for special players.
 */
export const SPECIAL_PLAYER_IDS = Object.freeze({
  OPPONENT: "OPPONENT",
  TEAM_TIMEOUT: "TEAM_TIMEOUT",
  OUR_TEAM: "OUR_TEAM",
});

const SPECIAL_ID_SET: Set<string> = Object.freeze(
  new Set(Object.values(SPECIAL_PLAYER_IDS)),
);

/**
 * Regex for validating UUID v4 format.
 * Prevents path traversal and other injection attacks via IDs.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4.
 * @param {unknown} id - The ID to validate.
 * @returns {boolean} True if it's a valid UUID string.
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

/**
 * Determines if a player ID belongs to an opponent.
 * @param {string} playerId - The player ID.
 * @returns {boolean} True if the ID is for an opponent.
 */
export const isOpponentId = (playerId: string): boolean =>
  playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
  playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

/**
 * Validates if a string is a valid jersey number (1-2 digits).
 * @param {unknown} jersey - The jersey number to validate.
 * @returns {boolean} True if it's a valid jersey number string.
 */
export function isValidJerseyNumber(jersey: unknown): jersey is string {
  return typeof jersey === "string" && /^\d{1,2}$/.test(jersey);
}

/**
 * Validates if a string is a valid player ID.
 *
 * ARCHITECTURE:
 * To support "on-the-fly" tracking of opponents without pre-creating entities,
 * the system accepts three types of player IDs:
 * 1. UUID v4: Standard for registered team players.
 * 2. SPECIAL CONSTANTS: (e.g., 'OPPONENT', 'OUR_TEAM') for general tracking.
 * 3. JERSEY PREFIX: 'OPPONENT:{jersey}' (e.g., 'OPPONENT:12') for tracking
 *    specific opponent players by their jersey number.
 *
 * @param {unknown} id - The ID to validate.
 * @returns {boolean} True if it's a valid player ID.
 */
export function isValidPlayerId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  if (isValidUuid(id)) return true;
  if (SPECIAL_ID_SET.has(id)) return true;
  // ⚡ Bolt: Use O(1) string checks before more expensive operations.
  const strId = id as string;
  const prefix = SPECIAL_PLAYER_IDS.OPPONENT + ":";
  if (strId.startsWith(prefix)) {
    // 🛡️ SECURITY GUARD: Strict length check for jersey-prefixed IDs.
    // WHY: Valid jersey-prefixed IDs (e.g., 'OPPONENT:5' or 'OPPONENT:12')
    // must be between 10 and 11 characters. This prevents malformed input
    // and potential injection attempts via the jersey suffix.
    if (strId.length > 11 || strId.length < 10) return false;
    const jersey = strId.slice(prefix.length);
    return isValidJerseyNumber(jersey);
  }
  return false;
}

/**
 * Validates a game metadata object.
 * @param {Record<string, unknown>} body - The game data to validate.
 * @returns {string | null} Error message or null if valid.
 */
export function validateGame(body: Record<string, unknown>): string | null {
  if (!isValidUuid(body?.teamId)) {
    return "Valid teamId (UUID) is required";
  }
  if (
    !body?.opponent ||
    typeof body.opponent !== "string" ||
    body.opponent.length > 100
  ) {
    return "Opponent name is required and must be under 100 characters";
  }
  if (
    body.location !== undefined &&
    (typeof body.location !== "string" || body.location.length > 100)
  ) {
    return "Location must be a string under 100 characters";
  }
  if (
    body.date !== undefined &&
    (typeof body.date !== "string" || body.date.length > 50)
  ) {
    return "Date must be a string under 50 characters";
  }
  return null;
}

/**
 * Valid basketball action types for stat event validation.
 */
export const VALID_ACTION_TYPES = Object.freeze(
  new Set([
    "MAKE",
    "MISS",
    "REBOUND",
    "OFF_REBOUND",
    "DEF_REBOUND",
    "ASSIST",
    "STEAL",
    "TURNOVER",
    "BLOCK",
    "FOUL",
    "FOUL_SHOOTING",
    "FOUL_NON_SHOOTING",
    "TIMEOUT",
    "SUB_IN",
    "SUB_OUT",
    "POSSESSION",
    "TECHNICAL_FOUL",
    "MATCHUP",
  ]),
);

/**
 * Validates a stat event body.
 * @param {unknown} body - The stat event data to validate.
 * @returns {string | null} Error message or null if valid.
 */
export function validateStatEvent(body: unknown): string | null {
  if (body === null || typeof body !== "object") {
    return "Invalid request body";
  }

  const b = body as Record<string, unknown>;

  if (
    !b.type ||
    typeof b.type !== "string" ||
    !VALID_ACTION_TYPES.has(b.type)
  ) {
    return "Valid stat type is required";
  }
  if (
    b.points !== undefined &&
    (typeof b.points !== "number" ||
      !Number.isSafeInteger(b.points) ||
      b.points < 0 ||
      b.points > 3)
  ) {
    return "Points must be an integer between 0 and 3";
  }
  if (!isValidPlayerId(b.playerId)) {
    return "Valid playerId is required";
  }
  if (
    b.period !== undefined &&
    (typeof b.period !== "number" ||
      !Number.isSafeInteger(b.period) ||
      b.period < 1 ||
      b.period > 20)
  ) {
    return "Period must be an integer between 1 and 20";
  }
  if (
    b.clockTime !== undefined &&
    (typeof b.clockTime !== "number" ||
      !Number.isFinite(b.clockTime) ||
      b.clockTime < 0)
  ) {
    return "Clock time must be a finite number at least 0";
  }
  if (
    b.isBookmarked !== undefined &&
    (typeof b.isBookmarked !== "number" || ![0, 1].includes(b.isBookmarked))
  ) {
    return "isBookmarked must be 0 or 1";
  }
  if (
    b.defensiveScheme !== undefined &&
    (typeof b.defensiveScheme !== "string" ||
      !["MAN", "ZONE", "PRESS"].includes(b.defensiveScheme))
  ) {
    return "Invalid defensive scheme";
  }
  if (
    b.locationX !== undefined &&
    (typeof b.locationX !== "number" ||
      !Number.isFinite(b.locationX) ||
      b.locationX < 0 ||
      b.locationX > 100)
  ) {
    return "Location coordinates must be finite numbers between 0 and 100";
  }
  if (
    b.locationY !== undefined &&
    (typeof b.locationY !== "number" ||
      !Number.isFinite(b.locationY) ||
      b.locationY < 0 ||
      b.locationY > 100)
  ) {
    return "Location coordinates must be finite numbers between 0 and 100";
  }

  // 🛡️ Enhancements: Validate relationship IDs, metadata and point consistency
  if (b.relatedPlayerId !== undefined && !isValidPlayerId(b.relatedPlayerId))
    return "Invalid relatedPlayerId";
  if (b.subInPlayerId !== undefined && !isValidPlayerId(b.subInPlayerId))
    return "Invalid subInPlayerId";
  if (b.subOutPlayerId !== undefined && !isValidPlayerId(b.subOutPlayerId))
    return "Invalid subOutPlayerId";

  if (
    b.shotType !== undefined &&
    (typeof b.shotType !== "string" || !["CATCH", "DRIB"].includes(b.shotType))
  )
    return "Invalid shot type";
  if (
    b.shotQuality !== undefined &&
    (typeof b.shotQuality !== "string" ||
      !["OPEN", "CONTESTED"].includes(b.shotQuality))
  )
    return "Invalid shot quality";
  if (
    b.playName !== undefined &&
    (typeof b.playName !== "string" || b.playName.length > 50)
  )
    return "Play name too long";

  if (
    b.points !== undefined &&
    b.points > 0 &&
    !["MAKE", "FOUL_SHOOTING"].includes(b.type as string)
  )
    return "Points only for MAKE or FOUL_SHOOTING";

  return null;
}
