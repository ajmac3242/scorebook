# CourtSight Backlog

## [x] [Numerical Scoreboard Foul Display]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Coaches require exact numerical team foul counts (not just dots/bonus indicators) on the live scoreboard for precise game management and bonus strategy.
**Status:** [x] COMPLETE

## [x] [Corrected Free Throw Attribution Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** The current free throw workflow incorrectly attributes points to the player who committed the foul (the defender); it must be updated to attribute shots to the player who was fouled (the shooter).
**Status:** [x] COMPLETE

## [x] [1-and-1 Bonus Free Throw Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Many leagues (High School/College) use "1-and-1" bonus rules where the second shot is only awarded if the first is made. Essential for accurate foul strategy.
**Status:** [x] COMPLETE

## [Period-End 'Last Shot' Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** High-leverage buckets at the buzzer are the most frequent source of table discrepancies.
**What:** Implement a "Last Shot" confirmation in the `VerifiedPeriodModal` that specifically asks if the final shot of the period was valid (good) or late (no basket).
**Acceptance Criteria:**
- [ ] If a scoring event occurs within the final 2 seconds of a period (`clockTime <= 2`), flag it in the `VerifiedPeriodModal` list with a prominent "BUZZER BEATER" badge.
- [ ] Provide a "Late Shot - Remove" button next to these flagged events in the verification list.
- [ ] Clicking "Remove" must record a `SYSTEM_ADJUSTMENT` for the points and set the `deletedAt` flag on the original event.

## [Overtime Ruleset Governance]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Rules for timeouts and fouls often change in overtime. Critical for competitive integrity.
**What:** Implement logic to grant an additional timeout at the start of each overtime period and ensure fouls carry over correctly from regulation.
**Acceptance Criteria:**
- [ ] In `useGameClock.ts`, when advancing to an OT period, automatically record a `REMOVE_TIMEOUT` event to increment `TOL` for both teams by 1.
- [ ] In `aggregators.ts`, update `isEventInPeriod` to ensure OT periods are included in the same team foul bucket as the final regulation period (e.g., Period 5 included in Period 4 bucket).

## [Automated Period-Start Possession]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** The alternating possession rule must be enforced at the start of every period except the first. Manual entry is prone to error.
**What:** Automatically record a `POSSESSION` event for the team indicated by the possession arrow when a new period (Period > 1) begins.
**Acceptance Criteria:**
- [ ] In `handleNextPeriod` (useGameClock), if `nextPeriod > 1`, record a `POSSESSION` event for the team currently holding the arrow.
- [ ] Ensure the arrow correctly flips *after* the possession is awarded for the period start.

## [Verified Timeout Reconciliation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Timeouts Left (TOL) is a critical game state that must be 100% accurate.
**What:** Add "Timeouts Left" (TOL) fields for both teams to the `VerifiedPeriodModal` to allow manual reconciliation at period breaks.
**Acceptance Criteria:**
- [ ] Add "Our TOL" and "Opponent TOL" input fields to the reconciliation modal.
- [ ] Adjustments to TOL should be recorded as `TIMEOUT` or `REMOVE_TIMEOUT` events.

## [Scoreboard 'Double Bonus' Visual Differentiation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** There is a major tactical difference between 1-and-1 (Bonus) and 2 shots (Double Bonus). Coaches need to see this distinction at a glance.
**What:** Update the `Scoreboard` and `TeamPanel` to display "BONUS+" or "DBL BONUS" when the double bonus threshold is reached.
**Acceptance Criteria:**
- [ ] In `useGameAggregator`, ensure `teamIsDouble` and `oppIsDouble` are used to set distinct labels.
- [ ] The Scoreboard should display "BONUS" for single bonus and "DOUBLE BONUS" for double bonus.
- [ ] Use a more intense color (e.g., error.main) or a pulse animation for Double Bonus status.

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

## [x] [DEPS] Upgrade jest to 30.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Status:** [x] COMPLETE

## [x] [DEPS] Upgrade @types/node to 26.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE

## [x] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE

## [x] [DEPS] Upgrade eslint and @eslint/js to 10.x in Frontend
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE

## [x] [DEPS] Upgrade @jest/globals, @types/jest, and jest-environment-node to 30.x in Backend
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE

## [Fix Accessibility Violations]
**Priority:** MEDIUM
**Phase:** Maintenance
**Type:** Accessibility
**Why:** Automated checks (jest-axe) have identified critical a11y violations on core pages.
**What:** Fix violations in `GameMode` and `Teams` pages related to button naming, heading order, and nested interactivity.
**Acceptance Criteria:**
- [ ] Add `aria-label` to all IconButtons in `ActionControls`, `Scoreboard`, and `LiveLineupCard`.
- [ ] Resolve nested interactive controls in `LineupPlayerButton`.
- [ ] All `assertAccessible` calls in tests pass.
