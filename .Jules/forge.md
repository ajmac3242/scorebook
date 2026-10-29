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

## September 2026 - Period Lineup Persistence, Zero-Tick Timestamp Clamping & OT Jump Ball Interlock

### Architectural Decisions & Domain Patterns
1. **Period Verification Lineup State Persist Interlock (`useGameMode.ts`)**:
   - Wrapped `verifiedPeriods` and active `onCourtIds` IndexedDB persistence inside a `try/catch` block in `handleVerifyPeriod`.
   - Guaranteed that if lineup or period state persistence fails, period counter advancement and intermission triggers are halted, preventing orphaned lineup state.

2. **Period Clock Zero-Tick Score Event Timestamp Clamp Guard (`useStatWriter.ts`, `useGameModeActions.ts`)**:
   - Enforced non-negative clock time clamping (`Math.max(0, clockSeconds)`) across all stat creation, edit, and score/foul override flows.
   - Fixed period hardcoding on `handleJumpBall` (`period` vs `1`) so jump ball events accurately bind to the active period (including OT periods).

3. **Overtime Period Opening Jump Ball Possession Reset Interlock (`useGameMode.ts`, `useGameModeActions.ts`)**:
   - Automatically opens the `JumpBallDialog` (`setIsJumpBallOpen(true)`) upon confirming transition into an overtime period.
   - Assigns the initial OT alternating possession arrow to the tip-off loser and persists atomically to `db.games` in IndexedDB.

### Test Verification
- Targeted unit tests pass with 100% success rate across `useStatWriter.test.ts`, `useGameMode.test.ts`, and `useGameModeActions.test.ts`.

## September 2026 - Bench Foul Attribution Guard, Whistle Clock Persistence & Period Transition 5-Player Interlock

### Architectural Decisions & Domain Patterns
1. **Bench Player Foul Attribution Safety Guard (`StatEntryDialog.tsx`)**:
   - Ensured that selecting a bench player for personal foul attribution triggers the `bench-player-warning` banner and requires explicit confirmation (`confirmBenchAction`) or substitution on-court (`onSubBenchPlayerOnCourt`) before enabling the save button.

2. **Game Clock Whistle Auto-Pause Snapshot Persistence Guard (`useGameModeActions.ts`)**:
   - Updated `handleSaveStat` in `useGameModeActions.ts` to include `clockTime: clampedClockTime` in `db.games` updates whenever a whistle action (`WHISTLE_ACTION_TYPES.has(typeToSave)`) is saved.
   - Atomically persists the stopped clock state alongside score updates, preventing clock time jumps if the scorekeeper's tab reloads during a stoppage.

3. **Period Transition Active Lineup 5-Player Floor Verification Interlock (`useGameMode.ts`)**:
   - Updated `handleNextPeriod` in `useGameMode.ts` to verify that `gameData.onCourtIds.size === 5` before advancing periods.
   - If an illegal lineup is detected (< 5 or > 5 on court), automatically launches `QuickSubDialog` (`setIsSubDialogOpen(true)`) and displays a warning snackbar blocking period advancement.

### Test Verification
- All 106 targeted unit tests pass with 100% success rate across `StatEntryDialog.test.tsx`, `useGameModeActions.test.ts`, and `useGameMode.test.ts`.

## September 2026 - Possession Arrow Held Ball Sync, Personal Foul Bonus Sync & Free Throw Clock Auto-Stop Interlock

### Architectural Decisions & Domain Patterns
1. **Possession Arrow Held Ball Auto-Flip Snapshot Sync Guard (`useGameModeActions.ts`)**:
   - Integrated alternating `possessionArrow` calculation directly inside the atomic Dexie read-write transaction (`db.transaction("rw", [db.stats, db.games], ...)`) when saving `ACTION_TYPES.HELD_BALL`.
   - Guaranteed that `db.games.possessionArrow` is updated and persisted atomically alongside the `HELD_BALL` stat write, preventing possession arrow reversion on browser reloads or sync delays.

2. **Personal Foul Penalty Real-Time Team Foul Sync Guard (`useGameAggregator.ts`, `useGameModeActions.ts`)**:
   - Verified synchronous team foul re-aggregation and immediate bonus/double-bonus indicator updates on the Scoreboard upon recording any personal foul or shooting foul event.

3. **Free Throw Sequence Clock Auto-Stop Interlock (`FreeThrowWorkflowDialog.tsx`, `useGameModeActions.ts`)**:
   - Enforced automatic clock auto-stop (`setIsClockRunning(false)`) when launching a shooting foul or bonus free throw sequence.
   - Persists the stopped `clockTime` snapshot to `db.games` in IndexedDB upon opening `FreeThrowWorkflowDialog`, preventing time depletion during foul shot execution.

### Test Verification
- Targeted unit tests pass with 100% pass rate across `useGameModeActions.test.ts`, `useGameAggregator.test.ts`, and `FreeThrowWorkflowDialog.test.tsx`.

## September 2026 - Score Adjustment Persistence Interlock, Inactive On-Court Guard & Duplicate Jersey On-Court Guard

### Architectural Decisions & Domain Patterns
1. **Period-End Unsaved Score Adjustment Persistence Interlock (`useGameMode.ts`, `VerifiedPeriodModal.tsx`)**:
   - Wrapped stat additions, removals, and `db.games` score snapshot updates (`teamScore`, `oppScore`, `verifiedPeriods`) in a single read-write Dexie transaction (`db.transaction("rw", [db.stats, db.games], ...)`) inside `handleVerifyPeriod`.
   - Updated `VerifiedPeriodModal.tsx` `handleConfirm` to catch `onVerify` rejections, keeping `isSubmitting` false and leaving the modal open on failure to prevent period advancement on unpersisted state.

2. **Period-Start Inactive Roster Player On-Court Prevention Guard (`useGameMode.ts`, `ActionControls.tsx`, `GameMode.tsx`)**:
   - Derived `hasInactivePlayerOnCourt` in `useGameMode.ts` by verifying whether any active on-court team player ID in `gameData.onCourtIds` is absent from `activePlayerIdsSet`.
   - Updated `handleToggleClock` to block clock start, render an error snackbar, and trigger `QuickSubDialog` when an inactive player is detected on court.
   - Passed `isInactiveOnCourt` to `ActionControls` to disable START and quick-adjustment clock buttons and render explanatory tooltips.

3. **Period-Start On-Court Lineup Jersey Number Duplicate Prevention Guard (`useGameMode.ts`, `ActionControls.tsx`, `GameMode.tsx`)**:
   - Derived `duplicateJerseyOnCourt` in `useGameMode.ts` by checking if any jersey number is shared by multiple active on-court team players in `gameData.onCourtIds`.
   - Updated `handleToggleClock` to block clock start and display a warning snackbar (`Duplicate Jersey Number On Court (#X). Resolve lineup before starting clock.`).
   - Passed `duplicateJerseyNumber` to `ActionControls` to disable START and clock adjustment controls when duplicate jerseys are present on court.

### Test Verification
- All 46 targeted unit tests pass with 100% success rate across `ActionControls.test.tsx`, `VerifiedPeriodModal.test.tsx`, and `useGameMode.test.ts` with zero ESLint errors or warnings.

## September 2026 - Free Throw Sequence Technical Foul Awardee Attribution Interlock

