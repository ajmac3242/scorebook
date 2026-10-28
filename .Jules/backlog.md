# CourtSight Backlog

*Last Strategic Audit: October 28, 2026*

## [x] [Individual Foul Count Visibility (Scoreboard)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches often miss when a key player is in foul trouble because individual counts are buried in sub-panels. Seeing on-court foul counts directly on the main scoreboard is a non-negotiable tactical requirement for rotation management.
**What:** Add a "Foul Strip" to the Scoreboard that lists jerseys and current foul counts for the 5 active players on each team.
**Acceptance Criteria:**
- [x] Add a horizontal or vertical "Foul Strip" to the `TeamPanel` within the `Scoreboard`.
- [x] Highlight any player with 4 fouls (or limit - 1) in a high-contrast warning color.
- [x] Ensure the strip updates in real-time during substitutions and stat entry.

## [x] [Mandatory Roster Minimum Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Starting a game with < 5 players breaks the "Digital Twin" parity and corrupts lineup/stint data from the tip. We must enforce the rule of 5 at the point of game creation and start.
**What:** Block game creation and clock starts if the team roster has fewer than 5 players.
**Acceptance Criteria:**
- [x] Disable the "Create game" button in `AddGameDialog` if `team.players.length < 5`.
- [x] Display a prominent "Roster Incomplete" warning in the `GameMode` setup phase if < 5 players are present.
- [x] In `useGameMode.ts`, prevent the `isJumpBallOpen` state from clearing or the clock from starting if the roster is illegal.

## [x] [Scoreboard Clock 'Winning Time' Styling]
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

## [x] [Roster Jersey Number Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** Duplicate jersey numbers on the same team create identification ambiguity for scorekeepers and break voice recognition workflows. Jersey numbers must be unique within a team roster.
**What:** Implement validation in the roster management and player creation workflows to prevent duplicate jersey numbers.
**Acceptance Criteria:**
- [x] In `PlayerWorkflowDialog`, block saving if the entered jersey number is already assigned to another player on the same team.
- [x] Display a clear "Jersey Number Conflict" error message near the input field.
- [x] Add a unit test in `PlayerWorkflowDialog.test.tsx` verifying the duplicate jersey guard.

## [x] [Backend Action Type Alignment]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop (Foundation)
**Type:** Technical Debt / Data Integrity
**Why:** The backend schema currently rejects several action types defined in the frontend (e.g., HOCKEY_ASSIST, FLOOR_DIVE). This causes sync failures and data loss, compromising the "Digital Twin" reliability.
**What:** Update `backend/src/validation.ts` to include all action types defined in the frontend's `ACTION_TYPES` constant.
**Acceptance Criteria:**
- [x] Backend `VALID_ACTION_TYPES` matches Frontend `ACTION_TYPES` (adding `HOCKEY_ASSIST`, `FLOOR_DIVE`, `CHARGE_TAKEN`, `GREAT_CONTEST`, `PAINT_TOUCH`).
- [x] Integration tests in `backend/src/__tests__/stats.test.ts` verify that these new types are accepted.

## [x] [Whistle-Aware Scoreboard Clock Status]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the heat of a game, users need absolute clarity on whether the clock is stopped due to a whistle or a manual pause.
**What:** Implement a distinct visual state for the Scoreboard clock when it is stopped specifically by a whistle action (Foul/Timeout).
**Acceptance Criteria:**
- [x] The clock display (background or border) should pulse or change color (e.g., to a soft yellow) when stopped via `WHISTLE_ACTION_TYPES`.
- [x] Display a small "WHISTLE" or "OFFICIAL STOP" label near the clock on the `Scoreboard`.

## [x] [Dynamic Team Foul Coloration]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Coaches need a pre-attentive signal when a team is approaching the bonus.
**What:** Update the team foul counter on the scoreboard to change color as it approaches the bonus threshold.
**Acceptance Criteria:**
- [x] Foul count color changes to `warning.main` when at `bonusThreshold - 1`.
- [x] Foul count color changes to `error.main` when at `bonusThreshold` or above.

## [x] [Buzzer-Beater Shot Validation UI Guard]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** In standard basketball, high-pressure shots right at the buzzer can determine the game. Scorekeepers often struggle to accurately capture and confirm whether a shot was released before the clock hit 0.0. A structured validation flow is essential for competitive parity.
**What:** Trigger a temporary modal or prompt in `GameMode` when a field goal (MAKE) or free throw is logged within the final 2 seconds of any period (regulation or overtime). This allows the user to explicitly confirm or disallow the bucket based on the official table's ruling before advancing.
**Acceptance Criteria:**
- [x] If a scoring event (`ACTION_TYPES.MAKE`) is recorded with `clockSeconds <= 2` in any period, present a visual validation banner or prompt.
- [x] The prompt must offer two options: "Confirm Basket" (keep stat event) and "Disallow Basket" (automatically delete or omit the event).
- [x] Ensure the period-end confirmation flow highlights any late-period shots for final verification before closing the period.

## [x] [Roster Player Name Uniqueness Constraint]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Duplicate player names on the same team roster lead to extreme confusion in stat logs, voice recognition command resolution, and roster management. Every player's identity must be unassailable.
**What:** Enhance name validation in `PlayerWorkflowDialog` to block saving if a player with the same name (case-insensitive) is already registered on the same team.
**Acceptance Criteria:**
- [x] In `PlayerWorkflowDialog` (identity step), query existing players on the selected team(s).
- [x] If the entered name matches an existing active player's name (case-insensitive), disable the "Next" / "Save" action and show a prominent "Player Name Already Exists" validation error.
- [x] Add unit tests in `PlayerWorkflowDialog.test.tsx` checking that duplicate name entry is rejected with a clear visual validation state.

## [x] [Manual Possession Arrow Toggle & Held Ball Auto-Flip]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Managing possession arrow state during jump balls and held-ball situations is a fundamental rule in non-professional leagues (NFHS/NCAA). The scoreboard must render and manage this arrow accurately.
**What:** Add a visual Possession Arrow indicator to the main Scoreboard that allows manual toggling (by clicking it) and automatically flips whenever a held-ball (`HELD_BALL`) or period-starting possession action is registered.
**Acceptance Criteria:**
- [x] Display an arrow symbol (pointing towards `OUR_TEAM` or `OPPONENT`) near the team names on the `Scoreboard`.
- [x] Clicking the arrow must manually toggle the direction, updating the game state in IndexedDB.
- [x] Registering a `HELD_BALL` stat event during play must automatically flip the current possession arrow direction.

## [x] [Overtime Team Foul Penalty Carried-Over Rule]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under standard high school (NFHS) and collegiate (NCAA) rules, team fouls from the fourth quarter or second half carry over directly into overtime as an extension of that period. Correctly carrying fouls over is critical for bonus and double-bonus enforcement during winning time.
**What:** Ensure that during overtime periods, team fouls from the fourth quarter (for QUARTERS) or second half (for HALVES) are carried over and continue to aggregate in the `eventAggregates` and `getBonusStatus` calculations.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, when compiling team fouls for overtime periods (period >= 5 for Quarters, >= 3 for Halves), include all team fouls accumulated during the preceding period.
- [x] Ensure the Scoreboard bonus status (`BONUS` / `DBL BONUS`) updates correctly at the start of overtime based on carried-over fouls.
- [x] Add integration tests in `useGameAggregator.test.ts` verifying correct overtime team foul carryover.

## [x] [Roster Jersey Format and Limit Validation]
**Priority:** LOW
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Basketball jersey rules dictate specific number regulations (e.g., standard numbers 00, 0-99; letters or symbols are illegal). Allowing bad input corrupts logs and breaks voice parsing patterns.
**What:** Enforce strict format restrictions on jersey numbers entered during player creation and roster management.
**Acceptance Criteria:**
- [x] In `PlayerWorkflowDialog` and any roster editors, restrict jersey number input strictly to standard numbers: "00", or single/double digits (0-99). Letters, decimals, and negative values must be blocked.
- [x] Display a clear "Invalid Jersey Number" helper text if non-compliant values are typed.
- [x] Ensure backend validation in `validation.ts` aligns with this pattern by rejecting non-compliant formats.

## [x] [Free-Throw Sequence Guided Flow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** During high-pressure games, scorekeepers frequently lose track of the free throw count and might log events out of order, or attribute them to the wrong player.
**What:** Provide a guided sequence overlay when a free throw foul is recorded, prompting the scorekeeper to input the shooter, and then guiding them through shot-by-shot (Make/Miss) until the sequence is completed.
**Acceptance Criteria:**
- [x] Trigger a guided "Free Throw Sequence" overlay when FOUL_SHOOTING or technical foul shots are registered.
- [x] Guide the user shot-by-shot (e.g., "Shot 1 of 2") with giant, tap-friendly "MAKE" / "MISS" buttons.
- [x] Correctly attribute each shot's result to the selected shooter, update the score, and close automatically when the final shot is completed.

## [x] [Instant Scoreboard Rollback Undo Button]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** In the fast-paced flow of a game, a scorekeeper might tap the wrong button. Tapping through menus to delete the stat and re-add it causes them to fall behind the live play.
**What:** Add a prominent "Undo last action" button directly on the game mode action panel that instantly rolls back the single most recently recorded stat event (and updates scores/fouls accordingly) with a single tap.
**Acceptance Criteria:**
- [x] Place a visible "Undo" button on the primary `ActionControls` or scoreboard HUD.
- [x] Tapping "Undo" must immediately remove the last recorded stat event from IndexedDB.
- [x] Re-calculate team/player scores, personal fouls, team fouls, and clock status immediately upon rollback.

## [x] [Period Transition Intermission Clock Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** When a quarter or half ends, the scoreboard clock simply stops at 0:00. Scorekeepers must manually track intermission time or guess when to resume, leading to uneven breaks and operational confusion.
**What:** Automatically trigger an intermission/halftime countdown timer (e.g., 2:00 for quarters, 10:00 for halftime) when a period is verified and finalized.
**Acceptance Criteria:**
- [x] Upon verifying and finalizing a period, automatically transition the scoreboard clock to show an intermission countdown timer (default 2 minutes for quarter breaks, 10 minutes for halftime).
- [x] Render a clear "INTERMISSION" or "HALFTIME" label on the Scoreboard during the break.
- [x] When the intermission timer hits 0:00, sound a soft buzzer or visual alert, and transition to the next period's starting lineup verification state.

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

## [x] [Default Roster Template Auto-Load]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Re-entering the names and jerseys of 5-15 players for every single new game is a major source of setup friction. Coaches expect to load their default team roster instantly when starting a new game.
**What:** Provide a "Load Default Roster" action during game setup/creation that automatically populates the roster with all active players previously registered to that team, saving time and preventing manual entry errors.
**Acceptance Criteria:**
- [x] In `AddGameDialog` or the game creation flow, add a "Load Team Roster" checkbox or action.
- [x] When selected, automatically assign all active players associated with the selected `teamId` to the game's active roster list.
- [x] Ensure that players are correctly copied with their registered names and jersey numbers, and that they immediately satisfy the 5-player minimum roster guard.

## [x] [Mandatory Starting Lineup Verification Pre-Tip Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** To prevent recording possession and stint tracking errors from the very start, the scorekeeper must explicitly select and verify exactly 5 active players on the court before the game clock can be run or the opening tip can be completed. This ensures there are no illegal lineups at the initial whistle.
**What:** Add a pre-tip "Starting Lineup Verification" step in `GameMode` that blocks all active gameplay features until a valid 5-player starting lineup is drafted and confirmed.
**Acceptance Criteria:**
- [x] If `period === 1`, game stats are empty, and `clockSeconds` is at its maximum length, show a distinct starting lineup selection panel.
- [x] Block the "START" clock button and prevent the `JumpBallDialog` from opening until exactly 5 team players are selected.
- [x] On user confirmation, record the starting lineup in local storage/IndexedDB and then transition to the jump ball tip-off.

## [x] [Quick-Tap Game Clock Adjustment Buttons]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** During high-intensity game moments, minor clock errors must be corrected instantly. Opening a modal, entering digits, and saving is too slow and causes the scorekeeper to fall behind live play.
**What:** Add single-tap "+1s" and "-1s" adjustment buttons directly on the Scoreboard or game-mode action panel.
**Acceptance Criteria:**
- [x] Render small "+1s" and "-1s" buttons near the clock in `ActionControls` or the scoreboard HUD.
- [x] Clicking these buttons must immediately adjust `clockSeconds` by +/- 1 second and persist the new clock time to IndexedDB.
- [x] Disable these quick-correction buttons while the clock is actively running (to prevent accidental taps) and when the game is in `isReadOnly` mode.
- [x] Cap the clock at 0 (underflow) and the maximum period length (overflow).

## [x] [Interactive Foul-Out Danger Warning in Substitution and Bench Panels]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** When coaches prepare substitutions, they must know immediately if a player on the bench is in severe foul danger before putting them on the court. Surfacing this inside rotation panels reduces mistakes and helps prevent illegal lineup states.
**What:** Add high-visibility "foul trouble" warnings for bench players within the substitution panel and bench drawer.
**Acceptance Criteria:**
- [x] In `QuickSubDialog` and bench player selection cards, display a high-contrast warning icon or color code for any player who is within 1 foul of the disqualification limit (`foulLimit - 1`).
- [x] If a bench player has already reached or exceeded the game's `foulLimit` personal fouls, display a "DISQUALIFIED" tag next to their name.
- [x] Disable the selection checkbox or sub-in trigger for disqualified players in the drawer, or show an immediate warning dialog.

## [x] [Overtime Transition Dialog and Period Length Configurator]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official rules, games ending in a tie go to Overtime, but different leagues utilize varying OT durations (e.g., 4 minutes for NFHS vs. 5 minutes for NCAA). Providing a guided transition flow allows the scorekeeper to confirm and customize this temporal extension seamlessly.
**What:** Present a transition dialog when regulation ends in a tie, allowing the user to initiate and customize the Overtime period.
**Acceptance Criteria:**
- [x] Trigger an "Overtime Transition" prompt in the game mode when regulation ends in a tie game (period 4 for Quarters, period 2 for Halves) and period verification is completed.
- [x] Allow the scorekeeper to enter or edit the Overtime period duration, pre-populating with `team.defaultOvertimeLength` or standard defaults (4 or 5 minutes).
- [x] On confirmation, transition the clock to the designated OT duration, increment the period number, reset team fouls, and preserve player personal fouls.

## [x] [Roster Player Game-Day Active Toggle]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Rosters
**Why:** While a team roster might contain 15 players, often only 7-10 are present on game day. Hiding inactive players from stat logging and substitution panels drastically reduces visual noise and speeds up scorekeeper input during fast transitions.
**What:** Add a toggle list on the game dashboard or setup page allowing the scorekeeper to mark players as active/inactive for that specific game.
**Acceptance Criteria:**
- [x] Add "Game-Day Roster" checkbox/toggle list next to team players on pre-game setup screen.
- [x] Players marked as "Inactive" must be excluded from `StatEntryDialog`, `QuickSubDialog`, and lineup selection panels.
- [x] Retain their roster history but ensure they do not clutter live gameplay interfaces.
- [x] Enforce that a minimum of 5 players must remain "Active" to save the game-day roster selection.

## [x] [Clock Auto-Stop on Successful Field Goal in Final Minute of Regulation/OT]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official NCAA, NFHS, and FIBA rules, the game clock must automatically stop following any successful field goal (MAKE) in the final minute (under 60.0 seconds) of the 4th quarter/2nd half and any overtime period. Tapping "STOP" manually is error-prone and lags behind real-time play.
**What:** Integrate a clock-stop hook trigger within `useGameClock` or the scoring mutation flow that automatically pauses the running game clock whenever a successful field goal is logged during "Winning Time" (clockSeconds < 60 in period >= maxPeriod).
**Acceptance Criteria:**
- [x] Automatically pause the game clock (set `isClockRunning` to false) when a field goal `ACTION_TYPES.MAKE` (points > 1) is recorded.
- [x] Apply this automation ONLY if the game clock is under 60 seconds (`clockSeconds < 60`) and the period is a final regulation period or overtime period (`period >= maxPeriod`).
- [x] Ensure that this auto-stop does not trigger on free throw makes (points === 1), as the clock is already stopped on whistles for free throws.

## [x] [Roster Player Selection Sync with Persistent Opponent Rosters]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Currently, scorekeepers can enter an opponent's name and logo, but the opponent's roster has to be manually entered from scratch for every game. Adding support to select and pull the active roster of a previously saved persistent Opponent saves significant pre-game prep time and prevents data discrepancies.
**What:** Enhance `AddGameDialog` and the game creation flow to let scorekeepers select a persistent opponent from the existing list, and automatically load/pull that opponent's previously recorded roster (jersey numbers) into the game session's scouting panel.
**Acceptance Criteria:**
- [x] In `AddGameDialog` step 0, when a persistent opponent is selected from the Autocomplete dropdown, fetch the opponent's saved `roster` (jersey list) from the `opponents` table in IndexedDB.
- [x] On game creation, populate the game's initial opponent roster tracking state with these persistent jerseys.
- [x] Ensure that any new opponent jersey added during live play (e.g., via the scouting panel or stat entry) is optionally saved back to the persistent opponent's roster on game completion.

