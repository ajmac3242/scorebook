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

## Clock Auto-Pause on Whistle Action Recording (September 2026)
- **Whistle Action Pause Trigger**: Included `ACTION_TYPES.HELD_BALL` in `WHISTLE_ACTION_TYPES` in `frontend/src/constants/stats.ts`. When a foul, technical foul, timeout, or held ball is recorded via `handleSaveStat`, `handleTimeout`, or `handleDirectFoulOverride` (with `delta > 0`), `setIsClockRunning(false)` is automatically called.
- **Clock Pause Persistence Guard**: Updated `useGameClock.ts` to persist `clockSecondsRef.current` and `currentPeriod` to `db.games` in IndexedDB whenever `isClockRunning` transitions from `true` to `false` using `wasRunningRef` to ensure paused clock time is stored offline without improperly flagging clean games on page load.

## Jump Ball Alternating Possession Period-Start Automation (September 2026)
- **Automated Throw-in Possession**: Updated `useGameClock.ts` (`handleNextPeriod`) so that when transitioning to period > 1, the jump ball dialog is bypassed, and inbounds possession is automatically recorded for the team holding the current `possessionArrow`.
- **Delayed Possession Arrow Flipping**: Preserved the possession arrow pointing towards the throw-in team during intermission and inbounds throw-in using `pendingArrowFlipRef`. The arrow is flipped in IndexedDB (`db.games`) upon the first gameplay clock tick or subsequent live play event in the new period.
- **Alert Toast Notification**: Formatted and displayed an informative alert notification upon period transition ("Period started: [Team Name] Possession via Alternating Arrow.").

## Foul Trouble Real-Time Alerts HUD Banner (September 2026)
- **Real-Time Warning Detection**: Added real-time foul trouble tracking in `useGameMode.ts` that monitors player foul counts against `foulLimit = game?.foulLimit || team?.defaultFoulLimit || 5`. When an on-court player's personal fouls increase to `foulLimit - 1` (e.g. 4 fouls in a 5-foul limit game), `setFoulTroubleAlert` triggers the HUD alert state with player details (`playerId`, `jerseyNumber`, `playerName`, `foulCount`).
- **HUD Banner & Auto-Dismiss Timeout**: Rendered `<FoulTroubleAlertBanner />` on the main `GameMode.tsx` HUD header. Features a high-contrast warning style, bold player information (`#23 John Doe - Foul Trouble (4 Fouls)`), explicit close/dismiss button, and a 5-second auto-dismiss `setTimeout` cleanup effect in `useGameMode.ts`.

## Roster Player Game-Day Active Toggle (September 2026)
- **Game-Day Active Roster Schema & Setup**: Added `activePlayerIds?: string[]` to the `Game` interface in `frontend/src/db.ts`. Updated `AddGameDialog.tsx` and `useTeamActions.ts` to present a "Game-Day Roster" checkbox/toggle list next to team players on the pre-game setup screen, defaulting all team players to active while enforcing a minimum of 5 active players required to create a game.
- **In-Game Active Roster Editing**: Updated `QuickEditRosterDialog.tsx` to support active player toggling/editing during live play while maintaining the active on-court player protection guard (preventing deactivation/deletion of on-court players). On save, active player IDs are updated in `db.games`.
- **Live Interface Exclusion & Roster History Preservation**: Updated `useGameMode.ts` to derive active players (`players` / `teamPlayers`) based on `game?.activePlayerIds`. Live tracking panels (`StatEntryDialog`, `QuickSubDialog`, `StartingLineupDialog`, `LiveLineupCard`) receive only active players, eliminating interface clutter during live transitions while retaining all-player references (`allPlayers` / `allTeamPlayers`) for historical action logs and statistical aggregations.
