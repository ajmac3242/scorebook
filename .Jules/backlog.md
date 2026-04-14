## Redesign Dashboard page
**Priority:** HIGH
**Type:** Feature
**Why:** The current Dashboard page does not offer any benefits. 
**What:** Swap out the dashboard page for "My Team" page. My team will be determined by adding a star next to the individual team name on the team page. The team that has the star enabled will now represent the My Team page. 
**Acceptance Criteria:**
- [ ] My Team page will show overall stats, heatmaps, and upcoming games for the team
- [ ] More data can be added to this page. The intent is to give coaches all the high-level information they need at a quick glance.

## Update Edit Team Details
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to be able to set default settings for a team 
**What:** On the Edit Team Details dialog, we need to add a defaults section where we can add/update game defaults. These game defaults can be overwritten when setting up a game but these should be the default values. 
**Acceptance Criteria:**
- [ ] All customizable basketball settings should be in this dialog. These settings should include period types, minutes for each period, number of timeouts allowed, and number of fouls allowed. As others are discovered, they should go here. 
            
## Live Game Clock & Minutes Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Tracking minutes played is essential for managing rotations and calculating per-minute efficiency. A synchronized game clock ensures statistical events are timestamped accurately within the flow of the game.
**What:** Implement a configurable game clock (10/12/20 min periods) in `GameMode.tsx` with start/stop functionality. Automatically calculate and store "Minutes Played" for every player based on SUB_IN and SUB_OUT events linked to clock time.
**Acceptance Criteria:**
- [x] Clock can be started, paused, and reset.
- [x] Period length is configurable based on team settings.
- [x] SUB_IN/SUB_OUT events record the exact game clock time.
- [x] Box score displays "MIN" for each player with 100% accuracy.
- [x] Added clock reset functionality for game management.

## Advanced Analytics (+/- and eFG%)
**Priority:** HIGH
**Type:** Enhancement
**Why:** Raw points don't tell the whole story. Plus/Minus (+/-) measures a player's impact on the score while on the court, and Effective Field Goal Percentage (eFG%) accounts for the added value of 3-pointers.
**What:** Update the statistical aggregation logic in `stats.ts` to calculate `plusMinus` and `eFG%`. Display these metrics in the `GameStats` box score and `PlayerStats` profiles.
**Acceptance Criteria:**
- [x] Plus/Minus is calculated correctly based on team vs. opponent scoring during a player's active stints.
- [x] eFG% is calculated using the formula: (FGM + 0.5 * 3PM) / FGA.
- [x] Metrics are sortable in the box score table.

## Lineup Efficiency Tracker
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches need to know which combinations of 5 players are most effective. Tracking lineup-specific stats identifies the "death lineups" and the ones that are struggling.
**What:** Implement a utility to group statistical events by the specific 5-player lineup on the floor. Create a new "Lineups" tab in `TeamStats` or `GameStats` showing Net Rating, eFG%, and Turnover Rate for each combination.
**Acceptance Criteria:**
- [x] System identifies unique 5-man lineups used during a game.
- [x] Calculates Points For and Points Against for each lineup.
- [x] Visualizes lineup performance in a dedicated table.

## PDF/Digital Box Score Export
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches need to share results with players, parents, and local media. A professional, branded export format is a major "quality of life" improvement.
**What:** Add an "Export" button to the `GameStats` page. Generate a clean, high-resolution PDF or Image of the box score, including the shot chart and team totals.
**Acceptance Criteria:**
- [x] One-click generation of a box score PDF.
- [x] PDF includes Team names, final score, player table, and shot chart.
- [x] Layout is optimized for mobile sharing (A4 or social media aspect ratio).

## Shot Zone Heatmaps
**Priority:** MEDIUM
**Type:** UX
**Why:** A simple scatter plot of makes/misses can get cluttered. Heatmaps provide immediate visual feedback on where the team is most efficient and where they are settling for bad shots.
**What:** Enhance the `BasketballCourt` component to support a heatmap overlay. Use color density (red for high efficiency, blue for low) to visualize FG% across different zones of the court.
**Acceptance Criteria:**
- [x] Toggleable "Heatmap" mode on the `GameStats` and `PlayerStats` court views.
- [x] Zones are calculated dynamically based on the current filter (All, Player, or Team).
- [x] Uses a color gradient to represent scoring density or efficiency.