## [x] [Undo History Toast with Re-Apply Option]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** While a single tap "Undo" button rolls back the last action, scorekeepers sometimes accidentally double-tap or undo a valid action in the heat of a fast-paced transition, with no way to recover that lost stat.
**What:** Enhance the Snackbar/Toast notification shown after an "Undo" action is clicked to include a "RE-APPLY" (or Redo) button, allowing the user to restore the deleted event back into IndexedDB immediately with a single click.
**Acceptance Criteria:**
- [x] When an event is undone via the "Undo" button, do not delete it immediately or mark it permanently; instead, cache the undone stat event in a temporary state variable (`undoneStatCache`).
- [x] Render a Snackbar with the message "Action Undone" and a "REDO" or "RE-APPLY" button.
- [x] Clicking "REDO" must restore the cached stat event back to the database with a new or active status, recalculate current scores/fouls, and clear the cache.
- [x] The cache should be cleared automatically as soon as any new live action is recorded.

## [x] [Technical Foul Penalty Type Differentiation (Class A vs. Class B)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official NFHS and NCAA rules, Technical Fouls are categorized as Class A (conduct-related) and Class B (administrative/rulebook-related). Class A counts toward the player's personal 5-foul limit and disqualification, whereas Class B does not, although both result in free throw penalties. Currently, all technical fouls are treated identically.
**What:** Split the technical foul logging flow to support "Class A (Conduct)" and "Class B (Administrative)" technical fouls, ensuring correct ruleset enforcement for player disqualifications and team bonus calculations.
**Acceptance Criteria:**
- [x] In the foul logging screen, when "Technical Foul" is selected, present a toggle or selection for "Class A (Conduct)" vs "Class B (Administrative)".
- [x] A "Class A" Technical Foul must increment both the player's personal fouls (counting toward their 5-foul limit) and the team's period fouls.
- [x] A "Class B" Technical Foul must increment the team's period fouls but NOT increment the player's personal fouls.
- [x] In the `RecentActionsPanel` and stats log, display the distinction clearly as "Class A Tech" or "Class B Tech".

## [x] [Configurable Individual Foul Limit (Disqualification Threshold)]
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

## [x] [Period Duration Customization & Preset Configurator]
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

## [x] [Roster Name & Jersey Quick-Edit during Live Play]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** In amateur and youth leagues, players frequently swap jerseys at the last minute or arrive late, rendering pre-game roster lists inaccurate. Without an in-game editing capability, scorekeepers are forced to record incorrect statistics or completely discard/restart the game session.
**What:** Add a "Quick Edit Roster" drawer or modal accessible directly from the live `GameMode` page, permitting the scorekeeper to edit any player's name and jersey number on-the-fly, or add a late player directly to the game-day roster.
**Acceptance Criteria:**
- [x] Provide an "Edit Roster" button or menu item inside `GameMode` (e.g., in the tracking toolbar or lineup panels).
- [x] Clicking it opens a dialog/drawer listing all current game-day roster players with inline text fields for `name` and `jerseyNumber`.
- [x] Submitting the changes updates the players' definitions in IndexedDB, instantly refreshing the scoreboard, on-court lineup, and stat logging panels.
- [x] Enforce standard validations inside this quick-editor (blocking duplicate names or duplicate jerseys on the same team in real-time).

## [x] [1-and-1 Free Throw Bonus Ruleset Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Fouls
**Why:** High school (NFHS) and college (NCAA) basketball historically utilize a "1-and-1" bonus structure where the shooter only receives a second free throw attempt if they make the first one. Forcing a second shot on a missed first shot in single bonus situations corrupts statistical accuracy and game flow.
**What:** Integrate "1-and-1" ruleset logic into the `FreeThrowWorkflowDialog`. When a non-shooting team foul is recorded and the team is in the single bonus, the shooting sequence must automatically terminate if the first free throw is a "MISS".
**Acceptance Criteria:**
- [x] Detect if the game rules specify a 1-and-1 bonus and the defensive team is in the "single bonus" status (bonus active, but not double bonus).
- [x] When a 1-and-1 free throw sequence is initiated, guide the user through the first free throw.
- [x] If the user logs the first shot as "MISS", terminate the `FreeThrowWorkflowDialog` sequence immediately, skipping the second shot.
- [x] If the user logs the first shot as "MAKE", proceed automatically to "Shot 2 of 2".

## [x] [Direct Score Override Point-Correction Tool]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Referees occasionally correct scoring decisions (e.g., changing a 3-pointer to a 2-pointer or correcting a scorer's table mistake) several possessions after the event occurred. Undoing multiple subsequent valid plays to correct the score is slow and causes scorekeepers to fall behind live play.
**What:** Add a direct score correction override mechanism on the main scoreboard. Clicking on either team's score display opens a prompt where the user can directly override the score (adding/subtracting points), which records a `SYSTEM_ADJUSTMENT` action.
**Acceptance Criteria:**
- [x] Clicking on either the Team or Opponent score display on the scoreboard HUD launches a "Score Adjustment" dialog.
- [x] Provide simple "+1", "-1", "+2", "-2", "+3", and "-3" buttons or a direct manual numeric override input field.
- [x] On saving, insert a `SYSTEM_ADJUSTMENT` event to IndexedDB with the adjusted points delta (can be positive or negative) attributed to the correct team.
- [x] Ensure the scoreboard and all live aggregates update the displayed score instantly without destroying subsequent stat events.

## [x] [Visual and Audible Game Clock End-of-Period Buzz Warning]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** In high-intensity games, scorekeepers can lose track of the clock and attempt to log actions after the period has expired. Clear visual and audible alerts at `00:00.0` prevent illegal late-period logging and provide immediate operational feedback.
**What:** Trigger a high-intensity full-screen visual flash and play a synthesized buzzer sound (using the HTML5 Web Audio API) the exact instant the game clock counts down to `00:00.0`.
**Acceptance Criteria:**
- [x] When `clockSeconds` reaches exactly `0` while the clock is running, trigger a visual alert overlay/flash stating "PERIOD END" or "BUZZER".
- [x] Synthesize a standard basketball horn/buzzer sound using the Web Audio API (e.g., oscillator nodes playing high-amplitude low-frequency saw/triangle waves for 1.5 seconds) to avoid external asset dependency issues.
- [x] Ensure the clock is strictly paused and no further gameplay events (other than buzzer-beater verification or manual adjustments) can be registered without advancing the period.

## [x] [Scoreboard Bonus Status Indicator Lights]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** During high-leverage moments, a coach must instantly see if the opponent is in the bonus or double bonus without looking at the raw team foul number and performing mental ruleset calculations. Simple, high-contrast indicators on the scoreboard HUD are a non-negotiable standard for live game coaching.
**What:** Add dedicated visual status indicators ("B" and "B+" or active lights) for single and double bonus on the main scoreboard HUD.
**Acceptance Criteria:**
- [x] In `Scoreboard`, render prominent "BONUS" and "DOUBLE BONUS" indicator lights or badges near the team panels.
- [x] Ensure the indicators activate dynamically based on the calculated team fouls and period config in `useGameAggregator.ts`.
- [x] Color-code indicators (e.g. warning.main for Bonus, error.main for Double Bonus) using tokens from `useTokens()`.

## [x] [Multi-Period Overtime Tracking & Period Counter Support]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** High-stakes games can go into multiple overtimes (OT1, OT2, OT3). If the system only supports a single overtime or hardcodes period 5 as the only OT, subsequent tied periods will fail to initialize or track, causing the app to crash or freeze.
**What:** Implement support for infinite subsequent overtime periods (period > 5 for Quarters, period > 3 for Halves), incrementing the period counter dynamically and resetting team fouls for each extra period.
**Acceptance Criteria:**
- [x] Ensure `useGameClock` and `useGameMode` correctly handle transitions to period 6 and beyond (OT2, OT3, etc.) on tie-game finalizations.
- [x] Dynamically render period labels on the Scoreboard (e.g., "OT2", "OT3") instead of hardcoding "OT".
- [x] Reset team fouls to 0 at the start of each overtime period, while preserving player personal fouls and previous period's aggregates.

## [x] [Live Scoreboard Offline Persistence and Recovery Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Scorekeepers operate in school gyms with notoriously spotty Wi-Fi. If the browser tab crashes or is accidentally refreshed, the live scoreboard clock, period, scores, and active lineups must be completely recovered from the local IndexedDB state rather than resetting to 0.
**What:** Persist the active, running game state (including current clock time and active lineup) to IndexedDB on every second or major event, and auto-restore this exact state on page reload.
**Acceptance Criteria:**
- [x] Auto-save the exact state of the running clock (`clockSeconds`), period, and active on-court lineup to the `games` table in IndexedDB on every clock tick or tick interval.
- [x] On mounting `GameMode`, check for incomplete games and initialize the clock and lineups with the persisted values if present.
- [x] Add unit tests verifying that the page-reload recovery flow succeeds and restores the correct game status.

## [x] [Opponent Score & Team Foul Quick-Correction Controls]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** When the opponent scores or commits a team foul, the scorekeeper must record it instantly. If they mistakenly attribute it or make an error, they need quick +1/-1 score adjustments and +1/-1 team foul adjustment buttons directly on the opponent's panel of the Scoreboard HUD to prevent having to navigate into complex stat entries or undo flows for simple opponent corrections.
**What:** Add small, non-obtrusive quick-adjustment buttons (+1/-1 score and +1/-1 team fouls) on the opponent's panel of the Scoreboard HUD to prevent having to navigate into complex stat entries or undo flows for simple opponent corrections.
**Acceptance Criteria:**
- [x] Render small `+`/`-` buttons near the opponent score and opponent team foul counters on the Scoreboard HUD.
- [x] Clicking these buttons must immediately record or remove the appropriate `SYSTEM_ADJUSTMENT` or `FOUL` event in IndexedDB.
- [x] Disable quick-correction buttons when the clock is active or if the game is in `isReadOnly` mode.

## [x] [Automated Game Session Lockout on Verification]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Security
**Why:** Once a period's stats are verified and finalized by the head coach or scorekeeper, those specific period events must be permanently locked against accidental modifications or deletions during live play.
**What:** Prevent any deletes, edits, or additions to stat events belonging to completed/verified periods, only allowing modifications via an explicit "Re-open Period" administrative workflow.
**Acceptance Criteria:**
- [x] In `RecentActionsPanel` and any action controls, disable edit/delete buttons for all events belonging to completed/verified periods.
- [x] Block new stat entries if their designated period has already been finalized and verified.
- [x] Provide an explicit, password-protected or double-confirmation "Unlock Period" action for administrators to make previous periods editable again.

## [x] [Halftime Team Foul Reset and Period Transition Alignment]
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

## [x] [Scoreboard Possession Arrow Persistent State Recovery]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** If the live scorekeeper's tab is refreshed, the browser crashes, or a game is resumed from the dashboard, losing the possession arrow state causes operational confusion and official disputes. Restoring this direction on loading the game ensures seamless continuity.
**What:** Persist the current possession arrow direction in the game's schema in IndexedDB on every toggle, and automatically load this direction when initializing the `GameMode` page.
**Acceptance Criteria:**
- [x] Save the possession arrow state (e.g., pointing to "OUR_TEAM", "OPPONENT", or "NONE") as a field on the `Game` schema in IndexedDB whenever it changes.
- [x] On mounting the `GameMode` page, retrieve the saved arrow state from the DB and initialize the HUD display with the recovered value.
- [x] Add unit/integration tests in `useGameMode.test.ts` or a new test verifying that state recovery successfully restores the arrow's correct direction on reload.

## [x] [On-Court Player Roster Protection during Live Play]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix / Data Integrity
**Why:** If a scorekeeper attempts to delete or deactivate a player from the roster who is currently on the court, it corrupts active lineups, play-by-play statistics, and causes frontend crashes.
**What:** Enforce roster protection inside player/roster editing dialogs by blocking deletion or deactivation of players who are currently in the active on-court lineup.
**Acceptance Criteria:**
- [x] Check if the player is currently in the active 5-player on-court lineup when attempting to delete or deactivate them during live game editing.
- [x] If on-court, block the delete/deactivate action, display a clear inline validation message stating "Cannot delete/deactivate an active on-court player. Perform a substitution first."
- [x] Provide unit tests in the roster quick-editor test suite verifying that on-court player deletions are safely prevented.

## [x] [Jump Ball Alternating Possession Period-Start Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official regulations, subsequent periods (quarters 2, 3, 4, and halves 2) do not start with a jump ball; they start with throw-ins determined by the alternating possession arrow. Automating this eliminates the need for manual jump-ball dialogs at the start of every period.
**What:** Detect if the current period is greater than 1 when starting a period, bypass the JumpBall dialog, automatically attribute the period-opening possession according to the possession arrow, and flip the arrow on the first whistle or clock start.
**Acceptance Criteria:**
- [x] When transitioning into period 2, 3, or 4 (regulation or overtime breaks), bypass opening the `JumpBallDialog` and automatically award inbounds possession to the team designated by the current possession arrow.
- [x] Render a non-intrusive alert toast indicating "Period started: [Team Name] Possession via Alternating Arrow."
- [x] Automatically toggle the possession arrow's direction when the period's first gameplay clock tick or subsequent live play event is registered.
- [x] Add integration tests verifying that period-start throw-in possession is correctly resolved without user-input prompts.

## [x] [Foul Trouble Real-Time Alerts HUD Banner]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** Scorekeepers and coaches are often caught by surprise when a player commits a foul and is suddenly disqualified. Providing a real-time HUD alert banner when a player reaches the warning threshold (`foulLimit - 1`) helps coaches adjust rotations before illegal personnel situations occur.
**What:** Add a prominent, dismissible real-time warning alert banner on the main tracking HUD that displays when any on-court player reaches 4 fouls (or limit - 1).
**Acceptance Criteria:**
- [x] When a player commits a foul that raises their personal fouls to exactly `foulLimit - 1`, trigger a distinct warning banner on the `GameMode` HUD.
- [x] The banner should display the player's jersey number, name, and "Foul Trouble (X Fouls)" in a warning-colored, easily legible banner.
- [x] Allow the scorekeeper to quickly dismiss the banner or auto-dismiss it after 5 seconds of inactive screen state.
- [x] Verify using unit tests that the alert is rendered correctly and vanishes on click or timeout.

## [x] [Live Clock Synchronization Drift Conflict Resolution]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Technical Debt
**Why:** In spotty Wi-Fi environments, network lag can cause local clock states to drift or get overwritten by older incoming server updates during background syncs, leading to clock time jumps or desynchronizations.
**What:** Implement an explicit clock-drift resolution guard in `syncService` and IndexedDB transactions to ensure that the live, local scorekeeper's clock state is always treated as the absolute source of truth and is never overwritten by background peer-to-peer updates.
**Acceptance Criteria:**
- [x] Introduce a lock or timestamp-based guard on the `clockSeconds` and `period` updates during background syncs.
- [x] Reject or drop any incoming sync updates that attempt to modify `clockSeconds` or `period` on a game that is currently being actively tracked/edited locally.
- [x] Add unit tests in `useSyncBehavior.test.ts` or corresponding sync tests verifying that local clock state is perfectly protected against incoming sync conflicts.