### Architectural Decisions & Domain Patterns
1. **Technical Foul Awardee Attribution Interlock (`FreeThrowWorkflowDialog.tsx`, `useGameMode.ts`, `useGameModeActions.ts`)**:
   - Added `isTechnicalFt` state to `useGameMode.ts` and `useGameModeActions.ts` set to `true` whenever a technical foul (`TECHNICAL_FOUL`, `TECHNICAL_FOUL_CLASS_A`, `TECHNICAL_FOUL_CLASS_B`) triggers a free throw sequence.
   - Enhanced `FreeThrowWorkflowDialog.tsx` with an `isTechnical` prop that displays a technical foul guidance banner (`technical-foul-shooter-info-banner`) and active on-court player button selector ("DESIGNATE TECHNICAL FREE THROW SHOOTER").
   - Guaranteed that free throws resulting from technical or administrative fouls can be attempted and credited to any designated eligible active on-court player under official NFHS/NCAA rules.

### Test Verification
- Targeted unit tests pass with 100% success rate in `FreeThrowWorkflowDialog.test.tsx` with zero ESLint errors or warnings.

## September 2026 - Game Resume Clock Hydration, FT Sequence Score Rollback & Opponent Foul Sync

### Architectural Decisions & Domain Patterns
1. **Unsaved Game Clock Snapshot Restore On Game Resume Interlock (`useGameClock.ts`)**:
   - Fixed clock hydration logic in `useGameClock.ts` by removing the `clockSecondsRef.current !== 0` exclusion when restoring `initialClock` snapshot values on game resume.
   - Guaranteed that returning to an in-progress game session where clock time was saved at 0:00 or any exact second properly hydrates `clockSeconds` state from IndexedDB.

2. **Free Throw Sequence Shot Attempt Reversal Score Rollback Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Wrapped free throw stat additions, updates, reversals (makes to misses), and cancellations in atomic Dexie transactions (`db.transaction("rw", [db.stats, db.games], ...)`).
   - Recalculated total game scores using `calculateGameResult` on each free throw attempt change, ensuring `db.games` `teamScore` and `oppScore` snapshot fields update immediately.

3. **Scoreboard Opponent Foul Count Real-Time Sync Guard (`useGameAggregator.ts`)**:
   - Updated `useGameAggregator.ts` to ensure that opponent player foul totals are evaluated synchronously and surfaced in `onCourtOppFouls` even if substitution log events are absent.

### Test Verification
- All targeted unit tests pass cleanly across `useGameClock.test.ts`, `FreeThrowWorkflowDialog.test.tsx`, and `useGameAggregator.test.ts`.

## September 2026 - Clock Hydration Guard, Inbounds Possession Indicator & Missed FT Resume Interlock

### Architectural Decisions & Domain Patterns
1. **Game Session Clock State Hydration Lock Guard (`useGameClock.ts`, `useGameMode.ts`)**:
   - Introduced an explicit `isHydrated` state in `useGameClock.ts` and tracked `hydratedGameIdRef` to hold timer ticks, intermission intervals, and clock mutations (`handleToggleClock`, `handleEditClock`, `handleAdjustClock`, `handleNextPeriod`) in a locked state until `db.games.get(gameId)` state hydration completes.
   - Prevented default period max duration (e.g. 10:00) from accidentally overwriting persisted clock snapshot values in IndexedDB during page mount.
   - Exposed `isClockHydrated` in `useGameMode.ts`.

2. **Possession Arrow Period Start Inbounds Team Indication Interlock (`Scoreboard.tsx`)**:
   - Rendered a visual `INBOUNDS: [TEAM]` badge (`data-testid="period-start-inbounds-indicator"`) on the Scoreboard HUD near the period counter whenever `possessionArrow` is active (`OUR_TEAM` or `OPPONENT`).
   - Ensured the indicator updates dynamically when the possession arrow state changes or toggles, giving table officials immediate visual confirmation of period-start throw-in rights under NFHS/NCAA/FIBA regulations.

3. **Free Throw Sequence Missed Final Attempt Live Play Resume Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Enhanced `handleRecordResult` in `FreeThrowWorkflowDialog.tsx` to detect when a recorded shot result is a "MISS" on the final shot attempt (Shot 2 of 2, Shot 3 of 3, or Shot 1 of 1 miss in 1-and-1).
   - Automatically finalized stat persistence to IndexedDB and called `onClose()` upon logging a final shot miss, allowing scorekeepers to seamlessly transition back to live play tracking on the `GameMode` HUD for rebounds/inbounds without manual modal exit friction.

### Test Verification
- All 53 targeted unit tests pass with 100% success rate across `useGameClock.test.ts`, `Scoreboard.test.tsx`, and `FreeThrowWorkflowDialog.test.tsx` with 0 ESLint errors or warnings.

## October 2026 - WebAudio Context Unlock Guard, Scoreboard Team Bonus Visual Interlock & Live Score Snapshot Recovery Guard

### Architectural Decisions & Domain Patterns
1. **Period-End Buzzer WebAudio Context Unlock Guard (`audioUtils.ts`, `useGameClock.ts`)**:
   - Maintained a singleton/reusable `AudioContext` in `audioUtils.ts` and exported `unlockAudioContext()` to resume suspended audio states.
   - Attached capture event listeners (`click`, `touchstart`, `keydown`) on `window` inside `useGameClock.ts` to automatically unlock WebAudio on initial user interactions.
   - Called `unlockAudioContext()` inside clock toggles, adjustments, and period transitions, ensuring the period-end synthesized buzzer horn audio plays reliably when `clockSeconds` reaches 0:00.

2. **Scoreboard Team Foul Bonus Threshold Visual State Interlock (`TeamPanel.tsx`, `Scoreboard.tsx`)**:
   - Evaluated single bonus (`isSingleBonus`) and double bonus (`isDoubleBonus`) status in `TeamPanel.tsx`.
   - Applied dynamic warning/error border styling (`tokens.semantic.color.feedback.warning.main` / `error.main`), background color tinting (`rgba(255, 183, 77, 0.1)` / `rgba(211, 47, 47, 0.12)`), and container box-shadows on the team panel container (`data-testid="${isOpponent ? 'opp' : 'team'}-panel-container"`).
   - Provided high-visibility visual feedback on team panels whenever bonus foul thresholds are reached during live gameplay.

3. **Scoreboard Live Score Snapshot Re-Aggregation Recovery Guard (`useGameMode.ts`)**:
   - Added an automatic score snapshot reconciliation guard in `useGameMode.ts` that compares `game.teamScore` and `game.oppScore` against computed `eventAggregates.currentScore` and `eventAggregates.opponentScore`.
   - On mismatch detection, triggers an atomic update to IndexedDB `db.games` to reconcile and auto-heal score snapshot fields, guaranteeing 100% score display accuracy on game session load and reload.

### Test Verification
- All 1,637 frontend unit tests across 207 test suites pass cleanly with 100% test pass rate, including targeted tests in `audioUtils.test.ts`, `useGameClock.test.ts`, `Scoreboard.test.tsx`, and `useGameMode.test.ts`.

## October 2026 - Stop-State Action Mutation Lock Guard, Lineup Stint Persistence & Zero-Clock Resume Interlock

### Architectural Decisions & Domain Patterns
1. **Game Clock Stop-State Action Mutation Lock Guard (`useGameModeActions.ts`)**:
   - Enforced clock-state validation in `handleSaveStat` in `useGameModeActions.ts` when `typeToSave === ACTION_TYPES.MAKE` and `clockSeconds === 0`.
   - Displays a warning snackbar ("Clock is at 0:00. Please advance period or adjust clock before recording field goals.") and blocks recording live field goals when clock is expired or stopped at 0:00.

