# Forge Insights & Architecture Journal

## Overtime Team Foul Penalty Carried-Over Rule (September 2026)
- **Period Matching & Overtime Carryover**: Updated `isEventInPeriod` in `frontend/src/utils/stats/helpers.ts` to properly aggregate team fouls during overtime under official NFHS/NCAA rules:
  - **QUARTERS mode**: Periods 1-3 only evaluate events matching `eventPeriod === currentPeriod`. For Period >= 4 (Q4 and all OT periods), `eventPeriod >= 4 && eventPeriod <= currentPeriod` carries Q4 fouls directly into OT1, OT2, etc., while excluding future OT period fouls.
  - **HALVES mode**: Period 1 evaluates `eventPeriod === 1`; Period 2 (2nd half) resets fouls (`eventPeriod === 2`); Period >= 3 (OT1, OT2, etc.) evaluates `eventPeriod >= 2 && eventPeriod <= currentPeriod`, carrying 2nd half fouls into OT1/OT2 while ignoring 1st half fouls.
- **Scoreboard Bonus Synchronization**: `useGameAggregator` relies on `isEventInPeriod` when aggregating team fouls, automatically reflecting carried-over team fouls and updating `BONUS` / `DBL BONUS` status indicators on the Scoreboard as soon as OT begins.

## Scoreboard Possession Arrow Persistent State Recovery (September 2026)
- **Possession Arrow Schema & State Recovery**: Updated `possessionArrow` type on `Game` schema in `db.ts` (`"OUR_TEAM" | "OPPONENT" | "NONE"`). `useGameMode` queries `db.games` via Dexie `useLiveQuery`, ensuring that the possession arrow state is recovered on page reload or re-mount and reactively updated across `useGameAggregator` and `Scoreboard`.
- **Scoreboard Interactive Arrows**: Extended `ScoreboardProps` with `onFlipPossessionArrow` and converted `Scoreboard` arrow indicators into accessible, focusable click targets (`role="button"`, `tabIndex`, ARIA labels, Enter/Space key support) that trigger manual arrow toggles directly on the scoreboard HUD.

## Overtime Transition Dialog & Period Length Configurator (September 2026)
- **Overtime Transition Triggering**: When regulation (period 4 for Quarters, period 2 for Halves) or any subsequent OT period ends in a tie game during period verification (`handleVerifyPeriod`), `useGameMode` opens the `OvertimeTransitionDialog`.
- **Custom Overtime Length**: Allows scorekeepers to confirm or adjust the Overtime duration (1-20 minutes, defaulting to `team.defaultOvertimeLength` or standard ruleset default of 5 minutes).
- **Persistence & Intermission**: Updating the OT duration persists the team's `defaultOvertimeLength` preference to IndexedDB, starts a 2-minute quarter break intermission countdown, and seamlessly increments the period counter in `useGameClock`.

## Undo History Toast with Re-Apply Option (September 2026)
- **Undone Stat Cache**: Added `undoneStatCache` state management to `useGameMode.ts` and `useGameModeActions.ts`. When `handleUndo` is invoked, the undone `StatEvent` is cached in memory prior to marking `deletedAt` in IndexedDB.
- **Re-Apply (Redo) Restoration**: Implemented `handleReapplyUndo` in `useGameModeActions.ts`. Clicking "RE-APPLY" on the Snackbar notification removes `deletedAt` from the stat in IndexedDB, pushes sync updates, clears `undoneStatCache`, and displays an "Action restored" notification.
- **Cache Invalidation**: Any new live action saved via `handleSaveStat` automatically clears `undoneStatCache` to prevent restoring outdated actions.
