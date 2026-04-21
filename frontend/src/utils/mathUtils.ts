/**
 * @file mathUtils.ts
 * @description Shared numeric formatting and math utilities.
 */

/**
 * Rounds a number to one decimal place and returns it as a number.
 * @param {number} val - The value to round.
 * @returns {number} The rounded number.
 */
export const roundToOne = (val: number): number => Math.round(val * 10) / 10;

/**
 * Formats a number to one decimal place and returns it as a string.
 * @param {number} val - The value to format.
 * @returns {string} The formatted string.
 */
export const formatToOne = (val: number): string => val.toFixed(1);

/**
 * Determines the game result (W, L, or D) based on team and opponent scores.
 * @param {number} teamScore - Points scored by the team.
 * @param {number} oppScore - Points scored by the opponent.
 * @returns {"W" | "L" | "D"} Result indicator.
 */
export const determineResult = (
  teamScore: number,
  oppScore: number,
): "W" | "L" | "D" => {
  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
};

/**
 * Formats a total number of seconds into a mm:ss clock string.
 * @param {number} totalSeconds - The total seconds.
 * @returns {string} The formatted clock string (e.g., "10:00").
 */
export const formatClock = (totalSeconds: number): string => {
  // ⚡ Bolt: Use bitwise OR for faster floor operation and template literals for efficiency.
  // WHY: Bitwise OR (| 0) is a high-performance alternative to Math.floor() for positive
  // integers in hot paths, as it effectively truncates decimal places in a single operation.
  const mins = (totalSeconds / 60) | 0;
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Formats an ISO timestamp string to a mm:ss time string.
 *
 * WHY: This utility provides a lightweight way to extract the time component
 * from a standard ISO 8601 string without the overhead of a full Date object
 * or library (like Day.js) in high-frequency rendering paths (e.g., event logs).
 *
 * CONSTRAINT: It relies on a strict ISO 8601 format (e.g. "YYYY-MM-DDTHH:mm:ss.sssZ").
 * It uses specific slice indices (14 to 19) to extract the "mm:ss" portion.
 * Any change to the backend timestamp format MUST be mirrored here.
 *
 * @param {string} timestamp - ISO timestamp (e.g. "2023-01-01T12:00:30.000Z").
 * @returns {string} The formatted time string (e.g. "00:30").
 */
export const formatTimestampToTime = (timestamp: string): string => {
  return timestamp.slice(14, 19);
};

/**
 * Returns a theme color name based on a plus-minus value.
 * @param {number} val - The plus-minus value.
 * @returns {string} The color key.
 */
export const getPlusMinusColor = (val: number): string => {
  if (val > 0) return "success.main";
  if (val < 0) return "error.main";
  return "inherit";
};

/**
 * Formats a plus-minus value with a leading '+' for positive numbers.
 * @param {number} val - The plus-minus value.
 * @returns {string | number} The formatted value.
 */
export const formatPlusMinus = (val: number): string | number => {
  return val > 0 ? `+${val}` : val;
};
