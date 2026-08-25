# Forge Journal 🔨

## Architectural Decisions

- **Connectivity Maps (Assist Network):** Established a pattern of using temporal matching for assists in `calculateAssistNetwork`. Decided that a passer's eFG% within the network should reflect the team's efficiency on those generated shots (e.g., assisting a 3PT results in 1.5 eFG% contribution) rather than just a binary make/miss.
- **xPTS Logic:** Centralized shot quality expected values in `frontend/src/utils/shotZones.ts` using a 2D map of [Zone][Quality]. This allows other agents to easily update the "baseline" as the competitive level of the team changes (e.g., NBA vs High School averages).
- **ROI Metric:** Defined "Shot ROI" as `(Actual / Expected) - 1.0`. This provides a normalized percentage (e.g., +15%) that coaches can use to distinguish between "bad luck" and "bad selection."

## Patterns Established

- **Chained HUD Indicators:** Integrated the xPTS and Paint Touch stats into the `GameMode` sidebar. This establishes a pattern of "Strategic KPIs" that update in real-time alongside the raw score, reinforcing "The Process."
- **Keyboard Shortcuts:** Reserved 'p' for Paint Touches. Shortcuts should be documented in the Stat recording dialog to encourage high-speed tracking.

## Basketball Domain Insights

- **Paint Touch Window:** Settled on a 15-second window for `calculatePaintTouchStats`. This accounts for the time it takes to collapse a defense, kick out, and find the open shooter while still attributing the efficiency gain to the original rim pressure.
- **Shot Clock Phase Definitions:** 'EARLY' (0-10s), 'MID' (10-20s), and 'LATE' (20s+) phases are now standard across the engine for shot rhythm analysis.

## Data Model Decisions

- **StatEvent Extensions:** Leveraged `situation` and `shotClockPhase` fields to drive the new analytics. These fields are critical for separating "Transition" performance from "Half-Court" performance.

## Opponent Foul Tracking Pattern
- **Individual Opponent IDs:** Established the pattern of using `${SPECIAL_PLAYER_IDS.OPPONENT}:${jersey}` for tracking individual opponent players when full roster data is unavailable. Aggregators must proactively extract the jersey number from these IDs for display and reconciliation.
- **Period Reconciliation:** Expanded the `VerifiedPeriodModal` to support two-way reconciliation (Team & Opponent) for both scores and individual fouls, ensuring "Digital Twin" parity at every quarter break.

## Foul-Out Lineup Interlock Pattern
- **Automated Personnel Enforcement:** Established the continuous `useEffect` interlock pattern in `useGameMode.ts` to block play when personal foul limits are breached. Calculating this reactively ensures any entry point of personal fouls (stat recording, workflow completion, reconciliation adjustments) immediately safeguards the integrity of active personnel on the floor.
- **Modal Interlocking constraints:** Configured custom `handleClose` handlers on `QuickSubDialog` to intercept backdrop and escape key events when in forced mode, requiring a substitution before returning to active gameplay.

## Starting Lineup Pre-Tip Interlock Pattern
- **Pre-Tip Setup Enforcement:** Created a robust pre-tip setup phase (`isPreTipState`) active when Period is 1, stats log is empty, and the clock is at starting duration.
- **Starting Lineup Verification Dialog:** Implemented `StartingLineupDialog` which forces the scorekeeper to draft exactly 5 team starting players. Dialog blocks backdrop, escape, and standard closing options.
- **Transactional Lineup Persistence:** Confirming the lineup transactions 5 `SUB_IN` records to IndexedDB in a single pass, resolving the illegal lineup state and transitioning the game directly to the jump-ball tip-off modal.

## Clock Auto-Stop on Successful Field Goal
- **Imperative Stop Trigger:** Applied the Clock Auto-Stop logic imperatively in both `useGameModeActions.ts` (for manual stat entries) and `useGameMode.ts` (for voice commands) rather than reactively. This prevents the "clock restart lock" bug that occurs when a reactive watcher detects a historic make and repeatedly pauses the clock whenever a user attempts to resume play.
- **Winning Time and Ruleset Specificity:** Dynamically evaluated `maxPeriod` (2 for HALVES, 4 for QUARTERS) to enforce standard ruleset behavior correctly under both temporal configurations. Restricted auto-stop to points > 1 to avoid false triggers on free throws (points === 1), which are already played under stopped-clock conditions.

## Completed Game Administrative Restoration (Re-open Guard)
- **Administrative Recovery Workflow:** Implemented a visible "Re-open Game" button as an action inside the read-only warning Alert of finalized games (`completed: 1`), prompting a ConfirmDialog that updates the game status to `completed: 0` and `synced: 0` in IndexedDB and calls `syncService.pushUpdates()`.
- **Reactive Interface Restoration:** Since the `GameMode` page reads the game status reactively via Dexie's `useLiveQuery`, updating the database automatically triggers a re-render. This seamlessly re-loads the tracking interface, re-enabling active action panels, clock controls, and stat-entry buttons without page-reload lag or manual routing.

