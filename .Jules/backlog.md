# CourtSight Backlog

## [Numerical Scoreboard Foul Display]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Coaches require exact numerical team foul counts (not just dots/bonus indicators) on the live scoreboard for precise game management and bonus strategy.
**What:** Add numerical "Team Fouls" displays to both team panels on the Scoreboard header.
**Acceptance Criteria:**
- [ ] Display the current team foul count as a number next to the team name or score on the Scoreboard.
- [ ] Ensure the number updates in real-time as fouls are recorded or removed.
- [ ] Visual styling should match the high-contrast TV-style scoreboard.

## [Corrected Free Throw Attribution Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** The current free throw workflow incorrectly attributes points to the player who committed the foul (the defender); it must be updated to attribute shots to the player who was fouled (the shooter).
**What:** Modify `FreeThrowWorkflowDialog` and the triggering logic to ensure the `playerId` passed is the shooter, not the defender.
**Acceptance Criteria:**
- [ ] Ensure `StatEntryDialog` and `FreeThrowWorkflowDialog` attribute FT attempts and makes to the offensive player being fouled.
- [ ] Fix any logic in `useGameModeActions` where `FOUL_SHOOTING` might be conflating the foul-committer with the shot-taker.

## [1-and-1 Bonus Free Throw Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Many leagues (High School/College) use "1-and-1" bonus rules where the second shot is only awarded if the first is made. Essential for accurate foul strategy.
**What:** Add a "1-and-1" option to the `FreeThrowWorkflowDialog` that dynamically ends the sequence if the first shot is a MISS.
**Acceptance Criteria:**
- [ ] Add "1-and-1" as a shot count option in `FreeThrowWorkflowDialog`.
- [ ] If "1-and-1" is selected, record the first shot. If MISS, disable/hide the second shot and allow saving. If MAKE, prompt for the second shot.

## [Period-End 'Last Shot' Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** High-leverage buckets at the buzzer are the most frequent source of table discrepancies.
**What:** Implement a "Last Shot" confirmation in the `VerifiedPeriodModal` that specifically asks if the final shot of the period was valid (good) or late (no basket).
**Acceptance Criteria:**
- [ ] If a scoring event occurs within the final 2 seconds of a period (`clockTime <= 2`), flag it in the `VerifiedPeriodModal` list as a "Buzzer Beater".
- [ ] Provide a "Late Shot - Remove" button next to buzzer-beater events in the verification list.
- [ ] Ensure the game score is updated immediately upon removal of a late shot via a `SYSTEM_ADJUSTMENT` event.

## [Overtime Ruleset Governance]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Rules for timeouts and fouls often change in overtime (e.g., extra timeout awarded, fouls do not reset). Critical for competitive integrity.
**What:** Implement logic to grant an additional timeout at the start of each overtime period and ensure fouls carry over correctly from regulation.
**Acceptance Criteria:**
- [ ] Increment `teamTOL` and `oppTOL` by 1 at the start of Period 5 (Quarters) or Period 3 (Halves).
- [ ] Ensure `useGameAggregator` calculates bonus status correctly in OT by treating OT as an extension of the final regulation period's foul count.

## [Verified Timeout Reconciliation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Timeouts Left (TOL) is a critical game state that must be 100% accurate. Discrepancies between the app and the official table can lead to technical fouls.
**What:** Add "Timeouts Left" (TOL) fields for both teams to the `VerifiedPeriodModal` to allow manual reconciliation at period breaks.
**Acceptance Criteria:**
- [ ] Add "Our TOL" and "Opponent TOL" input fields to the reconciliation modal.
- [ ] Adjustments to TOL should be recorded as `TIMEOUT` (to increment usage) or `REMOVE_TIMEOUT` events.

## [Consolidated Game Clock Hook]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Technical Debt
**Why:** Duplicate clock logic in `hooks/useGameClock.ts` and `pages/GameMode/hooks/useGameClock.ts` is a "Split-Brain" risk.
**What:** Consolidate all game clock management into a single, shared hook in `src/hooks/`.
**Acceptance Criteria:**
- [ ] Migrate all unique logic from `pages/GameMode/hooks/useGameClock.ts` (like arrow flipping) into the shared hook.
- [ ] Ensure `GameMode.tsx` and all tests use the unified hook.
- [ ] Delete the redundant hook file.

## [DEPS] Upgrade jest to 30.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Why:** Keep testing infrastructure up to date and benefit from new features/performance improvements in the latest major version.
**What:** Upgrade jest and related packages (@jest/globals, @types/jest, jest-environment-node, ts-jest) to 30.x across backend. (Frontend uses Vitest).
**Acceptance Criteria:**
- [ ] All backend tests pass with Jest 30.
- [ ] No regressions in test reporting or coverage.

## [Fix Accessibility Violations]
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

## [DEPS] Upgrade @types/node to 26.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep Node.js type definitions up to date.
**What:** Upgrade `@types/node` from 22.x/24.x to 26.x in both backend and frontend.
**Acceptance Criteria:**
- [ ] Backend and frontend build successfully with new types.

## [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Match latest uuid major version.
**What:** Upgrade `@types/uuid` to 11.x in backend.
**Acceptance Criteria:**
- [ ] Backend builds successfully.

## [DEPS] Upgrade eslint and @eslint/js to 10.x in Frontend
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep linting infrastructure up to date.
**What:** Upgrade `eslint` and `@eslint/js` to 10.x in frontend.
**Acceptance Criteria:**
- [ ] Frontend linting passes with new ESLint version.

## [DEPS] Upgrade @jest/globals, @types/jest, and jest-environment-node to 30.x in Backend
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Align with planned Jest 30 upgrade.
**What:** Upgrade `@jest/globals`, `@types/jest`, and `jest-environment-node` to 30.x in backend.
**Acceptance Criteria:**
- [ ] Backend tests pass.
