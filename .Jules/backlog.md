# CourtSight Backlog

*Last Strategic Audit: August 15, 2026*

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
- [x] In `PlayerWorkflowDialog`, block saving if the entered jersey number is already assigned to another player on the same team.
- [x] Display a clear "Jersey Number Conflict" error message near the input field.
- [x] Add a unit test in `PlayerWorkflowDialog.test.tsx` verifying the duplicate jersey guard.

## [Backend Action Type Alignment]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop (Foundation)
**Type:** Technical Debt / Data Integrity
**Why:** The backend schema currently rejects several action types defined in the frontend (e.g., HOCKEY_ASSIST, FLOOR_DIVE). This causes sync failures and data loss, compromising the "Digital Twin" reliability.
**What:** Update `backend/src/validation.ts` to include all action types defined in the frontend's `ACTION_TYPES` constant.
**Acceptance Criteria:**
- [x] Backend `VALID_ACTION_TYPES` matches Frontend `ACTION_TYPES` (adding `HOCKEY_ASSIST`, `FLOOR_DIVE`, `CHARGE_TAKEN`, `GREAT_CONTEST`, `PAINT_TOUCH`).
- [x] Integration tests in `backend/src/__tests__/stats.test.ts` verify that these new types are accepted.

## [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [x] The clock display (background or border) should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [x] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock on the `Scoreboard`.

## [Dynamic Team Foul Coloration]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches need a pre-attentive signal when a team is approaching the bonus.
**What:** Update the team foul counter on the scoreboard to change color as it approaches the bonus threshold.
**Acceptance Criteria:**
- [x] Foul count color changes to `warning.main` when at `bonusThreshold - 1`.
- [x] Foul count color changes to `error.main` when at `bonusThreshold` or above.

## [Buzzer-Beater Shot Validation UI Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** In standard basketball, high-pressure shots right at the buzzer can determine the game. Scorekeepers often struggle to accurately capture and confirm whether a shot was released before the clock hit 0.0. A structured validation flow is essential for competitive parity.
**What:** Trigger a temporary modal or prompt in `GameMode` when a field goal (MAKE) or free throw is logged within the final 2 seconds of any period (regulation or overtime). This allows the user to explicitly confirm or disallow the bucket based on the official table's ruling before advancing.
**Acceptance Criteria:**
- [x] If a scoring event (`ACTION_TYPES.MAKE`) is recorded with `clockSeconds <= 2` in any period, present a visual validation banner or prompt.
- [x] The prompt must offer two options: "Confirm Basket" (keep stat event) and "Disallow Basket" (automatically delete or omit the event).
- [x] Ensure the period-end confirmation flow highlights any late-period shots for final verification before closing the period.

## [Roster Player Name Uniqueness Constraint]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Duplicate player names on the same team roster lead to extreme confusion in stat logs, voice recognition command resolution, and roster management. Every player's identity must be unassailable.
**What:** Enhance name validation in `PlayerWorkflowDialog` to block saving if a player with the same name (case-insensitive) is already registered on the same team.
**Acceptance Criteria:**
- [x] In `PlayerWorkflowDialog` (identity step), query existing players on the selected team(s).
- [x] If the entered name matches an existing active player's name (case-insensitive), disable the "Next" / "Save" action and show a prominent "Player Name Already Exists" validation error.
- [x] Add unit tests in `PlayerWorkflowDialog.test.tsx` checking that duplicate name entry is rejected with a clear visual validation state.

## [Manual Possession Arrow Toggle & Held Ball Auto-Flip]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Managing possession arrow state during jump balls and held-ball situations is a fundamental rule in non-professional leagues (NFHS/NCAA). The scoreboard must render and manage this arrow accurately.
**What:** Add a visual Possession Arrow indicator to the main Scoreboard that allows manual toggling (by clicking it) and automatically flips whenever a held-ball (`HELD_BALL`) or period-starting possession action is registered.
**Acceptance Criteria:**
- [x] Display an arrow symbol (pointing towards `OUR_TEAM` or `OPPONENT`) near the team names on the `Scoreboard`.
- [x] Clicking the arrow must manually toggle the direction, updating the game state in IndexedDB.
- [x] Registering a `HELD_BALL` stat event during play must automatically flip the current possession arrow direction.

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
- [x] In `PlayerWorkflowDialog` and any roster editors, restrict jersey number input strictly to standard numbers: "00", or single/double digits (0-99). Letters, decimals, and negative values must be blocked.
- [x] Display a clear "Invalid Jersey Number" helper text if non-compliant values are typed.
- [x] Ensure backend validation in `validation.ts` aligns with this pattern by rejecting non-compliant formats.