## [x] [Clock Auto-Pause on Whistle Action Recording]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Official basketball rules mandate that the game clock stops immediately upon any whistle action (fouls, held ball, official timeout). Relying on scorekeepers to manually tap stop after logging a whistle action creates timing drift and operational delay during live play.
**What:** Automatically pause the game clock (`isClockRunning = false`) whenever a whistle action (e.g. personal foul, technical foul, held ball, timeout) is registered while the clock is running.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` / `useGameClock`, automatically pause the game clock when an action belonging to `WHISTLE_ACTION_TYPES` is recorded.
- [x] Ensure the clock status transitions to the whistle-stopped state, persisting the paused `clockSeconds` in IndexedDB.
- [x] Add unit test coverage verifying that logging a foul or held ball automatically halts a running clock.

## [x] [Unassigned Jersey Number Quick-Register during Live Stat Entry]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** In high-speed live games, scorekeepers frequently observe an unassigned jersey number on the floor or scoring (e.g. late arrivals or temporary jersey swaps). Pausing live tracking to open full roster settings causes missed possessions; scorekeepers need an inline quick-register prompt right inside the stat entry or jersey picker workflow.
**What:** Add a quick-register trigger in `StatEntryDialog` / `OpponentJerseyPicker` when an unassigned jersey number is tapped or entered, allowing instant creation and assignment of the jersey number to the active game roster without leaving the live stat entry flow.
**Acceptance Criteria:**
- [x] When an unassigned jersey number is entered or selected during stat entry, present an inline "Quick-Register Jersey #[X]" action.
- [x] On confirmation, automatically create the player record in IndexedDB and add them to the game's active player list.
- [x] Instantly resume the stat entry workflow with the newly created player selected.
- [x] Include unit tests in `StatEntryDialog.test.tsx` or `OpponentJerseyPicker.test.tsx` verifying the inline quick-registration workflow.

## [x] [Disqualified Player Re-Entry Warning Guard in Live Action Panel]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** When a player has fouled out or been disqualified, a scorekeeper in the rush of live tracking might accidentally tap their jersey number on the live stat entry panel or quick sub panel, recording invalid statistics for an illegal player.
**What:** Add a real-time validation guard in `StatEntryDialog` and `ActionControls` that blocks recording new stats or subbing in a player who has reached or exceeded the game's `foulLimit`, displaying a high-visibility "Player Disqualified" modal/alert.
**Acceptance Criteria:**
- [x] In `StatEntryDialog` and `ActionControls`, check the selected player's personal fouls against `foulLimit`.
- [x] If the player has reached or exceeded `foulLimit` fouls, block stat submission and display an inline warning message "Player Disqualified (5+ Fouls). Perform substitution first."
- [x] Ensure that existing stat history for the player is preserved while preventing new live event attribution to the disqualified player.
- [x] Add unit test coverage in `StatEntryDialog.test.tsx` verifying that stat entry for disqualified players is prevented.

## [x] [Substituted-Out Bench Player Stat Entry Safety Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** In high-speed live games, scorekeepers can accidentally select a player currently on the bench during stat entry. Attributing points or fouls to a player not on the court corrupts active stint calculations and lineup stats.
**What:** Add a safety validation in `StatEntryDialog` and live action panels that checks if the selected player is currently in the active on-court lineup, displaying a warning or prompt when a benched player is selected for on-court actions.
**Acceptance Criteria:**
- [x] In `StatEntryDialog`, warn or prompt when a benched player is selected for on-court actions (makes, misses, personal fouls).
- [x] Provide an option to sub the player on-court or confirm the action with explicit confirmation.
- [x] Add unit test coverage in `StatEntryDialog.test.tsx` verifying the bench player stat entry safety guard.

## [x] [Game Creation Roster Duplicate Jersey Validation Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / UX
**Why:** Duplicate jersey numbers introduced during initial game setup or team creation lead to extreme confusion during live stat recording and voice input processing. Preventing duplicate jersey numbers before the game starts ensures clean roster state.
**What:** Add roster validation in `AddGameDialog` and game setup workflows to block starting or creating a game if any team or opponent roster contains duplicate jersey numbers.
**Acceptance Criteria:**
- [x] In `AddGameDialog` and roster setup panels, validate that all active roster players on a team have unique jersey numbers.
- [x] Block game creation or setup confirmation if duplicate jersey numbers are detected, highlighting the conflicting numbers.
- [x] Add unit test coverage in `AddGameDialog.test.tsx` verifying the duplicate jersey guard.

## [x] [Quick Sub Lineup Disqualification Forced Replacement Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** When a player reaches their personal foul limit, the forced substitution workflow must prevent closing or bypassing the quick sub drawer until a valid, non-disqualified active replacement player is selected for the floor.
**What:** Enforce a strict selection lock in `QuickSubDialog` during forced substitution mode for disqualified players, blocking dialog dismissal or confirmation until 5 eligible active players are assigned on-court.
**Acceptance Criteria:**
- [x] In `QuickSubDialog` forced substitution mode, block the "Confirm" / "Close" action if any disqualified player remains assigned on-court.
- [x] Display an inline error message "Disqualified player must be replaced before resuming play."
- [x] Add unit test coverage in `QuickSubDialog.test.tsx` verifying the selection lock for disqualified players.

## [x] [Free Throw Sequence Scoreboard Real-Time Score Update Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Live Scoreboard
**Why:** During a multi-shot free throw sequence, the scoreboard must update live scores immediately after each make (e.g. shot 1 of 2) rather than waiting for the entire modal sequence to finalize, keeping bench and table views perfectly in sync.
**What:** Interlock real-time score mutation on each individual free throw attempt in `FreeThrowWorkflowDialog` so the live scoreboard updates incrementally on every shot attempt.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog`, dispatch/persist score update events to IndexedDB on each individual made free throw attempt instead of delaying until full workflow exit.
- [x] Ensure `Scoreboard` score display reflects the incremented score immediately after Shot 1 make.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying incremental scoreboard score updates.

## [x] [Game Clock Negative Second Clamp and Overflow Safeguard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** Extreme clock quick-adjustment actions (+1s / -1s) or fast manual edits can occasionally push `clockSeconds` below zero or above `periodLength * 60`, causing NaN displays or broken period countdowns.
**What:** Implement hard boundary clamping (`Math.max(0, Math.min(maxPeriodSeconds, seconds))`) in `useGameClock` and `useGameModeActions` clock mutation handlers to prevent clock state corruption under all conditions.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `EditClockDialog.tsx`, clamp all clock adjustments strictly between `0` and `periodLength * 60` seconds.
- [x] Prevent negative clock values or overflow states from persisting to IndexedDB `db.games`.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying clock boundary clamping.

## [x] [Period-End Unsaved Stat Event Sync Verification Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** Advancing or verifying a period while offline stat writes or pending IndexedDB operations are in-flight can cause period-attribution race conditions, resulting in events being saved to the wrong period.
**What:** Add a synchronization verification lock in period transition logic to ensure all in-flight stat mutations are flushed and saved before period counter increments.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` / `useGameMode.ts` period transition handlers, await pending stat persistence promises before finalizing period end.
- [x] Display a brief loading/saving state in `VerifiedPeriodModal` if stat persistence is active.
- [x] Add unit test coverage in `useGameMode.test.ts` and `VerifiedPeriodModal.test.tsx` verifying period transition sync safety.

## [x] [Scoreboard Unassigned Player Roster Allocation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Rosters / Data Integrity
**Why:** If an opponent player or team member with no assigned jersey number scores or commits a foul, stats can become orphaned or break lineup efficiency calculations.
**What:** Require jersey number selection or temporary unassigned placeholder allocation (e.g. "N/A" or "Team") for all live stat actions to guarantee 100% event attribution integrity.
**Acceptance Criteria:**
- [x] In `StatEntryDialog` and live action controls, block stat recording without a valid player jersey selection or explicit "Team/Bench" selection.
- [x] Ensure all recorded stat events contain valid non-null `playerId` or `isTeamFoul` flags.
- [x] Add unit test coverage in `StatEntryDialog.test.tsx` verifying attribution guards.

## [x] [Free Throw Sequence Auto-Sub Interlock & Pause Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** During an active multi-shot free throw sequence, permitting live clock resumes or active substitutions between shot attempts causes score, foul, and lineup attribution race conditions.
**What:** Lock substitution triggers and clock start actions during an active free throw sequence modal until the final shot attempt is logged or cancelled.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog` and `ActionControls`, disable quick substitutions and block manual clock start while a free throw sequence is in progress.
- [x] Display an inline banner "Complete free throw sequence before resuming live play or subbing players."
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying substitution and clock start locking during free throw sequences.

## [x] [Game Period Overtime Transition Tie-Score Validation Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** If a period ends with a tied score in the final regulation period, advancing directly to game finalization without triggering the overtime transition modal causes illegal game completion in a tied state under standard basketball rules.
**What:** Prevent finalized game state transition if scores are tied at the end of regulation, automatically triggering the Overtime Transition workflow instead of game completion.
**Acceptance Criteria:**
- [x] In `VerifiedPeriodModal` and `useGameMode.ts`, check for tied team scores when verifying the final regulation period (`period === maxPeriod`).
- [x] If team scores are tied, block "End Game" finalization and automatically launch the `Overtime Transition` dialog to initialize period `maxPeriod + 1`.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying tie-game overtime transition enforcement.

## [x] [Opponent Team Foul Reset on Period Transition Alignment]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix / Data Integrity
**Why:** While home team fouls are correctly reset or carried over across period transitions according to the game format (Quarters vs. Halves), opponent team fouls must also reset or carry over in exact synchronization to prevent invalid bonus indicator states for opponent possessions.
**What:** Ensure opponent team foul counts in `useGameAggregator.ts` adhere to the exact same period transition reset rules (resetting per period in Quarters format, carrying over across Period 1 & 2 in Halves format) as the home team.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, calculate opponent team fouls per period or half in exact alignment with the game's `periodType` (QUARTERS vs HALVES).
- [x] Ensure opponent bonus status on the Scoreboard (`BONUS` / `DOUBLE BONUS`) updates correctly upon period transitions.
- [x] Add unit test coverage in `useGameAggregator.test.ts` verifying opponent team foul period resets.

## [x] [Direct Point-Correction Score Sync with IndexedDB Snapshot Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** Direct score overrides via `SYSTEM_ADJUSTMENT` must atomically persist to local IndexedDB `db.games` score snapshot fields (`teamScore`, `opponentScore`) alongside the event log to prevent score rebound lag on page reload or background sync.
**What:** Ensure direct score correction mutations update both the `db.stats` event store and the cached `db.games` score fields atomically within the same IndexedDB transaction.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` (direct score adjustment handler), write the updated total score snapshot to `db.games` in the same transaction as the `SYSTEM_ADJUSTMENT` stat event.
- [x] Verify that reloading the page immediately after a direct score adjustment displays the updated score without requiring a full stat re-aggregation pass.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying atomic score snapshot persistence.

## [x] [Period-End Official Final Score Verification Audit Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** Before finalizing a period or full game session, the scorekeeper must explicitly review and confirm the computed period score breakdown against the running total score to prevent lingering score discrepancies or unverified period transitions.
**What:** Introduce a mandatory score audit step in `VerifiedPeriodModal` that displays the calculated per-period score summary alongside team foul totals, requiring explicit scorekeeper confirmation before period state advances.
**Acceptance Criteria:**
- [x] In `VerifiedPeriodModal.tsx`, display an official score breakdown table showing team and opponent scores for the current period and cumulative game score.
- [x] Block period verification if calculated event scores differ from the game state score snapshot until reconciled.
- [x] Add unit test coverage in `VerifiedPeriodModal.test.tsx` verifying the period-end score audit interlock.

## [x] [Live Game Clock Expiration Auto-Pause Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Game Clock
**Why:** When the countdown timer reaches exactly 0:00.0, the game clock state must immediately freeze (`isClockRunning = false`) and persist to IndexedDB to prevent negative clock values or illegal gameplay actions post-expiration.
**What:** Ensure `useGameClock.ts` triggers an automatic clock pause callback and persists `clockSeconds: 0` to IndexedDB immediately upon hitting 0 seconds.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, automatically set `isClockRunning = false` when `clockSeconds` reaches 0.
- [x] Persist `clockSeconds: 0` and paused state to `db.games` in IndexedDB.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying automatic clock pause on 0:00 expiration.

## [x] [Personal Foul Bonus Threshold Calculation Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** Calculating team foul totals for bonus and double-bonus status must strictly evaluate live personal foul events in real-time without lagging during rapid foul sequences.
**What:** Harden team foul aggregation in `useGameAggregator.ts` to recompute team foul counts and bonus indicators synchronously whenever a personal foul or team foul event is recorded.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, recalculate team fouls and bonus status synchronously on every stat event mutation.
- [x] Ensure `BONUS` and `DOUBLE BONUS` scoreboard badges update immediately when team fouls reach threshold.
- [x] Add unit test coverage in `useGameAggregator.test.ts` verifying synchronous bonus status recalculation.

## [x] [Scoreboard Live Lead Differential Indicator]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Live Scoreboard
**Why:** During high-intensity game moments, coaches and scorekeepers must instantly know the exact point differential (e.g. "+5" or "-3") without doing mental math off running team total scores.
**What:** Add a prominent live lead/margin indicator badge to the Scoreboard HUD displaying the current score differential relative to the home team.
**Acceptance Criteria:**
- [x] Display a lead differential badge (e.g., "+4" or "-2") on the `Scoreboard` HUD between or near team scores.
- [x] Color-code the badge dynamically (e.g. success/green for lead, error/red for deficit, neutral for tied).
- [x] Ensure the differential updates instantly on every scoring event or point adjustment.

## [x] [Period Transition Active Lineup Continuity Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Transitioning to a new period without explicitly verifying or carrying over the active 5-player on-court lineup risks orphaned possessions or missing lineup attribution at period start.
**What:** Enforce active lineup carryover and verification when advancing to a new period, ensuring 5 valid active players are assigned on-court before clock start.
**Acceptance Criteria:**
- [x] Automatically preserve active 5-player on-court lineup IDs when advancing from period N to N+1.
- [x] Block clock start in the new period if fewer than 5 active players are present on court for either team.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying lineup continuity across period transitions.

## [x] [Undo Action Scoreboard Snapshot Atomic Rollback Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** When rolling back an action via the "Undo" button, the score snapshot fields (`teamScore`, `oppScore`) in IndexedDB `db.games` must update atomically alongside `db.stats` deletion to prevent transient score desynchronization on page refresh.
**What:** Interlock `db.games` score snapshot updates within the same transaction/operation as `db.stats` soft deletion during undo operations.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` (`handleUndo`), update `db.games` score fields (`teamScore`, `oppScore`) atomically when marking a stat event deleted.
- [x] Verify that page reload immediately following an undo operation reflects the rolled-back score accurately.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying atomic score rollback on undo.

## [x] [Possession Arrow Initial Jump Ball Allocation Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official basketball rules (NFHS/NCAA/FIBA), the team that loses the opening jump ball receives the initial alternating possession arrow pointing towards their basket. Setting the initial arrow incorrectly or leaving it unassigned corrupts subsequent period-start throw-in automation.
**What:** Automatically set the initial possession arrow in IndexedDB to point toward the team that lost the jump ball immediately upon confirming the opening tip-off in `JumpBallDialog`.
**Acceptance Criteria:**
- [x] In `JumpBallDialog`, when the jump ball winner is designated, set the `possessionArrow` state to point to the non-winning team.
- [x] Persist the initial `possessionArrow` state atomically to `db.games` in IndexedDB upon confirming tip-off.
- [x] Add unit test coverage in `JumpBallDialog.test.tsx` / `useGameMode.test.ts` verifying initial possession arrow allocation to the non-gaining team on opening tip-off.

## [x] [Free Throw Sequence Disqualified Shooter Substitution Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** Under official basketball rules, if a player who was awarded free throws becomes disqualified (e.g. via technical foul or injury/foul-out) before shooting, the substitute player must be designated to shoot the free throws. Allowing a disqualified or non-designated player to shoot corrupts free throw attribution.
**What:** Enforce substitution and shooter selection in `FreeThrowWorkflowDialog` if the originally designated shooter reaches their foul limit or is subbed off prior to starting the free throw sequence.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog`, validate that the assigned shooter is currently active and eligible (not disqualified).
- [x] Prompt for an eligible substitute shooter selection if the original shooter is disqualified or unavailable.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying substitute shooter designation for disqualified free throw awardees.

## [x] [Scoreboard Live Clock Sub-Minute Tenths-of-Second Transition Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** During the final minute of any period, the clock format transitions to display tenths of a second (e.g., "59.9s"). If the clock renderer or state hook fails to smoothly format sub-second ticks, the clock display stutters or misrepresents remaining possession time in high-leverage moments.
**What:** Harden `useGameClock.ts` and `Scoreboard.tsx` sub-minute clock formatting to guarantee smooth 100ms precision ticks and seamless visual transition at 1:00.0 without rendering delays or layout shifts.
**Acceptance Criteria:**
- [x] Ensure `Scoreboard.tsx` transitions cleanly from MM:SS to SS.T format when `clockSeconds < 60`.
- [x] Guarantee sub-second timer state updates consistently without UI flickering or tick drops.
- [x] Add unit test coverage in `Scoreboard.test.tsx` / `useGameClock.test.ts` verifying sub-minute tenths-of-second transition rendering.

## [x] [Period-Start Active Roster Jersey Number Validation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Starting a period with an active player on-court who has an missing or blank jersey number breaks play-by-play stat attribution and scoreboard foul strip displays.
**What:** Enforce that all 5 active on-court players have valid, non-empty jersey numbers assigned prior to starting any period's game clock.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` / `ActionControls.tsx`, validate that all 5 active on-court players have valid non-empty `jerseyNumber` fields before allowing clock start.
- [x] Trigger a quick jersey assignment prompt if an active on-court player is missing a jersey number.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameMode.test.ts` verifying period-start jersey validation interlocks.

## [x] [Opponent Team Score Snapshot Rollback Sync Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Live Scoreboard
**Why:** Opponent score adjustments or rollbacks must update the cached `opponentScore` / `oppScore` in `db.games` atomically alongside `db.stats` to prevent opponent score desynchronization on page reload or background sync.
**What:** Interlock opponent score mutations and rollbacks in `useGameModeActions.ts` so `db.games` cached `oppScore` updates atomically in the same IndexedDB transaction as `db.stats`.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts`, update `db.games` `oppScore` atomically whenever opponent scoring events or score adjustments are recorded or undone.
- [x] Ensure browser reload after an opponent score adjustment or undo immediately reflects the correct opponent total score.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying atomic opponent score snapshot updates on stat mutation and undo.

