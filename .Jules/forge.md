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

## On-Court Player Roster Protection during Live Play (September 2026)
- **Roster Removal Guard for Active Players**: Updated `QuickEditRosterDialog.tsx` to accept `onCourtIds?: Set<string>` and enforce on-court roster protection. When a scorekeeper attempts to remove/delete a player row, `handleRemovePlayerRow` checks if `onCourtIds?.has(playerId)`. If on-court, deletion is blocked and an actionable inline error message is rendered ("Cannot delete/deactivate an active on-court player. Perform a substitution first.").
- **Database Cleanup for Bench Player Removal**: Non-on-court bench players can be removed from the draft roster during live play. On save (`handleSave`), corresponding records in `db.teamPlayers` are deleted via `db.teamPlayers.delete(tpRecordId)`, maintaining database cleanliness without breaking active on-court lineups or play-by-play logs.

## Technical Foul Penalty Type Differentiation (Class A vs. Class B) (September 2026)
- **Class A (Conduct) vs. Class B (Administrative) Separation**: Added `TECHNICAL_FOUL_CLASS_A` and `TECHNICAL_FOUL_CLASS_B` to `ACTION_TYPES` and `WHISTLE_ACTION_TYPES` in frontend and `VALID_ACTION_TYPES` in backend validation.
- **Personal vs. Team Foul Aggregation**:
  - `Class A Technical Fouls` (conduct) increment both player personal fouls (counting toward 5-foul disqualification) and team period fouls.
  - `Class B Technical Fouls` (administrative) increment team period fouls (counting toward team bonus calculations) but bypass individual player personal foul increments and disqualification/foul-out checks.
- **UI & Free-Throw Penalty Workflow**: Updated `StatEntryDialog.tsx` with a toggle group for Class A vs. Class B technical foul selection, and updated `useGameModeActions.ts` to award 2 free-throw attempts for all technical fouls while skipping individual player foul-out enforcement for Class B. `RecentActionItem` and `RecentActionsPanel` display user-friendly labels ("Class A Tech", "Class B Tech").
