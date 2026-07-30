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
