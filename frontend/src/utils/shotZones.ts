/**
 * @file shotZones.ts
 * @description Defines basketball court zones for heatmap visualization.
 */

import { isThreePointCoord } from "./courtUtils";

export type ShotZone =
  | "RA"
  | "PAINT"
  | "MID_LEFT"
  | "MID_CENTER"
  | "MID_RIGHT"
  | "3PT_LEFT_CORNER"
  | "3PT_RIGHT_CORNER"
  | "3PT_LEFT"
  | "3PT_CENTER"
  | "3PT_RIGHT";

/**
 * Maps court coordinates (0-100) to a specific shot zone.
 *
 * WHY: The application uses a relative coordinate system (0-100) for internal
 * storage to remain independent of specific UI layouts. This function maps those
 * relative coordinates to the specific SVG dimensions of the NCAA-regulation
 * court visualization (500px width by 470px height).
 *
 * SCALING:
 * - svgX (5x): Maps 0-100 width to the 500px SVG viewport.
 * - svgY (4.7x): Maps 0-100 height to the 470px SVG viewport.
 *
 * @param x - X coordinate (0-100)
 * @param y - Y coordinate (0-100)
 * @returns The identified ShotZone
 */
export const getShotZone = (x: number, y: number): ShotZone => {
  const svgX = x * 5;
  const svgY = y * 4.7;

  const rimX = 250;
  const rimY = 47;
  const distToRim = Math.sqrt(
    Math.pow(svgX - rimX, 2) + Math.pow(svgY - rimY, 2),
  );

  // 1. Restricted Area (Approx radius 40)
  if (distToRim <= 45) return "RA";

  // 2. Paint (Rectangle 170-330, 0-190)
  if (svgX >= 170 && svgX <= 330 && svgY <= 190) return "PAINT";

  // 3PT Line Check
  if (isThreePointCoord(svgX, svgY)) {
    if (svgY <= 140) {
      return svgX < 250 ? "3PT_LEFT_CORNER" : "3PT_RIGHT_CORNER";
    }
    // Wings and Center
    const angle = Math.atan2(svgY - 140, svgX - 250) * (180 / Math.PI);
    if (angle < 45) return "3PT_RIGHT";
    if (angle > 135) return "3PT_LEFT";
    return "3PT_CENTER";
  }

  // Mid-range
  if (svgY <= 140) {
    return svgX < 170 ? "MID_LEFT" : "MID_RIGHT";
  }
  if (svgX < 170) return "MID_LEFT";
  if (svgX > 330) return "MID_RIGHT";
  return "MID_CENTER";
};

/**
 * Returns a color based on field goal percentage.
 * @param fgPct - Field goal percentage (0-100)
 * @returns Hex color string
 */
export const getHeatmapColor = (fgPct: number): string => {
  if (fgPct >= 50) return "#4caf50"; // Green
  if (fgPct >= 40) return "#8bc34a"; // Light Green
  if (fgPct >= 30) return "#ffeb3b"; // Yellow
  if (fgPct >= 20) return "#ff9800"; // Orange
  return "#f44336"; // Red
};

/**
 * 🏀 Forge: Expected Points (xPTS) Table
 * Based on historical NCAA/NBA averages for shot quality.
 * OPEN: Uncontested shot.
 * CONTESTED: Defended shot.
 */
export const XPTS_TABLE: Record<ShotZone, { OPEN: number; CONTESTED: number }> =
  {
    RA: { OPEN: 1.65, CONTESTED: 1.25 },
    PAINT: { OPEN: 1.2, CONTESTED: 0.85 },
    MID_LEFT: { OPEN: 0.95, CONTESTED: 0.7 },
    MID_CENTER: { OPEN: 1.05, CONTESTED: 0.75 },
    MID_RIGHT: { OPEN: 0.95, CONTESTED: 0.7 },
    "3PT_LEFT_CORNER": { OPEN: 1.15, CONTESTED: 0.8 },
    "3PT_RIGHT_CORNER": { OPEN: 1.15, CONTESTED: 0.8 },
    "3PT_LEFT": { OPEN: 1.05, CONTESTED: 0.75 },
    "3PT_CENTER": { OPEN: 1.08, CONTESTED: 0.78 },
    "3PT_RIGHT": { OPEN: 1.05, CONTESTED: 0.75 },
  };
