# Forge Strategic Journal & Architecture Log

## September 2026 - Core Game Loop Interlocks & Lead Differential HUD

### Architectural Decisions & Domain Patterns
1. **Synchronous Bonus Calculation Interlock (`useGameAggregator.ts`)**:
   - Ensured that `useGameAggregator.ts` evaluates team foul accumulations and bonus thresholds (`BONUS` / `DBL BONUS`) synchronously within a single deterministic pass over `sortedGameStats`.
   - Guaranteed that any personal foul mutation immediately recalculates team foul totals and updates the Scoreboard bonus badges without UI rendering latency.

2. **Live Lead Differential HUD Badge (`Scoreboard.tsx`)**:
   - Added a prominent live score differential badge near the period counter displaying `+X` for home leads, `-X` for opponent leads, and `TIED` for equal scores.
   - Styled using semantic design tokens (`tokens.semantic.color.feedback.success.main`, `error.main`, and `action.disabledBackground`) for pre-attentive tactical clarity.

3. **Active Lineup Period Continuity & 5-Player Clock Start Guard (`useGameMode.ts`, `ActionControls.tsx`)**:
   - Updated `handleVerifyPeriod` and `handleNextPeriod` in `useGameMode.ts` to automatically preserve and persist active `onCourtIds` to `db.games` during period transitions.
   - Hardened `handleToggleClock` in `useGameMode.ts` to block clock start and trigger a high-visibility warning snackbar ("Illegal Lineup: Exactly 5 on-court players required to start clock.") whenever `gameData.onCourtIds.size !== 5`.

### Test Verification
- All 69 targeted unit tests across `useGameAggregator.test.ts`, `Scoreboard.test.tsx`, `useGameMode.test.ts`, and `ActionControls.test.tsx` pass cleanly with 0 ESLint warnings or errors.

## September 2026 - Scoreboard Atomic Rollback, Jump Ball Possession Interlock & Disqualified FT Shooter Guard

### Architectural Decisions & Domain Patterns
1. **Atomic Score Snapshot Rollback (`useGameModeActions.ts`)**:
   - Wrapped stat soft deletion / restoration and `db.games` score recalculation (`teamScore`, `oppScore`) within a single read-write IndexedDB transaction in `handleUndo` and `handleReapplyUndo`.
   - Prevents transient score desynchronization or stale score snapshots on page refresh following undo or reapply actions.

2. **Opening Tip Jump Ball Possession Arrow Interlock (`useGameModeActions.ts`)**:
   - Wrapped `POSSESSION` stat creation and `db.games` `possessionArrow` update within an atomic read-write transaction in `handleJumpBall`.
   - Guaranteed that setting the initial possession arrow to the non-gaining (losing) team on tip-off is persisted atomically alongside the possession event.

3. **Free Throw Disqualified Shooter Substitution Guard (`FreeThrowWorkflowDialog.tsx`, `GameMode.tsx`)**:
   - Enhanced `FreeThrowWorkflowDialog.tsx` to evaluate shooter foul totals against `foulLimit` using `statsMap`.
   - When the assigned shooter is disqualified (`fouls >= foulLimit`), displays a prominent warning banner, disables saving the sequence, and prompts for selection of an eligible substitute shooter from `onCourtPlayers` (filtering out disqualified players).

### Test Verification
- Targeted unit tests pass with 100% success rate across `useGameModeActions.test.ts`, `JumpBallDialog.test.tsx`, and `FreeThrowWorkflowDialog.test.tsx`.

## September 2026 - Clock Sub-Minute Tenths Transition, Period-Start Jersey Validation & Opponent Score Rollback Interlock

### Architectural Decisions & Domain Patterns
1. **Sub-Minute Scoreboard Tenths Formatting (`Scoreboard.tsx`)**:
   - Standardized `Scoreboard.tsx` clock display logic to format time with `formatClockWithTenths(clockSeconds)` whenever `clockSeconds < 60` across any period.
   - Guaranteed smooth sub-second transitions and uniform aria-label accessibility descriptions.

2. **Period-Start Missing Jersey Validation Interlock (`useGameMode.ts`, `ActionControls.tsx`)**:
   - Derived `hasMissingJerseyOnCourt` in `useGameMode.ts` by verifying that every active on-court team player in `gameData.onCourtIds` possesses a non-empty `jerseyNumber` in `jerseyMap`.
   - Updated `handleToggleClock` to block clock start and render a descriptive error snackbar when any on-court player is missing a jersey number.
   - Passed `isMissingJersey={hasMissingJerseyOnCourt}` to `ActionControls` to disable clock start/adjustment buttons and display informative tooltips.

3. **Opponent Score Snapshot Atomic Rollback Interlock (`useGameModeActions.ts`, `useStatWriter.ts`)**:
   - Interlocked stat creation, editing, soft deletion, and undo/reapply handlers in `useGameModeActions.ts` and `useStatWriter.ts` within atomic Dexie transactions (`db.transaction("rw", [db.stats, db.games], ...)`).
   - Recalculated total game scores using `calculateGameResult` on every stat mutation, ensuring `db.games` `oppScore` and `teamScore` snapshots stay perfectly synchronized with play-by-play stat logs.

### Test Verification
- All 104 targeted unit tests pass with 100% success rate across `Scoreboard.test.tsx`, `ActionControls.test.tsx`, `useGameMode.test.ts`, and `useGameModeActions.test.ts`.