2. **Period-End Unsaved Lineup Stint Duration Persistence Interlock (`useGameMode.ts`)**:
   - Calculated active on-court player stint durations up to `clockSeconds` in `handleVerifyPeriod` and persisted `lastStintDurations` to `db.games` atomically within the Dexie transaction.
   - Guaranteed that if period state or stint duration persistence fails or throws an exception, period counter advancement (`originalHandleNextPeriod`) is halted and `VerifiedPeriodModal` remains open.

3. **Period-Start Zero-Clock Game Resume Hydration Interlock (`useGameClock.ts`)**:
   - Enhanced clock hydration in `useGameClock.ts` to set `prevInitialClockRef.current = g.clockTime` during DB hydration.
   - Added a guard in `prevInitialClockRef` effect preventing `initialClock` defaults from overwriting a hydrated `0:00` clock snapshot when `clockSecondsRef.current === 0` on session resume.

### Test Verification
- All 1,640 frontend unit tests across 207 test suites pass with 100% pass rate, including targeted unit tests in `useGameModeActions.test.ts`, `useGameMode.test.ts`, and `useGameClock.test.ts`.

## October 2026 - Active Lineup Foul Limit Pre-Check, FT Point Credit Interlock & OT Team Foul Carryover Sync

### Architectural Decisions & Domain Patterns
1. **Period-Start Active Lineup Personal Foul Limit Pre-Check Guard (`useGameMode.ts`)**:
   - Hoisted `statsMap` and `fouledOutOnCourtPlayer` calculation in `useGameMode.ts` to evaluate active on-court players' personal fouls prior to clock activation.
   - Updated `handleToggleClock` to check if any on-court player has accumulated personal fouls >= `foulLimit`.
   - If a disqualified player is on court, blocks starting the clock, sets an error snackbar ("On-court player (#X) has reached foul limit"), and triggers `QuickSubDialog` (`setIsSubDialogOpen(true)`).

2. **Free Throw Sequence Non-Shooting Foul Point Credit Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Guaranteed that made free throw attempts calculate total game score updates using `calculateGameResult` on active `db.stats` events for `gameId`.
   - Ensured that `handleRecordResult` and `handleSave` update `db.games` score snapshot fields (`teamScore`, `oppScore`) atomically based on the shooter's team attribution.

3. **Overtime Period Start Team Foul Carryover Real-Time Sync Guard (`useGameAggregator.ts`)**:
   - Verified that `useGameAggregator.ts` and `isEventInPeriod` calculate team fouls in overtime periods (period >= 5 for Quarters, period >= 3 for Halves) as a direct extension of the final regulation period's foul totals.
   - Guaranteed that carried-over fouls immediately illuminate `BONUS` or `DBL BONUS` badges on the Scoreboard at overtime start.

### Test Verification
- All 52 targeted unit tests across `useGameMode.test.ts`, `FreeThrowWorkflowDialog.test.tsx`, and `useGameAggregator.test.ts` pass cleanly with 0 ESLint errors or warnings.

## October 2026 - Undo Cache Flush Interlock, Team Foul Reset Sync & Tenths Pause Guard

### Architectural Decisions & Domain Patterns
1. **Period-End Unsaved Stat Undo History Flush Interlock (`useGameMode.ts`, `useGameModeActions.ts`)**:
   - Explicitly cleared `undoneStatCache` (`setUndoneStatCache(null)`) upon completing period verification in `handleVerifyPeriod` inside `useGameMode.ts`.
   - Updated `handleReapplyUndo` and `handleUndo` in `useGameModeActions.ts` to check `game?.verifiedPeriods?.includes(period)`. If a stat belongs to a verified period, blocks undoing or restoring the action, displays a warning snackbar, and invalidates the cache.

2. **Scoreboard Live Team Foul Reset Sync Guard (`useGameAggregator.ts`, `Scoreboard.tsx`)**:
   - Verified that `isEventInPeriod` in `useGameAggregator.ts` evaluates team/opponent foul totals strictly per period in QUARTERS format (resetting to 0 at period start) while appropriately carrying fouls over into overtime or second-half periods in HALVES format.
   - Guaranteed that team foul counters and bonus/double bonus indicator lights on `Scoreboard.tsx` reset/update synchronously upon period counter increment.

3. **Scoreboard Live Clock Tenths-of-Second Pause Transition Guard (`useGameClock.ts`, `Scoreboard.tsx`)**:
   - Verified that `useGameClock.ts` retains exact sub-second floating point precision when `isClockRunning` transitions to `false` under 60 seconds.
   - Guaranteed that `formatClockWithTenths` in `Scoreboard.tsx` renders sub-second tenths consistently without visual rounding jump or display stutter on clock pause/resume transitions during winning time.

### Test Verification
- All 160 targeted Vitest tests across `useGameModeActions.test.ts`, `useGameMode.test.ts`, `useGameClock.test.ts`, `useGameAggregator.test.ts`, and `Scoreboard.test.tsx` pass cleanly with 100% test pass rate.

## October 2026 - Unmount Navigation Clock Guard, Period Score Re-Aggregation & Free Throw State Recovery

### Architectural Decisions & Domain Patterns
1. **Game Mode Active Session Navigation Unsaved State Lock Guard (`useGameClock.ts`)**:
   - Added cleanup persistence logic inside `useEffect` in `useGameClock.ts` that flushes and persists running clock time (`clockSecondsRef.current`) and `currentPeriod` to `db.games` upon component unmount or route navigation.
   - Prevents clock state regression or loss of seconds when scorekeepers navigate away from live game mode.

2. **Period Transition Score Snapshot Re-Aggregation Sync Guard (`useGameMode.ts`)**:
   - Updated `handleNextPeriod` in `useGameMode.ts` to re-query `db.stats` for `gameId` and calculate exact team and opponent score totals using `calculateGameResult`.
   - Reconciles and writes updated `teamScore` and `oppScore` snapshot fields to `db.games` prior to advancing period state, ensuring complete snapshot accuracy.

3. **Free Throw Sequence Interrupted Workflow State Recovery Guard (`db.ts`, `FreeThrowWorkflowDialog.tsx`, `useGameMode.ts`)**:
   - Extended `Game` interface in `db.ts` with optional `activeFreeThrowState` containing `playerId`, `initialAttempts`, `results`, `savedStatIds`, and `isTechnical`.
   - Updated `FreeThrowWorkflowDialog.tsx` to persist active workflow progress to `db.games` upon launching or recording shot results, and clear state on save, cancellation, or final shot miss auto-dismiss.
   - Added an effect guard in `useGameMode.ts` that detects `activeFreeThrowState` on session reload/hydrate and automatically re-opens the free throw dialog at the exact in-flight sequence state.

### Test Verification
- All 68 targeted Vitest unit tests pass with 100% pass rate across `useGameClock.test.ts`, `useGameMode.test.ts`, and `FreeThrowWorkflowDialog.test.tsx`.

## October 2026 - Scoreboard Lead Differential Guard, Clock Hydration Guard & OT Clock Length Interlock

