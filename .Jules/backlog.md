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

## [x] [Foul-Out Lineup Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Core Game Loop
**Why:** Allowing a player with 5 fouls (or game limit) to remain on court violates fundamental basketball rules and corrupts stint/lineup data. We must enforce the "Personnel Floor" by blocking the clock if a fouled-out player is on the floor.
**What:** Prevent the game clock from running if any player on the court has reached the personal foul limit.
**Acceptance Criteria:**
- [x] In `useGameMode.ts`, automatically stop the clock and trigger a `QuickSubDialog` (forced mode) when a player reaches the personal foul limit.
- [x] Disable the "START" button in `ActionControls` and display a "Foul Out Conflict" alert if a disqualified player is in the active lineup.
- [x] Ensure the `QuickSubDialog` in forced mode blocks closing until the fouled-out player is replaced.

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

## [Buzzer-Beater Shot Validation UI Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** In standard basketball, high-pressure shots right at the buzzer can determine the game. Scorekeepers often struggle to accurately capture and confirm whether a shot was released before the clock hit 0.0. A structured validation flow is essential for competitive parity.
**What:** Trigger a temporary modal or prompt in `GameMode` when a field goal (MAKE) or free throw is logged within the final 2 seconds of any period (regulation or overtime). This allows the user to explicitly confirm or disallow the bucket based on the official table's ruling before advancing.
**Acceptance Criteria:**
- [ ] If a scoring event (`ACTION_TYPES.MAKE`) is recorded with `clockSeconds <= 2` in any period, present a visual validation banner or prompt.
- [ ] The prompt must offer two options: "Confirm Basket" (keep stat event) and "Disallow Basket" (automatically delete or omit the event).
- [ ] Ensure the period-end confirmation flow highlights any late-period shots for final verification before closing the period.

## [Roster Player Name Uniqueness Constraint]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Duplicate player names on the same team roster lead to extreme confusion in stat logs, voice recognition command resolution, and roster management. Every player's identity must be unassailable.
**What:** Enhance name validation in `PlayerWorkflowDialog` to block saving if a player with the same name (case-insensitive) is already registered on the same team.
**Acceptance Criteria:**
- [ ] In `PlayerWorkflowDialog` (identity step), query existing players on the selected team(s).
- [ ] If the entered name matches an existing active player's name (case-insensitive), disable the "Next" / "Save" action and show a prominent "Player Name Already Exists" validation error.
- [ ] Add unit tests in `PlayerWorkflowDialog.test.tsx` checking that duplicate name entry is rejected with a clear visual validation state.

## [Manual Possession Arrow Toggle & Held Ball Auto-Flip]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Managing possession arrow state during jump balls and held-ball situations is a fundamental rule in non-professional leagues (NFHS/NCAA). The scoreboard must render and manage this arrow accurately.
**What:** Add a visual Possession Arrow indicator to the main Scoreboard that allows manual toggling (by clicking it) and automatically flips whenever a held-ball (`HELD_BALL`) or period-starting possession action is registered.
**Acceptance Criteria:**
- [ ] Display an arrow symbol (pointing towards `OUR_TEAM` or `OPPONENT`) near the team names on the `Scoreboard`.
- [ ] Clicking the arrow must manually toggle the direction, updating the game state in IndexedDB.
- [ ] Registering a `HELD_BALL` stat event during play must automatically flip the current possession arrow direction.

## [Overtime Team Foul Penalty Carried-Over Rule]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under standard high school (NFHS) and collegiate (NCAA) rules, team fouls from the fourth quarter or second half carry over directly into overtime as an extension of that period. Correctly carrying fouls over is critical for bonus and double-bonus enforcement during winning time.
**What:** Ensure that during overtime periods, team fouls from the fourth quarter (for QUARTERS) or second half (for HALVES) are carried over and continue to aggregate in the `eventAggregates` and `getBonusStatus` calculations.
**Acceptance Criteria:**
- [ ] In `useGameAggregator.ts`, when compiling team fouls for overtime periods (period >= 5 for Quarters, >= 3 for Halves), include all team fouls accumulated during the preceding period.
- [ ] Ensure the Scoreboard bonus status (`BONUS` / `DBL BONUS`) updates correctly at the start of overtime based on carried-over fouls.
- [ ] Add integration tests in `useGameAggregator.test.ts` verifying correct overtime team foul carryover.

