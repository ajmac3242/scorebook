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

## [Opponent Individual Foul Tracking & Reconciliation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Knowing which opponent is in foul trouble is as critical as tracking your own team. Foul-outs change the game's tactical landscape.
**What:** Expand opponent tracking to include individual foul counts for specific jerseys and include them in the `VerifiedPeriodModal`.
**Acceptance Criteria:**
- [ ] Track personal fouls per opponent jersey number (e.g., `OPPONENT:12`) in the state.
- [ ] Display individual foul counts for each recorded opponent jersey in the `OpponentScoutingPanel`.
- [ ] Add an "Opponent Individual Fouls" section to `VerifiedPeriodModal` allowing for reconciliation of opponent player fouls.
- [ ] Trigger a "FOUL TROUBLE" alert for opponent jerseys reaching 4 fouls (or limit - 1).

## [Individual Foul Count Visibility (Scoreboard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because they have to look at a sub-panel. Seeing on-court fouls on the main scoreboard area is a critical tactical requirement.
**What:** Display individual foul counts for all 5 active players directly within or near the team panels on the Scoreboard.
**Acceptance Criteria:**
- [ ] Add a "Foul Strip" to the Scoreboard that lists jerseys and foul counts for the 5 active players on each team.
- [ ] Highlight any player with 4 fouls (or limit - 1) in yellow/warning color.
- [ ] Ensure the display updates in real-time as fouls are recorded or adjusted.

## [Finalized Game Immutability Guard (Frontend)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Once a game is finalized, stats must not be accidentally modified or added through the UI, preserving the official record.
**What:** Implement a strict global guard that blocks all mutations to stats belonging to a `completed: 1` game.
**Acceptance Criteria:**
- [ ] Update `useGameModeActions.ts` to block execution of all "handleSave", "handleDelete", and "handleUndo" actions if `game.completed === 1`.
- [ ] Ensure all "Edit", "Delete", and "Undo" UI elements (e.g., in `RecentActionsPanel`) are hidden or disabled in the Game Mode view for completed games.
- [ ] Disable the "Save" button in `StatEntryDialog` and all other action dialogs (Jump Ball, Free Throw, etc.) if the game is completed.

## [Mandatory Roster Minimum Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** You cannot play a valid basketball game with fewer than 5 players. Starting without a full lineup leads to broken stint calculations and invalid data.
**What:** Prevent the game from transitioning to "Live" state or starting the clock if the team has fewer than 5 players on the roster.
**Acceptance Criteria:**
- [ ] Disable the "Create game" button in `AddGameDialog` if the team roster count < 5.
- [ ] Display a "Roster Incomplete" warning in the Setup/Game Mode screens explaining that 5 players are required for valid lineup tracking.
- [ ] In `GameMode.tsx`, show a prominent alert if the game is accessed with < 5 players on the roster.

## [Scoreboard Strategic Foul Awareness (FTG & Double Bonus)]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Knowing "Fouls-to-Give" (FTG) and distinguishing between Bonus and Double Bonus is critical for late-game strategy and free-throw preparation.
**What:** Add a "Fouls to Give" indicator and update visual state for Double Bonus on the Scoreboard.
**Acceptance Criteria:**
- [ ] If team fouls < bonus threshold, display "FTG: X" (where X is fouls remaining until bonus) next to team fouls on the `Scoreboard`.
- [ ] Update `Scoreboard` to display "BONUS" for single bonus and "DBL BONUS" for double bonus.
- [ ] Implement a distinct styling (e.g., pulse or high-contrast background) specifically for the "DBL BONUS" state.

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
