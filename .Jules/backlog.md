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
**What:** Remove all references to `team.fouls` being used as a timeout limit or count. Standardize on `team.timeoutsPerTeam` and `team.defaultTimeoutLimit`. Implement the `timeoutScope` logic to reset or carry over timeouts at halftime based on the team's configuration.
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
- [x] Automatically flip the arrow direction within the `handleNextPeriod` action in `useGameClock` hooks (for periods 2, 3, 4, etc.).
- [x] Ensure the visual directional indicators in `Scoreboard` next to team names reflect the current arrow state accurately.

## [x] [Game Clock / Period End Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Recording statistical events after the buzzer or when the clock is stopped is a major source of data desynchronization with the official table.
**What:** Implement a safety interlock that prevents recording non-timeout/non-substitution events if the game clock is at 0:00.
**Acceptance Criteria:**
- [x] Disable the BasketballCourt and StatEntryDialog triggers when clock is 0:00.
- [x] Show a "Clock Stopped" warning on the StatEntryDialog and block the "Save" button if the user attempts to record a stat while the clock is at 0:00.
- [x] Ensure Timeout and Substitution actions remain available even when the clock is stopped at 0:00.

## [x] [Hardened Score Integrity & 'Ghost Point' Fix]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Current score calculation in `calculateGameResult` ignores `SYSTEM_ADJUSTMENT` events, meaning final game scores will be incorrect if adjustments were made during verification. This creates a discrepancy between the live scoreboard and the finalized record.
**What:** Update `calculateGameResult`, `updateScores`, and `calculateTeamAggregates` in `frontend/src/utils/stats/aggregators.ts` to include `points` from `SYSTEM_ADJUSTMENT` events. Ensure `teamScore` and `oppScore` on the `Game` record are updated correctly in `useStatWriter.ts` upon game completion.
**Acceptance Criteria:**
- [x] `calculateGameResult` must sum `points` from both `MAKE` and `SYSTEM_ADJUSTMENT` events.
- [x] `updateScores` helper in `aggregators.ts` must be updated to process `SYSTEM_ADJUSTMENT` events for both teams.
- [x] `calculateTeamAggregates` in `aggregators.ts` must include `SYSTEM_ADJUSTMENT` points in its scoring logic.
- [x] `endHighGame` in `useStatWriter.ts` must correctly persist the calculated scores to the `Game` table.

## [x] [Standardized Data Correction Action Types]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Current system uses inconsistent "ADJUST_FOUL_REMOVE" labels that are missing from the formal `ACTION_TYPES` constant. Standardizing these ensures statistical aggregators can process corrections deterministically.
**What:** Define formal `REMOVE_FOUL` and `REMOVE_TIMEOUT` action types in `ACTION_TYPES`. Update `handleVerifyPeriod` in `useGameMode.ts` to use these specific types instead of legacy string literals.
**Acceptance Criteria:**
- [x] Add `REMOVE_FOUL` and `REMOVE_TIMEOUT` to `ACTION_TYPES` in `frontend/src/constants/stats.ts`.
- [x] Update `useGameAggregator.ts` to decrement foul and timeout totals when these "REMOVE" types are encountered.
- [x] Refactor `handleVerifyPeriod` in `useGameMode.ts` to use the new `ACTION_TYPES` instead of the `"ADJUST_FOUL_REMOVE"` string literal.

## [x] [Initial Jump Ball Workflow Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Games do not start in a vacuum. Capturing the jump ball winner and initial arrow direction ensures the game starts with 100% data fidelity without immediate manual corrections.
**What:** Implement a one-tap workflow at the start of Period 1 that records the jump ball winner, sets the initial possession, and sets the starting direction of the possession arrow.
**Acceptance Criteria:**
- [x] Automatically prompt for "Jump Ball Winner" when the clock starts for the first time in Period 1 (check `gameStats.length === 0`).
- [x] Automatically record a `POSSESSION` event for the winner.
- [x] Set the `possessionArrow` on the `Game` record to the loser of the jump ball.

## [x] [Proactive Period-End Reconciliation Trigger]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Verification is most accurate when done immediately. Waiting for the user to tap "Next Period" creates a window where discrepancies are forgotten.
**What:** Automatically launch the `VerifiedPeriodModal` in `GameMode.tsx` via `useGameMode.ts` the moment `clockSeconds` reaches 0 at the end of a period.
**Acceptance Criteria:**
- [ ] In `useGameMode.ts`, trigger `setIsVerificationOpen(true)` when `clockSeconds === 0` and the current period is not yet verified.
- [ ] Ensure the `VerifiedPeriodModal` in `frontend/src/pages/GameMode/dialogs/` uses the `disableEscapeKeyDown` prop to prevent bypassing critical reconciliation.

## [ ] [Halftime Ruleset Governance]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Basketball rules change at the half (timeouts reset, team fouls reset). The app must automate these transitions to maintain the "digital twin" of the official table.
**What:** Refine `isEventInPeriod` in `aggregators.ts` to ensure team fouls reset correctly at the half for both QUARTERS (Period 3) and HALVES (Period 2). Ensure `useGameAggregator.ts` timeout logic correctly handles carry-over vs. reset based on `timeoutScope`.
**Acceptance Criteria:**
- [ ] `isEventInPeriod` must correctly isolate fouls per quarter for QUARTERS (periods 1, 2, 3) and group OT with Period 4.
- [ ] `isEventInPeriod` must correctly isolate fouls per half for HALVES (period 1) and group OT with Period 2.
- [ ] Verify `useGameAggregator.ts` correctly resets `teamTOL` and `oppTOL` when the game enters the second half if `timeoutScope === 'HALF'`.