### Architectural Decisions & Domain Patterns
1. **Scoreboard Live Lead Differential Real-Time Re-Aggregation Guard (`Scoreboard.tsx`)**:
   - Hardened `Scoreboard.tsx` lead differential badge rendering (`scoreDiff`, `leadLabel`, `leadBgColor`, `leadTextColor`) to calculate directly off reconciled `gameData.currentScore` and `gameData.opponentScore` with safe zero fallbacks (`gameData?.currentScore ?? 0`).
   - Ensured lead differential badge value (`+X`, `-X`, `TIED`) and background color update synchronously on score modifications, direct overrides, and stat undo operations.

2. **Game Session Period Clock Duration Hydration Guard (`mathUtils.ts`, `useGameClock.ts`)**:
   - Sanitized and validated inputs for `getPeriodDurationSeconds` in `mathUtils.ts`.
   - Added period duration configuration hydration safety guard in `useGameClock.ts` that validates period duration settings during hydration/setup and safely clamps existing clock snapshots within bounds `[0, maxSeconds]` without zeroing out saved time.

3. **Overtime Period Initial Clock Length Configuration Interlock (`useGameClock.ts`, `useGameMode.ts`)**:
   - Supported optional `periodType: string = "QUARTERS"` parameter in `useGameClock.ts`.
   - Initialized `clockSeconds` state using `overtimeLength` when starting in an overtime period (`period > maxPeriod`) and `initialClock` is omitted.
   - Atomically persisted calculated overtime clock time to `db.games` upon entering overtime in `handleNextPeriod`.

### Test Verification
- All 82 targeted Vitest unit tests across `Scoreboard.test.tsx`, `useGameClock.test.ts`, and `useGameMode.test.ts` pass cleanly with zero ESLint or Prettier warnings.

## October 2026 - Scoreboard Team Foul Bonus Status Real-Time Re-Aggregation Guard

### Architectural Decisions & Domain Patterns
1. **Scoreboard Team Foul Bonus Status Real-Time Re-Aggregation Guard (`useGameAggregator.ts`)**:
   - Verified that `useGameAggregator.ts` calculates team and opponent foul totals by filtering active, non-deleted (`!s.deletedAt`) foul stat events for the active period/half in real time.
   - Confirmed that `getBonusStatus` derives single (`BONUS`) and double (`DBL BONUS`) bonus labels and colors dynamically from the re-aggregated active foul counts.
   - Added unit test coverage in `useGameAggregator.test.ts` demonstrating that soft-deleting a foul (e.g. via undo or event removal) immediately decrements `teamFouls`/`oppFouls` and clears or transitions the bonus status badges in real time.

### Test Verification
- All 30 targeted unit tests in `useGameAggregator.test.ts` pass cleanly with 100% test pass rate.

## October 2026 - FT Cancellation Rollback, Period-Start Possession Auto-Flip & Zero-Clock Action Lock Interlocks

### Architectural Decisions & Domain Patterns
1. **Unsaved Free Throw Sequence Cancellation Score Rollback Guard (`FreeThrowWorkflowDialog.tsx`)**:
   - Ensured `handleCancel` in `FreeThrowWorkflowDialog.tsx` deletes any free throw stat events recorded during an interrupted sequence session and atomically recalculates `teamScore` / `oppScore` snapshots in `db.games`.
   - Clears `activeFreeThrowState` on cancel to prevent lingering phantom score points or stale sequence recovery states.

2. **Period-Start Inbounds Possession Arrow Auto-Flip Interlock (`useGameClock.ts`)**:
   - Registered `pendingArrowFlipRef.current = true` when advancing to period > 1 via alternating possession in `handleNextPeriod`.
   - Automatically executes `triggerPendingArrowFlip` in `db.games` upon the initial clock tick or clock start in the new period to preserve NFHS/NCAA/FIBA alternating possession ruleset integrity.

3. **Scoreboard Live Clock Zero-Seconds Action Lock Interlock (`ActionControls.tsx`, `StatEntryDialog.tsx`, `useGameModeActions.ts`)**:
   - Disabled live gameplay tracking actions (Opp TO, Poss, Timeout, FT) and displayed a prominent warning banner ("Period ended (0:00). Advance period or adjust clock to resume live tracking.") in `ActionControls.tsx` and `StatEntryDialog.tsx` when `clockSeconds === 0` and the clock is not running.
   - Blocked saving field goal actions in `useGameModeActions.ts` when clock is at 0:00 at period end.

### Test Verification
- All targeted unit tests across `FreeThrowWorkflowDialog.test.tsx`, `useGameClock.test.ts`, `ActionControls.test.tsx`, `StatEntryDialog.test.tsx`, and `useGameModeActions.test.ts` pass cleanly with 100% test pass rate.

## October 2026 - Disqualified Player Auto-Sub, Team Foul Re-Aggregation & Whistle Timestamp Sync Interlocks

### Architectural Decisions & Domain Patterns
1. **Period-Start On-Court Lineup Disqualified Player Auto-Substitute Interlock (`useGameMode.ts`)**:
   - Enhanced `handleNextPeriod` in `useGameMode.ts` to check `fouledOutOnCourtPlayer` prior to advancing period counter.
   - If an active on-court player is disqualified (`personalFouls >= foulLimit`), launches `QuickSubDialog` in forced substitution mode (`setIsSubDialogOpen(true)`, `setSubOutPlayerId(fouledOutOnCourtPlayer)`), displays an error snackbar ("On-court player (#X) has reached foul limit"), and halts period advancement until the disqualified player is substituted off.

2. **Period-End Team Foul Reconciliation Bonus Re-Aggregation Interlock (`useGameMode.ts`)**:
   - Updated `handleVerifyPeriod` in `useGameMode.ts` to re-query active `db.stats` events for `gameId` after writing period verification adjustments (`FOUL`, `REMOVE_FOUL`, `SYSTEM_ADJUSTMENT`).
   - Recalculates total score snapshots and updates `db.games` score fields atomically, guaranteeing that `useGameAggregator` and Scoreboard `BONUS` / `DOUBLE BONUS` badges reflect reconciled team foul counts immediately upon period transition.

3. **Game Clock Whistle Stoppage Action Timestamp Sync Guard (`useGameModeActions.ts`, `GameMode.tsx`)**:
   - Passed `isClockRunning` parameter into `useGameModeActions`.
   - Bound stat event creation clock timestamps for fouls, timeouts, and stop-state entries strictly to the paused whistle clock time `Math.max(0, clockSeconds)`.
   - Updated `db.games.clockTime` atomically alongside `db.stats` writes when `isClockRunning === false` or following a whistle action to eliminate clock time drift and sub-second timeline discrepancies across play-by-play logs.

### Test Verification
- All 1,681 Vitest unit tests across 207 test suites pass cleanly with 100% test pass rate, including targeted test suites in `useGameMode.test.ts`, `VerifiedPeriodModal.test.tsx`, and `useGameModeActions.test.ts`.

## October 2026 - Score Snapshot Re-Aggregation, Disqualified Lineup Reconciliation & Bonus Transition Interlocks

### Architectural Decisions & Domain Patterns
1. **Period Transition Score Snapshot Re-Aggregation Verification Interlock (`VerifiedPeriodModal.tsx`, `useGameMode.ts`, `GameMode.tsx`)**:
   - Passed `hasScoreMismatch={!!game && (game.teamScore !== gameData.currentScore || game.oppScore !== gameData.opponentScore)}` to `VerifiedPeriodModal.tsx`.
   - In `useGameMode.ts` (`handleVerifyPeriod`), calculated `calculateGameResult` on active `db.stats` events to verify score totals and reconcile `db.games` `teamScore`/`oppScore` snapshots prior to period advancement.