## [Free-Throw Sequence Guided Flow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** During high-pressure games, scorekeepers frequently lose track of the free throw count and might log events out of order, or attribute them to the wrong player.
**What:** Provide a guided sequence overlay when a free throw foul is recorded, prompting the scorekeeper to input the shooter, and then guiding them through shot-by-shot (Make/Miss) until the sequence is completed.
**Acceptance Criteria:**
- [x] Trigger a guided "Free Throw Sequence" overlay when FOUL_SHOOTING or technical foul shots are registered.
- [x] Guide the user shot-by-shot (e.g., "Shot 1 of 2") with giant, tap-friendly "MAKE" / "MISS" buttons.
- [x] Correctly attribute each shot's result to the selected shooter, update the score, and close automatically when the final shot is completed.

## [Instant Scoreboard Rollback Undo Button]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the fast-paced flow of a game, a scorekeeper might tap the wrong button. Tapping through menus to delete the stat and re-add it causes them to fall behind the live play.
**What:** Add a prominent "Undo last action" button directly on the game mode action panel that instantly rolls back the single most recently recorded stat event (and updates scores/fouls accordingly) with a single tap.
**Acceptance Criteria:**
- [x] Place a visible "Undo" button on the primary `ActionControls` or scoreboard HUD.
- [x] Tapping "Undo" must immediately remove the last recorded stat event from IndexedDB.
- [x] Re-calculate team/player scores, personal fouls, team fouls, and clock status immediately upon rollback.

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

## [x] [Administrative/Bench Team Foul Support]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official basketball rules, certain infractions (like administrative technicals or bench conduct) result in a team foul but cannot be assigned to any of the 5 active players on the court. Forcing scorekeepers to assign these to an active player corrupts player foul-out records.
**What:** Support logging a "Bench / Administrative" foul that increments the team's foul count and bonus status, but does not attribute the foul to any individual player or count toward their personal 5-foul limit.
**Acceptance Criteria:**
- [x] In `StatEntryDialog` or foul logging controls, add an option for "Team / Administrative" as the foul recipient.
- [x] Ensure that selecting this option increments the team foul counter and updates the bonus/double-bonus calculations in `useGameAggregator.ts`.
- [x] Ensure this foul does not increment any individual player's personal fouls or trigger foul-out warnings.

## [Default Roster Template Auto-Load]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Re-entering the names and jerseys of 5-15 players for every single new game is a major source of setup friction. Coaches expect to load their default team roster instantly when starting a new game.
**What:** Provide a "Load Default Roster" action during game setup/creation that automatically populates the roster with all active players previously registered to that team, saving time and preventing manual entry errors.
**Acceptance Criteria:**
- [x] In `AddGameDialog` or the game creation flow, add a "Load Team Roster" checkbox or action.
- [x] When selected, automatically assign all active players associated with the selected `teamId` to the game's active roster list.
- [x] Ensure that players are correctly copied with their registered names and jersey numbers, and that they immediately satisfy the 5-player minimum roster guard.

## [Mandatory Starting Lineup Verification Pre-Tip Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** To prevent recording possession and stint tracking errors from the very start, the scorekeeper must explicitly select and verify exactly 5 active players on the court before the game clock can be run or the opening tip can be completed. This ensures there are no illegal lineups at the initial whistle.
**What:** Add a pre-tip "Starting Lineup Verification" step in `GameMode` that blocks all active gameplay features until a valid 5-player starting lineup is drafted and confirmed.
**Acceptance Criteria:**
- [x] If `period === 1`, game stats are empty, and `clockSeconds` is at its maximum length, show a distinct starting lineup selection panel.
- [x] Block the "START" clock button and prevent the `JumpBallDialog` from opening until exactly 5 team players are selected.
- [x] On user confirmation, record the starting lineup in local storage/IndexedDB and then transition to the jump ball tip-off.

