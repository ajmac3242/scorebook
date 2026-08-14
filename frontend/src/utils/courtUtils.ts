/**
 * 🏀 CoachBoard: detectShotValueFromCoords
 * Why: Automatically detects if a shot is a 2 or 3 based on court coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 */
/**
 * Determines if given SVG court coordinates fall on or outside the 3-point line.
 * Court dimensions are based on 500x470 SVG viewBox.
 */
export const isThreePointCoord = (svgX: number, svgY: number): boolean => {
  if (svgY <= 140) {
    return svgX <= 30 || svgX >= 470;
  }
  const dist = Math.sqrt(Math.pow(svgX - 250, 2) + Math.pow(svgY - 140, 2));
  return dist >= 220;
};

export const detectShotValueFromCoords = (x: number, y: number): number => {
  const svgX = x * 5; // 500 / 100
  const svgY = y * 4.7; // 470 / 100

  return isThreePointCoord(svgX, svgY) ? 3 : 2;
};
