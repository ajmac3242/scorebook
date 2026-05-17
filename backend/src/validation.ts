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
  // 🛡️ Sentinel: Enforce strict type and length before regex
  return typeof id === "string" && id.length === 36 && UUID_REGEX.test(id);
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
  // 🛡️ Sentinel: Enforce max length for any player ID format
  if (id.length > 50) return false;
  if (isValidUuid(id)) return true;
  if (SPECIAL_ID_SET.has(id)) return true;
  // ⚡ Bolt: Use O(1) string checks before more expensive operations.
  const strId = id as string;
  const prefix = `${SPECIAL_PLAYER_IDS.OPPONENT}:`;
  if (strId.startsWith(prefix)) {
    const jersey = strId.slice(prefix.length);
    return /^\d{1,2}$/.test(jersey);
  }
  return false;
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
  ]),
);

/**
 * Valid situational contexts for statistical events.
 */
export const VALID_SITUATIONS = Object.freeze(
  new Set(["ATO", "SLOB", "BLOB", "EOP"]),
);

/**
 * Valid shot clock phases.
 */
export const VALID_SHOT_CLOCK_PHASES = Object.freeze(
  new Set(["EARLY", "MID", "LATE"]),
);

/**
 * Valid defensive schemes.
 */
export const VALID_DEFENSIVE_SCHEMES = Object.freeze(
  new Set(["MAN", "ZONE", "PRESS", "DOUBLE"]),
);

/**
 * Valid opponent play types.
 */
export const VALID_OPPONENT_PLAY_TYPES = Object.freeze(
  new Set(["PnR", "ISO", "POST", "TRANSITION", "OFF_SCREEN"]),
);

/**
 * Valid defensive breakdown reasons.
 */
export const VALID_BREAKDOWN_REASONS = Object.freeze(
  new Set([
    "Missed Rotation",
    "Transition Leak",
    "Poor Closeout",
    "Out-Hustled",
    "Great Contest",
  ]),
);

/**
 * Validates a stat event body.
 * @param body - The stat event data to validate.
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
      b.period < 1)
  ) {
    return "Period must be an integer at least 1";
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
  if (
    b.situation !== undefined &&
    (typeof b.situation !== "string" || !VALID_SITUATIONS.has(b.situation))
  ) {
    return "Invalid situational context";
  }

  const lengthError = validateStringLengths(b, 128);
  if (lengthError) return lengthError;

  if (
    b.shotClockPhase !== undefined &&
    (typeof b.shotClockPhase !== "string" ||
      !VALID_SHOT_CLOCK_PHASES.has(b.shotClockPhase))
  ) {
    return "Invalid shot clock phase";
  }
  if (
    b.primaryDefenderId !== undefined &&
    !isValidPlayerId(b.primaryDefenderId)
  ) {
    return "Invalid primary defender ID";
  }
  if (
    b.defensiveScheme !== undefined &&
    (typeof b.defensiveScheme !== "string" ||
      !VALID_DEFENSIVE_SCHEMES.has(b.defensiveScheme))
  ) {
    return "Invalid defensive scheme";
  }
  if (
    b.opponentPlayType !== undefined &&
    (typeof b.opponentPlayType !== "string" ||
      !VALID_OPPONENT_PLAY_TYPES.has(b.opponentPlayType))
  ) {
    return "Invalid opponent play type";
  }
  if (
    b.breakdownReason !== undefined &&
    (typeof b.breakdownReason !== "string" ||
      !VALID_BREAKDOWN_REASONS.has(b.breakdownReason))
  ) {
    return "Invalid defensive breakdown reason";
  }
  return null;
}

/**
 * Validates that all string values in an object are under a specific length.
 * @param obj - The object to validate.
 * @param maxLength - Maximum allowed length.
 * @returns {string | null} Error message or null.
 */
function validateStringLengths(
  obj: Record<string, unknown>,
  maxLength: number,
): string | null {
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string" && val.length > maxLength) {
      return `Field ${key} exceeds maximum length of ${maxLength} characters`;
    }
  }
  return null;
}

/**
 * Validates player metadata for creation.
 * @param body - The player data to validate.
 * @returns {string | null} Error message or null if valid.
 */
export function validatePlayerMetadata(
  body: Record<string, unknown>,
): string | null {
  if (!body.name || typeof body.name !== "string" || body.name.length > 100) {
    return "Player name is required and must be under 100 characters";
  }
  // 🛡️ Sentinel: Prevent oversized string payloads in metadata
  return validateStringLengths(body, 128);
}

/**
 * Validates game metadata for creation.
 * @param body - The game data to validate.
 * @returns {string | null} Error message or null if valid.
 */
export function validateGameMetadata(
  body: Record<string, unknown>,
): string | null {
  if (!isValidUuid(body.teamId)) {
    return "Valid teamId (UUID) is required";
  }
  if (
    !body.opponent ||
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
  // 🛡️ Sentinel: Prevent oversized string payloads in metadata
  return validateStringLengths(body, 128);
}