## [x] [Period Verification Unsaved Lineup State Persist Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Rosters / Data Integrity
**Why:** Verifying and finalizing a period without explicitly flushing in-flight on-court lineup edits to `db.games` risks losing lineup continuity or active stint tracking for the subsequent period.
**What:** Ensure `VerifiedPeriodModal.tsx` and `useGameMode.ts` await active `onCourtIds` persistence to IndexedDB before executing period verification and period counter increment.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` (`handleVerifyPeriod`), explicitly await `db.games` update for current `onCourtIds` before advancing `currentPeriod`.
- [x] Prevent period advancement if active on-court lineup state persistence is incomplete or failing.
- [x] Add unit test coverage in `useGameMode.test.ts` / `VerifiedPeriodModal.test.tsx` verifying lineup state persistence before period advancement.

## [x] [Period Clock Zero-Tick Score Event Timestamp Clamp Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Scoring
**Why:** When a scoring event is recorded at or near `clockSeconds: 0` before the period buzzer registers, clamping timestamps strictly to non-negative period bounds guarantees clean period attribution and audit log accuracy.
**What:** Clamp stat event clock timestamps strictly to `Math.max(0, clockSeconds)` in stat writing flows and ensure zero-clock scoring events bind to the current active period prior to period transitions.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` / `useStatWriter.ts`, clamp stat event `clockTime` / `clockSeconds` to non-negative values within period bounds.
- [x] Ensure late-period scoring events recorded at `0:00` are explicitly associated with the ending period prior to period transition.
- [x] Add unit test coverage in `useGameModeActions.test.ts` / `useStatWriter.test.ts` verifying timestamp clamping and period association for zero-clock stat events.

## [x] [Overtime Period Opening Jump Ball Possession Reset Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official NFHS/NCAA/FIBA rules, each overtime period begins with a new jump ball at center circle, which re-establishes the alternating possession arrow direction for that OT period. Failing to trigger the jump ball or reset possession arrow at OT start corrupts subsequent alternating possession throw-in calls.
**What:** Enforce opening jump ball trigger and possession arrow re-allocation upon transitioning into any Overtime period (period 5+ for Quarters, period 3+ for Halves).
**Acceptance Criteria:**
- [x] In `useGameMode.ts` / `JumpBallDialog.tsx`, automatically prompt for an opening jump ball at the start of period `maxPeriod + 1` (OT1) and subsequent OT periods.
- [x] Assign initial OT possession arrow to the team losing the OT tip-off and persist state to IndexedDB `db.games`.
- [x] Add unit test coverage in `useGameMode.test.ts` / `JumpBallDialog.test.tsx` verifying OT jump ball possession arrow re-initialization.

## [x] [Substituted-Out Player Foul Attribution Safety Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** Recording a personal foul against a player who was previously subbed off to the bench corrupts team foul counts, individual foul-out records, and active lineup tracking.
**What:** Enforce on-court validation in `StatEntryDialog.tsx` for personal foul entries, requiring explicit confirmation or on-court substitution before attributing personal fouls to bench players.
**Acceptance Criteria:**
- [x] In `StatEntryDialog.tsx`, validate that a selected player is in the active 5-player on-court lineup when logging a personal foul.
- [x] Render a high-visibility warning prompt if a bench player is selected for a personal foul, requiring confirmation or quick sub-in.
- [x] Add unit test coverage in `StatEntryDialog.test.tsx` verifying bench player foul attribution safeguards.

## [x] [Game Clock Whistle Auto-Pause Snapshot Persistence Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** When the game clock is automatically paused by a whistle action (e.g. personal foul, held ball, official timeout), persisting the stopped clock time and paused status synchronously to `db.games` prevents clock time jumps or state drift if the tab is reloaded during a whistle stoppage.
**What:** Interlock whistle-action clock pauses in `useGameModeActions.ts` and `useGameClock.ts` to immediately update and await `db.games` clock state persistence upon whistle event logging.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` whistle event handlers, atomically set `isClockRunning = false` and update `clockTime` in `db.games` alongside the stat event write.
- [x] Verify that reloading the browser during a whistle stop restores the exact paused clock time and stopped state.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameModeActions.test.ts` verifying atomic whistle pause persistence.

## [x] [Period Transition Active Lineup 5-Player Floor Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** When transitioning into a new period, starting the game clock without verifying that exactly 5 active players are assigned on-court per team corrupts possession attribution and line score tracking from the opening whistle.
**What:** Enforce active 5-player on-court lineup verification upon period transition, blocking period clock toggling until 5 eligible players per team are assigned on-court.
**Acceptance Criteria:**
- [x] Prompt for starting lineup verification when transitioning to period N+1 if active on-court lineup contains fewer or more than 5 players per team.
- [x] Block clock start in the new period until exactly 5 players are confirmed on-court for both teams.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying period-start 5-player lineup interlocks.

## [x] [Possession Arrow Held Ball Auto-Flip Snapshot Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** When a held ball action is recorded, the alternating possession arrow automatically flips direction. Persisting the updated possession arrow atomically to `db.games` alongside the stat write prevents arrow state reversion during browser reloads or network sync lags.
**What:** Interlock held ball event mutations so that the toggled `possessionArrow` state is written and persisted atomically to `db.games` in IndexedDB alongside the `HELD_BALL` stat event.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts`, atomically update and persist `possessionArrow` state in `db.games` within the same IndexedDB transaction as the `HELD_BALL` stat write.
- [x] Verify page refresh immediately following a held ball call retains the updated possession arrow direction.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying atomic possession arrow persistence on held ball events.

## [x] [Personal Foul Penalty Real-Time Team Foul Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** Personal fouls increment team period foul totals immediately under official rules. Synchronizing team foul counts and bonus indicators synchronously on personal foul entries ensures the Scoreboard displays active bonus status prior to free throw execution.
**What:** Guarantee synchronous team foul re-aggregation and immediate Scoreboard bonus badge updates upon logging any personal foul or shooting foul event.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts` and `useGameModeActions.ts`, re-compute team fouls and update scoreboard bonus status synchronously on personal foul event writes.
- [x] Verify Scoreboard `BONUS` or `DOUBLE BONUS` badges illuminate immediately if a personal foul pushes team fouls to or above the threshold.
- [x] Add unit test coverage in `useGameAggregator.test.ts` / `useGameModeActions.test.ts` verifying synchronous bonus indicator updates on personal foul entries.

## [x] [Free Throw Sequence Clock Auto-Stop Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** Under official basketball regulations, the game clock is stopped during free throw attempts. Launching a free throw workflow while the game clock is running must automatically halt the clock to prevent illegal time depletion during foul shot execution.
**What:** Enforce an automatic clock pause when a shooting foul or free throw sequence is initiated, persisting the stopped clock time to `db.games`.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts`, automatically set `isClockRunning = false` when launching a free throw sequence.
- [x] Persist the stopped `clockTime` to `db.games` in IndexedDB upon opening the free throw workflow.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying automatic clock pause on free throw sequence launch.

## [x] [Period-End Unsaved Score Adjustment Persistence Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** Direct score corrections or point adjustments made right before a period transition must be completely flushed to `db.games` and `db.stats` before period verification to prevent score discrepancies between period totals and final game snapshots.
**What:** Interlock manual score adjustment writes in `VerifiedPeriodModal.tsx` to require all pending score adjustments to resolve in IndexedDB prior to period verification.
**Acceptance Criteria:**
- [x] In `VerifiedPeriodModal.tsx`, await full persistence of any pending score adjustments before completing period verification.
- [x] Block period transition if a score adjustment transaction fails or is in-flight.
- [x] Add unit test coverage in `VerifiedPeriodModal.test.tsx` verifying score adjustment persistence interlocks before period verification.

## [x] [Period-Start Inactive Roster Player On-Court Prevention Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player marked inactive on the game-day roster is assigned to the active on-court lineup at period transition, stat entry and rotation calculations fail or display corrupted jersey data.
**What:** Validate that all 5 active on-court players are marked active on the game-day roster prior to period clock start, prompting a lineup correction if an inactive player is detected on-court.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, check that all 5 on-court player IDs are active in the game-day roster prior to clock start.
- [x] Prompt for lineup replacement if an inactive player is assigned on-court, blocking clock start until resolved.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameMode.test.ts` verifying game-day active roster on-court guards.

## [x] [Period-Start On-Court Lineup Jersey Number Duplicate Prevention Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If two players assigned to the active on-court 5-player lineup share the same jersey number (e.g. following quick editing or unassigned player allocation), scorekeepers and voice recognition tools cannot resolve player attribution cleanly.
**What:** Validate that all 5 active on-court players on a team have distinct, unique jersey numbers before allowing period clock start or game start.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, verify jersey number uniqueness across all 5 active on-court players for both teams prior to clock start.
- [x] Block clock start and display a warning banner "Duplicate Jersey Number On Court (#X). Resolve lineup before starting clock." if a duplicate is detected.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameMode.test.ts` verifying on-court jersey uniqueness enforcement.

## [x] [Free Throw Sequence Technical Foul Awardee Attribution Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Scoring
**Why:** Under official basketball rules, free throws resulting from a technical foul or administrative infraction may be attempted by any eligible player on the floor designated by the head coach. Forcing standard foul shooter attribution logic for technical fouls causes scorekeeper confusion and invalid shooter errors.
**What:** Allow free shooter selection from any active on-court player when launching a free throw sequence resulting from a technical or administrative bench foul.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, enable any active on-court player selection as the designated free throw shooter for technical or administrative fouls.
- [x] Ensure point credits and free throw statistics are accurately assigned to the selected designated shooter in `db.stats`.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying technical foul shooter designation workflows.

## [x] [Unsaved Game Clock Snapshot Restore On Game Resume Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** If a game session is paused or navigated away from while the game clock is running or stopped, resuming the game session from the dashboard must load the exact persisted `clockSeconds` and `period` snapshot from IndexedDB rather than re-initializing to period default max seconds.
**What:** Ensure game session initialization in `useGameClock.ts` and `useGameMode.ts` recovers and restores exact `clockTime`, `isClockRunning`, and `period` snapshots from IndexedDB `db.games`.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` / `useGameClock.ts`, restore `clockSeconds`, `period`, and clock running status from `db.games` when mounting an active game session.
- [x] Verify that navigating back to an in-progress game resumes with the exact saved clock seconds.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying clock state recovery on session resume.

## [x] [Free Throw Sequence Shot Attempt Reversal Score Rollback Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Live Scoreboard
**Why:** If a scorekeeper mistakenly records a made free throw shot during an active multi-shot sequence (e.g., Shot 1 of 2) and taps "Back" or toggles to "MISS" on that attempt, the incremental score awarded to `db.games` must immediately roll back to prevent lingering +1 score desynchronizations on the Scoreboard.
**What:** Interlock free throw shot result edits and back-navigation in `FreeThrowWorkflowDialog.tsx` so that previously awarded free throw points are decremented atomically from IndexedDB `db.games` score snapshot fields.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, decrement `teamScore` or `oppScore` in `db.games` immediately when a previously made free throw attempt is changed to a miss or reversed.
- [x] Guarantee that the live `Scoreboard` score reflects the deducted point in real-time before the sequence workflow exits.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying score rollback on free throw attempt result reversal.

## [x] [Scoreboard Opponent Foul Count Real-Time Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Live Scoreboard
**Why:** During fast-paced play, recording personal or shooting fouls against opponent players must synchronously update opponent team foul totals and bonus indicator lights on the main Scoreboard HUD, preventing delayed bonus visual cues during opponent possessions.
**What:** Harden opponent foul event processing in `useGameAggregator.ts` and `useGameModeActions.ts` to trigger immediate synchronous Scoreboard team foul and bonus badge re-renders upon logging opponent foul events.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, re-evaluate opponent team fouls and bonus badge states synchronously whenever an opponent foul event is written or deleted.
- [x] Ensure `Scoreboard` opponent team foul numbers and `BONUS` / `DOUBLE BONUS` badges update immediately without requiring manual panel refocus.
- [x] Add unit test coverage in `useGameAggregator.test.ts` / `Scoreboard.test.tsx` verifying synchronous opponent foul count and bonus status updates.

## [x] [Game Session Clock State Hydration Lock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** On cold page mounts or slow local storage reads, `useGameClock.ts` can temporarily initialize with period default max seconds (e.g. 10:00) before IndexedDB state hydration completes, risking accidental clock overwrites to 10:00 if an action or tick fires during hydration.
**What:** Implement an explicit hydration lock state in `useGameClock.ts` and `useGameMode.ts` that blocks clock mutations, ticks, and action triggers until IndexedDB clock state recovery is fully resolved.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, hold clock controls and tick intervals in a locked state until `db.games` clock hydration completes.
- [x] Prevent default period max seconds from overwriting persisted clock snapshot values in IndexedDB during page mount.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying hydration lock enforcement during initial clock state recovery.

## [x] [Possession Arrow Period Start Inbounds Team Indication Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official basketball rules (NFHS/NCAA/FIBA), subsequent periods start with throw-ins determined by the alternating possession arrow. Displaying a clear visual indication of which team is awarded the period-start throw-in on the Scoreboard prevents confusion at the scorer's table before play resumes.
**What:** Add a visual "Inbounds Possession" indicator on the Scoreboard and pre-period transition HUD that explicitly highlights the team entitled to the throw-in at the start of the upcoming period.
**Acceptance Criteria:**
- [x] In `Scoreboard.tsx` and period start HUD panels, render a visual badge/indicator showing which team has period-start throw-in rights based on `possessionArrow`.
- [x] Ensure the indicator updates dynamically when the possession arrow state changes or toggles.
- [x] Add unit test coverage in `Scoreboard.test.tsx` verifying period-start inbounds possession indication.

## [x] [Free Throw Sequence Missed Final Attempt Live Play Resume Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official basketball rules, if the final free throw attempt of a multi-shot or 1-and-1 sequence is missed, the ball remains live in play. Scorekeepers need an automated trigger or prompt upon logging a final shot miss to instantly close the free throw modal and resume live clock/rebound stat tracking without manual workflow friction.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` so that logging a "MISS" on the final free throw attempt automatically closes the dialog and sets up live play readiness on the ActionControls HUD.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, automatically finalize and dismiss the workflow modal upon logging a "MISS" on the final shot attempt (e.g., shot 2 of 2, shot 3 of 3, or shot 1 of 1 miss in 1-and-1).
- [x] Ensure the main `GameMode` HUD immediately transitions to live play state with clock controls unlocked for rebound/inbounds tracking.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying automated modal dismissal on missed final free throw attempt.

## [x] [Period-End Buzzer WebAudio Context Unlock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** Modern browsers restrict WebAudio playback until user interaction has initialized or resumed the AudioContext. If the game clock reaches 0:00 without an active AudioContext, the period-end synthesized buzzer sound fails silently, leaving scorekeepers and officials without acoustic feedback.
**What:** Add an AudioContext state unlock guard in `useGameClock.ts` and clock start handlers that explicitly initializes and resumes the WebAudio AudioContext on initial tap/interaction.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` or audio utility modules, ensure the WebAudio `AudioContext` is resumed on user interactions (e.g. clock start/pause or stat entry).
- [x] Guarantee that synthesized period-end buzzer audio plays reliably when `clockSeconds` reaches 0:00.
- [x] Add unit test coverage in `useGameClock.test.ts` / sound utility tests verifying AudioContext initialization and unlock guards.

## [x] [Scoreboard Team Foul Bonus Threshold Visual State Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Fouls
**Why:** In high-stakes games, scorekeepers and head coaches need immediate visual confirmation on the main Scoreboard when a team enters the bonus or double bonus state without relying solely on small text badges. Dynamically updating panel border colors or background highlights on the Scoreboard when bonus thresholds are reached reduces cognitive load during live play.
**What:** Interlock `Scoreboard.tsx` team panel styling with real-time bonus status from `useGameAggregator.ts`, updating team panel visual highlights when bonus/double bonus is active.
**Acceptance Criteria:**
- [x] In `Scoreboard.tsx`, update team panel container styles (e.g. border color or background highlight) dynamically based on single or double bonus status.
- [x] Ensure visual styling updates synchronously whenever a team foul is added or removed.
- [x] Add unit test coverage in `Scoreboard.test.tsx` verifying team panel visual style changes on bonus threshold transitions.

## [x] [Scoreboard Live Score Snapshot Re-Aggregation Recovery Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** If local IndexedDB `db.games` cached `teamScore` or `oppScore` becomes desynchronized from the sum of valid `db.stats` events due to an interrupted transaction or browser reload, the live scoreboard displays incorrect total scores. Automatically re-aggregating and reconciling score snapshots on game load or period start guarantees 100% score display accuracy.
**What:** Add a score snapshot reconciliation guard in `useGameMode.ts` / `useGames.ts` that compares cached `teamScore`/`oppScore` against calculated `db.stats` scoring event totals and automatically heals desynchronized `db.games` score fields.
**Acceptance Criteria:**
- [x] On mounting `GameMode` or initializing a game session, calculate sum of active scoring events in `db.stats`.
- [x] If calculated scores differ from cached `teamScore` or `oppScore` in `db.games`, update `db.games` score snapshot fields atomically to restore parity.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying score snapshot auto-reconciliation on game session load.

## [x] [Game Clock Stop-State Action Mutation Lock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** Recording live scoring actions (e.g. 2PT make, 3PT make) while the clock is stopped at 0:00 or during intermission can accidentally attribute stats to expired periods or create zero-timestamp score events without user intent.
**What:** Enforce a clock-state validation guard in `useGameModeActions.ts` that warns or requires scorekeeper confirmation when logging live field goals while `clockSeconds === 0` or during intermission states.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts`, check `clockSeconds` and period state before saving live field goal actions (`ACTION_TYPES.MAKE`).
- [x] If `clockSeconds === 0` and the period has ended, prompt for clock adjustment or period advancement before recording live field goals.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying clock stop-state mutation validation.

