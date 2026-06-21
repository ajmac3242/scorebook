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

## [x] [Unified Timeout Governance & Data Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Redundant and incorrect mapping (using `team.fouls` for timeouts) creates a "Split-Brain" state where the scoreboard and team configuration disagree. Consolidating this is critical for game management reliability.
**What:** Remove all references to `team.fouls` being used as a timeout limit. Standardize on `team.timeoutsPerTeam` and `team.defaultTimeoutLimit`. Ensure the `useGameAggregator` and `useTeamActions` hooks are perfectly aligned.
**Acceptance Criteria:**
- [x] `MAX_TIMEOUTS` in `useGameAggregator` must prioritize `game.timeoutLimit` then `team.timeoutsPerTeam`.
- [x] `useTeamActions.ts` must stop writing to `team.fouls` when updating timeout settings.
- [x] Scoreboard `TeamPanel` must display the correct "Timeouts Left" (TOL) based on these unified fields.

## [x] [Full-Cycle Possession Arrow Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** While Held Ball triggers are implemented, the arrow must also automate for period starts (alternating possession rule) to be a true digital twin of the official table.
**What:** Implement logic to automatically flip the possession arrow when a new period starts (Period > 1).
**Acceptance Criteria:**
- [x] Automatically flip the arrow direction when a `HELD_BALL` action is recorded.
- [x] Provide a manual override button for the arrow in the `ActionControls`.
- [x] Automatically flip the arrow direction when the `handleNextPeriod` action is executed (for periods 2, 3, 4, etc.).
- [x] Visual directional indicators in `Scoreboard` next to team names must reflect the current arrow state.

## [x] [Active Substitution Trigger for Disqualified Players]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** A disqualified player must leave the floor immediately. Relying on manual intervention creates windows of illegal game state where points or fouls could be recorded for a player who is technically out.
**What:** When a player on court reaches the foul limit via a recorded StatEvent, the app must automatically launch the QuickSubDialog with that player selected to be subbed out, blocking all other actions until a valid lineup is restored.
**Acceptance Criteria:**
- [x] Automatically trigger QuickSubDialog when a player's foul count reaches the limit (Team.foulLimit).
- [x] Pre-select the fouled-out player in the "Sub Out" slot.
- [x] Prevent closing the dialog until a replacement is selected.

## [x] [Game Clock / Period End Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Recording statistical events after the buzzer or when the clock is stopped is a major source of data desynchronization with the official table.
**What:** Implement a safety interlock that prevents recording non-timeout events if the game clock is at 0:00 or if the clock is stopped (with a bypass for pre-buzzer "live" actions).
**Acceptance Criteria:**
- [x] Disable the BasketballCourt and StatEntryDialog triggers when clock is 0:00.
- [x] Show a "Clock Stopped" warning on the StatEntryDialog if the user attempts to record a stat while the clock is not running.
- [x] Ensure Timeout and Substitution actions remain available even when the clock is stopped.

## [x] [Team Timeout Reset and Scope Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Current logic incorrectly maps `team.fouls` to timeouts and lacks "Half vs Game" scope enforcement. Incorrect timeout counts can lead to illegal coaching advantages or lost opportunities in clutch time.
**What:** Correct the `useGameAggregator` to use `team.timeoutsPerTeam` and implement the `timeoutScope` logic to reset or carry over timeouts at halftime based on the team's configuration.
**Acceptance Criteria:**
- [x] Fix `MAX_TIMEOUTS` in `useGameAggregator` to reference `team.timeoutsPerTeam` instead of `team.fouls`.
- [x] Implement logic to reset "Timeouts Left" (TOL) at the start of the 2nd half if `timeoutScope` is set to 'HALF'.
- [x] Display the "TOL" count accurately on the Scoreboard for both teams.

## [ ] [DEPS] Upgrade jest to 30.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Keep testing infrastructure up to date and benefit from new features/performance improvements in the latest major version.
**What:** Upgrade jest and related packages (@jest/globals, @types/jest, jest-environment-node, ts-jest) to 30.x across backend. (Frontend uses Vitest).
**Acceptance Criteria:**
- [ ] All backend tests pass with Jest 30.
- [ ] No regressions in test reporting or coverage.

## [ ] [DEPS] Upgrade @types/node to 25.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Align with the latest Node.js type definitions.
**What:** Upgrade @types/node to 25.x in both backend and frontend. Current backend: 22.13.4, Current frontend: 24.12.2.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in both directories.

## [ ] [DEPS] Upgrade eslint-plugin-jsdoc to 63.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Keep documentation linting rules current.
**What:** Upgrade eslint-plugin-jsdoc to 63.x. Current: 62.9.0.
**Acceptance Criteria:**
- [ ] pnpm lint passes with no new errors.

## [ ] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Keep uuid type definitions current. Note: uuid@11.0.0 is deprecated, investigate alternative or higher version.
**What:** Upgrade @types/uuid to 11.x in backend. Current: 10.0.0.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in backend.

## [ ] [DEPS] Upgrade @mui dependencies to 9.1.x+
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Stay current with MUI features and fixes.
**What:** Upgrade @mui/material, @mui/icons-material to 9.1.1+, and @mui/x-date-pickers to 9.5.0+. Note: 9.1.1 caused a regression in Vitest during the last update attempt.
**Acceptance Criteria:**
- [ ] Frontend tests pass with new MUI versions.
- [ ] Build and lint pass.

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
