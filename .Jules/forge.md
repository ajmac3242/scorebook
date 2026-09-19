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
