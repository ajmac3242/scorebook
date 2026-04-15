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
/**
 * Formats a total number of seconds into a mm:ss clock string.
 * ⚡ Bolt: Uses fast ternary padding instead of .padStart() for high-frequency updates.
 */
export const formatClock = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