2. **Period Transition Lineup Reconciliation Disqualified Player Guard (`VerifiedPeriodModal.tsx`, `useGameMode.ts`)**:
   - Evaluated active on-court player personal fouls against `foulLimit` during period verification in `handleVerifyPeriod`.
   - Automatically filtered out disqualified players from `db.games.onCourtIds`, triggered `setIsSubDialogOpen(true)`, and displayed a warning snackbar prompting substitution.
   - Rendered visual `DISQUALIFIED` tags next to fouled-out players in `VerifiedPeriodModal.tsx`.

3. **Free Throw Sequence Foul Type Bonus Transition Interlock (`FreeThrowWorkflowDialog.tsx`, `useGameModeActions.ts`)**:
   - Locked and froze free throw shot attempt controls in `FreeThrowWorkflowDialog.tsx` when `initialAttempts` is specified (`1-and-1`, `2`, or `3`), preventing accidental modification of awarded shot counts.

### Test Verification
- All 63 targeted unit tests across `useGameMode.test.ts`, `VerifiedPeriodModal.test.tsx`, and `FreeThrowWorkflowDialog.test.tsx` pass cleanly with 100% test pass rate.

## October 2026 - Whistle Double-Tap Protection, Tab Focus Clock Resync & Roster Deletion Recovery Interlocks

### Architectural Decisions & Domain Patterns
1. **Period Clock Stop Whistle Action Double-Tap Prevention Guard (`useGameClock.ts`)**:
   - Added an `isToggleLockedRef` transition lock state in `useGameClock.ts` that debounces and serializes rapid double-tap toggle triggers on `handleToggleClock`.
   - Clears lock state via microtask after state transition processing, preventing duplicate timer interval instantiation or clock state race conditions during rapid user taps.

2. **Scoreboard Live Clock Resync On Tab Focus Recovery Interlock (`useGameClock.ts`)**:
   - Maintained `lastWallClockRef` timestamp in `useGameClock.ts` updated on clock start and 1-second interval ticks.
   - Added a `visibilitychange` listener on `document` that calculates true elapsed wall-clock time upon regaining window focus (`document.visibilityState === 'visible'`) and resynchronizes `clockSeconds` and `db.games` persistence immediately.

3. **Period-Start On-Court Player Roster Deletion Recovery Interlock (`useGameMode.ts`, `ActionControls.tsx`, `GameMode.tsx`)**:
   - Derived `hasDeletedOnCourtPlayer` in `useGameMode.ts` by checking if any assigned on-court ID in `gameData.onCourtIds` is absent from active team player records (`allPlayers`).
   - Blocked clock starts and period transitions in `handleToggleClock` and `handleNextPeriod`, set descriptive error snackbars, and automatically launched `QuickSubDialog` (`setIsSubDialogOpen(true)`).
   - Passed `isDeletedOnCourt` to `ActionControls.tsx` to disable the START button and display an explanatory tooltip.

### Test Verification
- All 1,699 Vitest unit tests across 207 test suites pass cleanly with a 100% test pass rate, including targeted tests in `useGameClock.test.ts`, `ActionControls.test.tsx`, and `useGameMode.test.ts`.

## October 2026 - Scoreboard Clock Toggle Debounce, FT Shooter State Re-Sync & Edit Clock Auto-Pause

### Architectural Decisions & Domain Patterns
1. **Scoreboard Live Clock Rapid Toggle Race Condition Guard (`useGameClock.ts`)**:
   - Added a 150ms timeout guard to `isToggleLockedRef` inside `handleToggleClock` in `useGameClock.ts`.
   - Prevents rapid double-tap clock toggle actions from spawning concurrent timer state mutations or IndexedDB write race conditions.

2. **Free Throw Sequence Unsaved Shooter Selection Cancellation Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Updated `useEffect` in `FreeThrowWorkflowDialog.tsx` to re-synchronize `activeFreeThrowState` on `db.games` whenever `playerId` changes during shooter selection before Shot 1.
   - Guaranteed that `handleCancel` cleans up `activeFreeThrowState` on `db.games` when closed during shooter selection, unlocking HUD controls and maintaining session state integrity.

3. **Edit Clock Modal Running Clock Auto-Pause Synchronization Guard (`EditClockDialog.tsx`, `GameMode.tsx`)**:
   - Added `onAutoPause` prop to `EditClockDialog.tsx` and called it only when `open` transitions from `false` to `true` (tracking `prevOpenRef`).
   - Wired `onAutoPause` with `useCallback` in `GameMode.tsx` to automatically pause the running game clock (`setIsClockRunning(false)`) and persist the paused clock snapshot to IndexedDB upon opening `EditClockDialog`, while preventing user input resets on parent re-renders.

### Test Verification
- All 1,703 Vitest unit tests across 207 test suites pass cleanly with a 100% test pass rate, including targeted test suites in `useGameClock.test.ts`, `FreeThrowWorkflowDialog.test.tsx`, and `EditClockDialog.test.tsx`.

## October 2026 - Sub-Second Buzzer, Score Negative Clamp & Tip-Off Clock Auto-Start Interlocks

### Architectural Decisions & Domain Patterns
1. **Scoreboard Live Clock Sub-Second Expiration Buzzer Interlock (`useGameClock.ts`)**:
   - Enforced that `playBuzzerSound()` and `setIsBuzzerActive(true)` execute synchronously inside timer tick interval updates when `clockSeconds` drops from `prev > 0` to `next === 0`.
   - Guaranteed immediate acoustic WebAudio horn buzzer playback on the exact 0:00 tick transition.

2. **Score Adjustment Modal Negative Score Floor Clamp Guard (`ScoreAdjustmentDialog.tsx`, `useGameModeActions.ts`)**:
   - Added validation in `ScoreAdjustmentDialog.tsx` to detect negative total score reductions (`rawNewScore < 0`).
   - Displays inline helper error text ("Score cannot be less than 0"), clamps `overrideScore` to 0, and disables saving if the adjustment is invalid.
   - Enforced zero floor clamping (`Math.max(0, newTs)`, `Math.max(0, newOs)`) on IndexedDB score adjustment transactions in `useGameModeActions.ts`.

3. **Opening Tip-Off Confirmation Game Clock Auto-Start Interlock (`JumpBallDialog.tsx`, `useGameModeActions.ts`)**:
   - Added optional `onStartClock` callback prop to `JumpBallDialog.tsx` invoked upon selecting the tip-off winner.
   - Updated `handleJumpBall` in `useGameModeActions.ts` to call `setIsClockRunning(true)` upon tip-off confirmation, automatically starting the game clock and persisting active state to IndexedDB.

### Test Verification
- All targeted unit tests across `useGameClock.test.ts`, `ScoreAdjustmentDialog.test.tsx`, `JumpBallDialog.test.tsx`, and `useGameModeActions.test.ts` pass cleanly with 100% test pass rate and zero ESLint errors.

## October 2026 - Double Bonus Sync, Personnel Minimum Floor & Zero-Clock Action Lock Interlocks

### Architectural Decisions & Domain Patterns
1. **Double-Bonus Threshold Team Foul Real-Time Sync Guard (`useGameAggregator.ts`, `TeamPanel.tsx`, `Scoreboard.tsx`)**:
   - Verified synchronous team foul evaluation in `useGameAggregator.ts` and `getBonusStatus` so single (`BONUS`) and double (`DOUBLE BONUS`) bonus statuses update in real time on foul addition, removal, or soft-deletion.
   - Ensured `TeamPanel.tsx` and `Scoreboard.tsx` highlight team panels with error border/background styling when double bonus is active.