## [Roster Jersey Format and Limit Validation]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Basketball jersey rules dictate specific number regulations (e.g., standard numbers 00, 0-99; letters or symbols are illegal). Allowing bad input corrupts logs and breaks voice parsing patterns.
**What:** Enforce strict format restrictions on jersey numbers entered during player creation and roster management.
**Acceptance Criteria:**
- [ ] In `PlayerWorkflowDialog` and any roster editors, restrict jersey number input strictly to standard numbers: "00", or single/double digits (0-99). Letters, decimals, and negative values must be blocked.
- [ ] Display a clear "Invalid Jersey Number" helper text if non-compliant values are typed.
- [ ] Ensure backend validation in `validation.ts` aligns with this pattern by rejecting non-compliant formats.

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

## [Free-Throw Sequence Guided Flow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** During high-pressure games, scorekeepers frequently lose track of the free throw count and might log events out of order, or attribute them to the wrong player.
**What:** Provide a guided sequence overlay when a free throw foul is recorded, prompting the scorekeeper to input the shooter, and then guiding them through shot-by-shot (Make/Miss) until the sequence is completed.
**Acceptance Criteria:**
- [ ] Trigger a guided "Free Throw Sequence" overlay when FOUL_SHOOTING or technical foul shots are registered.
- [ ] Guide the user shot-by-shot (e.g., "Shot 1 of 2") with giant, tap-friendly "MAKE" / "MISS" buttons.
- [ ] Correctly attribute each shot's result to the selected shooter, update the score, and close automatically when the final shot is completed.

## [Instant Scoreboard Rollback Undo Button]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the fast-paced flow of a game, a scorekeeper might tap the wrong button. Tapping through menus to delete the stat and re-add it causes them to fall behind the live play.
**What:** Add a prominent "Undo last action" button directly on the game mode action panel that instantly rolls back the single most recently recorded stat event (and updates scores/fouls accordingly) with a single tap.
**Acceptance Criteria:**
- [ ] Place a visible "Undo" button on the primary `ActionControls` or scoreboard HUD.
- [ ] Tapping "Undo" must immediately remove the last recorded stat event from IndexedDB.
- [ ] Re-calculate team/player scores, personal fouls, team fouls, and clock status immediately upon rollback.

## [Period Transition Intermission Clock Automation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** When a quarter or half ends, the scoreboard clock simply stops at 0:00. Scorekeepers must manually track intermission time or guess when to resume, leading to uneven breaks and operational confusion.
**What:** Automatically trigger an intermission/halftime countdown timer (e.g., 2:00 for quarters, 10:00 for halftime) when a period is verified and finalized.
**Acceptance Criteria:**
- [ ] Upon verifying and finalizing a period, automatically transition the scoreboard clock to show an intermission countdown timer (default 2 minutes for quarter breaks, 10 minutes for halftime).
- [ ] Render a clear "INTERMISSION" or "HALFTIME" label on the Scoreboard during the break.
- [ ] When the intermission timer hits 0:00, sound a soft buzzer or visual alert, and transition to the next period's starting lineup verification state.

## [Administrative/Bench Team Foul Support]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official basketball rules, certain infractions (like administrative technicals or bench conduct) result in a team foul but cannot be assigned to any of the 5 active players on the court. Forcing scorekeepers to assign these to an active player corrupts player foul-out records.
**What:** Support logging a "Bench / Administrative" foul that increments the team's foul count and bonus status, but does not attribute the foul to any individual player or count toward their personal 5-foul limit.
**Acceptance Criteria:**
- [ ] In `StatEntryDialog` or foul logging controls, add an option for "Team / Administrative" as the foul recipient.
- [ ] Ensure that selecting this option increments the team foul counter and updates the bonus/double-bonus calculations in `useGameAggregator.ts`.
- [ ] Ensure this foul does not increment any individual player's personal fouls or trigger foul-out warnings.

## [Default Roster Template Auto-Load]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Re-entering the names and jerseys of 5-15 players for every single new game is a major source of setup friction. Coaches expect to load their default team roster instantly when starting a new game.
**What:** Provide a "Load Default Roster" action during game setup/creation that automatically populates the roster with all active players previously registered to that team, saving time and preventing manual entry errors.
**Acceptance Criteria:**
- [ ] In `AddGameDialog` or the game creation flow, add a "Load Team Roster" checkbox or action.
- [ ] When selected, automatically assign all active players associated with the selected `teamId` to the game's active roster list.
- [ ] Ensure that players are correctly copied with their registered names and jersey numbers, and that they immediately satisfy the 5-player minimum roster guard.
