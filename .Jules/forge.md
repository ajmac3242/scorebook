# 🔨 Forge Journal

## Architectural Decisions

### Multi-Game Lineup Aggregation
- **Observation:** Original `calculateLineupStats` assumed all stats belonged to a single game, leading to incorrect "minutes" and "plus/minus" calculation if multi-game data was passed.
- **Solution:** Group events by `gameId` before calculating stints. This ensures clock deltas and score differentials are isolated to their respective game contexts.
- **Pattern:** Follow this "Group then Process" pattern for any future analytics that rely on temporal sequences (e.g., scoring runs, momentum shifts).

### SVG Heatmap Visualization
- **Approach:** Decoupled coordinate-to-zone logic (`shotZones.ts`) from the visual rendering (`BasketballCourt.tsx`).
- **Detail:** Used complex SVG `<path>` elements to represent non-rectangular zones (3PT wings, mid-range arcs). This provides a professional "TV-style" data visualization.
- **Constraint:** Zones must have a `pointer-events: none` style or be placed below interactive elements to not interfere with marker clicks or court recording.

### PDF Export with DOM Capture
- **Tooling:** Integrated `jspdf` and `html2canvas`.
- **Implementation:** Leveraged the `id="game-stats-container"` to capture the high-resolution box score and shot charts exactly as displayed to the coach.
- **Scaling:** Set `scale: 2` in `html2canvas` to ensure legibility on retina displays and when printed.

## Basketball Domain Insights

### TS% (True Shooting Percentage)
- **Calculation:** Implemented as `Points / (2 * (FGA + 0.44 * FTA))`.
- **Note:** Current implementation approximates FTA based on 1-point makes until explicit FTA tracking is more robust.
- **Value:** Provides a more complete picture of efficiency than raw FG%, rewarding players who get to the line and hit 3s.

## Backlog Status
- [x] PDF Export
- [x] Shot Zone Heatmaps
- [x] Team Lineup Efficiency
- [x] Live Defensive Momentum HUD
- [x] Live Lineup Impact (+/-)
- [x] Rotation Alerts (Foul/Fatigue)