## [x] [Period-End Unsaved Lineup Stint Duration Persistence Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** When a period ends or is verified, active 5-player on-court lineup stint timestamps must be saved to IndexedDB `db.games` / `db.stats` before period counter increments to prevent losing active court time calculations across period transitions.
**What:** Ensure `useGameMode.ts` and `VerifiedPeriodModal.tsx` await full line-up stint duration persistence in IndexedDB before completing period verification and period state advancement.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` (`handleVerifyPeriod`), calculate and persist active on-court player stint durations up to `clockSeconds` before incrementing `currentPeriod`.
- [x] Block period advancement if lineup stint persistence fails or is in-flight.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying stint duration persistence before period advancement.

## [x] [Period-Start Zero-Clock Game Resume Hydration Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** When resuming an active game from the dashboard at period start or intermission where `clockSeconds === 0`, cold page loads can incorrectly re-initialize `clockSeconds` to the default full period length (e.g. 10:00) instead of preserving the period-end `0:00` state.
**What:** Enforce strict clock state hydration locking in `useGameClock.ts` and `useGameMode.ts` to ensure `0:00` period-end clock snapshots persist correctly across page reloads without defaulting back to period start duration.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, preserve `0:00` clock snapshot from `db.games` when loading a game at period end or intermission.
- [x] Prevent re-initialization to full period default duration when `clockSeconds === 0` and the period has ended or is awaiting verification.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying `0:00` period-end clock state recovery on session resume.

## [x] [Period-Start Active Lineup Personal Foul Limit Pre-Check Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Data Integrity
**Why:** If an active player on court accumulates personal fouls up to the disqualification limit right before a period ends, starting the subsequent period without checking individual foul limits risks recording illegal game clock ticks and corrupted personal foul event logs.
**What:** Validate personal foul limits across all 5 active on-court players in `useGameMode.ts` upon period transition, blocking clock start and displaying an alert if a player with `personalFouls >= foulLimit` is detected on court.
**Acceptance Criteria:**
- [x] In `useGameMode.ts`, check on-court player personal fouls against `foulLimit` prior to allowing clock start at period transition.
- [x] Block game clock activation and display an alert banner "On-court player (#X) has reached foul limit" if an eligible foul limit violation is detected.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying on-court personal foul limit pre-checks.

## [x] [Free Throw Sequence Non-Shooting Foul Point Credit Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** During a multi-shot free throw sequence resulting from shooting or bonus personal fouls, attributing made free throw points to the wrong team or non-shooting player invalidates official score records.
**What:** Enforce strict shooting team ID and shooter player ID verification in `FreeThrowWorkflowDialog.tsx` prior to committing made free throw points to `db.stats` and `db.games`.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, verify that points awarded on made free throw attempts match the designated shooting player ID and team ID.
- [x] Guarantee that made free throw attempts atomically increment `teamScore` or `oppScore` snapshot fields on `db.games` matching the foul awardee's team.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying free throw point credit team and player attribution.

## [x] [Overtime Period Start Team Foul Carryover Real-Time Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Data Integrity
**Why:** Under official NFHS/NCAA rules, fouls committed during overtime periods append to the final regulation period's foul totals for team foul bonus enforcement. Failing to carry over team fouls into overtime corrupts bonus indicator badges during extra period play.
**What:** Guarantee that starting an overtime period (period > maxPeriod) in `useGameAggregator.ts` and `Scoreboard.tsx` inherits and aggregates carried-over team fouls in real time.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, calculate overtime team fouls as a direct extension of the final regulation period's foul total.
- [x] Ensure `Scoreboard.tsx` displays active `BONUS` or `DOUBLE BONUS` badges immediately at OT start if carried-over fouls exceed threshold.
- [x] Add unit test coverage in `useGameAggregator.test.ts` verifying team foul carryover at overtime start.

## [x] [Period-End Unsaved Stat Undo History Flush Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Allowing undo operations on stat events recorded in previous periods after verifying and advancing to a new period causes score, foul, and stint desynchronization across period boundaries.
**What:** Flush and invalidate the temporary `undoneStatCache` and undo stack upon period verification to lock previous period history against post-period rollbacks.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` and `VerifiedPeriodModal.tsx`, clear `undoneStatCache` and clear undo history when period verification completes.
- [x] Block rolling back or re-applying stat actions belonging to verified, finalized periods.
- [x] Add unit test coverage in `useGameModeActions.test.ts` verifying undo cache flushing on period verification.

## [x] [Scoreboard Live Team Foul Reset Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Live Scoreboard
**Why:** When transitioning across periods, team foul displays on the Scoreboard must reset to 0 (or carry over for HALVES format) synchronously across both teams to prevent inaccurate bonus indicator states at period start.
**What:** Guarantee synchronous Scoreboard team foul display resets and bonus light clears on period transition in `Scoreboard.tsx` and `useGameAggregator.ts`.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts` and `Scoreboard.tsx`, reset team foul counters and bonus lights synchronously upon period advancement.
- [x] Verify that single and double bonus badges clear immediately at the start of new regulation periods.
- [x] Add unit test coverage in `Scoreboard.test.tsx` verifying synchronous team foul display reset on period transition.

## [x] [Scoreboard Live Clock Tenths-of-Second Pause Transition Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Live Scoreboard
**Why:** Pausing or resuming the game clock under 1 minute can cause sub-second display rounding mismatches between the live timer and the cached IndexedDB game snapshot. Guaranteeing exact sub-second clock state sync on pause prevents scorekeeper confusion during winning time.
**What:** Synchronize sub-second clock formatting in `Scoreboard.tsx` and `useGameClock.ts` on clock start/pause transitions to persist and render exact remaining tenths of a second without display rounding jump.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `Scoreboard.tsx`, retain exact sub-second precision when `isClockRunning` transitions to `false`.
- [x] Persist `clockTime` snapshot with sub-second accuracy to `db.games` on clock pause.
- [x] Add unit test coverage in `useGameClock.test.ts` / `Scoreboard.test.tsx` verifying sub-second clock pause precision.

## [x] [Game Mode Active Session Navigation Unsaved State Lock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** Navigating away from `GameMode` during an active clock tick or in-flight IndexedDB transaction without pausing the clock or persisting session snapshot risks state corruption and lost stat history.
**What:** Implement a navigation guard or route change listener in `GameMode.tsx` that pauses the running clock and awaits pending IndexedDB state flushes before allowing user navigation away from the live game view.
**Acceptance Criteria:**
- [x] In `GameMode.tsx`, automatically pause the game clock (`isClockRunning = false`) when navigating away or unmounting the component.
- [x] Await active `db.games` clock and score snapshot persistence before routing transition completes.
- [x] Add unit test coverage in `GameMode.test.tsx` verifying clock auto-pause and state flush on component unmount.

## [x] [Period Transition Score Snapshot Re-Aggregation Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** Transitioning into a new period while an in-flight score adjustment or stat write is resolving can cause cached `teamScore` or `oppScore` in `db.games` to lag behind actual event totals.
**What:** Re-aggregate and verify `db.stats` scoring event sums against `db.games` score snapshot fields during period initialization, reconciling any score discrepancies prior to opening clock controls.
**Acceptance Criteria:**
- [x] In `useGameMode.ts`, verify calculated stat score totals match `db.games` score fields upon entering a new period.
- [x] Atomically update `db.games` score snapshots if a discrepancy is detected at period start.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying period-start score snapshot re-aggregation.

## [x] [Free Throw Sequence Interrupted Workflow State Recovery Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Scoring
**Why:** If a scorekeeper's tab refreshes, browser crashes, or loses power while inside an active multi-shot free throw sequence, losing the in-flight sequence state or remaining shot count causes free throw attempt misattribution and score desynchronization.
**What:** Persist the active free throw workflow sequence state (current shot number, shooter ID, foul awardee team, total shots) to `db.games` in IndexedDB on every shot attempt, and automatically restore or prompt to resume the sequence if the game session reloads.
**Acceptance Criteria:**
- [x] Save active free throw sequence progress state in `db.games` upon starting or advancing a free throw workflow.
- [x] On mounting `GameMode`, check for an interrupted free throw sequence and automatically restore the workflow modal at the exact remaining shot attempt.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` / `useGameMode.test.ts` verifying interrupted free throw sequence state recovery.

## [x] [Scoreboard Live Lead Differential Real-Time Re-Aggregation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Live Scoreboard
**Why:** On cold page loads or during rapid scoring sequences, if the live lead differential badge on the Scoreboard calculates off stale score snapshots rather than active event aggregates, coaches see an inaccurate lead or deficit indicator.
**What:** Harden the lead differential badge rendering on `Scoreboard.tsx` to compute directly off real-time reconciled score aggregates, ensuring instant differential updates across scoring events and score adjustments.
**Acceptance Criteria:**
- [x] In `Scoreboard.tsx`, calculate lead differential directly from reconciled team and opponent score totals.
- [x] Ensure lead differential badge color and value update synchronously on direct score overrides and stat undo actions.
- [x] Add unit test coverage in `Scoreboard.test.tsx` verifying lead differential badge synchronization on score modifications.

## [x] [Game Session Period Clock Duration Hydration Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** When switching between period types (e.g. Quarters vs. Halves) or custom period lengths during an active game session, `useGameClock.ts` must safely recalculate and hydrate maximum period seconds without corrupting saved `clockTime` snapshots.
**What:** Implement period duration validation guards in `useGameClock.ts` and `getPeriodDurationSeconds` to ensure clock time clamps correctly to the active period config without zeroing out saved time.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, validate period length and period type configuration prior to recalculating max period duration.
- [x] Guarantee that modifying period duration settings during game setup clamps existing clock snapshots safely within period bounds.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying period duration configuration hydration safety.

## [x] [Overtime Period Initial Clock Length Configuration Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / UX
**Why:** Under official rules, overtime period lengths differ by competition level (e.g., 4 minutes for high school/NFHS, 5 minutes for NCAA/FIBA) and from regulation period lengths. If an overtime period is started without properly initializing the clock to overtimeLength seconds, the clock defaults to full regulation period length, causing incorrect period time tracking.
**What:** Ensure `useGameClock.ts` and `useGameMode.ts` calculate and initialize `clockSeconds` strictly using `overtimeLength` (or regulation default OT length) when advancing to any overtime period, persisting the OT clock length snapshot to `db.games`.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `handleNextPeriod`, set initial period seconds using `overtimeLength` when `period > maxPeriod` (period > 4 for Quarters, period > 2 for Halves).
- [x] Atomically persist the calculated overtime clock time to `db.games` upon entering overtime.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying overtime period clock initialization with dynamic overtime lengths.

## [x] [Scoreboard Team Foul Bonus Status Real-Time Re-Aggregation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Live Scoreboard
**Why:** When a stat event (such as a personal foul) is undone, edited, or deleted, or when the game tab reloads, team foul counts for bonus/double-bonus calculations must immediately re-aggregate from active non-deleted `db.stats` events. If bonus calculations rely on cached counts, the Scoreboard displays incorrect bonus badges during active play.
**What:** Harden `useGameAggregator.ts` to re-aggregate team fouls directly from non-deleted stat events upon any stat mutation or cache update, ensuring `BONUS` and `DOUBLE BONUS` indicators reflect the exact active foul total.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, calculate team foul totals by filtering non-deleted foul events for the active period/half in real time.
- [x] Ensure `Scoreboard` bonus and double bonus badge states update immediately when fouls are undone or deleted.
- [x] Add unit test coverage in `useGameAggregator.test.ts` verifying team foul bonus indicator updates on foul deletion or undo.

## [x] [Period-Start Inactive Player Roster Selection Filter Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Rosters / Data Integrity
**Why:** Players marked inactive on the game-day roster must be completely filtered out of active on-court lineup pickers and stat entry menus during game setup and period transitions to prevent accidental stat entry or lineup assignment for inactive players.
**What:** Enforce game-day active roster filtering in `GameMode` and `ActionControls.tsx` so that inactive roster players cannot be assigned to starting lineups or live stat actions.
**Acceptance Criteria:**
- [x] Filter active player options in lineup controls and stat entry panels to exclude players marked inactive on the game-day roster.
- [x] Prevent game start or period clock activation if an inactive roster player is assigned on court.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameMode.test.ts` verifying game-day inactive roster filtering.

## [x] [Unsaved Free Throw Sequence Cancellation Score Rollback Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** If a scorekeeper cancels or exits an in-flight multi-shot free throw sequence midway (e.g. after logging shot 1 of 2 as a make) before completing the full sequence, any incremental score points awarded during the interrupted dialog must be atomically rolled back in `db.stats` and `db.games` score snapshot fields to prevent phantom point accumulation.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` cancellation and exit handlers to roll back any free throw stat events and score snapshot increments recorded during the cancelled sequence session.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, track free throw stat IDs created during the active sequence session.
- [x] If the user taps "Cancel" or closes the modal before sequence completion, soft-delete recorded free throw stat events and decrement `db.games` `teamScore`/`oppScore` snapshots accordingly.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying score rollback on sequence cancellation.

## [x] [Period-Start Inbounds Possession Arrow Auto-Flip Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Under official rules (NFHS/NCAA/FIBA), when a new period starts and throw-in possession is awarded via the alternating possession arrow, the arrow direction must automatically flip to the opposing team upon the first clock tick or live play event to preserve alternating possession integrity.
**What:** Ensure `useGameClock.ts` and `useGameModeActions.ts` set and execute the pending possession arrow flip in `db.games` immediately when the clock starts or the first live event is recorded in a new period started via alternating possession.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `handleNextPeriod`, register pending possession arrow flip when period > 1 starts via alternating possession.
- [x] Automatically execute possession arrow flip in `db.games` upon initial clock tick or stat entry in the new period.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying possession arrow auto-flip on period-start throw-in execution.

## [x] [Scoreboard Live Clock Zero-Seconds Action Lock Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Data Integrity
**Why:** When the period game clock reaches 0:00, scorekeepers must not accidentally log live gameplay actions (like 2PT make or personal foul) before verifying the period or adjusting the clock, as recording events at 0:00 without active period state corrupts play-by-play timelines.
**What:** Lock live action buttons in `ActionControls.tsx` and stat entry dialogs when `clockSeconds === 0` and `isClockRunning === false` at period end, prompting the user to advance the period or edit the clock first.
**Acceptance Criteria:**
- [x] In `ActionControls.tsx` and `StatEntryDialog.tsx`, disable live scoring and foul entry controls when `clockSeconds === 0` and period verification is pending.
- [x] Display an inline banner "Period ended (0:00). Advance period or adjust clock to resume live tracking."
- [x] Add unit test coverage in `ActionControls.test.tsx` verifying control lock state at 0:00 clock expiration.

## [x] [Period-Start On-Court Lineup Disqualified Player Auto-Substitute Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player receives their disqualifying foul right at the end of a period (e.g. buzzer foul), advancing to the next period without removing them from the active 5-player on-court lineup allows illegal personnel on court and causes game clock start locks.
**What:** Enforce automatic removal and forced replacement of fouled-out players from the active on-court lineup when initializing a new period before allowing clock start.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` / `ActionControls.tsx`, check all 5 active on-court player personal foul counts against `foulLimit` upon period transition.
- [x] If an active on-court player has reached or exceeded `foulLimit`, launch `QuickSubDialog` in forced substitution mode to replace the disqualified player before period clock start.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying forced substitution on period transition for fouled-out players.

## [x] [Period-End Team Foul Reconciliation Bonus Re-Aggregation Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Data Integrity
**Why:** When period verification executes manual team foul overrides or individual player foul adjustments in `VerifiedPeriodModal`, team foul totals and Scoreboard bonus status indicators must immediately re-aggregate from non-deleted `db.stats` events to ensure accurate bonus light displays at the start of the next period.
**What:** Interlock `handleVerifyPeriod` in `useGameMode.ts` to trigger a synchronous team foul re-aggregation pass across `db.stats` after applying period verification adjustments, updating Scoreboard `BONUS` and `DOUBLE BONUS` badges before transitioning to the next period.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` (`handleVerifyPeriod`), re-aggregate team foul stats synchronously after writing period verification adjustment events to `db.stats`.
- [x] Ensure Scoreboard team foul displays and bonus status badges reflect reconciled team foul totals immediately upon period transition.
- [x] Add unit test coverage in `useGameMode.test.ts` / `VerifiedPeriodModal.test.tsx` verifying team foul bonus re-aggregation post period verification.

