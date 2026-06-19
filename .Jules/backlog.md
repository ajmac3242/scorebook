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

## [ ] [Timeout and Bonus Configuration Mapping]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Incorrect field mapping (using `fouls` for timeouts) causes the scoreboard to display wrong timeout counts. Bonus logic must also be configurable per team.
**What:** Correct `useGameAggregator` to use `timeoutsPerTeam` for timeout limits and ensure bonus logic uses the `teamFoulsToBonus` and `teamFoulsToDoubleBonus` thresholds from the team config.
**Acceptance Criteria:**
- [ ] `MAX_TIMEOUTS` in `useGameAggregator` must use `team.timeoutsPerTeam`.
- [ ] Bonus/Double Bonus indicators in `getBonusStatus` must respect team-specific thresholds if present, falling back to defaults.
- [ ] Scoreboard `TeamPanel` must display the correct "Timeouts Left" (TOL) based on the correct limit.

## [ ] [Automated Possession Arrow Logic]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** The possession arrow is a critical part of officiating (alternating possession). Manually tracking it is prone to error and distracts from game flow.
**What:** Implement a "Possession Arrow" that automatically flips when a "Held Ball" or "Jump Ball" event is recorded, or at the start of periods.
**Acceptance Criteria:**
- [ ] Add `HELD_BALL` to `ACTION_TYPES`.
- [ ] Display a directional "Possession Arrow" icon next to team names in the Scoreboard.
- [ ] Automatically flip the arrow direction when a `HELD_BALL` action is recorded.
- [ ] Provide a manual override button for the arrow in the `ActionControls`.

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