## [Quick-Tap Game Clock Adjustment Buttons]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** During high-intensity game moments, minor clock errors must be corrected instantly. Opening a modal, entering digits, and saving is too slow and causes the scorekeeper to fall behind live play.
**What:** Add single-tap "+1s" and "-1s" adjustment buttons directly on the Scoreboard or game-mode action panel.
**Acceptance Criteria:**
- [ ] Render small "+1s" and "-1s" buttons near the clock in `ActionControls` or the scoreboard HUD.
- [ ] Clicking these buttons must immediately adjust `clockSeconds` by +/- 1 second and persist the new clock time to IndexedDB.
- [ ] Disable these quick-correction buttons while the clock is actively running (to prevent accidental taps) and when the game is in `isReadOnly` mode.
- [ ] Cap the clock at 0 (underflow) and the maximum period length (overflow).

## [Interactive Foul-Out Danger Warning in Substitution and Bench Panels]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** When coaches prepare substitutions, they must know immediately if a player on the bench is in severe foul danger before putting them on the court. Surfacing this inside rotation panels reduces mistakes and helps prevent illegal lineup states.
**What:** Add high-visibility "foul trouble" warnings for bench players within the substitution panel and bench drawer.
**Acceptance Criteria:**
- [ ] In `QuickSubDialog` and bench player selection cards, display a high-contrast warning icon or color code for any player who is within 1 foul of the disqualification limit (`foulLimit - 1`).
- [ ] If a bench player has already reached or exceeded the game's `foulLimit` personal fouls, display a "DISQUALIFIED" tag next to their name.
- [ ] Disable the selection checkbox or sub-in trigger for disqualified players in the drawer, or show an immediate warning dialog.

## [Overtime Transition Dialog and Period Length Configurator]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official rules, games ending in a tie go to Overtime, but different leagues utilize varying OT durations (e.g., 4 minutes for NFHS vs. 5 minutes for NCAA). Providing a guided transition flow allows the scorekeeper to confirm and customize this temporal extension seamlessly.
**What:** Present a transition dialog when regulation ends in a tie, allowing the user to initiate and customize the Overtime period.
**Acceptance Criteria:**
- [ ] Trigger an "Overtime Transition" prompt in the game mode when regulation ends in a tie game (period 4 for Quarters, period 2 for Halves) and period verification is completed.
- [ ] Allow the scorekeeper to enter or edit the Overtime period duration, pre-populating with `team.defaultOvertimeLength` or standard defaults (4 or 5 minutes).
- [ ] On confirmation, transition the clock to the designated OT duration, increment the period number, reset team fouls, and preserve player personal fouls.

## [Roster Player Game-Day Active Toggle]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX / Rosters
**Why:** While a team roster might contain 15 players, often only 7-10 are present on game day. Hiding inactive players from stat logging and substitution panels drastically reduces visual noise and speeds up scorekeeper input during fast transitions.
**What:** Add a toggle list on the game dashboard or setup page allowing the scorekeeper to mark players as active/inactive for that specific game.
**Acceptance Criteria:**
- [ ] Add "Game-Day Roster" checkbox/toggle list next to team players on pre-game setup screen.
- [ ] Players marked as "Inactive" must be excluded from `StatEntryDialog`, `QuickSubDialog`, and lineup selection panels.
- [ ] Retain their roster history but ensure they do not clutter live gameplay interfaces.
- [ ] Enforce that a minimum of 5 players must remain "Active" to save the game-day roster selection.

## [Clock Auto-Stop on Successful Field Goal in Final Minute of Regulation/OT]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official NCAA, NFHS, and FIBA rules, the game clock must automatically stop following any successful field goal (MAKE) in the final minute (under 60.0 seconds) of the 4th quarter/2nd half and any overtime period. Tapping "STOP" manually is error-prone and lags behind real-time play.
**What:** Integrate a clock-stop hook trigger within `useGameClock` or the scoring mutation flow that automatically pauses the running game clock whenever a successful field goal is logged during "Winning Time" (clockSeconds < 60 in period >= maxPeriod).
**Acceptance Criteria:**
- [x] Automatically pause the game clock (set `isClockRunning` to false) when a field goal `ACTION_TYPES.MAKE` (points > 1) is recorded.
- [x] Apply this automation ONLY if the game clock is under 60 seconds (`clockSeconds < 60`) and the period is a final regulation period or overtime period (`period >= maxPeriod`).
- [x] Ensure that this auto-stop does not trigger on free throw makes (points === 1), as the clock is already stopped on whistles for free throws.

