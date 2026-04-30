# Assistant Coach Journal 🏀

## Basketball Workflow Insights
- **The "Game Identity" Crisis**: Coaches often feel the game "slipping away" but can't quantify it. By visualizing Four Factors (eFG%, TO%, ORB%, FT Rate) and Pace as a Radar Chart against season blueprints, we provide an immediate "Identity Alert" when the team deviates >20% from their established style of play.
- **Defensive Synergy is Non-Linear**: A 5-player lineup's performance isn't just the sum of its parts. Calculating Net Ratings for 2 and 3-player units (Synergy) reveals "underrated" defensive pairings that might have low individual scoring but elite Stop % when shared on the floor.
- **Prescriptive Analytics**: Post-game stats are often "descriptive" (what happened). By mapping statistical failures (e.g., < 20% ORB) directly to specific drills (e.g., "The Gauntlet"), we turn data into a tangible Practice Plan.

## Implementation Patterns
- **Flush-on-Transition Pattern**: When calculating unit stats (Synergy) from a stream of events, standard interval tracking fails at period boundaries or substitutions. Implementing a `flushPending` helper that closes the current "open stint" before processing the next state ensures precision in Defensive Rating (DRtg) and Net Rating.
- **Hook Ordering Dependency**: In React, `useMemo` blocks that depend on each other (e.g., `identityAlerts` depending on `liveFourFactors`) must be declared in strict order. Mixing these up leads to `ReferenceError` even with `useMemo` due to the way Vite/React transpiles the component body.
- **JSX Entity Safety**: Always escape or use entities for `>` and `<` in component text (e.g., `&gt;`) to avoid JSX parser confusion, especially in complex ternary logic within the render body.

## Edge Cases to Watch
- **Period Transitions**: Stints that start in P1 and end in P2 must be split to correctly attribute points and minutes to the active period.
- **Zero-Possession Units**: Small sample sizes (e.g., 20 seconds of play) can produce extreme DRtg (0 or Infinity). The Synergy UI now filters for units with >10 minutes of shared time by default to maintain coach trust.
- **Radar Scaling**: Pace (70-100) and eFG% (40-60) have different scales. The Radar Chart must normalize these to a 0-100% "Identity Match" scale to be visually useful.

## Final Review & Refinements
- **Efficiency Matrix Integration**: Verified that the `EfficiencyMatrix` component is properly imported and utilized in `GameMode.tsx`. This provides O(1) visibility into lineup performance.
- **Radar Chart Normalization**: Refactored `IdentityRadarChart.tsx` to remove redundant math and use raw Pace values, as Recharts handles the scaling.
- **Dependency Integrity**: Confirmed `recharts` is present in `package.json` to prevent build failures.
- **Import Verification**: Re-verified MUI and constant imports (`Alert`, `ANALYTICAL_BASELINES`) to ensure runtime stability.