## [x] [Game Clock Whistle Stoppage Action Timestamp Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** When a whistle action automatically pauses the live game clock, recording subsequent actions during the stoppage must bind to the exact clock time snapshot at the whistle to prevent timestamp drift or sub-second timeline mismatches across play-by-play logs.
**What:** Ensure `useGameModeActions.ts` and `useGameClock.ts` synchronize stat event creation clock timestamps strictly to the frozen whistle clock time when the clock is paused due to a whistle stoppage.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts`, bind recorded stat event timestamps to the exact paused whistle clock snapshot when `isClockRunning === false` following a whistle event.
- [x] Prevent clock time drift or sub-second discrepancy between whistle events and immediate follow-up stat entries (e.g. fouls or administrative adjustments).
- [x] Add unit test coverage in `useGameModeActions.test.ts` / `useGameClock.test.ts` verifying whistle stoppage clock timestamp synchronization.

## [x] [Free Throw Workflow Interrupted Shooter Substitution Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / UX
**Why:** Under official basketball rules, if a free throw shooter injured or disqualified prior to executing free throws is subbed out, the substitute player must be designated and verified in the free throw workflow before shot attempts are logged.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` to require substitute shooter selection and validation if the originally designated shooter is subbed off or unavailable when the free throw sequence modal launches.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, check that the assigned shooter is active on court; if unavailable, prompt for immediate substitute shooter designation.
- [x] Ensure all subsequent made/missed free throw stat events attribute strictly to the verified substitute shooter.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying substitute shooter designation interlocks.

## [x] [Period-Start Jump Ball Initial Possession Arrow Enforcement Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** When opening a game or overtime period with a jump ball, the alternating possession arrow must strictly set to point toward the team that lost the tip-off immediately upon jump ball confirmation, establishing the baseline for all subsequent period-start throw-ins.
**What:** Interlock `JumpBallDialog.tsx` and `useGameMode.ts` to enforce atomic possession arrow allocation and IndexedDB persistence immediately when tip-off winner is confirmed.
**Acceptance Criteria:**
- [x] In `JumpBallDialog.tsx`, set `possessionArrow` to point toward the non-winning team atomically upon jump ball completion.
- [x] Persist `possessionArrow` direction strictly to `db.games` before allowing live game clock start.
- [x] Add unit test coverage in `JumpBallDialog.test.tsx` / `useGameMode.test.ts` verifying possession arrow enforcement on jump ball completion.

## [x] [Free Throw Sequence Awarded Shot Counter Hard Boundary Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** When executing a multi-shot free throw sequence, manual scorekeeper taps or rapid UI interactions can accidentally trigger additional shot prompts beyond the awarded shot count (1, 2, or 3 shots), causing extra free throw point additions and corrupted stat logs.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` to strictly clamp maximum shot sequence iterations to the exact awarded shot count (1, 2, or 3) determined by the initial foul event type, preventing extra shot logging.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, enforce a hard maximum shot iteration limit matching the initial foul type (`FOUL_SHOOTING_2` -> 2, `FOUL_SHOOTING_3` -> 3, `FOUL_BONUS` -> 1 or 2).
- [x] Block "Next Shot" triggers once the awarded shot count limit is reached, automatically finalizing the sequence.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying awarded shot counter boundary enforcement.

## [x] [Period Transition Score Snapshot Re-Aggregation Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** If a period transition occurs immediately following a rapid score entry or undo operation, cached team scores in `db.games` can lag behind the actual sum of `db.stats` scoring events, causing scoreboard score discrepancies in subsequent periods.
**What:** Interlock `VerifiedPeriodModal.tsx` and `useGameMode.ts` to re-aggregate and verify `db.stats` scoring event totals against `db.games` snapshot scores before finalizing period transitions, automatically reconciling any snapshot desynchronizations.
**Acceptance Criteria:**
- [x] In `VerifiedPeriodModal.tsx` / `useGameMode.ts`, compare total points calculated from active `db.stats` against `db.games` score snapshot fields before period verification.
- [x] Automatically reconcile and persist matching `teamScore` and `oppScore` in `db.games` if a discrepancy is detected prior to period advancement.
- [x] Add unit test coverage in `VerifiedPeriodModal.test.tsx` / `useGameMode.test.ts` verifying score snapshot re-aggregation on period verification.

## [x] [Period Transition Lineup Reconciliation Disqualified Player Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player receives their 5th personal foul (or disqualifying foul) on a period-ending buzzer whistle, verifying the period and advancing to the next period without removing them from the active 5-player on-court lineup causes illegal personnel states and blocks period start.
**What:** Enforce active lineup disqualification pre-checks during period verification in `VerifiedPeriodModal.tsx` and `useGameMode.ts`, automatically removing disqualified players from the on-court lineup prior to period transition.
**Acceptance Criteria:**
- [x] In `VerifiedPeriodModal.tsx` / `useGameMode.ts`, check all on-court players for disqualifying foul totals before completing period verification.
- [x] Automatically clear or prompt for replacement of disqualified players from the active 5-player lineup before advancing to the new period.
- [x] Add unit test coverage in `VerifiedPeriodModal.test.tsx` / `useGameMode.test.ts` verifying disqualified player removal during period transition reconciliation.

## [x] [Free Throw Sequence Foul Type Bonus Transition Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Fouls
**Why:** When a non-shooting personal foul commits a team into the single bonus or double bonus state, launching a free throw workflow must dynamically resolve the exact awarded shot attempts (1-and-1 vs. 2 shots) based on the team's bonus status at the exact moment of the foul.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts` to calculate and freeze the awarded free throw count directly from the real-time team foul bonus threshold at foul event creation.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` / `FreeThrowWorkflowDialog.tsx`, evaluate team foul bonus status at foul creation time and award 1-and-1 (or 2 shots for double bonus) accordingly.
- [x] Ensure `FreeThrowWorkflowDialog.tsx` renders the exact awarded shot count dynamically based on the foul's bonus classification.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying foul-type bonus transition awarded shot calculations.

## [x] [Period Clock Stop Whistle Action Double-Tap Prevention Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** In fast-moving game situations, scorekeepers might rapidly double-tap a whistle action (such as personal foul or timeout) or press the clock stop button simultaneously, causing duplicate clock pause state mutations or orphaned clock timer intervals.
**What:** Implement a debounced execution lock and atomic transition guard in `useGameClock.ts` and `useGameModeActions.ts` during whistle-action clock auto-pause processing to block concurrent or double-tapped stop requests.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `useGameModeActions.ts`, lock clock pause state transitions against concurrent whistle action triggers.
- [x] Prevent duplicate clock state mutations or race conditions when whistle actions and manual pause buttons are pressed simultaneously.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameModeActions.test.ts` verifying double-tap whistle pause protection.

## [x] [Scoreboard Live Clock Resync On Tab Focus Recovery Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Live Scoreboard
**Why:** When a scorekeeper switches tabs or minimizes the browser window during a running clock, browser timer throttling (e.g. `setInterval` throttling) can cause the displayed clock to lag behind true elapsed system time upon refocusing the tab.
**What:** Integrate a `visibilitychange` window focus event listener in `useGameClock.ts` that calculates true elapsed wall-clock time using `performance.now()` / timestamp deltas and resynchronizes `clockSeconds` immediately on tab focus recovery.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, track wall-clock start timestamps and calculate elapsed time upon document visibility state changes (`visibilitychange`).
- [x] Automatically resynchronize `clockSeconds` and persist updated state to `db.games` when regaining window focus.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying clock resynchronization on tab focus recovery.

## [x] [Period-Start On-Court Player Roster Deletion Recovery Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player assigned to the active on-court 5-player lineup is deleted or removed from the team roster during pre-game setup or period transitions, stat entry and clock starts fail due to missing player references.
**What:** Interlock `useGameMode.ts` and `ActionControls.tsx` to detect deleted on-court player IDs on period start, prompt for automatic replacement, and prevent clock starts until 5 valid active roster players are confirmed on court.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, validate active player existence for all 5 on-court IDs prior to allowing period clock start.
- [x] Prompt for forced substitution if an assigned on-court player ID is missing or deleted from the roster.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying deleted player recovery on period start.

## [x] [Scoreboard Live Clock Rapid Toggle Race Condition Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / UX
**Why:** Rapidly tapping the clock start/stop toggle button on the Scoreboard can spawn overlapping `setInterval` timer instances or trigger race conditions between state mutations and IndexedDB updates.
**What:** Implement a state lock and transition guard in `useGameClock.ts` during toggle processing, ignoring rapid repeated taps until the previous clock state transition completes and persists.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, lock `handleToggleClock` against concurrent or rapid execution triggers.
- [x] Ensure `setInterval` instances are strictly cleared before instantiating new timer ticks.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying clock toggle debouncing and interval lock protection.

## [x] [Free Throw Sequence Unsaved Shooter Selection Cancellation Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** If a free throw workflow launches and the scorekeeper cancels or closes the shooter selection step prior to logging any shot attempts, any pending state changes or temporary flags must be cleanly reset to avoid lingering workflow locks.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` modal cancel/close handlers to flush temporary state and unlock clock/action controls when closed during shooter selection.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, clean up pending workflow state if cancelled during shooter selection before Shot 1.
- [x] Re-enable clock controls and action panels on `GameMode` HUD immediately upon workflow exit.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying clean cancellation during free throw shooter selection.

## [x] [Edit Clock Modal Running Clock Auto-Pause Synchronization Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / UX
**Why:** If a scorekeeper opens the `EditClockDialog` to make a clock correction while the live clock is running, continuing the live tick in the background causes time mismatches between the scorekeeper's manual input and the running timer state.
**What:** Interlock `EditClockDialog.tsx` and `useGameClock.ts` to automatically pause the running game clock when the manual clock edit dialog is opened, persisting the paused state and resuming only upon explicit user action after saving or closing the dialog.
**Acceptance Criteria:**
- [x] In `EditClockDialog.tsx` / `useGameClock.ts`, automatically pause the live game clock (`isClockRunning = false`) upon opening `EditClockDialog`.
- [x] Persist the paused clock time snapshot to `db.games` in IndexedDB upon opening the edit dialog.
- [x] Add unit test coverage in `EditClockDialog.test.tsx` / `useGameClock.test.ts` verifying automatic clock pause on edit clock dialog open.

## [x] [Score Adjustment Modal Direct Override Score Snapshot Parity Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** When scorekeepers adjust points directly via `ScoreAdjustmentDialog.tsx`, committing the score change without re-validating the score delta against active `db.games` score snapshot fields can cause transient score display mismatches on the Scoreboard HUD.
**What:** Interlock `ScoreAdjustmentDialog.tsx` and `useGameModeActions.ts` to compute the exact point delta and update both `db.stats` system adjustment records and `db.games` score snapshot fields atomically within the same IndexedDB transaction.
**Acceptance Criteria:**
- [x] In `ScoreAdjustmentDialog.tsx` and `useGameModeActions.ts`, write direct score overrides atomically to both `db.stats` and `db.games` score fields.
- [x] Ensure the live `Scoreboard` score display and lead differential badge update immediately upon saving the score adjustment.
- [x] Add unit test coverage in `ScoreAdjustmentDialog.test.tsx` / `useGameModeActions.test.ts` verifying atomic score snapshot persistence on direct score overrides.

## [x] [Period Intermission Timer Clock Resume State Transition Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Feature
**Why:** When a period ends and intermission/halftime countdown timer is active on the Scoreboard, tapping "Skip Intermission" or "Start Period" before intermission expires must cleanly reset intermission state in IndexedDB and transition directly to starting lineup verification for the upcoming period.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` to clear active intermission countdown timers atomically and transition into the next period's pre-tip lineup verification workflow upon user override or intermission completion.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `useGameMode.ts`, clear `intermissionSeconds` and active intermission flags in `db.games` when skipping or completing intermission breaks.
- [x] Automatically open the pre-period starting lineup verification dialog for the upcoming period upon intermission transition.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying intermission timer clearing and period start transition interlocks.

## [x] [Period-End Scoreboard Final Result Freeze Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Live Scoreboard
**Why:** When a game is finalized or period ends, accidental score updates or live action clicks can alter the official scorebook result before verification is complete. Freezing live action controls upon period clock expiration protects final result integrity.
**What:** Interlock `ActionControls.tsx` and `useGameMode.ts` to freeze live action inputs and lock team scores on `Scoreboard.tsx` immediately when the period/game clock reaches 0:00 until explicit period verification or clock edit.
**Acceptance Criteria:**
- [x] In `ActionControls.tsx` and `Scoreboard.tsx`, disable live action buttons and score mutation inputs when `clockSeconds === 0` and period verification is pending.
- [x] Ensure score snapshot values displayed on the Scoreboard freeze and persist strictly to `db.games` at period end.
- [x] Add unit test coverage in `Scoreboard.test.tsx` / `ActionControls.test.tsx` verifying result freeze on period expiration.

## [x] [Free Throw Sequence Technical Foul Consecutive Penalty Order Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Fouls
**Why:** Under official basketball rules (NFHS/NCAA), multiple technical fouls or personal plus technical fouls committed in the same stoppage must be administered in strict chronological order with correct free throw shot counts.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts` to queue and execute consecutive free throw penalty sequences in exact order without losing awardee team attribution or shot attempt totals.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` and `FreeThrowWorkflowDialog.tsx`, queue pending free throw penalty sequences when multiple foul events occur during the same clock stoppage.
- [x] Automatically launch follow-up free throw sequences for remaining queued penalties upon completion of the preceding sequence.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying consecutive penalty free throw sequence queuing.

## [x] [Period-Start Inbounds Arrow State Sync Snapshot Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** When a new period starts via alternating possession throw-in, browser reloads or tab switches during the initial throw-in execution can lose the pending possession arrow flip state, leading to duplicate throw-in awards to the same team.
**What:** Persist the pending possession arrow transition state snapshot to `db.games` in IndexedDB upon period start and execute the arrow flip atomically on the first clock tick or live stat write.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `useGameMode.ts`, persist `pendingPossessionFlip` state to `db.games` at period start.
- [x] Guarantee that browser reloads prior to the initial clock tick preserve the pending arrow flip direction.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying pending possession arrow state persistence across reloads.

## [x] [Scoreboard Live Clock Sub-Second Expiration Buzzer Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** In tight winning-time situations, sub-second clock ticks reaching exactly `0.0` must trigger the WebAudio horn buzzer synchronously on the exact 0.0 tick rather than after a multi-second delayed state transition.
**What:** Interlock sub-second clock countdown logic in `useGameClock.ts` to execute `playBuzzerSound()` synchronously on the exact tick where `clockSeconds` transitions to `0`.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, invoke audio buzzer output synchronously inside the timer tick callback when `clockSeconds` hits 0.
- [x] Prevent delayed or skipped buzzer playback during sub-minute tenths-of-second rendering transitions.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying synchronous buzzer invocation on 0:00 tick transition.

## [x] [Score Adjustment Modal Negative Score Floor Clamp Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** When scorekeepers perform manual score corrections via `ScoreAdjustmentDialog.tsx`, applying a negative point adjustment that reduces a team's total score below 0 causes invalid negative score displays on the Scoreboard.
**What:** Enforce a hard zero floor clamp (`Math.max(0, currentScore + delta)`) on direct score adjustments in `ScoreAdjustmentDialog.tsx` and `useGameModeActions.ts` to block negative total scores.
**Acceptance Criteria:**
- [x] In `ScoreAdjustmentDialog.tsx` and `useGameModeActions.ts`, clamp team score adjustments strictly so total team score cannot fall below 0.
- [x] Display an inline error message "Score cannot be less than 0" if a negative adjustment exceeds current score.
- [x] Add unit test coverage in `ScoreAdjustmentDialog.test.tsx` verifying negative score floor clamping.

## [x] [Opening Tip-Off Confirmation Game Clock Auto-Start Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** Under official basketball rules, the game clock starts immediately when the ball is legally touched by a player on the opening tip-off. Forcing scorekeepers to manually tap "Start Clock" after confirming the jump ball winner in `JumpBallDialog` introduces timing lag and operational friction at game start.
**What:** Interlock `JumpBallDialog.tsx` and `useGameClock.ts` to automatically set `isClockRunning = true` and persist running clock state to `db.games` immediately upon user confirmation of the opening tip-off winner.
**Acceptance Criteria:**
- [x] In `JumpBallDialog.tsx`, invoke `onStartClock()` or automatically toggle `isClockRunning` to true when tip-off winner is submitted.
- [x] Atomically persist active running clock state and starting timestamp to `db.games` in IndexedDB upon tip-off completion.
- [x] Add unit test coverage in `JumpBallDialog.test.tsx` / `useGameClock.test.ts` verifying automatic clock start on opening tip-off confirmation.

## [x] [Double-Bonus Threshold Team Foul Real-Time Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Live Scoreboard
**Why:** When team fouls reach the double bonus threshold (e.g. 10 team fouls in NFHS/NCAA or 5 in FIBA quarters), the Scoreboard HUD must dynamically transition from `BONUS` to `DOUBLE BONUS` status synchronously across both teams without lagging behind foul event writes.
**What:** Interlock `useGameAggregator.ts` and `Scoreboard.tsx` to re-evaluate double bonus threshold limits in real time on every foul event write, edit, or rollback, updating `DOUBLE BONUS` indicator lights synchronously.
**Acceptance Criteria:**
- [x] In `useGameAggregator.ts`, evaluate double bonus foul thresholds synchronously upon personal foul creation, deletion, or undo.
- [x] Ensure `Scoreboard.tsx` updates `DOUBLE BONUS` badges dynamically and highlights team panels when double bonus is active.
- [x] Add unit test coverage in `useGameAggregator.test.ts` / `Scoreboard.test.tsx` verifying synchronous double bonus threshold state transitions.

## [x] [Period-Start On-Court Active Personnel Minimum Floor Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Starting any period clock or opening tip-off with fewer than 5 active players assigned to the floor per team corrupts stint tracking, play-by-play stat attribution, and lineup efficiency calculations from the opening possession.
**What:** Enforce a hard 5-player minimum personnel floor guard in `ActionControls.tsx` and `useGameMode.ts` that strictly blocks clock activation if either team has fewer than 5 active non-disqualified players confirmed on court.
**Acceptance Criteria:**
- [x] In `ActionControls.tsx` and `useGameMode.ts`, validate that both home and opponent teams have exactly 5 eligible active players assigned on court before enabling "Start Clock".
- [x] Display an inline banner "Minimum 5 active players required on court per team before starting clock" if an incomplete lineup is present.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameMode.test.ts` verifying personnel floor enforcement guards.