## [Roster Player Selection Sync with Persistent Opponent Rosters]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Currently, scorekeepers can enter an opponent's name and logo, but the opponent's roster has to be manually entered from scratch for every game. Adding support to select and pull the active roster of a previously saved persistent Opponent saves significant pre-game prep time and prevents data discrepancies.
**What:** Enhance `AddGameDialog` and the game creation flow to let scorekeepers select a persistent opponent from the existing list, and automatically load/pull that opponent's previously recorded roster (jersey numbers) into the game session's scouting panel.
**Acceptance Criteria:**
- [ ] In `AddGameDialog` step 0, when a persistent opponent is selected from the Autocomplete dropdown, fetch the opponent's saved `roster` (jersey list) from the `opponents` table in IndexedDB.
- [ ] On game creation, populate the game's initial opponent roster tracking state with these persistent jerseys.
- [ ] Ensure that any new opponent jersey added during live play (e.g., via the scouting panel or stat entry) is optionally saved back to the persistent opponent's roster on game completion.

## [Undo History Toast with Re-Apply Option]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** While a single tap "Undo" button rolls back the last action, scorekeepers sometimes accidentally double-tap or undo a valid action in the heat of a fast-paced transition, with no way to recover that lost stat.
**What:** Enhance the Snackbar/Toast notification shown after an "Undo" action is clicked to include a "RE-APPLY" (or Redo) button, allowing the user to restore the deleted event back into IndexedDB immediately with a single click.
**Acceptance Criteria:**
- [ ] When an event is undone via the "Undo" button, do not delete it immediately or mark it permanently; instead, cache the undone stat event in a temporary state variable (`undoneStatCache`).
- [ ] Render a Snackbar with the message "Action Undone" and a "REDO" or "RE-APPLY" button.
- [ ] Clicking "REDO" must restore the cached stat event back to the database with a new or active status, recalculate current scores/fouls, and clear the cache.
- [ ] The cache should be cleared automatically as soon as any new live action is recorded.

## [Technical Foul Penalty Type Differentiation (Class A vs. Class B)]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official NFHS and NCAA rules, Technical Fouls are categorized as Class A (conduct-related) and Class B (administrative/rulebook-related). Class A counts toward the player's personal 5-foul limit and disqualification, whereas Class B does not, although both result in free throw penalties. Currently, all technical fouls are treated identically.
**What:** Split the technical foul logging flow to support "Class A (Conduct)" and "Class B (Administrative)" technical fouls, ensuring correct ruleset enforcement for player disqualifications and team bonus calculations.
**Acceptance Criteria:**
- [ ] In the foul logging screen, when "Technical Foul" is selected, present a toggle or selection for "Class A (Conduct)" vs "Class B (Administrative)".
- [ ] A "Class A" Technical Foul must increment both the player's personal fouls (counting toward their 5-foul limit) and the team's period fouls.
- [ ] A "Class B" Technical Foul must increment the team's period fouls but NOT increment the player's personal fouls.
- [ ] In the `RecentActionsPanel` and stats log, display the distinction clearly as "Class A Tech" or "Class B Tech".