## Quick-Tap Game Clock Adjustments
- **Clock Adjustment Clamping and Sync:** Added `handleAdjustClock(deltaSeconds: number, periodType?: string)` in `useGameClock.ts` which clamps the clock between 0 and `getPeriodDurationSeconds(...)`, updates Dexie IndexedDB `games.update`, and triggers `syncService.pushUpdates()`.
- **UI Interlock Controls:** Passed `onAdjustClock` through `useGameMode.ts` to `ActionControls.tsx`, rendering single-tap `-1s` and `+1s` buttons adjacent to the clock toggle button. These quick-adjustment buttons are automatically disabled when `isClockRunning`, `isReadOnly`, `isLineupIllegal`, or `isFoulOutConflict` is active.

## Roster Name & Jersey Quick-Edit during Live Play
- **Live Roster Quick Editing:** Implemented `QuickEditRosterDialog` in `frontend/src/pages/GameMode/dialogs/QuickEditRosterDialog.tsx`, exposed via the `TrackingModeToolbar` in `GameMode`. Allows scorekeepers to edit names, update jersey numbers, or add late-arriving players to the roster in real time.
- **Data Integrity & Reactive UI Sync:** Enforces jersey number formats ('00' or 0-99) and checks for duplicate names (case-insensitive) or jerseys before updating `db.players` and `db.teamPlayers` in IndexedDB. Live queries in `useGameMode` immediately update all court, lineup, and stat panels.

## Interactive Foul-Out Danger Warning in Substitution and Bench Panels
- **Substitution Interlock Visual Cues:** Integrated high-contrast `Warning` icons and `DISQUALIFIED` tags into `QuickSubDialog.tsx` for on-court and bench players.
- **Rules Enforcement:** Bench players who are disqualified (`pf >= foulLimit`) have their sub-in selection buttons disabled, preventing illegal personnel entries while keeping their foul state explicitly visible.

## Direct Score Override Point-Correction Tool
- **Direct Score Correction Flow:** Clicking either team's score display on `TeamPanel` / `Scoreboard` opens `ScoreAdjustmentDialog`, offering quick delta buttons (+1, -1, +2, -2, +3, -3) and direct numeric score input.
- **System Adjustment Event Recording:** On confirmation, records a `SYSTEM_ADJUSTMENT` event to IndexedDB with the calculated delta attributed to `SPECIAL_PLAYER_IDS.OUR_TEAM` or `SPECIAL_PLAYER_IDS.OPPONENT`. Live aggregators instantly update displayed totals without affecting existing or subsequent play-by-play stat events.

## Visual and Audible Game Clock End-of-Period Buzz Warning
- **Web Audio Horn Synthesis:** Synthesized a realistic dual-oscillator (sawtooth + triangle) low-frequency basketball buzzer sound in `audioUtils.ts` lasting 1.5 seconds, eliminating external audio asset dependencies.
- **Visual Alert Interlock:** Managed `isBuzzerActive` state in `useGameClock.ts` and `useGameMode.ts`, automatically playing the buzzer sound and triggering a high-contrast, accessible (`role="alert"`, `aria-live="assertive"`) "PERIOD END / BUZZER" visual flash overlay on `Scoreboard.tsx` whenever `clockSeconds` counts down to 0.

## Scoreboard Bonus Status Indicator Lights
- **Visual Indicator Lights & Badges:** Enhanced `TeamPanel.tsx` bonus rendering with glowing indicator lights and high-contrast badges for single bonus ("BONUS" in warning color) and double bonus ("DOUBLE BONUS" in error color with pulse animation and glowing box shadows).
- **Accessible Status Announcements:** Wrapped indicator badges with `role="status"` and team-specific `aria-label` attributes (`aria-label="${name} in double bonus"`), giving coaches and scorekeepers instant pre-attentive feedback during high-leverage situations.

## Multi-Period Overtime Tracking & Period Counter Support
- **Multi-Period Overtime Clock & Transition:** Validated `useGameClock.ts` and `getPeriodDurationSeconds` handling for dynamic, infinite overtime period transitions (period > 4 for QUARTERS, period > 2 for HALVES). Preserved timeouts, alternating possession arrow flips, and clock setting logic across consecutive OT periods (OT1, OT2, OT3...).
- **OT Period Foul Reset Rules:** Verified `isEventInPeriod` in `helpers.ts` and `useGameAggregator.ts` to ensure team fouls reset to 0 at the start of each individual overtime period while player personal fouls carry over and accumulate seamlessly throughout the entire game.

## Live Scoreboard Offline Persistence and Recovery Guard
- **Lineup Persistence Schema:** Added `onCourtIds?: string[]` to the `Game` interface in `frontend/src/db.ts` to support offline storage of active lineups.
- **Clock & Lineup Auto-Save:** Updated `useGameClock.ts` interval to 1000ms to persist `clockTime` and `currentPeriod` continuously while the clock is running. In `useGameMode.ts`, memoized the active lineup signature (`onCourtKey`) to auto-save `onCourtIds` to IndexedDB whenever lineup changes occur without incurring infinite re-render loops.
- **Recovery Fallback in Aggregator:** Enhanced `useGameAggregator.ts` to reconstruct `onCourt` player IDs from `game.onCourtIds` if no substitution events exist in the stat log (e.g. after tab refresh/crash), guaranteeing complete scoreboard and lineup continuity.
