/**
 * @file mathUtils.ts
 * @description Shared numeric formatting and math utilities.
 */

/**
 * Rounds a number to one decimal place and returns it as a number.
 * @param {number} val - The value to round.
 * @returns {number} The rounded number.
 */
export const roundToOne = (val: number): number => Number(val.toFixed(1));

/**
 * Formats a number to one decimal place and returns it as a string.
 * @param {number} val - The value to format.
 * @returns {string} The formatted string.
 */
export const formatToOne = (val: number): string => val.toFixed(1);
