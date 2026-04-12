/**
 * @file shotZones.ts
 * @description Defines basketball court zones for heatmap visualization.
 */

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
 * @param x - X coordinate (0-100)
 * @param y - Y coordinate (0-100)
 * @returns The identified ShotZone
 */
export const getShotZone = (x: number, y: number): ShotZone => {
  const svgX = x * 5; // Convert 0-100 to 0-500
  const svgY = y * 4.7; // Convert 0-100 to 0-470

  const rimX = 250;
  const rimY = 47;
  const distToRim = Math.sqrt(Math.pow(svgX - rimX, 2) + Math.pow(svgY - rimY, 2));

  // 1. Restricted Area (Approx radius 40)
  if (distToRim <= 45) return "RA";

  // 2. Paint (Rectangle 170-330, 0-190)
  if (svgX >= 170 && svgX <= 330 && svgY <= 190) return "PAINT";

  // 3PT Line Check
  let isThree = false;
  if (svgY <= 140) {
    if (svgX <= 30 || svgX >= 470) isThree = true;
  } else {
    const distToThreeCenter = Math.sqrt(Math.pow(svgX - 250, 2) + Math.pow(svgY - 140, 2));
    if (distToThreeCenter >= 220) isThree = true;
  }

  if (isThree) {
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