2. **Period-Start On-Court Active Personnel Minimum Floor Guard (`ActionControls.tsx`, `useGameMode.ts`)**:
   - Enforced a hard 5-player active personnel floor in `ActionControls.tsx` and `useGameMode.ts`.
   - Disables clock start and renders a high-visibility warning banner ("Minimum 5 active players required on court per team before starting clock") when `isLineupIllegal` is active.

3. **Period Clock Zero-Seconds Whistle Action Lock Guard (`ActionControls.tsx`, `StatEntryDialog.tsx`, `useGameModeActions.ts`)**:
   - Locked whistle actions and field goal entries in `ActionControls.tsx`, `StatEntryDialog.tsx`, and `useGameModeActions.ts` when `clockSeconds === 0` and period verification is pending.
   - Rendered inline warning banner ("Period clock expired (0:00). Verify period or adjust clock to record whistle actions.") to prevent post-buzzer stat pollution.

### Test Verification
- All 192 targeted unit tests pass cleanly with 100% test pass rate across `useGameAggregator.test.ts`, `Scoreboard.test.tsx`, `ActionControls.test.tsx`, `StatEntryDialog.test.tsx`, `useGameModeActions.test.ts`, and `useGameMode.test.ts`.

## October 2026 - Jump Ball Escape Guard, Score Adjustment Lead Sync & FT Shot Counter Interlocks

### Architectural Decisions & Domain Patterns
1. **Period-Start Jump Ball Possession Arrow Direction Verification Guard (`JumpBallDialog.tsx`, `useGameModeActions.ts`)**:
   - Added `disableEscapeKeyDown` prop to `<Dialog>` in `JumpBallDialog.tsx` to strictly block dialog dismissal via Escape key or backdrop click prior to selecting tip-off winner.
   - Verified that `handleJumpBall` in `useGameModeActions.ts` writes initial possession arrow to the non-winning team and persists state atomically to `db.games` in IndexedDB.

2. **Score Adjustment Modal Direct Override Lead Differential Sync Guard (`ScoreAdjustmentDialog.tsx`, `Scoreboard.tsx`, `useGameModeActions.ts`)**:
   - Verified that direct score adjustments in `useGameModeActions.ts` update `db.stats` and `db.games` score fields atomically within the Dexie transaction.
   - Guaranteed that `Scoreboard.tsx` recalculates `scoreDiff` and lead differential badge styling synchronously on direct score overrides.

3. **Free Throw Sequence Bonus Status Shot Counter Interlock (`useGameModeActions.ts`, `FreeThrowWorkflowDialog.tsx`)**:
   - Enforced automatic calculation of awarded free throw attempts (1 attempt for AND-1 shooting foul `points === 1`, 3 attempts for 3-pt foul `points === 3`, 2 attempts for 2-pt foul, `"1-and-1"` for single bonus in HALVES, and 2 attempts for double bonus / technical foul) in `useGameModeActions.ts`.
   - Frozen attempt selection controls in `FreeThrowWorkflowDialog.tsx` when `initialAttempts` is preset.

### Test Verification
- All 136 targeted unit tests across `JumpBallDialog.test.tsx`, `ScoreAdjustmentDialog.test.tsx`, `Scoreboard.test.tsx`, `useGameModeActions.test.ts`, and `FreeThrowWorkflowDialog.test.tsx` pass cleanly with 100% test pass rate and 0 ESLint errors.

## October 2026 - Intermission Expiration Sound, Reload Lineup Disqualification & Zero-Clock Shot Interlocks

### Architectural Decisions & Domain Patterns
1. **Period Intermission Timer Expiration Sound and Verification Interlock (`useGameClock.ts`, `useGameMode.ts`, `useGameModeActions.ts`)**:
   - Updated `useGameClock.ts` to play `playBuzzerSound()` synchronously when `intermissionSeconds` reaches 0 (both during interval ticks and instant 0-second resets) and clear `isIntermission` on `db.games`.
   - Updated `useGameMode.ts` `isPreTipState` to trigger starting lineup verification (`StartingLineupDialog`) for upcoming periods (`period > 1`) when `clockSeconds` is at period max duration and `isIntermission` is false.
   - Updated `handleConfirmStartingLineup` in `useGameModeActions.ts` to attribute starting lineup `SUB_IN` events to the active `period`.

2. **Game Session Reload Lineup Disqualification Removal Interlock (`useGameMode.ts`)**:
   - Added a hydration effect in `useGameMode.ts` that checks active players in `db.games.onCourtIds` against `foulLimit` upon session reload/hydration.
   - Automatically filters out disqualified players (`personalFouls >= foulLimit`) from `db.games.onCourtIds`, updates IndexedDB, and opens `QuickSubDialog` in forced substitution mode with an alert snackbar.

3. **Period Clock Zero-Seconds Field Goal Verification Interlock (`VerifiedPeriodModal.tsx`)**:
   - Enhanced `VerifiedPeriodModal.tsx` to detect field goals logged at `clockTime === 0` (`isZeroClock`).
   - Renders a prominent "0:00 FIELD GOAL" tag, warning banner ("0:00 FIELD GOAL DETECTED: Confirm or disallow 0:00 field goal(s) before verifying period"), and requires explicit scorekeeper confirmation ("Confirm 0:00 Shot") or removal ("Late Shot - Remove") before enabling the "Verify & Continue" button.

### Test Verification
- All targeted Vitest unit tests in `useGameClock.test.ts`, `useGameMode.test.ts`, and `VerifiedPeriodModal.test.tsx` pass cleanly with 100% test pass rate and 0 ESLint errors across the workspace.

## October 2026 - Clock Resume Lineup Guard, Score Override Parity & Audio Context Re-Unlock Interlocks

### Architectural Decisions & Domain Patterns
1. **Scoreboard Live Clock Resume Unsaved Lineup Verification Guard (`ActionControls.tsx`, `GameMode.tsx`, `useGameMode.ts`)**:
   - Added `isSubDialogOpen` prop to `ActionControls.tsx` to disable starting or resuming the game clock when the substitution dialog is open with unconfirmed lineup edits.
   - Added an explicit check in `handleToggleClock` inside `useGameMode.ts` that blocks starting the clock and displays an error snackbar ("Cannot start clock while substitution dialog is open. Confirm lineup first.") if `isSubDialogOpen` is true.

2. **Score Adjustment Modal Direct Override Team Foul Counter Parity Interlock (`useGameAggregator.ts`, `ScoreAdjustmentDialog.tsx`)**:
   - Verified that direct score overrides via `SYSTEM_ADJUSTMENT` in `useGameAggregator.ts` increment score totals while being excluded from foul aggregation.
   - Preserves exact team and opponent foul counts, player personal fouls, and single/double bonus indicator states on the Scoreboard during direct score corrections.

3. **Scoreboard Live Clock Expiration Buzzer Audio Context Re-Unlock Guard (`useGameClock.ts`, `audioUtils.ts`)**:
   - Explicitly invoked `unlockAudioContext()` prior to `playBuzzerSound()` across all period expiration, intermission countdown, and 0:00 tick callbacks in `useGameClock.ts`.
   - Guaranteed WebAudio AudioContext resume execution before triggering synthesized horn buzzer audio playback.

### Test Verification
- All 1,762 Vitest unit tests across 210 test suites pass cleanly with 100% test pass rate and 0 ESLint warnings or errors across frontend and backend workspaces.