## Workflows for game creation
**Priority:** MEDIUM
**Type:** UX
**Why:** Creating a game contains to many things to enter at once. Introduce a workflow to help streamline the process. 
**What:** Enhance the `Create Game` dialog to be a workflow similar to this example on Dribbble [https://dribbble.com/shots/26448955-Hotel-Booking-Mobile-App]. This is just an example and is not meant to be copied exactly. This example shows a workflow that A user can follow to create something. The first part of the workflow would be opponent information, the second part would be game date/time information, the last part would be game settings information (period type, fouls, time, etc.)
**Acceptance Criteria:**
- [ ] Transition `Create Game` dialog to a workflow.
- [ ] After all information is entered, there should be a create game button. Once the button is clicked, the game should be created.
- [ ] On the first two parts of the workflow, once the required information has been entered, show a `continue` button.
- [ ] Like the example, show the steps to the user and which ones have been completed

## Individual Opponent Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to identify which specific opponent is the primary threat. Aggregating all opponent stats into one "OPPONENT" entity prevents tactical adjustments like "who needs to be double-teamed."
**What:** Allow scorekeepers to create "Quick Opponents" (e.g., Opp #12, Opp #5) on the fly during Game Mode. Statistical events can then be assigned to these specific IDs to generate an opponent box score.
**Acceptance Criteria:**
- [x] Interface to quickly add 1-5 specific opponent jerseys in `GameMode.tsx`.
- [x] Stat recording dialog allows selecting between "Our Team" and specific "Opponent" players.
- [x] Game Stats page displays a secondary box score for the opponent.

## Live Stint & Fatigue Monitor
**Priority:** MEDIUM
**Type:** UX
**Why:** Managing player energy is a core coaching responsibility. A player who has played 8 consecutive minutes is significantly less effective than one who just checked in, even if their total minutes are equal.
**What:** Add a "Current Stint" timer next to active players in the Live Lineup. The timer resets on SUB_IN and turns red/orange when a player exceeds a configurable fatigue threshold (e.g., 6 minutes).
**Acceptance Criteria:**
- [ ] Live Lineup display shows "T-MIN" (Time in stint) for all 5 players on court.
- [ ] Timer color shifts from green -> yellow -> red based on stint duration.
- [ ] Total minutes (MIN) continues to track cumulative game time.

## Foul Strategy Dashboard
**Priority:** MEDIUM
**Type:** Feature
**Why:** Losing a star player to "foul out" in the 4th quarter often decides games. Coaches need proactive warnings to pull players in foul trouble before the critical 5th foul.
**What:** Create a "Foul Watch" section in `GameMode.tsx` that highlights players with high "Fouls per Minute." Suggest substitutions for players with 2 fouls in the 1st half or 4 fouls in the 3rd quarter.
**Acceptance Criteria:**
- [ ] "Foul Watch" alert appears when a player hits a specific foul/period threshold.
- [ ] Substitution dialog suggests bench players with 0-1 fouls as replacements.
- [ ] Visual indicator (pulsing border) on player avatars in foul trouble.

## Free Throw "Trip to the Line" Mode
**Priority:** MEDIUM
**Type:** UX
**Why:** Recording free throws one-by-one (Select Player -> Make/Miss -> Save -> Repeat) is the most common cause of scorekeepers falling behind the live action.
**What:** Implement a "Free Throw Trip" interface. When a shooting foul is recorded, open a dedicated screen to quickly tap the result of 1, 2, or 3 shots in sequence.
**Acceptance Criteria:**
- [ ] One-tap recording for common trips (e.g., "1 of 2", "2 of 2").
- [ ] Automatic timestamping of all FT events in the trip to the current clock time.
- [ ] Reduces the total number of taps to record a 2-shot foul from 6+ to 3.

## Real-time Efficiency (Points Per Possession)
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Scoring totals can be misleading if the game pace is extremely fast or slow. Points Per Possession (PPP) provides an objective measure of how well the offense is actually executing.
**What:** Calculate "Possessions" in real-time based on the existing POSSESSION and TURNOVER events. Display "Live PPP" for the last 5 possessions in the scoreboard area.
**Acceptance Criteria:**
- [ ] Possessions are calculated as: FGA + 0.44 * FTA + TO - ORB.
- [ ] Scoreboard shows a small "PPP" metric for both teams.
- [ ] Lineup Efficiency table includes PPP and Defensive PPP (Opponent PPP).

## Defensive "Stops" & "Kills" Tracker
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often preach "Stops" (3 consecutive defensive stands) as a key performance indicator. Tracking this in real-time provides a motivational tool and a defensive efficiency metric beyond raw points allowed.
**What:** Add a "Stops" counter to the scoreboard. A "Stop" is defined as a defensive possession ending in a miss (without offensive rebound), turnover, or blocked shot. Three consecutive stops constitute a "Kill."
**Acceptance Criteria:**
- [ ] Visual counter for consecutive stops in `GameMode.tsx`.
- [ ] Logic to detect "Kills" (3 stops in a row) and log them as a team event.
- [ ] Summary of "Kills" in the Game Stats page.

## Substitution Timeline Audit & Correction
**Priority:** HIGH
**Type:** UX
**Why:** A single missed substitution ruins the accuracy of Minutes Played, Plus/Minus, and Lineup Efficiency for the entire remainder of the game.
**What:** Create a dedicated "Timeline Audit" view that shows a vertical timeline of all substitutions. Allow the user to "Insert Missed Sub" at a specific clock time, which automatically updates subsequent on-court states.
**Acceptance Criteria:**
- [ ] Interface to view chronological list of all SUB_IN/SUB_OUT events.
- [ ] Ability to edit the time of an existing sub or delete it.
- [ ] "Insert Sub" feature that handles the logic of swapping players retroactively.

## Detailed Foul Context (Shooting vs. Non-Shooting)
**Priority:** HIGH
**Type:** Feature
**Why:** Not all fouls are equal. Knowing if a player is fouling on shot attempts (giving up FTs) versus "cheap" reach-in fouls helps coaches adjust defensive aggression.
**What:** Update the Foul recording dialog to include a toggle for "Shooting" vs "Non-Shooting" and "Offensive" fouls.
**Acceptance Criteria:**
- [ ] Foul dialog includes type selection (Personal, Shooting, Offensive, Technical).
- [ ] Offensive fouls correctly recorded as turnovers (as per basketball rules).
- [ ] Box score displays "PF" with a drill-down or icon for shooting fouls committed.

## End-of-Period Score & Foul Verification
**Priority:** MEDIUM
**Type:** UX
**Why:** In official games, the scorekeeper must sync with the table/referees at each break. Discrepancies found at the end of the game are much harder to fix than at the end of a quarter.
**What:** When a period ends (clock hits 0:00), trigger a "Period Review" modal. This forces the user to confirm the period score and team fouls against the official table before the next period can begin.
**Acceptance Criteria:**
- [ ] Automated trigger of review dialog when period clock expires.
- [ ] Comparison view showing calculated score vs. "Official Score" input.
- [ ] Ability to record a "Score Adjustment" event to reconcile differences.

## Bench Production & Rotation Analytics
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know if their bench is maintaining the lead or losing it. Comparing Starter vs. Bench efficiency (Net Rating, PPG) is a fundamental part of post-game rotation analysis.
**What:** Update the `TeamStats` and `GameStats` pages to group players into "Starters" (those who started the 1st period) and "Bench." Calculate aggregate efficiency metrics for both groups.
**Acceptance Criteria:**
- [ ] Automatically tag players as "Starters" based on the first 5 players on court at the start of Game.
- [ ] Display a "Starter vs Bench" breakdown in the Game Stats summary.
- [ ] Track "Bench Points" as a distinct team stat.