## [x] [Period Clock Zero-Seconds Whistle Action Lock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** Recording whistle-action events (e.g. personal fouls, timeouts, or held balls) when the period game clock is expired at 0:00 causes invalid period attribution and clock snapshot corruption if registered post-buzzer without period verification.
**What:** Interlock `ActionControls.tsx`, `StatEntryDialog.tsx`, and `useGameModeActions.ts` to disable whistle-action stat entry controls when `clockSeconds === 0` and period verification is pending.
**Acceptance Criteria:**
- [x] In `ActionControls.tsx` and `StatEntryDialog.tsx`, disable whistle action triggers when `clockSeconds === 0` and period verification is pending.
- [x] Display an inline warning banner "Period clock expired (0:00). Verify period or adjust clock to record whistle actions."
- [x] Add unit test coverage in `ActionControls.test.tsx` / `StatEntryDialog.test.tsx` verifying control lock state at 0:00 expiration for whistle actions.

## [x] [Period-Start Jump Ball Possession Arrow Direction Verification Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** When opening a game session or overtime period with a jump ball, closing or bypassing the `JumpBallDialog` before confirming the tip-off winner leaves the possession arrow uninitialized or improperly pointing to a default team, corrupting subsequent alternating possession calls.
**What:** Interlock `JumpBallDialog.tsx` and `useGameMode.ts` to require explicit tip-off winner confirmation before closing the dialog and persisting the possession arrow direction strictly to `db.games`.
**Acceptance Criteria:**
- [x] In `JumpBallDialog.tsx`, block closing or dismissing the dialog until the jump ball winner is explicitly selected and submitted.
- [x] Ensure `possessionArrow` is atomically written and persisted to `db.games` immediately upon jump ball winner submission.
- [x] Add unit test coverage in `JumpBallDialog.test.tsx` verifying mandatory tip-off winner submission before dialog closure.

## [x] [Score Adjustment Modal Direct Override Lead Differential Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Live Scoreboard
**Why:** When scorekeepers perform manual score overrides via `ScoreAdjustmentDialog.tsx`, the live lead differential badge on the Scoreboard HUD must re-evaluate synchronously against the newly updated team scores to prevent stale lead indicators during score corrections.
**What:** Interlock `ScoreAdjustmentDialog.tsx` and `Scoreboard.tsx` to recalculate and refresh the live lead differential badge synchronously immediately upon committing direct score adjustments.
**Acceptance Criteria:**
- [x] In `ScoreAdjustmentDialog.tsx` and `Scoreboard.tsx`, trigger a synchronous score lead differential re-calculation upon saving a score adjustment.
- [x] Ensure the Scoreboard lead differential badge color and value reflect the newly updated score margin immediately.
- [x] Add unit test coverage in `ScoreAdjustmentDialog.test.tsx` / `Scoreboard.test.tsx` verifying lead differential badge re-calculation on score adjustments.

## [x] [Free Throw Sequence Bonus Status Shot Counter Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Fouls
**Why:** When a foul triggers a free throw sequence under single-bonus vs. double-bonus or shooting foul rules, the sequence dialog must dynamically set the total awarded initial attempts (1 shot for 1-pt foul, 2 shots for 2-pt/double-bonus, 3 shots for 3-pt) directly from the foul event type and team foul count at the time of creation to prevent scorekeeper error.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts` to calculate and freeze `initialAttempts` based on the exact foul type and bonus status at foul creation time.
**Acceptance Criteria:**
- [x] In `useGameModeActions.ts` / `FreeThrowWorkflowDialog.tsx`, automatically compute awarded free throw attempts (1, 2, or 3) from the foul type and defensive team foul count.
- [x] Freeze awarded free throw initial attempts during sequence execution, disabling attempt increment/decrement controls.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying initial free throw attempt calculation from foul type and bonus status.

## [x] [Period Intermission Timer Expiration Sound and Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Game Clock
**Why:** When a quarter or halftime intermission countdown reaches 0:00, scorekeepers need an immediate audio alert and automatic transition to the pre-period starting lineup selection dialog to prevent delayed period starts.
**What:** Interlock `useGameClock.ts` to play the WebAudio buzzer sound and open the pre-period starting lineup dialog atomically when `intermissionSeconds` reaches 0.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, invoke `playBuzzerSound()` synchronously when `intermissionSeconds` counts down to 0.
- [x] Automatically set `isIntermission = false` on `db.games` and trigger starting lineup verification for the upcoming period.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying buzzer playback and lineup modal trigger on intermission expiration.

## [x] [Game Session Reload Lineup Disqualification Removal Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a browser tab reloads or a game session is resumed after a player fouls out, the initialization hook must re-verify that no disqualified player (`personalFouls >= foulLimit`) remains in `db.games.onCourtIds`, preventing illegal personnel on court on cold mounts.
**What:** Interlock `useGameMode.ts` game mounting logic to filter out disqualified players from `onCourtIds` and prompt for substitution if an illegal lineup is detected on reload.
**Acceptance Criteria:**
- [x] In `useGameMode.ts`, check `onCourtIds` player personal fouls against `foulLimit` upon game state hydration.
- [x] Automatically remove disqualified player IDs from `db.games.onCourtIds` and open `QuickSubDialog` in forced substitution mode if an illegal player is on court.
- [x] Add unit test coverage in `useGameMode.test.ts` verifying disqualified player removal from active on-court lineups during game hydration.

## [x] [Period Clock Zero-Seconds Field Goal Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Scoring
**Why:** When a field goal is attempted right as the period clock hits 0:00, scorekeepers need a prompt to explicitly verify or disallow late shots before finalizing the period score.
**What:** Interlock `VerifiedPeriodModal.tsx` and `useGameModeActions.ts` to highlight field goals logged at 0:00 and require explicit scorekeeper confirmation during period verification.
**Acceptance Criteria:**
- [x] Highlight field goals logged at `clockSeconds === 0` in `VerifiedPeriodModal.tsx`.
- [x] Require explicit confirmation or disallow action for 0:00 field goals before verifying the period.
- [x] Add unit test coverage in `VerifiedPeriodModal.test.tsx` verifying zero-clock shot verification interlocks.

## [x] [Scoreboard Live Clock Resume Unsaved Lineup Verification Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Resuming a stopped clock while active lineup substitutions remain unconfirmed risks recording possessions with mismatched or incomplete on-court roster states.
**What:** Interlock `ActionControls.tsx` and `useGameClock.ts` to verify active on-court lineup consistency in `db.games` before starting or resuming the game clock.
**Acceptance Criteria:**
- [x] Validate `db.games.onCourtIds` player counts and roster validity prior to resuming the clock.
- [x] Block clock start and prompt for substitution if unconfirmed lineup modifications exist.
- [x] Add unit test coverage in `ActionControls.test.tsx` / `useGameClock.test.ts` verifying lineup consistency guards on clock resume.

## [x] [Score Adjustment Modal Direct Override Team Foul Counter Parity Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** Direct score adjustments must not accidentally alter team foul counts or bonus thresholds while modifying point totals, keeping scoring and foul metrics independent.
**What:** Interlock `ScoreAdjustmentDialog.tsx` and `useGameAggregator.ts` to preserve exact team foul counts and bonus states during direct score overrides.
**Acceptance Criteria:**
- [x] Verify team foul counts and bonus states remain unchanged in `useGameAggregator.ts` when direct score overrides are applied.
- [x] Ensure `Scoreboard.tsx` team foul counters retain exact values during score adjustments.
- [x] Add unit test coverage in `ScoreAdjustmentDialog.test.tsx` / `useGameAggregator.test.ts` verifying team foul parity during score overrides.

## [x] [Scoreboard Live Clock Expiration Buzzer Audio Context Re-Unlock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX / Game Clock
**Why:** WebAudio AudioContext instances can transition to a suspended state during extended periods of scorekeeper inactivity or background tab operation. Guaranteeing an active AudioContext prior to 0:00 tick execution ensures the period-end buzzer audio horn always sounds clearly.
**What:** Interlock `useGameClock.ts` and `audioUtils.ts` to automatically attempt WebAudio AudioContext re-unlocking prior to triggering `playBuzzerSound()` at 0:00 period clock expiration.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, invoke AudioContext re-unlocking prior to playing period-end horn sound at 0:00.
- [x] Ensure acoustic horn audio plays reliably even after background tab or inactive user states.
- [x] Add unit test coverage in `useGameClock.test.ts` / `audioUtils.test.ts` verifying AudioContext re-unlocking on clock expiration.

## [x] [Free Throw Sequence Unsaved Shooter Substitution Reset Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** When a free throw workflow designates a substitute shooter and the modal is cancelled before Shot 1 is attempted, resetting temporary substitute shooter assignments in `db.games` guarantees that subsequent actions attribute to the original valid on-court lineup.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts` to clear temporary substitute shooter overrides in `db.games` upon workflow cancellation before shot logging.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, revert temporary shooter override state if cancelled prior to Shot 1.
- [x] Ensure `db.games` active on-court lineup remains unmodified when substitute shooter designation is cancelled.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying shooter state reset on sequence cancellation.

## [x] [Period-Start Jump Ball Possession Arrow Snapshot Parity Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / Data Integrity
**Why:** Confirming a jump ball winner at period start must write the initial possession arrow direction snapshot atomically to `db.games` alongside the `JUMP_BALL` stat event to prevent possession arrow desynchronization during offline or slow sync states.
**What:** Interlock `JumpBallDialog.tsx` and `useGameModeActions.ts` so `db.games` possession arrow direction snapshot persists in the exact same IndexedDB transaction as the jump ball stat write.
**Acceptance Criteria:**
- [x] In `JumpBallDialog.tsx` / `useGameModeActions.ts`, persist `possessionArrow` snapshot atomically in `db.games` within the jump ball transaction.
- [x] Verify page reload immediately following jump ball confirmation retains exact possession arrow direction.
- [x] Add unit test coverage in `JumpBallDialog.test.tsx` / `useGameModeActions.test.ts` verifying atomic possession arrow snapshot parity.

## [x] [Period Intermission Timer Clock Resume Lineup Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Manually skipping or resuming from an intermission break directly into live period tracking without verifying active 5-player on-court lineups risks recording possessions with missing or corrupted lineup data.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` to require 5-player starting lineup verification when skipping or completing intermission countdowns prior to period clock start.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` / `useGameMode.ts`, trigger mandatory 5-player starting lineup verification upon skipping or completing intermission countdown breaks.
- [x] Block game clock activation in the upcoming period until 5 active on-court players are confirmed per team in `db.games`.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying lineup verification interlocks on intermission completion.

## [x] [Free Throw Sequence Shot Attempt Reversal Score Snapshot Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** Toggling a previously recorded free throw shot from MAKE to MISS during sequence editing must atomically decrement team score snapshot fields in `db.games` within the same IndexedDB transaction to maintain scoreboard score parity.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` so that reversing a free throw make result updates both `db.stats` and `db.games` team/opponent score snapshots atomically in IndexedDB.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, update `db.games` `teamScore` / `oppScore` snapshot fields atomically within the same IndexedDB transaction when reversing a made free throw.
- [x] Ensure live Scoreboard total score updates immediately upon shot result reversal.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying atomic score snapshot updates on free throw result reversal.

## [x] [Scoreboard Live Clock Rapid Pause Resume Sub-Second Sync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Live Scoreboard
**Why:** Rapidly pausing and resuming the game clock during winning time (under 1 minute) without persisting sub-second wall-clock tick deltas can cause clock time jumps or desynchronizations across browser reloads.
**What:** Interlock `useGameClock.ts` clock pause and resume handlers to persist exact sub-second timer snapshots to `db.games` on every clock state transition.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, record wall-clock timestamps on clock pause/resume transitions and persist exact sub-second `clockTime` snapshots to `db.games`.
- [x] Guarantee clock time display remains perfectly continuous without time jumps across rapid pause/resume cycles.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying sub-second clock snapshot persistence on pause/resume transitions.

## [x] [Free Throw Sequence Interrupted Substitution Shooter Re-Validation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** Executing a substitution during a free throw stoppage where a free throw sequence is active or paused can result in subbing out the designated shooter or subbing in an ineligible player. Re-validating the shooter's active on-court status and prompting for shooter reassignment if the shooter was subbed off prevents orphan free throw attempts and invalid stat attribution.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `QuickSubDialog.tsx` so that executing a substitution while a free throw workflow is active re-checks whether the designated shooter remains in `db.games.onCourtIds`, prompting for shooter selection if the original shooter was subbed off.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx` and `QuickSubDialog.tsx`, detect if the active free throw shooter is subbed off during an in-flight sequence.
- [x] Prompt for substitute shooter selection before allowing the free throw sequence to resume if the original shooter is no longer on court.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` / `QuickSubDialog.test.tsx` verifying shooter re-validation upon mid-sequence substitution.

## [x] [Scoreboard Live Clock Expiration Background Tab Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** If the game clock expires (hits 0:00) while the user is on another browser tab, returning to the app must automatically trigger period completion processing, pause the timer in IndexedDB `db.games`, and open `VerifiedPeriodModal.tsx` so the scorekeeper is immediately prompted to verify the period rather than leaving the game in an unverified 0:00 state.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` so that when `clockSeconds` reaches 0 in the background, tab re-focus automatically initiates period verification and persists the paused clock state.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, detect background period clock expiration (0:00) upon document visibility state change (`visibilitychange`).
- [x] Automatically pause game clock and launch `VerifiedPeriodModal` synchronously when tab focus is restored after background expiration.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying background period expiration state handling and modal triggering.

## [x] [Quick Edit Roster Live Game On-Court Jersey Collision Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Editing a player's jersey number or name in `QuickEditRosterDialog.tsx` during live play while that player is currently on court must atomically update active `onCourtIds` player references and scoreboard displays without causing player ID mismatches or orphaned court tracking.
**What:** Interlock `QuickEditRosterDialog.tsx` and `useGameMode.ts` to validate and update active on-court player references in `db.games` atomically when roster quick-edits are saved during live game sessions.
**Acceptance Criteria:**
- [x] In `QuickEditRosterDialog.tsx`, validate that edited jersey numbers do not conflict with active on-court players.
- [x] Atomically refresh `db.games` active roster and `Scoreboard` player displays upon saving roster edits during live play.
- [x] Add unit test coverage in `QuickEditRosterDialog.test.tsx` verifying on-court player reference sync on live roster quick-edits.

## [x] [Period Transition Lineup Personnel Floor Fallback Substitution Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Transitioning into a new period when a team's active roster falls below 5 eligible non-disqualified players due to multiple foul-outs or roster deletions can freeze the game loop if not handled by a clear fallback substitution flow.
**What:** Interlock `useGameMode.ts` and `ActionControls.tsx` to detect under-floor roster states at period transitions, present an alert modal, and enforce roster adjustments or technical foul-outs prior to enabling period clock controls.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, validate that both teams have at least 5 eligible non-disqualified active players upon period transition.
- [x] Present a prominent lineup warning dialog and block clock start if an under-floor eligible personnel state is detected.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying personnel floor fallback substitution enforcement.

