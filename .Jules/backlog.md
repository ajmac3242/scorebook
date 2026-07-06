# CourtSight Backlog

## [x] [Action-Clock Interlock (Safety)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** In basketball, the clock stops on every whistle (fouls, violations, timeouts). Manual clock stops are error-prone and slow.
**What:** Implement a safety interlock that automatically pauses the game clock when a FOUL or TIMEOUT event is recorded.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts`, trigger a clock pause (`setIsClockRunning(false)`) whenever a foul-type (FOUL, FOUL_SHOOTING, FOUL_NON_SHOOTING, TECHNICAL_FOUL) or timeout-type (TIMEOUT) action is saved.
- [x] Ensure the pause occurs *before* the stat is finalized in the DB to capture precise clock time.
- [x] Visual feedback (snackbar) confirming: "Clock Paused for Whistle."

## [Finalized Game Immutability Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Once a game is finalized, stats must not be accidentally modified or added.
**What:** Implement a strict global guard that blocks all mutations (adds, updates, deletes) to stats belonging to a `completed: 1` game.
**Acceptance Criteria:**
- [ ] Update `useStatWriter` and `useGameModeActions` to throw an error or block execution if `game.completed === 1`.
- [ ] Ensure all "Edit" and "Delete" UI elements are hidden or disabled in the Game Stats view for completed games.
- [ ] Verify that even manual DB calls are blocked via a Dexie middleware or pre-save hook.

## [Backend API Immutability Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Security
**Why:** Client-side guards can be bypassed. The backend must be the final authority on data immutability for finalized games.
**What:** Update the backend stat resource handlers to reject POST/PUT/DELETE requests if the associated Game entity has `completed: 1`.
**Acceptance Criteria:**
- [ ] Update `backend/src/handlers/stats.ts` to fetch the game record and verify `completed !== 1` before any write.
- [ ] Return `403 Forbidden` with a descriptive error message: "Cannot modify stats for a finalized game."
- [ ] Add integration tests in `backend/src/handlers/__tests__/stats.test.ts` covering this rejection.

## [Opponent Individual Foul Tracking & Reconciliation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Knowing which opponent is in foul trouble is as critical as tracking your own team. Foul-outs change the game's tactical landscape.
**What:** Expand opponent tracking to include individual foul counts for specific jerseys and include them in the `VerifiedPeriodModal`.
**Acceptance Criteria:**
- [ ] Display individual foul counts for each recorded opponent jersey in the `OpponentScoutingPanel`.
- [ ] Add an "Opponent Individual Fouls" section to `VerifiedPeriodModal` similar to the team's section.
- [ ] Trigger a "FOUL TROUBLE" alert for opponent jerseys reaching 4 fouls (or limit - 1).

## [Mandatory Roster Minimum Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** You cannot play a valid basketball game with fewer than 5 players. Starting without a full lineup leads to broken stint calculations.
**What:** Prevent the game from transitioning to "Live" state or starting the clock if the team has fewer than 5 players on the roster.
**Acceptance Criteria:**
- [ ] Disable the "Start Game" button in Game Setup if the roster count < 5.
- [ ] Display a "Roster Incomplete" warning explaining that 5 players are required for valid lineup tracking.

## [Scoreboard 'Fouls-to-Give' Awareness]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Knowing how many fouls remain before the bonus (Fouls-to-Give) is a critical late-game tactical requirement.
**What:** Add a "Fouls to Give" (FTG) indicator to the Scoreboard when a team is not yet in the bonus.
**Acceptance Criteria:**
- [ ] If team fouls < bonus threshold, display "FTG: X" (where X = fouls remaining until bonus).
- [ ] Display this next to the team foul count on the Scoreboard.
- [ ] When FTG reaches 1, highlight it in yellow (`warningScale.main`).

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

## [Individual Foul Count Visibility (Scoreboard)]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because they have to look at a sub-panel. Seeing on-court fouls on the main scoreboard area is a critical tactical requirement.
**What:** Display individual foul counts for all 5 active players directly within or near the team panels on the Scoreboard.
**Acceptance Criteria:**
- [ ] Add a "Foul Strip" to the Scoreboard that lists jerseys and foul counts for the 5 active players.
- [ ] Highlight any player with 4 fouls (or limit - 1) in yellow.

## [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [ ] The clock background should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [ ] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock.
- [ ] State resets once the clock is manually restarted.

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

## [Scoreboard Clock 'Winning Time' Styling]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus.
**What:** Update the scoreboard clock display to change color (e.g., to a "Critical" red) and show tenths of a second when the clock is under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [ ] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [ ] Implement `formatClockWithTenths` utility for high-resolution display during Winning Time.