## [x] [Individual Foul Reconciliation Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Discrepancies often occur with *who* committed a foul. Correcting totals is not enough; individual player foul counts must match the official book to ensure accurate foul-out enforcement.
**What:** Expand the `VerifiedPeriodModal` to allow viewing and adjusting individual player foul counts for the period.
**Acceptance Criteria:**
- [ ] Display a list of players who committed fouls during the period in the reconciliation modal.
- [ ] Allow incrementing/decrementing these counts, with adjustments recorded as `SYSTEM_ADJUSTMENT` (type: 'FOUL' or 'REMOVE_FOUL') for that player.

## [ ] [1-and-1 Bonus Free Throw Workflow]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Many leagues (High School/College) use "1-and-1" bonus rules where the second shot is only awarded if the first is made. The current fixed FT workflow cannot handle this.
**What:** Add a "1-and-1" option to the `FreeThrowWorkflowDialog` that dynamically ends the sequence if the first shot is a MISS.
**Acceptance Criteria:**
- [ ] Add "1-and-1" as a shot count option.
- [ ] If "1-and-1" is selected, record the first shot. If MISS, disable/hide the second shot and allow saving. If MAKE, prompt for the second shot.

## [ ] [Verified Timeout Reconciliation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Timeouts Left (TOL) is a critical game state that must be 100% accurate. Discrepancies between the app and the official table can lead to technical fouls.
**What:** Add "Timeouts Left" (TOL) fields for both teams to the `VerifiedPeriodModal` to allow manual reconciliation at period breaks.
**Acceptance Criteria:**
- [ ] Add "Our TOL" and "Opponent TOL" input fields to the reconciliation modal.
- [ ] Adjustments to TOL should be recorded as `SYSTEM_ADJUSTMENT` events of type `TIMEOUT` (to increment usage) or a new `REMOVE_TIMEOUT` type.

## [x] [Illegal Lineup Clock Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Running the clock with an illegal lineup (e.g., 4 players) creates invalid stint and net-rating data.
**What:** Prevent the game clock from starting if the current lineup is illegal (not exactly 5 players).
**Acceptance Criteria:**
- [ ] Disable the "Start Clock" toggle if `isLineupIllegal` is true.
- [ ] Automatically stop the clock and show a warning if a substitution creates an illegal lineup while the clock is running.

## [ ] [Roster Jersey Number Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Jersey numbers are the primary identifier for officials and scorekeepers. Allowing duplicate jersey numbers on the same team or empty numbers causes identification failure and data drift.
**What:** Implement validation in Roster Management that prevents saving a roster with duplicate or missing jersey numbers.
**Acceptance Criteria:**
- [ ] Block "Save Roster" in `ManageRosterDialog` if any two active players share a jersey number.
- [ ] Highlight rows with missing or duplicate jersey numbers in the roster list.
- [ ] Ensure `jerseyMap` in `GameMode` handles edge cases where a player might have been added without a number.

## [ ] [Period-End 'Last Shot' Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** High-leverage buckets at the buzzer are the most frequent source of table discrepancies.
**What:** Implement a "Last Shot" confirmation in the Period Verification workflow that specifically asks if the final shot of the period was valid (good) or late (no basket).
**Acceptance Criteria:**
- [ ] If a scoring event occurs within the final 2 seconds of a period, flag it in the `VerifiedPeriodModal`.
- [ ] Provide a "Late Shot - Remove" button next to buzzer-beater events in the verification list.
- [ ] Ensure the game score is updated immediately upon removal of a late shot.

## [ ] [Overtime Ruleset Governance]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Rules for timeouts and fouls often change in overtime (e.g., extra timeout awarded, fouls do not reset).
**What:** Implement logic to grant an additional timeout at the start of each overtime period and ensure fouls carry over correctly from regulation.
**Acceptance Criteria:**
- [ ] Increment `teamTOL` and `oppTOL` by 1 at the start of Period 5 (Quarters) or Period 3 (Halves).
- [ ] Ensure `useGameAggregator` calculates bonus status correctly in OT by treating OT as an extension of the final regulation period's foul count.

## [ ] [Consolidated Game Clock Hook]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Technical Debt
**Why:** Duplicate clock logic in `hooks/useGameClock.ts` and `pages/GameMode/hooks/useGameClock.ts` is a "Split-Brain" risk.
**What:** Consolidate all game clock management into a single, shared hook in `src/hooks/`.
**Acceptance Criteria:**
- [ ] Migrate all unique logic from `pages/GameMode/hooks/useGameClock.ts` (like arrow flipping) into the shared hook.
- [ ] Ensure `GameMode.tsx` and all tests use the unified hook.
- [ ] Delete the redundant hook file.

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

## [ ] [DEPS] Upgrade @types/node to 26.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep Node.js type definitions up to date.
**What:** Upgrade `@types/node` from 22.x/24.x to 26.x in both backend and frontend.
**Acceptance Criteria:**
- [ ] Backend and frontend build successfully with new types.

## [ ] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Match latest uuid major version.
**What:** Upgrade `@types/uuid` to 11.x in backend.
**Acceptance Criteria:**
- [ ] Backend builds successfully.

## [ ] [DEPS] Upgrade eslint and @eslint/js to 10.x in Frontend
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep linting infrastructure up to date.
**What:** Upgrade `eslint` and `@eslint/js` to 10.x in frontend.
**Acceptance Criteria:**
- [ ] Frontend linting passes with new ESLint version.

## [ ] [DEPS] Upgrade @jest/globals, @types/jest, and jest-environment-node to 30.x in Backend
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Align with planned Jest 30 upgrade.
**What:** Upgrade `@jest/globals`, `@types/jest`, and `jest-environment-node` to 30.x in backend.
**Acceptance Criteria:**
- [ ] Backend tests pass.
