# CourtSight Backlog

## [x] [Strict Foul-Out Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Players who exceed the foul limit must be disqualified to maintain game integrity. Currently, they can remain on court and continue to record stats.
**What:** Implement a blocking validation in the Substitution and Stat entry flows that prevents a fouled-out player from being on court or recording actions.
**Acceptance Criteria:**
- [x] Prevent adding a player to the on-court lineup in the Sub dialog if they have reached the foul limit.
- [x] Automatically trigger a substitution prompt if a player on court commits their disqualifying foul.
- [x] Prevent any non-substitution actions for a player already at the foul limit in StatEntryDialog.
- [x] Visual indicator (e.g., Strike-through or "OUT") on fouled-out players in the lineup and bench lists.

## [x] [Dynamic Period & Overtime Clock Management]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Different levels of play have different period and OT lengths. Hardcoding these leads to incorrect game timing and coach confusion.
**What:** Use the `defaultPeriodLength` and `defaultOvertimeLength` from the Team configuration when starting new periods or overtime.
**Acceptance Criteria:**
- [x] New regulation periods must initialize with the team's `defaultPeriodLength`.
- [x] Overtime periods (Period > 4 for Quarters, > 2 for Halves) must initialize with `defaultOvertimeLength`.
- [x] Ensure the "Next Period" logic correctly identifies if the next period is regulation or overtime.

## [x] [Lineup Integrity Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** A standard basketball game requires exactly 5 players per team on the court. Allowing 4 or 6 players invalidates all lineup-based analytics and breaks core game rules.
**What:** Implement a validation check that prevents starting or resuming a game unless exactly 5 players are assigned to the "On Court" lineup.
**Acceptance Criteria:**
- [x] QuickSubDialog must prevent saving unless exactly 5 players are selected.
- [x] Show a prominent warning HUD if the lineup is illegal (less than or more than 5 players).
- [x] Disable game actions (except substitutions) if the lineup is not exactly 5 players.

## [ ] [Unified Timeout Governance & Data Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Redundant and incorrect mapping (using `team.fouls` for timeouts) creates a "Split-Brain" state where the scoreboard and team configuration disagree. Consolidating this is critical for game management reliability.
**What:** Remove all references to `team.fouls` being used as a timeout limit or count. Standardize on `team.timeoutsPerTeam` and `team.defaultTimeoutLimit`. Implement the `timeoutScope` logic to reset or carry over timeouts at halftime based on the team's configuration.
**Acceptance Criteria:**
- [ ] `MAX_TIMEOUTS` in `useGameAggregator` must prioritize `game.timeoutLimit` then `team.timeoutsPerTeam`.
- [ ] `useTeamActions.ts` and `useGameAggregator.ts` must stop writing to or reading from `team.fouls` for timeout purposes.
- [ ] Implement logic in `useGameAggregator` to reset "Timeouts Left" (TOL) at the start of the 2nd half if `timeoutScope` is set to 'HALF'.
- [ ] Scoreboard `TeamPanel` must display the correct "Timeouts Left" (TOL) for both teams based on these unified fields.

## [ ] [Full-Cycle Possession Arrow Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** While Held Ball triggers are implemented, the arrow must also automate for period starts (alternating possession rule) to be a true digital twin of the official table.
**What:** Implement logic to automatically flip the possession arrow when a new period starts (Period > 1).
**Acceptance Criteria:**
- [x] Automatically flip the arrow direction when a `HELD_BALL` action is recorded.
- [x] Provide a manual override button for the arrow in the `ActionControls`.
- [ ] Automatically flip the arrow direction within the `handleNextPeriod` action in both `useGameClock` hooks (for periods 2, 3, 4, etc.).
- [ ] Ensure the visual directional indicators in `Scoreboard` next to team names reflect the current arrow state accurately.

## [ ] [Game Clock / Period End Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Recording statistical events after the buzzer or when the clock is stopped is a major source of data desynchronization with the official table.
**What:** Implement a safety interlock that prevents recording non-timeout/non-substitution events if the game clock is at 0:00.
**Acceptance Criteria:**
- [ ] Disable the BasketballCourt and StatEntryDialog triggers when clock is 0:00.
- [ ] Show a "Clock Stopped" warning on the StatEntryDialog and block the "Save" button if the user attempts to record a stat while the clock is at 0:00.
- [ ] Ensure Timeout and Substitution actions remain available even when the clock is stopped at 0:00.

## [ ] [Verified Period Reconciliation Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Small discrepancies between the app and the official scorebook accumulate. Forcing a reconciliation at period breaks ensures the app remains the definitive source of truth.
**What:** Launch a "Verified Period" modal at the end of each period (when clock reaches 0:00) that requires the user to confirm the score and team fouls against the official table before advancing.
**Acceptance Criteria:**
- [ ] Automatically display the `VerifiedPeriodModal` when the clock reaches 0:00 and the period has not yet been advanced.
- [ ] Display the current app-calculated score and team fouls for both teams in the modal.
- [ ] Provide "Adjust" buttons that link directly to the `EditGameDialog` or `ActionHistory` for rapid corrections.
- [ ] Block the "Next Period" action until the "Confirm with Official Table" checkbox is checked.

## [ ] [Initial Jump Ball & Start-of-Game Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Every game starts with a jump ball which determines both the first possession and the initial direction of the possession arrow. Currently, the app defaults these, leading to manual correction on every game start.
**What:** Implement a "Start Game" workflow that specifically asks who won the jump ball and initializes the possession and arrow accordingly.
**Acceptance Criteria:**
- [ ] When a game is in Period 1 and Clock is at its maximum, show a "Start Game" button instead of the clock toggle.
- [ ] The "Start Game" button launches a dialog asking "Who won the Jump Ball?".
- [ ] Upon selection, record the initial `POSSESSION` event for the winning team.
- [ ] Initialize the `possessionArrow` to point toward the team that LOST the jump ball.

## [ ] [DEPS] Upgrade jest to 30.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Keep testing infrastructure up to date and benefit from new features/performance improvements in the latest major version.
**What:** Upgrade jest and related packages (@jest/globals, @types/jest, jest-environment-node, ts-jest) to 30.x across backend. (Frontend uses Vitest).
**Acceptance Criteria:**
- [ ] All backend tests pass with Jest 30.
- [ ] No regressions in test reporting or coverage.

## [ ] [Fix Accessibility Violations]
**Priority:** MEDIUM
**Phase:** Maintenance
**Type:** Accessibility
**Why:** Automated checks (jest-axe) have identified critical a11y violations on core pages that impact screen reader users and keyboard navigation.
**What:** Fix violations in `GameMode` and `Teams` pages related to button naming, heading order, and nested interactivity.
**Acceptance Criteria:**
- [ ] Add `aria-label` to all IconButtons in `RecentActionsPanel`, `MatchupAnalyticsCard`, `TrackingModeToolbar`, and `LiveLineupCard`.
- [ ] Resolve nested interactive controls in `EntityRowCard` (Teams page) by ensuring the outer card doesn't trap focus or by restructuring the actions.
- [ ] Fix heading order in `Teams` page (ensure h1-h6 hierarchy is logical).
- [ ] All `assertAccessible` calls in tests pass without `.catch()` blocks.
