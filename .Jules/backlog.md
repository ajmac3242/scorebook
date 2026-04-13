## Live Game Clock & Minutes Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Tracking minutes played is essential for managing rotations and calculating per-minute efficiency. A synchronized game clock ensures statistical events are timestamped accurately within the flow of the game.
**What:** Implement a configurable game clock (10/12/20 min periods) in `GameMode.tsx` with start/stop functionality. Automatically calculate and store "Minutes Played" for every player based on SUB_IN and SUB_OUT events linked to clock time.
**Acceptance Criteria:**
- [x] Clock can be started, paused, and reset.
- [x] Period length is configurable based on team settings.
- [x] SUB_IN/SUB_OUT events record the exact game clock time.
- [x] Box score displays "MIN" for each player with 100% accuracy.
- [x] Added clock reset functionality for game management.

## Advanced Analytics (+/- and eFG%)
**Priority:** HIGH
**Type:** Enhancement
**Why:** Raw points don't tell the whole story. Plus/Minus (+/-) measures a player's impact on the score while on the court, and Effective Field Goal Percentage (eFG%) accounts for the added value of 3-pointers.
**What:** Update the statistical aggregation logic in `stats.ts` to calculate `plusMinus` and `eFG%`. Display these metrics in the `GameStats` box score and `PlayerStats` profiles.
**Acceptance Criteria:**
- [x] Plus/Minus is calculated correctly based on team vs. opponent scoring during a player's active stints.
- [x] eFG% is calculated using the formula: (FGM + 0.5 * 3PM) / FGA.
- [x] Metrics are sortable in the box score table.

## Lineup Efficiency Tracker
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches need to know which combinations of 5 players are most effective. Tracking lineup-specific stats identifies the "death lineups" and the ones that are struggling.
**What:** Implement a utility to group statistical events by the specific 5-player lineup on the floor. Create a new "Lineups" tab in `TeamStats` or `GameStats` showing Net Rating, eFG%, and Turnover Rate for each combination.
**Acceptance Criteria:**
- [x] System identifies unique 5-man lineups used during a game.
- [x] Calculates Points For and Points Against for each lineup.
- [x] Visualizes lineup performance in a dedicated table.

## PDF/Digital Box Score Export
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches need to share results with players, parents, and local media. A professional, branded export format is a major "quality of life" improvement.
**What:** Add an "Export" button to the `GameStats` page. Generate a clean, high-resolution PDF or Image of the box score, including the shot chart and team totals.
**Acceptance Criteria:**
- [x] One-click generation of a box score PDF.
- [x] PDF includes Team names, final score, player table, and shot chart.
- [x] Layout is optimized for mobile sharing (A4 or social media aspect ratio).

## Shot Zone Heatmaps
**Priority:** MEDIUM
**Type:** UX
**Why:** A simple scatter plot of makes/misses can get cluttered. Heatmaps provide immediate visual feedback on where the team is most efficient and where they are settling for bad shots.
**What:** Enhance the `BasketballCourt` component to support a heatmap overlay. Use color density (red for high efficiency, blue for low) to visualize FG% across different zones of the court.
**Acceptance Criteria:**
- [x] Toggleable "Heatmap" mode on the `GameStats` and `PlayerStats` court views.
- [x] Zones are calculated dynamically based on the current filter (All, Player, or Team).
- [x] Uses a color gradient to represent scoring density or efficiency.
