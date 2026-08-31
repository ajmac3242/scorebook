# Forge Insights & Architecture Journal

## Scoreboard Possession Arrow Persistent State Recovery (September 2026)
- **Possession Arrow Schema & State Recovery**: Updated `possessionArrow` type on `Game` schema in `db.ts` (`"OUR_TEAM" | "OPPONENT" | "NONE"`). `useGameMode` queries `db.games` via Dexie `useLiveQuery`, ensuring that the possession arrow state is recovered on page reload or re-mount and reactively updated across `useGameAggregator` and `Scoreboard`.
- **Scoreboard Interactive Arrows**: Extended `ScoreboardProps` with `onFlipPossessionArrow` and converted `Scoreboard` arrow indicators into accessible, focusable click targets (`role="button"`, `tabIndex`, ARIA labels, Enter/Space key support) that trigger manual arrow toggles directly on the scoreboard HUD.

## Overtime Transition Dialog & Period Length Configurator (September 2026)
- **Overtime Transition Triggering**: When regulation (period 4 for Quarters, period 2 for Halves) or any subsequent OT period ends in a tie game during period verification (`handleVerifyPeriod`), `useGameMode` opens the `OvertimeTransitionDialog`.
- **Custom Overtime Length**: Allows scorekeepers to confirm or adjust the Overtime duration (1-20 minutes, defaulting to `team.defaultOvertimeLength` or standard ruleset default of 5 minutes).
- **Persistence & Intermission**: Updating the OT duration persists the team's `defaultOvertimeLength` preference to IndexedDB, starts a 2-minute quarter break intermission countdown, and seamlessly increments the period counter in `useGameClock`.