## [Configurable Individual Foul Limit (Disqualification Threshold)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** While standard high school and college rules disqualify a player on 5 personal fouls, professional leagues (NBA/WNBA/FIBA) and recreational/adult leagues sometimes use 6 personal fouls, or even custom limits (e.g., 4 fouls in short games). Currently, the foul limit is hardcoded in some panels or defaults, which limits league adaptability.
**What:** Fully support a configurable individual foul limit at the Game level, ensuring that all UI displays (the Scoreboard Foul Strip, Bench Warnings, Substitution Panel, and the Foul-Out Lineup Interlock) adapt dynamically to the configured limit instead of assuming 5 fouls.
**Acceptance Criteria:**
- [x] In `AddGameDialog` (Step 2 - Settings), allow the user to adjust the "Individual Foul Limit" (defaulting to the team's default limit, but adjustable from 4 to 6).
- [x] Ensure the `foulLimit` is persisted correctly on the `Game` object in IndexedDB.
- [x] Ensure the `TeamPanel`'s Foul Strip uses this dynamic `foulLimit` to calculate and sort the warning threshold (`foulLimit - 1`).
- [x] Ensure the `useGameModeActions` / `Foul-Out Lineup Interlock` stops the clock and forces substitution based on the dynamic `foulLimit` instead of a hardcoded 5 fouls.

## [x] [Completed Game Administrative Restoration (Re-open Guard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** In high-intensity games, a scorekeeper might tap the "End Game" button prematurely. Once finalized, the game is placed into a read-only state, meaning any missing stats or final adjustments cannot be recorded, forcing administrative data loss or complex database overrides.
**What:** Add a "Re-open Game" administrative restoration mechanism inside completed games that lets authorized scorekeepers transition a finalized game (`completed: 1`) back to an active state (`completed: 0`) and resume stat-entry seamlessly.
**Acceptance Criteria:**
- [x] Render a visible "Re-open Game" button or action on the Game Mode screen when the game is in `isReadOnly` or completed state.
- [x] Trigger a confirmation dialog with clear instructions explaining that re-opening will make the game editable and allow live stat-recording to resume.
- [x] On user confirmation, update the game's state in IndexedDB (setting `completed: 0`, and updating `synced: 0`).
- [x] Seamlessly re-load the game tracking interface, re-enabling active action panels, clock controls, and stat-entry buttons.
- [x] Push sync updates to the server to synchronize the restoration status.

## [Period Duration Customization & Preset Configurator]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Different levels of basketball have different period lengths (e.g., 8-minute quarters for high school, 10 minutes for FIBA, 12 minutes for NBA, or 20-minute halves for college). Currently, the system lacks dynamic configuration of period lengths during game setup, forcing users to repeatedly manually adjust the clock during play.
**What:** Introduce a "Period Duration" setting in the game creation/setup interface (Step 2 - Settings of `AddGameDialog`) that allows selecting a preset (e.g., High School 8m, FIBA/College 10m, NBA 12m, NCAA Halves 20m) or entering a custom duration (from 1 to 20 minutes) per period.
**Acceptance Criteria:**
- [x] In `AddGameDialog` (Step 2 - Settings), add a configurable input/dropdown for "Period Length" (in minutes).
- [x] Persist this value as `periodLength` (in minutes) on the `Game` schema in IndexedDB.
- [x] Ensure that `useGameClock` and the scoreboard timer initialize with the configured `periodLength * 60` seconds on the start of any new period.
- [x] Ensure the default period length defaults to 10 minutes if no value is configured, maintaining backwards compatibility.

## [Roster Name & Jersey Quick-Edit during Live Play]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** In amateur and youth leagues, players frequently swap jerseys at the last minute or arrive late, rendering pre-game roster lists inaccurate. Without an in-game editing capability, scorekeepers are forced to record incorrect statistics or completely discard/restart the game session.
**What:** Add a "Quick Edit Roster" drawer or modal accessible directly from the live `GameMode` page, permitting the scorekeeper to edit any player's name and jersey number on-the-fly, or add a late player directly to the game-day roster.
**Acceptance Criteria:**
- [ ] Provide an "Edit Roster" button or menu item inside `GameMode` (e.g., in the tracking toolbar or lineup panels).
- [ ] Clicking it opens a dialog/drawer listing all current game-day roster players with inline text fields for `name` and `jerseyNumber`.
- [ ] Submitting the changes updates the players' definitions in IndexedDB, instantly refreshing the scoreboard, on-court lineup, and stat logging panels.
- [ ] Enforce standard validations inside this quick-editor (blocking duplicate names or duplicate jerseys on the same team in real-time).

## [1-and-1 Free Throw Bonus Ruleset Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Fouls
**Why:** High school (NFHS) and college (NCAA) basketball historically utilize a "1-and-1" bonus structure where the shooter only receives a second free throw attempt if they make the first one. Forcing a second shot on a missed first shot in single bonus situations corrupts statistical accuracy and game flow.
**What:** Integrate "1-and-1" ruleset logic into the `FreeThrowWorkflowDialog`. When a non-shooting team foul is recorded and the team is in the single bonus, the shooting sequence must automatically terminate if the first free throw is a "MISS".
**Acceptance Criteria:**
- [ ] Detect if the game rules specify a 1-and-1 bonus and the defensive team is in the "single bonus" status (bonus active, but not double bonus).
- [ ] When a 1-and-1 free throw sequence is initiated, guide the user through the first free throw.
- [ ] If the user logs the first shot as "MISS", terminate the `FreeThrowWorkflowDialog` sequence immediately, skipping the second shot.
- [ ] If the user logs the first shot as "MAKE", proceed automatically to "Shot 2 of 2".

## [Direct Score Override Point-Correction Tool]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Referees occasionally correct scoring decisions (e.g., changing a 3-pointer to a 2-pointer or correcting a scorer's table mistake) several possessions after the event occurred. Undoing multiple subsequent valid plays to correct the score is slow and causes scorekeepers to fall behind live play.
**What:** Add a direct score correction override mechanism on the main scoreboard. Clicking on either team's score display opens a prompt where the user can directly override the score (adding/subtracting points), which records a `SYSTEM_ADJUSTMENT` action.
**Acceptance Criteria:**
- [ ] Clicking on either the Team or Opponent score display on the scoreboard HUD launches a "Score Adjustment" dialog.
- [ ] Provide simple "+1", "-1", "+2", "-2", "+3", and "-3" buttons or a direct manual numeric override input field.
- [ ] On saving, insert a `SYSTEM_ADJUSTMENT` event to IndexedDB with the adjusted points delta (can be positive or negative) attributed to the correct team.
- [ ] Ensure the scoreboard and all live aggregates update the displayed score instantly without destroying subsequent stat events.

## [Visual and Audible Game Clock End-of-Period Buzz Warning]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** In high-intensity games, scorekeepers can lose track of the clock and attempt to log actions after the period has expired. Clear visual and audible alerts at `00:00.0` prevent illegal late-period logging and provide immediate operational feedback.
**What:** Trigger a high-intensity full-screen visual flash and play a synthesized buzzer sound (using the HTML5 Web Audio API) the exact instant the game clock counts down to `00:00.0`.
**Acceptance Criteria:**
- [ ] When `clockSeconds` reaches exactly `0` while the clock is running, trigger a visual alert overlay/flash stating "PERIOD END" or "BUZZER".
- [ ] Synthesize a standard basketball horn/buzzer sound using the Web Audio API (e.g., oscillator nodes playing high-amplitude low-frequency saw/triangle waves for 1.5 seconds) to avoid external asset dependency issues.
- [ ] Ensure the clock is strictly paused and no further gameplay events (other than buzzer-beater verification or manual adjustments) can be registered without advancing the period.

## [Scoreboard Bonus Status Indicator Lights]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** During high-leverage moments, a coach must instantly see if the opponent is in the bonus or double bonus without looking at the raw team foul number and performing mental ruleset calculations. Simple, high-contrast indicators on the scoreboard HUD are a non-negotiable standard for live game coaching.
**What:** Add dedicated visual status indicators ("B" and "B+" or active lights) for single and double bonus on the main scoreboard HUD.
**Acceptance Criteria:**
- [ ] In `Scoreboard`, render prominent "BONUS" and "DOUBLE BONUS" indicator lights or badges near the team panels.
- [ ] Ensure the indicators activate dynamically based on the calculated team fouls and period config in `useGameAggregator.ts`.
- [ ] Color-code indicators (e.g. warning.main for Bonus, error.main for Double Bonus) using tokens from `useTokens()`.

## [Multi-Period Overtime Tracking & Period Counter Support]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** High-stakes games can go into multiple overtimes (OT1, OT2, OT3). If the system only supports a single overtime or hardcodes period 5 as the only OT, subsequent tied periods will fail to initialize or track, causing the app to crash or freeze.
**What:** Implement support for infinite subsequent overtime periods (period > 5 for Quarters, period > 3 for Halves), incrementing the period counter dynamically and resetting team fouls for each extra period.
**Acceptance Criteria:**
- [ ] Ensure `useGameClock` and `useGameMode` correctly handle transitions to period 6 and beyond (OT2, OT3, etc.) on tie-game finalizations.
- [ ] Dynamically render period labels on the Scoreboard (e.g., "OT2", "OT3") instead of hardcoding "OT".
- [ ] Reset team fouls to 0 at the start of each overtime period, while preserving player personal fouls and previous period's aggregates.

## [Live Scoreboard Offline Persistence and Recovery Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Scorekeepers operate in school gyms with notoriously spotty Wi-Fi. If the browser tab crashes or is accidentally refreshed, the live scoreboard clock, period, scores, and active lineups must be completely recovered from the local IndexedDB state rather than resetting to 0.
**What:** Persist the active, running game state (including current clock time and active lineup) to IndexedDB on every second or major event, and auto-restore this exact state on page reload.
**Acceptance Criteria:**
- [ ] Auto-save the exact state of the running clock (`clockSeconds`), period, and active on-court lineup to the `games` table in IndexedDB on every clock tick or tick interval.
- [ ] On mounting `GameMode`, check for incomplete games and initialize the clock and lineups with the persisted values if present.
- [ ] Add unit tests verifying that the page-reload recovery flow succeeds and restores the correct game status.

## [Opponent Score & Team Foul Quick-Correction Controls]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** When the opponent scores or commits a team foul, the scorekeeper must record it instantly. If they mistakenly attribute it or make an error, they need quick +1/-1 score adjustments and +1/-1 team foul adjustment buttons directly on the opponent's panel of the Scoreboard HUD.
**What:** Add small, non-obtrusive quick-adjustment buttons (+1/-1 score and +1/-1 team fouls) on the opponent's panel of the Scoreboard HUD to prevent having to navigate into complex stat entries or undo flows for simple opponent corrections.
**Acceptance Criteria:**
- [ ] Render small `+`/`-` buttons near the opponent score and opponent team foul counters on the Scoreboard HUD.
- [ ] Clicking these buttons must immediately record or remove the appropriate `SYSTEM_ADJUSTMENT` or `FOUL` event in IndexedDB.
- [ ] Disable quick-correction buttons when the clock is active or if the game is in `isReadOnly` mode.

## [Automated Game Session Lockout on Verification]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Security
**Why:** Once a period's stats are verified and finalized by the head coach or scorekeeper, those specific period events must be permanently locked against accidental modifications or deletions during live play.
**What:** Prevent any deletes, edits, or additions to stat events belonging to completed/verified periods, only allowing modifications via an explicit "Re-open Period" administrative workflow.
**Acceptance Criteria:**
- [ ] In `RecentActionsPanel` and any action controls, disable edit/delete buttons for all events belonging to completed/verified periods.
- [ ] Block new stat entries if their designated period has already been finalized and verified.
- [ ] Provide an explicit, password-protected or double-confirmation "Unlock Period" action for administrators to make previous periods editable again.

## [Halftime Team Foul Reset and Period Transition Alignment]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix / Data Integrity
**Why:** In high school and college halves format, team fouls are accumulated per half (not per period/quarter), meaning they must carry over from Period 1 to Period 2 (which represents the first half), but reset to 0 at the start of the second half (Period 3). Correctly handling halves-vs-quarters resets prevents invalid bonus awards.
**What:** Refactor team foul accumulation in `useGameAggregator.ts` to strictly handle half-based resets for games using the "HALVES" period type.
**Acceptance Criteria:**
- [x] If game period type is "HALVES", aggregate team fouls across Period 1 and Period 2 for the first half, and reset team fouls to 0 at the start of Period 3 (second half).
- [x] If game period type is "QUARTERS", reset team fouls to 0 at the start of every new period (1, 2, 3, 4).
- [x] Ensure that overtime carries over fouls from the final regulation half/quarter as per local rules.
- [x] Add comprehensive unit tests in `useGameAggregator.test.ts` for both halves and quarters formats.

## [Scoreboard Possession Arrow Persistent State Recovery]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** If the live scorekeeper's tab is refreshed, the browser crashes, or a game is resumed from the dashboard, losing the possession arrow state causes operational confusion and official disputes. Restoring this direction on loading the game ensures seamless continuity.
**What:** Persist the current possession arrow direction in the game's schema in IndexedDB on every toggle, and automatically load this direction when initializing the `GameMode` page.
**Acceptance Criteria:**
- [ ] Save the possession arrow state (e.g., pointing to "OUR_TEAM", "OPPONENT", or "NONE") as a field on the `Game` schema in IndexedDB whenever it changes.
- [ ] On mounting the `GameMode` page, retrieve the saved arrow state from the DB and initialize the HUD display with the recovered value.
- [ ] Add unit/integration tests in `useGameMode.test.ts` or a new test verifying that state recovery successfully restores the arrow's correct direction on reload.

## [On-Court Player Roster Protection during Live Play]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix / Data Integrity
**Why:** If a scorekeeper attempts to delete or deactivate a player from the roster who is currently on the court, it corrupts active lineups, play-by-play statistics, and causes frontend crashes.
**What:** Enforce roster protection inside player/roster editing dialogs by blocking deletion or deactivation of players who are currently in the active on-court lineup.
**Acceptance Criteria:**
- [ ] Check if the player is currently in the active 5-player on-court lineup when attempting to delete or deactivate them during live game editing.
- [ ] If on-court, block the delete/deactivate action, display a clear inline validation message stating "Cannot delete/deactivate an active on-court player. Perform a substitution first."
- [ ] Provide unit tests in the roster quick-editor test suite verifying that on-court player deletions are safely prevented.

## [Jump Ball Alternating Possession Period-Start Automation]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official regulations, subsequent periods (quarters 2, 3, 4, and halves 2) do not start with a jump ball; they start with throw-ins determined by the alternating possession arrow. Automating this eliminates the need for manual jump-ball dialogs at the start of every period.
**What:** Detect if the current period is greater than 1 when starting a period, bypass the JumpBall dialog, automatically attribute the period-opening possession according to the possession arrow, and flip the arrow on the first whistle or clock start.
**Acceptance Criteria:**
- [ ] When transitioning into period 2, 3, or 4 (regulation or overtime breaks), bypass opening the `JumpBallDialog` and automatically award inbounds possession to the team designated by the current possession arrow.
- [ ] Render a non-intrusive alert toast indicating "Period started: [Team Name] Possession via Alternating Arrow."
- [ ] Automatically toggle the possession arrow's direction when the period's first gameplay clock tick or subsequent live play event is registered.
- [ ] Add integration tests verifying that period-start throw-in possession is correctly resolved without user-input prompts.

## [Foul Trouble Real-Time Alerts HUD Banner]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** Scorekeepers and coaches are often caught by surprise when a player commits a foul and is suddenly disqualified. Providing a real-time HUD alert banner when a player reaches the warning threshold (`foulLimit - 1`) helps coaches adjust rotations before illegal personnel situations occur.
**What:** Add a prominent, dismissible real-time warning alert banner on the main tracking HUD that displays when any on-court player reaches 4 fouls (or limit - 1).
**Acceptance Criteria:**
- [ ] When a player commits a foul that raises their personal fouls to exactly `foulLimit - 1`, trigger a distinct warning banner on the `GameMode` HUD.
- [ ] The banner should display the player's jersey number, name, and "Foul Trouble (X Fouls)" in a warning-colored, easily legible banner.
- [ ] Allow the scorekeeper to quickly dismiss the banner or auto-dismiss it after 5 seconds of inactive screen state.
- [ ] Verify using unit tests that the alert is rendered correctly and vanishes on click or timeout.

## [Live Clock Synchronization Drift Conflict Resolution]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Technical Debt
**Why:** In spotty Wi-Fi environments, network lag can cause local clock states to drift or get overwritten by older incoming server updates during background syncs, leading to clock time jumps or desynchronizations.
**What:** Implement an explicit clock-drift resolution guard in `syncService` and IndexedDB transactions to ensure that the live, local scorekeeper's clock state is always treated as the absolute source of truth and is never overwritten by background peer-to-peer updates.
**Acceptance Criteria:**
- [ ] Introduce a lock or timestamp-based guard on the `clockSeconds` and `period` updates during background syncs.
- [ ] Reject or drop any incoming sync updates that attempt to modify `clockSeconds` or `period` on a game that is currently being actively tracked/edited locally.
- [ ] Add unit tests in `useSyncBehavior.test.ts` or corresponding sync tests verifying that local clock state is perfectly protected against incoming sync conflicts.

## [ ] [DEPS] Upgrade typescript from 6.0.3 to 7.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Foundational packages should be updated carefully with human supervision to avoid breaking type inference and type safety in both backend and frontend.

## [ ] [DEPS] Upgrade @testing-library/jest-dom from 6.9.1 to 7.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Upgrading test libraries to new major versions requires checking of compatibility with other testing utilities and potentially migrating legacy APIs.

## [ ] [DEPS] Upgrade jest-axe from 10.0.0 to 11.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Upgrading accessibility testing tool requires verifying new rulesets and ensuring that they do not fail active tests.

## [ ] [DEPS] Upgrade jsdom from 29.1.1 to 30.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Major upgrades of jsdom can affect environmental test mockings and happy-dom integrations in frontend.
