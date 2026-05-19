/**
 * 🏀 CoachBoard: detectShotValueFromCoords
 * Why: Automatically detects if a shot is a 2 or 3 based on court coordinates.
 * Coordinates are 0-100 percentage of SVG viewBox "0 0 500 470".
 * @param x
 * @param y
 */
export const detectShotValueFromCoords = (x: number, y: number): number => {
  const svgX = x * 5; // 500 / 100
  const svgY = y * 4.7; // 470 / 100

  // Three Point Line logic from BasketballCourt.tsx:
  // - Sidebar lines: x=30 and x=470 from y=0 to y=140
  // - Arc: Center (250, 140) with radius 220 for y > 140

  if (svgY <= 140) {
    if (svgX <= 30 || svgX >= 470) return 3;
  } else {
    const dist = Math.sqrt(Math.pow(svgX - 250, 2) + Math.pow(svgY - 140, 2));
    if (dist >= 220) return 3;
  }

  return 2;
};
