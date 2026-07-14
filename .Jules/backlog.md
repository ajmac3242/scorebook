# CourtSight Backlog

## [Individual Foul Count Visibility (Scoreboard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because individual counts are buried in sub-panels. Seeing on-court foul counts directly on the main scoreboard is a non-negotiable tactical requirement for rotation management.
**What:** Add a "Foul Strip" to the Scoreboard that lists jerseys and current foul counts for the 5 active players on each team.
**Acceptance Criteria:**
- [ ] Add a horizontal or vertical "Foul Strip" to the `TeamPanel` within the `Scoreboard`.
- [ ] Highlight any player with 4 fouls (or limit - 1) in a high-contrast warning color.
- [ ] Ensure the strip updates in real-time during substitutions and stat entry.

## [Mandatory Roster Minimum Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Starting a game with < 5 players breaks the "Digital Twin" parity and corrupts lineup/stint data from the tip. We must enforce the rule of 5 at the point of game creation and start.
**What:** Block game creation and clock starts if the team roster has fewer than 5 players.
**Acceptance Criteria:**
- [ ] Disable the "Create game" button in `AddGameDialog` if `team.players.length < 5`.
- [ ] Display a prominent "Roster Incomplete" warning in the `GameMode` setup phase if < 5 players are present.
- [ ] In `useGameMode.ts`, prevent the `isJumpBallOpen` state from clearing or the clock from starting if the roster is illegal.

## [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [ ] The clock background should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [ ] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock on the `Scoreboard`.

## [Scoreboard Clock 'Winning Time' Styling]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus during critical possessions.
**What:** Update the scoreboard clock display to change color and show tenths of a second when under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [ ] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [ ] Implement/Use `formatClockWithTenths` utility for high-resolution display during Winning Time on the `Scoreboard`.

## [Dynamic Team Foul Coloration]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches need a pre-attentive signal when a team is approaching the bonus.
**What:** Update the team foul counter on the scoreboard to change color as it approaches the bonus threshold.
**Acceptance Criteria:**
- [ ] Foul count color changes to `warning.main` when at `bonusThreshold - 1`.
- [ ] Foul count color changes to `error.main` when at `bonusThreshold` or above.

## [DEPS] Upgrade typescript from 6.0.3 to 7.0.2
**Priority:** CRITICAL
**Phase:** Maintenance
**Type:** Technical Debt
**Why:** TypeScript 7.0.2 is a major version update that may introduce breaking changes and requires careful manual migration.
**What:** Upgrade `typescript` to 7.0.2 in both `backend/` and `frontend/` and fix any type errors or configuration issues.
**Acceptance Criteria:**
- [ ] Both `backend/` and `frontend/` build successfully with TypeScript 7.x.
- [ ] All tests pass.

## [Backend Action Type Alignment]
**Priority:** MEDIUM
**Phase:** Maintenance
**Type:** Technical Debt
**Why:** The frontend tracks specialized "hustle" and tactical events (HOCKEY_ASSIST, FLOOR_DIVE, CHARGE_TAKEN, GREAT_CONTEST, PAINT_TOUCH) that are currently missing from the backend validation schema. This prevents these high-value tactical stats from being synced.
**What:** Update `backend/src/validation.ts` to include all action types defined in the frontend's `ACTION_TYPES` constant.
**Acceptance Criteria:**
- [ ] Backend `VALID_ACTION_TYPES` matches Frontend `ACTION_TYPES`.
- [ ] Sync tests pass for these specialized events.