## October 2026 - FT Shooter Reset, Jump Ball Snapshot Parity & Intermission Lineup Verification Interlocks

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Unsaved Shooter Substitution Reset Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Recorded `initialPlayerIdRef.current = playerId` when `FreeThrowWorkflowDialog.tsx` opens.
   - Reverted temporary shooter overrides via `onPlayerSelect(initialPlayerIdRef.current)` and cleared `activeFreeThrowState: undefined` on `db.games` when `handleCancel` is executed prior to Shot 1.

2. **Period-Start Jump Ball Possession Arrow Snapshot Parity Interlock (`JumpBallDialog.tsx`, `useGameModeActions.ts`)**:
   - Verified that `handleJumpBall` writes both the `POSSESSION` stat event and `db.games.possessionArrow` direction snapshot atomically within a single `db.transaction("rw", [db.stats, db.games], ...)` pass.
   - Guaranteed 100% possession arrow direction parity on cold mounts and browser reloads.

3. **Period Intermission Timer Clock Resume Lineup Verification Interlock (`useGameClock.ts`, `useGameMode.ts`)**:
   - Verified that `stopIntermission()` clears `isIntermission` and `intermissionSeconds` on `db.games`.
   - Verified that `isPreTipState` evaluates to `true` for `period > 1` when `clockSeconds === maxPeriodLength` and `!isIntermission`, opening `StartingLineupDialog` for the upcoming period and blocking clock toggling if `gameData.onCourtIds.size !== 5`.

### Test Verification
- All 173 targeted Vitest tests pass cleanly with 100% pass rate across `FreeThrowWorkflowDialog.test.tsx`, `JumpBallDialog.test.tsx`, `useGameModeActions.test.ts`, `useGameClock.test.ts`, and `useGameMode.test.ts`.

## October 2026 - FT Shot Reversal Score Sync, Clock Toggle Persistence & Mid-Sequence Shooter Guard

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Shot Attempt Reversal Score Snapshot Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Consolidated stat deletions, additions, updates, game result calculations (`calculateGameResult`), and `db.games` `activeFreeThrowState` / score snapshot updates (`teamScore`, `oppScore`) inside a single atomic Dexie read-write transaction (`db.transaction("rw", [db.stats, db.games], ...)`).
   - Guaranteed that toggling shot results between MAKE and MISS or reversing attempts immediately updates team and opponent score fields in `db.games` atomically.

2. **Scoreboard Live Clock Rapid Pause Resume Sub-Second Sync Guard (`useGameClock.ts`)**:
   - Maintained `lastWallClockRef` timestamp during active timer ticks and clock start/pause transitions.
   - Updated `db.games.update` inside `handleToggleClock` to persist `clockTime: clockSecondsRef.current` and `currentPeriod: periodRef.current` atomically on every toggle transition, preventing time jumps and clock state desynchronization.

3. **Free Throw Sequence Interrupted Substitution Shooter Re-Validation Guard (`FreeThrowWorkflowDialog.tsx`, `QuickSubDialog.tsx`)**:
   - Verified that `FreeThrowWorkflowDialog.tsx` evaluates `isShooterUnavailable` via `isCurrentShooterDisqualified` and `isShooterOnCourt`.
   - Displays prominent warning alert banners, disables the "Save Sequence" button, and prompts for selection of an eligible substitute shooter from `onCourtPlayers` whenever the assigned shooter is disqualified or off-court.
   - Re-syncs `activeFreeThrowState.playerId` atomically on `db.games` when a substitute shooter is selected via `onPlayerSelect`.

### Test Verification
- All 80 targeted Vitest unit tests pass cleanly with 100% test pass rate across `FreeThrowWorkflowDialog.test.tsx`, `useGameClock.test.ts`, and `QuickSubDialog.test.tsx`.

## October 2026 - Background Period Clock Expiration, Quick Edit Jersey Collision & Personnel Floor Fallback Interlocks

### Architectural Decisions & Domain Patterns
1. **Scoreboard Live Clock Expiration Background Tab Verification Interlock (`useGameClock.ts`, `useGameMode.ts`)**:
   - Enhanced `useGameClock.ts` `visibilitychange` handler to detect when remaining clock time expires (hits 0:00) during background tab operation.
   - Automatically pauses the game clock, plays buzzer sound, and persists `clockTime: 0` to `db.games` in IndexedDB.
   - Ensured `useGameMode.ts` detects zero clock time on tab focus restoration and opens `VerifiedPeriodModal` when `lastVerifiedPeriod < period`.

2. **Quick Edit Roster Live Game On-Court Jersey Collision Guard (`QuickEditRosterDialog.tsx`)**:
   - Enforced validation in `QuickEditRosterDialog.tsx` preventing duplicate jersey numbers across active on-court players and bench players during live quick-edits.
   - Atomically updated `db.teamPlayers`, `db.players`, and `db.games` active roster references upon saving quick roster edits.

3. **Period Transition Lineup Personnel Floor Fallback Substitution Interlock (`useGameMode.ts`)**:
   - Enhanced `handleNextPeriod` in `useGameMode.ts` to evaluate eligible non-disqualified active players (`personalFouls < foulLimit`).
   - If fewer than 5 eligible players remain available on the active team roster, blocks period advancement and renders a high-visibility warning snackbar ("Roster Personnel Floor Violation: Fewer than 5 eligible non-disqualified players available for upcoming period.").

### Test Verification
- All 83 targeted Vitest tests pass cleanly with 100% test pass rate across `useGameClock.test.ts`, `useGameMode.test.ts`, and `QuickEditRosterDialog.test.tsx`.

## October 2026 - FT Sequence Cancellation Rollback, Cold Mount Clock Resync & Intermission Personnel Floor Interlocks

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Multi-Shot Sequence Cancellation Score Snapshot Rollback Guard (`FreeThrowWorkflowDialog.tsx`)**:
   - Consolidated stat deletions, score recalculations (`calculateGameResult`), and clearing `activeFreeThrowState: undefined` inside a single atomic Dexie read-write transaction (`db.transaction("rw", [db.stats, db.games], ...)`).
   - Guaranteed that cancelling an in-flight multi-shot free throw sequence midway soft-deletes any temporary free throw stat events and atomically rolls back team and opponent score snapshot fields in `db.games`.

2. **Scoreboard Live Clock Resync On Cold Mount Hydration Recovery Interlock (`db.ts`, `useGameClock.ts`)**:
   - Extended `Game` schema interface in `db.ts` with optional `isClockRunning` and `lastWallClock` fields.
   - Updated `useGameClock.ts` DB hydration to compute elapsed wall-clock time (`Math.floor((now - g.lastWallClock) / 1000)`) when `isClockRunning === true` on cold mount/reload, updating `clockSeconds` atomically to reflect exact elapsed time and persisting the resynchronized snapshot to `db.games`.

3. **Period Intermission Timer Skipped Lineup Personnel Floor Interlock (`useGameMode.ts`)**:
   - Updated `stopIntermission` and `isIntermission` transition effect in `useGameMode.ts` to evaluate `gameData.onCourtIds` personnel count and eligible active players (`personalFouls < foulLimit`).
   - Automatically opens `QuickSubDialog` (`setIsSubDialogOpen(true)`) and displays a warning snackbar ("Period Intermission Ended: Minimum 5 eligible active players required on court.") if fewer than 5 eligible active players are present on court when an intermission break ends or is skipped.

