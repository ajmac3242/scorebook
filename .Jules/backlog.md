# CourtSight Backlog

## [Finalized Game Immutability Guard (Frontend)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Current frontend logic only checks for `deletedAt`, allowing users to attempt edits on finalized games (`completed: 1`). This creates a "Digital Mirage" where the UI suggests edits are possible but the backend (correctly) rejects them, leading to sync errors and user confusion.
**What:** Update the global `isReadOnly` logic to include `game.completed === 1`. Block all mutation actions (stat entry, edits, deletes, undos, substitutions) in the UI when a game is finalized.
**Acceptance Criteria:**
- [x] Update `useGameMode.ts` and `GameMode.tsx` to include `game.completed === 1` in the `isReadOnly` definition.
- [x] Ensure all "Edit", "Delete", and "Undo" buttons are hidden/disabled when `isReadOnly` is true.
- [x] Disable the "Create Action" triggers (court clicks, button taps) when the game is finalized.

## [Opponent Individual Foul Tracking & Reconciliation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** The `VerifiedPeriodModal` currently only reconciles team-level opponent fouls. Without individual opponent foul reconciliation, we lose the ability to accurately track foul-outs for key opposing players, which is a critical tactical requirement.
**What:** Expand `VerifiedPeriodModal` to include an "Opponent Individual Fouls" section similar to our team's section. Ensure `OpponentScoutingPanel` displays these counts in real-time.
**Acceptance Criteria:**
- [x] Add an "Opponent Player Fouls" section to `VerifiedPeriodModal` using the `OPPONENT:{jersey}` ID format.
- [x] Ensure the backend `SYSTEM_ADJUSTMENT` logic correctly handles individual opponent foul corrections.
- [x] Display individual foul counts for each recorded opponent jersey in the `OpponentScoutingPanel`.

## [Scoreboard Strategic Foul Awareness (FTG & Double Bonus)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** The Scoreboard currently hardcodes the label "BONUS" and lacks "Fouls-to-Give" (FTG) visibility. Coaches need to know *exactly* how many fouls are left before the bonus to manage end-of-quarter physicality.
**What:** Fix the hardcoded "BONUS" label to use the dynamic `teamBonusLabel` from `gameData`. Add a "FTG: X" indicator for both teams when they are under the bonus threshold.
**Acceptance Criteria:**
- [x] Replace hardcoded "BONUS" in `Scoreboard.tsx` with dynamic labels (`BONUS` / `DBL BONUS`).
- [x] Display "FTG: X" next to team fouls when the team is not yet in the bonus.
- [x] Implement a pulse or highlight animation specifically for the "DBL BONUS" state.

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

## [DEPS] Upgrade typescript from 6.0.3 to 7.0.2
**Priority:** CRITICAL
**Phase:** Maintenance
**Type:** Technical Debt
**Why:** TypeScript 7.0.2 is a major version update that may introduce breaking changes and requires careful manual migration.
**What:** Upgrade `typescript` to 7.0.2 in both `backend/` and `frontend/` and fix any type errors or configuration issues.
**Acceptance Criteria:**
- [ ] Both `backend/` and `frontend/` build successfully with TypeScript 7.x.
- [ ] All tests pass.

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
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Final minute pressure is unique. Visual cues help coaches and scorekeepers maintain focus during critical possessions.
**What:** Update the scoreboard clock display to change color and show tenths of a second when under 1:00 in the final period or OT.
**Acceptance Criteria:**
- [ ] Clock font color changes to `error.main` when `clockSeconds < 60` in the final regulation period or any OT.
- [ ] Implement/Use `formatClockWithTenths` utility for high-resolution display during Winning Time on the `Scoreboard`.
