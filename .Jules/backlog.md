# CourtSight Backlog

## [Period-End 'Last Shot' Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** High-leverage buckets at the buzzer are the most frequent source of table discrepancies.
**What:** Implement a "Last Shot" confirmation in the `VerifiedPeriodModal` that specifically asks if the final shot of the period was valid (good) or late (no basket).
**Acceptance Criteria:**
- [x] If a scoring event occurs within the final 2 seconds of a period (`clockTime <= 2`), flag it in the `VerifiedPeriodModal` list with a prominent "BUZZER BEATER" badge.
- [x] Provide a "Late Shot - Remove" button next to these flagged events in the verification list.
- [x] Clicking "Remove" must record a `SYSTEM_ADJUSTMENT` for the points and set the `deletedAt` flag on the original event.

## [Overtime Ruleset Governance]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Rules for timeouts and fouls often change in overtime. Critical for competitive integrity.
**What:** Implement logic to grant an additional timeout at the start of each overtime period and ensure fouls carry over correctly from regulation.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, when advancing to an OT period, automatically record a `REMOVE_TIMEOUT` event to increment `TOL` for both teams by 1.
- [x] In `aggregators.ts`, update `isEventInPeriod` to ensure OT periods are included in the same team foul bucket as the final regulation period (e.g., Period 5 included in Period 4 bucket).

## [Automated Period-Start Possession]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** The alternating possession rule must be enforced at the start of every period except the first. Manual entry is prone to error.
**What:** Automatically record a `POSSESSION` event for the team indicated by the possession arrow when a new period (Period > 1) begins.
**Acceptance Criteria:**
- [x] In `handleNextPeriod` (useGameClock), if `nextPeriod > 1`, record a `POSSESSION` event for the team currently holding the arrow.
- [x] Ensure the arrow correctly flips *after* the possession is awarded for the period start.

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
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Technical Debt
**Why:** Duplicate clock logic in `hooks/useGameClock.ts` and `pages/GameMode/hooks/useGameClock.ts` is a "Split-Brain" risk. Logic drift has already been detected where possession arrow automation and period-end triggers are inconsistently applied.
**What:** Consolidate all game clock management into a single, shared hook in `src/hooks/`.
**Acceptance Criteria:**
- [x] Migrate all unique logic from `pages/GameMode/hooks/useGameClock.ts` (like arrow flipping and persistence) into the shared hook.
- [x] Ensure `GameMode.tsx` and all tests use the unified hook.
- [x] Implement a standardized `clockTime` persistence strategy within the hook to prevent data drift between page-level state and the database.
- [x] Delete the redundant hook file.

## [Action-Clock Interlock (Safety)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** In basketball, the clock stops on every whistle (fouls, violations, timeouts). Manual clock stops are error-prone and slow.
**What:** Implement a safety interlock that automatically pauses the game clock when a FOUL or TIMEOUT event is recorded.
**Acceptance Criteria:**
- [ ] In `useGameModeActions.ts`, trigger a clock pause (`setIsClockRunning(false)`) whenever a foul-type or timeout-type action is saved.
- [ ] Visual feedback (snackbar or highlight) confirming the clock has been stopped for the action.

## [Roster Availability Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** Recording a game without a roster leads to "Ghost Stats" and broken UI components.
**What:** Implement a validation guard that prevents starting the game clock or recording stats if the team roster is empty.
**Acceptance Criteria:**
- [ ] Disable the "Start Clock" button in `Scoreboard` if `players.length === 0`.
- [ ] Show a prominent "Empty Roster" warning with a link to the Roster Management page.

## [Scoreboard Clock 'Winning Time' Styling]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus.
**What:** Update the scoreboard clock display to change color (e.g., to a "Critical" red) and show tenths of a second when the clock is under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [ ] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [ ] Implement `formatClockWithTenths` utility for high-resolution display during Winning Time.

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