## [x] [Free Throw Sequence Multi-Shot Sequence Cancellation Score Snapshot Rollback Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** Cancelling an active multi-shot free throw sequence midway (e.g., after logging shot 1 and shot 2 of a 3-shot sequence) must atomically decrement all points awarded during that session from `db.games.teamScore` / `oppScore` snapshot fields to maintain live Scoreboard parity.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` so that cancelling a multi-shot sequence session rolls back all temporary stat events and decrements team score snapshot fields in `db.games` within a single IndexedDB transaction.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, track all made free throw stat IDs created during an active multi-shot sequence session.
- [x] Atomically soft-delete session stat events and decrement `db.games` score fields if cancelled prior to workflow completion.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying multi-shot sequence cancellation score snapshot rollbacks.

## [x] [Scoreboard Live Clock Resync On Cold Mount Hydration Recovery Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** When an in-progress game is resumed via cold page mount while `isClockRunning` was saved as true, the clock hook must re-calculate exact elapsed wall-clock time since the persisted `lastWallClock` timestamp and update `clockSeconds` atomically to prevent time jumps or frozen timer states.
**What:** Interlock `useGameClock.ts` state hydration to compute elapsed wall-clock seconds upon mounting active running game sessions and persist the resynchronized `clockSeconds` snapshot to `db.games`.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, calculate elapsed wall-clock time from `db.games.lastWallClock` upon cold mount when `isClockRunning === true`.
- [x] Resynchronize `clockSeconds` atomically to reflect exact elapsed time and update `db.games` snapshot.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying clock resynchronization on cold mount hydration.

## [x] [Period Intermission Timer Skipped Lineup Personnel Floor Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Tapping 'Skip Intermission' or allowing the period break timer to expire must verify that both teams have at least 5 active non-disqualified players assigned on-court before transitioning into live pre-tip state for the upcoming period.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` so that skipping or expiring intermissions triggers starting lineup verification if either team falls below the 5-player active personnel floor.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `useGameMode.ts`, validate `db.games.onCourtIds` personnel count when intermission is skipped or reaches 0:00.
- [x] Automatically open starting lineup selection dialog and block period clock controls if fewer than 5 eligible active players are assigned on-court per team.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying personnel floor interlocks on skipped intermissions.

## [x] [Scoreboard Live Clock Expiration Unsaved Stat Snapshot Flush Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Game Clock
**Why:** When the live game clock counts down to exactly 0:00, any in-flight stat writes or pending IndexedDB operations must be completely flushed and persisted to `db.stats` before launching period verification to prevent period attribution race conditions.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` to await pending stat persistence promises before setting `clockSeconds: 0` and opening `VerifiedPeriodModal.tsx`.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, await pending `db.stats` persistence writes prior to completing period expiration state transitions.
- [x] Guarantee all late-period events recorded right before buzzer are completely written before launching period verification modal.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying stat snapshot flushing on clock expiration.

## [x] [Quick Edit Roster Live Game On-Court Disqualification Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Fouls
**Why:** If a player who has reached or exceeded their personal foul limit (`personalFouls >= foulLimit`) has their name or jersey edited via `QuickEditRosterDialog.tsx` during live play, saving changes must preserve their disqualified status and prevent them from being accidentally restored to the active on-court lineup.
**What:** Interlock `QuickEditRosterDialog.tsx` to re-validate personal foul limits against edited player records and maintain disqualified status in `db.games.onCourtIds`.
**Acceptance Criteria:**
- [x] In `QuickEditRosterDialog.tsx`, check edited player personal fouls against `foulLimit` upon saving changes.
- [x] Ensure disqualified players remain excluded from active `onCourtIds` and prompt for substitution if a disqualified player is on court.
- [x] Add unit test coverage in `QuickEditRosterDialog.test.tsx` verifying disqualified status retention on live roster editing.

## [x] [Period Transition Scoreboard Lead Differential Snapshot Re-Calculation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Live Scoreboard
**Why:** During period transition verification, direct score adjustments or reconciled stats can alter the total team margin. Re-calculating the lead differential snapshot on the Scoreboard HUD upon period transition ensures visual score margin alignment at the start of the next period.
**What:** Interlock `useGameMode.ts` and `Scoreboard.tsx` to recalculate and reconcile the live lead differential badge upon period advancement and verification.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` (`handleNextPeriod` / `handleVerifyPeriod`), trigger a synchronous lead differential recalculation upon period transition.
- [x] Ensure the `Scoreboard.tsx` lead badge reflects the reconciled team score differential at the start of the new period.
- [x] Add unit test coverage in `useGameMode.test.ts` / `Scoreboard.test.tsx` verifying lead differential re-calculation on period transition.

## [x] [Free Throw Sequence Consecutive Penalty Queue Hydration Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Fouls
**Why:** When multiple technical or personal fouls generate queued consecutive free throw sequences, a cold page refresh mid-sequence must recover and re-instantiate the queued pending sequences from `db.games.pendingFtSequences` to prevent lost penalty shots.
**What:** Interlock `useGameMode.ts` and `FreeThrowWorkflowDialog.tsx` to hydrate and resume queued pending free throw penalty sequences from IndexedDB upon game session mount.
**Acceptance Criteria:**
- [x] In `useGameMode.ts`, inspect `db.games.pendingFtSequences` on session load and automatically launch the next queued sequence dialog.
- [x] Guarantee queued penalty sequences persist across page reloads until all queued sequences are executed.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` / `useGameMode.test.ts` verifying pending free throw sequence queue hydration on reload.

## [x] [Period-Start On-Court Lineup Disqualified Player Replacement Prompt Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player on court accumulates their disqualifying 5th foul on a period-ending whistle, starting the next period without immediately prompting for a substitute player leaves an illegal disqualified player in `onCourtIds` and blocks live play start.
**What:** Interlock `useGameMode.ts` and `ActionControls.tsx` to check for disqualified on-court players upon entering a new period and open `QuickSubDialog.tsx` in forced substitution mode before enabling clock controls.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, validate on-court player personal foul counts against `foulLimit` when initializing a new period.
- [x] Automatically launch `QuickSubDialog` in forced mode and block clock start if a disqualified player is in the on-court lineup.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying forced substitution prompt on period start for disqualified players.

## [x] [Period Intermission Timer Countdown Auto-Resume Starting Lineup Verification Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature / UX
**Why:** When a quarter or halftime intermission timer counts down to 0:00 or is skipped, the game clock system must automatically prompt for starting lineup verification for the upcoming period, ensuring 5 valid active players are assigned on-court before live clock activation.
**What:** Interlock `useGameClock.ts` and `useGameMode.ts` to clear intermission state and automatically trigger starting lineup verification for period N+1 upon intermission expiration or skip action.
**Acceptance Criteria:**
- [x] In `useGameClock.ts` and `useGameMode.ts`, trigger pre-period starting lineup verification when `intermissionSeconds` reaches 0 or intermission is skipped.
- [x] Block period clock controls until starting lineups are confirmed for the upcoming period.
- [x] Add unit test coverage in `useGameClock.test.ts` / `useGameMode.test.ts` verifying lineup verification trigger on intermission auto-resume or skip.

## [x] [Free Throw Sequence Substitution Shooter Eligibility Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** Executing a substitution during a free throw stoppage must ensure that the designated free throw shooter cannot be subbed off or replaced by an ineligible player without re-verifying shooter assignment, preventing orphaned shot statistics.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `QuickSubDialog.tsx` to detect shooter substitutions during free throw stoppages and require explicit substitute shooter confirmation before shot execution resumes.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx` and `QuickSubDialog.tsx`, validate shooter on-court status when substitutions occur during free throw sequence execution.
- [x] Require selecting an eligible substitute shooter before shot attempt controls re-enable if the original shooter is subbed off.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` / `QuickSubDialog.test.tsx` verifying shooter eligibility validation on substitution.

## [x] [Scoreboard Live Clock Rapid Toggle Double-Tap State Lock Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / UX
**Why:** Rapidly tapping the clock start/stop toggle button or triggering simultaneous clock state actions can cause timer interval race conditions or timer tick state desynchronization.
**What:** Implement a transition state lock and debounce guard in `useGameClock.ts` during `handleToggleClock` execution to ignore rapid repeated clicks until state persistence resolves.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, lock `handleToggleClock` against double-tap or concurrent execution triggers.
- [x] Ensure timer intervals clear cleanly before instantiating new tick intervals.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying clock toggle transition lock debouncing.

## [x] [Scoreboard Live Clock Sub-Second Pause Precision Persistence Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Data Integrity
**Why:** Pausing the live game clock during winning time (under 1 minute) without persisting exact sub-second timer snapshots to `db.games` can cause sub-second display rounding mismatches or clock drift across browser reloads.
**What:** Interlock `useGameClock.ts` and `Scoreboard.tsx` to retain and write exact sub-second timer snapshots to `db.games` in IndexedDB on every clock pause transition.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, retain exact sub-second clock time precision upon pausing the live game clock.
- [x] Atomically write and persist the sub-second clock snapshot to `db.games` in IndexedDB.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying exact sub-second clock snapshot persistence on pause.

## [x] [Period-Start Active Lineup Inactive Roster Player Substitution Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** If a player marked inactive on the game-day roster remains assigned to the active on-court lineup when starting a new period, stat attribution and stint tracking calculations corrupt from the opening possession.
**What:** Interlock `useGameMode.ts` and `ActionControls.tsx` to detect inactive roster players in `onCourtIds` at period start and launch `QuickSubDialog.tsx` in forced substitution mode before enabling clock controls.
**Acceptance Criteria:**
- [x] In `useGameMode.ts` and `ActionControls.tsx`, validate active game-day roster status for all 5 on-court players prior to period clock start.
- [x] Automatically trigger forced substitution mode in `QuickSubDialog` if an inactive roster player is assigned on court.
- [x] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying forced substitution prompts for inactive on-court players at period start.

## [x] [Free Throw Sequence Shooter Foul-Out Substitution Prompt Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** If a player designated to shoot free throws fouls out or is disqualified before shooting (e.g. via a technical foul on the same stoppage), attempting to execute free throws without substituting an eligible shooter corrupts free throw attribution.
**What:** Interlock `FreeThrowWorkflowDialog.tsx` and `useGameModeActions.ts` to evaluate shooter eligibility against `foulLimit` upon opening the free throw workflow and force substitute shooter selection before shot 1.
**Acceptance Criteria:**
- [x] In `FreeThrowWorkflowDialog.tsx`, check designated shooter personal fouls against `foulLimit` upon sequence launch.
- [x] Prompt for substitute shooter selection and block attempt controls if the designated shooter has reached the foul limit.
- [x] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying substitute shooter prompts for disqualified free throw awardees.

## [x] [Scoreboard Live Clock Sub-Second Wall-Clock Resync Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Game Clock / Live Scoreboard
**Why:** When the browser tab loses focus or CPU throttling occurs during live gameplay, the countdown clock can drift behind true wall-clock time. Resynchronizing sub-second remaining time against actual wall-clock deltas on tab re-focus or clock resume guarantees 100% timing accuracy during winning time.
**What:** Interlock `useGameClock.ts` and `Scoreboard.tsx` to recalculate remaining period time using system wall-clock timestamps on visibility changes and pause/resume transitions.
**Acceptance Criteria:**
- [x] In `useGameClock.ts`, track wall-clock timestamps and recalculate `clockSeconds` upon document visibility changes (`visibilitychange`).
- [x] Atomically persist resynchronized clock time snapshots to `db.games` in IndexedDB.
- [x] Add unit test coverage in `useGameClock.test.ts` verifying wall-clock clock resynchronization.

## [ ] [Team Foul Count Period Reset Data Integrity Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Data Integrity
**Why:** When advancing across periods, resetting team foul totals to 0 (or carrying them over in Halves format) must update IndexedDB `db.games` cached team foul fields synchronously to ensure bonus indicators on the Scoreboard do not lag.
**What:** Interlock `useGameAggregator.ts` and `useGameMode.ts` to write recalculated period team foul totals to `db.games` on every period transition.
**Acceptance Criteria:**
- [ ] In `useGameAggregator.ts` and `useGameMode.ts`, persist reset team foul snapshot fields in `db.games` upon period transition.
- [ ] Ensure `Scoreboard.tsx` bonus indicators clear or update synchronously when a period resets.
- [ ] Add unit test coverage in `useGameAggregator.test.ts` / `useGameMode.test.ts` verifying team foul snapshot resets across period transitions.

## [ ] [Period Transition Lineup Personnel Disqualification Check Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity / Rosters
**Why:** Transitioning into a new period when an active on-court player has accumulated 5 fouls (or limit) on the preceding period's final whistle allows illegal personnel on court and corrupts stint tracking.
**What:** Interlock `useGameMode.ts` and `ActionControls.tsx` to evaluate personal foul limits across all 5 active on-court players upon period transition and force substitution before enabling period clock start.
**Acceptance Criteria:**
- [ ] In `useGameMode.ts` and `ActionControls.tsx`, validate on-court player personal fouls against `foulLimit` upon period transition.
- [ ] Automatically open `QuickSubDialog.tsx` in forced mode and block clock start if a disqualified player is on court.
- [ ] Add unit test coverage in `useGameMode.test.ts` / `ActionControls.test.tsx` verifying disqualification pre-checks on period transition.

## [ ] [Overtime Period Initial Team Foul Reset Rule Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Fouls / Data Integrity
**Why:** Under specific competition rules (e.g. FIBA vs NFHS/NCAA), overtime period team fouls either reset to 0 or carry over from the final regulation period. Enforcing rule-based OT team foul initialization in `useGameAggregator.ts` and `useGameMode.ts` ensures correct bonus indicator light behavior at the start of overtime.
**What:** Interlock `useGameAggregator.ts` and `useGameMode.ts` to evaluate game period type and apply correct OT team foul reset/carryover rules at the start of period `maxPeriod + 1`.
**Acceptance Criteria:**
- [ ] In `useGameAggregator.ts` and `useGameMode.ts`, apply ruleset-specific team foul reset or carryover rules when entering overtime periods.
- [ ] Ensure `Scoreboard.tsx` bonus indicators update accurately at the start of OT based on active ruleset configuration.
- [ ] Add unit test coverage in `useGameAggregator.test.ts` / `useGameMode.test.ts` verifying overtime team foul initialization under different period formats.

## [ ] [Free Throw Sequence Unsaved Attempt Score Snapshot Parity Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Data Integrity
**Why:** During an active free throw sequence, shot attempts increment scores in IndexedDB. If an attempt is edited or canceled before finalizing the sequence, score snapshots on `db.games` must stay in exact sync with `db.stats` without lagging or creating transient score mismatches on the Scoreboard.
**What:** Interlock free throw shot attempt mutations in `FreeThrowWorkflowDialog.tsx` to recalculate and write `teamScore` and `oppScore` snapshot fields in `db.games` on every attempt result modification.
**Acceptance Criteria:**
- [ ] In `FreeThrowWorkflowDialog.tsx`, recalculate and write `teamScore` and `oppScore` snapshots to `db.games` atomically whenever a free throw shot attempt result is modified.
- [ ] Ensure `Scoreboard.tsx` displays matching total team scores instantly on every attempt result edit during sequence execution.
- [ ] Add unit test coverage in `FreeThrowWorkflowDialog.test.tsx` verifying score snapshot parity during free throw attempt edits.

## [ ] [Stat Entry Dialog Zero-Clock Scoring Action Validation Guard]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Scoring / Game Clock
**Why:** When the game clock is stopped at 0:00 (period end), attempting to log a field goal or free throw via `StatEntryDialog.tsx` without explicit period verification or clock adjustment can attribute stats to an expired period or create invalid zero-second events.
**What:** Interlock `StatEntryDialog.tsx` to block field goal and free throw entries when `clockSeconds === 0` and period verification is pending, displaying an inline validation message.
**Acceptance Criteria:**
- [ ] In `StatEntryDialog.tsx`, disable scoring action triggers when `clockSeconds === 0` and period verification is pending.
- [ ] Display an inline banner "Period clock expired (0:00). Advance period or edit clock before recording score events."
- [ ] Add unit test coverage in `StatEntryDialog.test.tsx` verifying scoring action validation when clock is at 0:00.

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

## [ ] [DEPS] Upgrade vitest and @vitest/coverage-v8 from 4.1.11 to 5.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Upgrading vitest to major version 5.x requires checking test suite runner compatibility and configuration changes.

## [ ] [DEPS] Upgrade happy-dom from 20.14.5 to 21.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Upgrading happy-dom to major version 21.x requires checking test environment compatibility and DOM emulation behavior across frontend tests.

## [ ] [DEPS] Upgrade msw from 2.15.0 to 3.x
**Priority:** CRITICAL
**Phase:** 1 - Core Game Loop
**Type:** Maintenance
**Why:** Upgrading msw to major version 3.x requires verifying API compatibility and handler mocks across frontend unit tests.