### Test Verification
- All 99 targeted Vitest unit tests pass cleanly with 100% test pass rate across `FreeThrowWorkflowDialog.test.tsx`, `useGameClock.test.ts`, and `useGameMode.test.ts`.

## October 2026 - FT Sequence Queue Hydration, Disqualified Replacement Prompt & Intermission Auto-Resume Interlocks

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Consecutive Penalty Queue Hydration Interlock (`useGameMode.ts`)**:
   - Expanded session hydration effect in `useGameMode.ts` to inspect `game.pendingFtSequences` when no `activeFreeThrowState` is active.
   - Used `isHydratingQueueRef` guard to prevent redundant concurrent IndexedDB updates during component re-renders.
   - Automatically pops the first queued sequence (`pendingFtSequences[0]`), updates `db.games` to populate `activeFreeThrowState`, and opens `FreeThrowWorkflowDialog`.

2. **Period-Start On-Court Lineup Disqualified Player Replacement Prompt Guard (`ActionControls.tsx`, `useGameMode.ts`)**:
   - Rendered a high-contrast warning banner (`foul-out-warning-banner`) in `ActionControls.tsx` when `isFoulOutConflict` is active and UI is not read-only.
   - Verified that `fouledOutOnCourtPlayer` in `useGameMode.ts` halts clock controls and automatically opens `QuickSubDialog` in forced substitution mode until the disqualified player is replaced.

3. **Period Intermission Timer Countdown Auto-Resume Starting Lineup Verification Interlock (`useGameClock.ts`, `useGameMode.ts`)**:
   - Verified that `stopIntermission()` in `useGameClock.ts` and `useGameMode.ts` clears intermission state on `db.games` and transitions directly into starting lineup verification (`isPreTipState`) for upcoming periods before clock controls are enabled.

### Test Verification
- All 1,819 unit tests across 211 test suites pass cleanly with a 100% test pass rate across `FreeThrowWorkflowDialog.test.tsx`, `useGameMode.test.ts`, `ActionControls.test.tsx`, and `useGameClock.test.ts`.

## October 2026 - FT Substitution Eligibility Interlock, Clock Double-Tap Lock & Sub-Second Precision Persistence

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Substitution Shooter Eligibility Safety Interlock (`FreeThrowWorkflowDialog.tsx`)**:
   - Disabled free throw attempt buttons (Make/Miss) when `isShooterUnavailable` evaluates to `true` (e.g. when the assigned shooter is subbed off or disqualified).
   - Enforces substitute shooter selection from active on-court players before shot attempt controls re-enable.

2. **Scoreboard Live Clock Rapid Toggle Double-Tap State Lock Guard (`useGameClock.ts`)**:
   - Enforced a strict 150ms transition lock window on `handleToggleClock` inside `useGameClock.ts`.
   - Prevents rapid double-tap clock toggles from spawning overlapping timer tick interval instances or IndexedDB write race conditions.

3. **Scoreboard Live Clock Sub-Second Pause Precision Persistence Interlock (`useGameClock.ts`)**:
   - Calculated sub-second remaining time (`Math.round(preciseRemaining * 10) / 10`) when pausing the clock under 60 seconds.
   - Atomically writes and persists the sub-second clock snapshot to `db.games` in IndexedDB on clock pause.

### Test Verification
- All 81 targeted unit tests pass cleanly across `FreeThrowWorkflowDialog.test.tsx`, `QuickSubDialog.test.tsx`, and `useGameClock.test.ts` with 100% test pass rate.

## October 2026 - Inactive Roster Sub Guard, Disqualified FT Shooter Guard & Sub-Second Wall-Clock Resync

### Architectural Decisions & Domain Patterns
1. **Period-Start Active Lineup Inactive Roster Player Substitution Guard (`ActionControls.tsx`, `useGameMode.ts`)**:
   - Added an `inactive-on-court-warning-banner` data-testid banner in `ActionControls.tsx` rendered when `isInactiveOnCourt` is true and UI is not read-only.
   - Updated `handleNextPeriod` in `useGameMode.ts` to check `hasInactivePlayerOnCourt`. If true, displays an error snackbar and opens `QuickSubDialog` in forced substitution mode, blocking period transition until resolved.

2. **Free Throw Sequence Shooter Foul-Out Substitution Prompt Guard (`FreeThrowWorkflowDialog.tsx`, `useGameModeActions.ts`)**:
   - Evaluated designated shooter personal fouls against `foulLimit` upon free throw workflow launch or shooter selection.
   - Displays `disqualified-shooter-warning-banner`, disables Make/Miss shot buttons, and disables Save Sequence until an eligible substitute shooter is selected via `onPlayerSelect`.
   - Updated `useGameModeActions.ts` to clear or prompt for substitute shooter selection when a disqualified player is awarded free throws.

3. **Scoreboard Live Clock Sub-Second Wall-Clock Resync Guard (`useGameClock.ts`)**:
   - Tracked system wall-clock timestamps via `lastWallClockRef` during active timer ticks and clock state transitions.
   - Calculated exact sub-second remaining period time on `visibilitychange` window focus recovery events and pause/resume transitions, resynchronizing `clockSeconds` atomically to `db.games` in IndexedDB.

### Test Verification
- All targeted unit tests pass cleanly across `ActionControls.test.tsx`, `FreeThrowWorkflowDialog.test.tsx`, `useGameMode.test.ts`, and `useGameClock.test.ts` with 100% pass rate.

## October 2026 - FT Score Parity, Zero-Clock Scoring Lock & Intermission Cold Hydration

### Architectural Decisions & Domain Patterns
1. **Free Throw Sequence Unsaved Attempt Score Snapshot Parity Guard (`FreeThrowWorkflowDialog.tsx`)**:
   - Consolidated shot attempt modifications (recording, editing MAKE/MISS, reversing, or changing attempt counts) so that any orphan/truncated saved stats in `db.stats` are deleted and `teamScore` / `oppScore` snapshot fields on `db.games` are recalculated via `calculateGameResult` inside a single atomic Dexie transaction.
   - Guaranteed that modifying free throw attempt results or attempt counts immediately updates total team scores on `Scoreboard.tsx` in real time.

2. **Stat Entry Dialog Zero-Clock Scoring Action Validation Guard (`StatEntryDialog.tsx`)**:
   - Added zero-clock warning banner (`data-testid="zero-clock-scoring-lock-warning"`) in `StatEntryDialog.tsx` rendered when `clockSeconds === 0`.
   - Disabled point selection buttons (1, 2, 3) and Save action controls when `clockSeconds === 0` at period end to prevent post-buzzer stat entries.

3. **Period Intermission Timer Cold Hydration Auto-Resume Interlock (`useGameClock.ts`)**:
   - Enhanced cold mount hydration in `useGameClock.ts` to inspect `g.isIntermission` and `g.intermissionSeconds` from `db.games`.
   - Hydrates `isIntermission`, `intermissionSeconds`, and derives `intermissionLabel` ("HALFTIME" vs "INTERMISSION") on page reloads/cold mounts while respecting manual user overrides (`isIntermissionManuallySetRef`).
   - Persists remaining `intermissionSeconds` to `db.games` during countdown timer ticks.

### Test Verification
- All 97 targeted unit tests across `FreeThrowWorkflowDialog.test.tsx`, `StatEntryDialog.test.tsx`, and `useGameClock.test.ts` pass cleanly with a 100% test pass rate.
