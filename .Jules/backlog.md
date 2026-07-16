# CourtSight Backlog

## [Individual Foul Count Visibility (Scoreboard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because individual counts are buried in sub-panels. Seeing on-court foul counts directly on the main scoreboard is a non-negotiable tactical requirement for rotation management.
**What:** Add a "Foul Strip" to the Scoreboard that lists jerseys and current foul counts for the 5 active players on each team.
**Acceptance Criteria:**
- [x] Add a horizontal or vertical "Foul Strip" to the `TeamPanel` within the `Scoreboard`.
- [x] Highlight any player with 4 fouls (or limit - 1) in a high-contrast warning color.
- [x] Ensure the strip updates in real-time during substitutions and stat entry.

## [Mandatory Roster Minimum Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Starting a game with < 5 players breaks the "Digital Twin" parity and corrupts lineup/stint data from the tip. We must enforce the rule of 5 at the point of game creation and start.
**What:** Block game creation and clock starts if the team roster has fewer than 5 players.
**Acceptance Criteria:**
- [x] Disable the "Create game" button in `AddGameDialog` if `team.players.length < 5`.
- [x] Display a prominent "Roster Incomplete" warning in the `GameMode` setup phase if < 5 players are present.
- [x] In `useGameMode.ts`, prevent the `isJumpBallOpen` state from clearing or the clock from starting if the roster is illegal.

## [Scoreboard Clock 'Winning Time' Styling]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus during critical possessions.
**What:** Update the scoreboard clock display to change color and show tenths of a second when under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [x] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [x] Implement/Use `formatClockWithTenths` utility for high-resolution display during Winning Time on the `Scoreboard`.

## [Foul-Out Lineup Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Allowing a player with 5 fouls (or game limit) to remain on court violates fundamental basketball rules and corrupts stint/lineup data. We must enforce the "Personnel Floor" by blocking the clock if a fouled-out player is on the floor.
**What:** Prevent the game clock from running if any player on the court has reached the personal foul limit.
**Acceptance Criteria:**
- [ ] In `useGameMode.ts`, automatically stop the clock and trigger a `QuickSubDialog` (forced mode) when a player reaches the personal foul limit.
- [ ] Disable the "START" button in `ActionControls` and display a "Foul Out Conflict" alert if a disqualified player is in the active lineup.
- [ ] Ensure the `QuickSubDialog` in forced mode blocks closing until the fouled-out player is replaced.

## [Roster Jersey Number Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** Duplicate jersey numbers on the same team create identification ambiguity for scorekeepers and break voice recognition workflows. Jersey numbers must be unique within a team roster.
**What:** Implement validation in the roster management and player creation workflows to prevent duplicate jersey numbers.
**Acceptance Criteria:**
- [ ] In `PlayerWorkflowDialog`, block saving if the entered jersey number is already assigned to another player on the same team.
- [ ] Display a clear "Jersey Number Conflict" error message near the input field.
- [ ] Add a unit test in `PlayerWorkflowDialog.test.tsx` verifying the duplicate jersey guard.

## [Backend Action Type Alignment]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop (Foundation)
**Type:** Technical Debt / Data Integrity
**Why:** The backend schema currently rejects several action types defined in the frontend (e.g., HOCKEY_ASSIST, FLOOR_DIVE). This causes sync failures and data loss, compromising the "Digital Twin" reliability.
**What:** Update `backend/src/validation.ts` to include all action types defined in the frontend's `ACTION_TYPES` constant.
**Acceptance Criteria:**
- [ ] Backend `VALID_ACTION_TYPES` matches Frontend `ACTION_TYPES` (adding `HOCKEY_ASSIST`, `FLOOR_DIVE`, `CHARGE_TAKEN`, `GREAT_CONTEST`, `PAINT_TOUCH`).
- [ ] Integration tests in `backend/src/__tests__/stats.test.ts` verify that these new types are accepted.

## [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [ ] The clock display (background or border) should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [ ] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock on the `Scoreboard`.

## [Dynamic Team Foul Coloration]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches need a pre-attentive signal when a team is approaching the bonus.
**What:** Update the team foul counter on the scoreboard to change color as it approaches the bonus threshold.
**Acceptance Criteria:**
- [ ] Foul count color changes to `warning.main` when at `bonusThreshold - 1`.
- [ ] Foul count color changes to `error.main` when at `bonusThreshold` or above.

## [DEPS] Upgrade TypeScript to v7.x
**Priority:** CRITICAL
**Phase:** Maintenance
**Type:** Technical Debt
**Why:** TypeScript 7.0.2 is available (currently 6.0.3). Major version upgrades for foundational packages must be handled separately with manual review.
**What:** Upgrade `typescript` to v7.x in both `backend/` and `frontend/` and resolve any new type errors.
**Acceptance Criteria:**
- [ ] `typescript` updated to `^7.0.0` in `backend/package.json`.
- [ ] `typescript` updated to `^7.0.0` in `frontend/package.json`.
- [ ] `pnpm build` succeeds in both directories.
