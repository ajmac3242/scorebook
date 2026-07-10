# CourtSight Backlog

## [DEPS] Upgrade typescript from 6.0.3 to 7.0.2
**Priority:** CRITICAL
**Phase:** Maintenance
**Type:** Technical Debt
**Why:** TypeScript 7.0.2 is a major version update that may introduce breaking changes and requires careful manual migration.
**What:** Upgrade `typescript` to 7.0.2 in both `backend/` and `frontend/` and fix any type errors or configuration issues.
**Acceptance Criteria:**
- [ ] Both `backend/` and `frontend/` build successfully with TypeScript 7.x.
- [ ] All tests pass.

## [Backend Stat Validation Schema Sync]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** The backend validation schema is missing essential reconciliation and possession-related action types used by the frontend. This causes sync failures for critical game state adjustments.
**What:** Update `backend/src/validation.ts` to include missing Phase 1 action types.
**Acceptance Criteria:**
- [ ] Add `SYSTEM_ADJUSTMENT`, `HELD_BALL`, `REMOVE_FOUL`, and `REMOVE_TIMEOUT` to `VALID_ACTION_TYPES`.
- [ ] Ensure the backend allows these types to facilitate period reconciliation and jump ball possession.

## [Double Bonus Threshold Fix (Quarters)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** The current `BONUS_CONFIG` for Quarters has a double bonus threshold of 999, which effectively disables the double bonus state in regulation play.
**What:** Update `frontend/src/constants/stats.ts` to set the Quarters double bonus threshold to 5 (standard for many leagues).
**Acceptance Criteria:**
- [ ] Set `BONUS_CONFIG.QUARTERS.double` to `5` in `frontend/src/constants/stats.ts`.
- [ ] Verify that `getBonusStatus` correctly returns `isDouble: true` when fouls reach the threshold in Quarters mode.

## [Backend API Immutability Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Client-side guards can be bypassed. The backend must be the final authority on data immutability for finalized games to ensure historical integrity.
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

## [Individual Foul Count Visibility (Scoreboard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because they have to look at a sub-panel. Seeing on-court fouls on the main scoreboard area is a critical tactical requirement.
**What:** Display individual foul counts for all 5 active players directly within or near the team panels on the Scoreboard.
**Acceptance Criteria:**
- [ ] Add a "Foul Strip" to the Scoreboard that lists jerseys and foul counts for the 5 active players.
- [ ] Highlight any player with 4 fouls (or limit - 1) in yellow.
- [ ] Ensure the display updates in real-time as fouls are recorded.

## [Scoreboard Strategic Foul Awareness (FTG & Double Bonus)]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Knowing "Fouls-to-Give" (FTG) and distinguishing between Bonus and Double Bonus is critical for late-game strategy and free-throw preparation.
**What:** Add a "Fouls to Give" indicator and update visual state for Double Bonus on the Scoreboard.
**Acceptance Criteria:**
- [ ] If team fouls < bonus threshold, display "FTG: X" next to team fouls.
- [ ] Display "BONUS" for single bonus and "DBL BONUS" for double bonus with distinct styling (e.g. pulse for Double Bonus).
- [ ] When FTG reaches 1, highlight the indicator in yellow.

## [Finalized Game Immutability Guard (Frontend)]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Once a game is finalized, stats must not be accidentally modified or added through the UI, preserving the official record.
**What:** Implement a strict global guard that blocks all mutations to stats belonging to a `completed: 1` game.
**Acceptance Criteria:**
- [ ] Update `useStatWriter` and `useGameModeActions` to block execution if `game.completed === 1`.
- [ ] Ensure all "Edit", "Delete", and "Undo" UI elements are hidden or disabled in the Game Stats view for completed games.
- [ ] Disable the "Save" button in any stat entry dialog if the game is completed.

## [Mandatory Roster Minimum Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** You cannot play a valid basketball game with fewer than 5 players. Starting without a full lineup leads to broken stint calculations.
**What:** Prevent the game from transitioning to "Live" state or starting the clock if the team has fewer than 5 players on the roster.
**Acceptance Criteria:**
- [ ] Disable the "Start Game" button in Game Setup if the roster count < 5.
- [ ] Display a "Roster Incomplete" warning explaining that 5 players are required for valid lineup tracking.

## [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [ ] The clock background should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [ ] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock.

## [Scoreboard Clock 'Winning Time' Styling]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus during critical possessions.
**What:** Update the scoreboard clock display to change color and show tenths of a second when under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [ ] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [ ] Implement `formatClockWithTenths` utility for high-resolution display during Winning Time.
