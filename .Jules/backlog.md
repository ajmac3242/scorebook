## Redesign Dashboard page
**Priority:** HIGH
**Type:** Feature
**Why:** The current Dashboard page does not offer any benefits.
**What:** Swap out the dashboard page for "My Team" page. My team will be determined by adding a star next to the individual team name on the team page. The team that has the star enabled will now represent the My Team page.
**Acceptance Criteria:**
- [x] My Team page will show overall stats, heatmaps, and upcoming games for the team
- [x] More data can be added to this page. The intent is to give coaches all the high-level information they need at a quick glance.

## Update Edit Team Details
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to be able to set default settings for a team
**What:** On the Edit Team Details dialog, we need to add a defaults section where we can add/update game defaults. These game defaults can be overwritten when setting up a game but these should be the default values.
**Acceptance Criteria:**
- [x] All customizable basketball settings should be in this dialog. These settings should include period types, minutes for each period, number of timeouts allowed, and number of fouls allowed. As others are discovered, they should go here.

## Workflows for game creation
**Priority:** MEDIUM
**Type:** UX
**Why:** Creating a game contains to many things to enter at once. Introduce a workflow to help streamline the process.
**What:** Enhance the `Create Game` dialog to be a workflow similar to this example on Dribbble [https://dribbble.com/shots/26448955-Hotel-Booking-Mobile-App]. This is just an example and is not meant to be copied exactly. This example shows a workflow that A user can follow to create something. The first part of the workflow would be opponent information, the second part would be game date/time information, the last part would be game settings information (period type, fouls, time, etc.)
**Acceptance Criteria:**
- [x] Transition `Create Game` dialog to a workflow.
- [x] After all information is entered, there should be a create game button. Once the button is clicked, the game should be created.
- [x] On the first two parts of the workflow, once the required information has been entered, show a `continue` button.
- [x] Like the example, show the steps to the user and which ones have been completed

## Substitution Timeline Audit
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**What:** Build a "Timeline Audit" view that shows a vertical chronological list of all substitution events. Allow users to edit the time of a sub, change the players involved, or insert a missing sub event.
**Acceptance Criteria:**
- [x] Accessible from the Game Stats or Game Mode page.
- [x] Displays a chronological list of SUB_IN and SUB_OUT events.
- [x] Allows editing the `clockTime` and `playerId` of any substitution event.
- [x] Recalculates all dependent stats (MIN, +/-, Lineup Efficiency) immediately upon saving changes.

## Offensive Play/Set Success Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**What:** Introduce "Play Tagging" for offensive events. Allow coaches to define a playbook in Team Settings and tag MAKE/MISS events with specific play names during the game.
**Acceptance Criteria:**
- [x] CRUD interface in Team Details to manage a "Playbook" (list of play names).
- [x] Optional "Play" dropdown in the MAKE/MISS recording dialog in Game Mode.
- [x] "Play Efficiency" table in Game Stats showing: Play Name, Frequency, Points, and EFG% for each set.
- [x] Filter Shot Chart by specific Play Name.

## Live Defensive Momentum HUD (Stops & Kills)
**Priority:** HIGH
**Type:** UX
**Why:** Defensive intensity is driven by momentum. Visualizing "Stops" and "Kills" (3 consecutive stops) on the live scoreboard motivates the team and helps coaches identify defensive runs.
**What:** Integrate the `calculateStopsAndKills` logic into the `GameMode` scoreboard. Display a "Defensive Momentum Bar" or series of icons that light up as stops are earned, with a special visual for a "Kill."
**Acceptance Criteria:**
- [x] Real-time "Stop" counter on the GameMode scoreboard.
- [x] "Kill" indicator (e.g., three flame icons or a "3 STOPS" badge) that resets after 3.
- [x] Total "Kills" count for the game displayed in the scoreboard sub-header.
- [x] Pulse animation when a Stop is recorded.

## Real-Time Foul Trouble & Fatigue Rotation Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**What:** Implement visual and haptic/audio alerts in `GameMode` when a player reaches configured thresholds (e.g., 2 fouls in Q1, 4 fouls total, or 8 consecutive minutes).
**Acceptance Criteria:**
- [x] "Foul Trouble" pulse on the player's lineup card (e.g., orange at limit-1, red at limit).
- [x] "Fatigue Alert" visual (e.g., a "Needs Sub" icon) when a player's current stint exceeds the "Max Stint Duration" from Team Settings.
- [x] Configuration in Team Details to set "Foul Warning Thresholds" by period.

## Live Lineup Impact (+/-) Dashboard Overlay
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *immediately* if a specific 5-man unit is being outscored, even if individual players look okay. Plus/Minus for the current lineup is the ultimate efficiency truth.
**What:** Add a "Live Lineup Impact" section to the `GameMode` page that displays the +/- for the currently active 5-man unit since they were subbed in.
**Acceptance Criteria:**
- [x] Real-time display of the "Current Lineup +/-" (e.g., "+4 since last sub").
- [x] Comparison metric showing points scored vs. points allowed for the active unit.
- [x] "Stint Duration" timer for the current 5-man unit as a whole.

## Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [x] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [x] "Load Roster" option in Create Game workflow for selected opponents.
- [ ] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## Verified Period Workflow
**Priority:** MEDIUM
**Type:** UX
**Why:** Official scores and fouls often drift from the app during high-intensity games. A scheduled reconciliation ensures data integrity before moving to the next phase of the game.
**What:** At the end of every period, show a mandatory "Verify Stats" dialog. The scorekeeper must confirm the score and team fouls against the official table before the period is marked "Verified."
**Acceptance Criteria:**
- [x] Automated dialog trigger when the clock hits 0:00 or "Next Period" is clicked.
- [x] Display summarized period stats (Score, Fouls) with input fields for "Correction" if they differ from the app.
- [x] Generate a `SYSTEM_CORRECTION` event to balance totals if manual overrides are entered.

## Multi-Period Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Shooting patterns change as a game progresses due to fatigue or defensive adjustments. Coaches need to see *when* their team stopped getting to the rim.
**What:** Enhance the Shot Chart in `GameStats` and `Dashboard` to allow filtering heatmaps by specific period or "Half."
**Acceptance Criteria:**
- [x] Period-selector filter (P1, P2, P3, P4, OT) on the Shot Chart view.
- [x] "Compare Periods" mode showing two heatmaps side-by-side (e.g., 1st Half vs 2nd Half).
- [x] Toggle to show "Only Misses" or "Only Makes" on the heatmap.

## Interactive Playbook Efficiency HUD
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know *during* the game if a specific offensive set is failing. Waiting for post-game stats to stop running an inefficient play is too late.
**What:** Add a "Playbook Performance" widget to the `GameMode` sidebar that shows the success rate (PPP) of the top 3 most-used plays in the current game.
**Acceptance Criteria:**
- [ ] Sidebar widget in GameMode showing Play Name, Frequency, and Points Per Possession (PPP).
- [ ] Color-coded efficiency indicator (Green/Yellow/Red) based on team-average PPP.
- [ ] One-tap access to see the shot chart for a specific play during timeouts.

## Automated PDF Box Score & Game Summary Export
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [x] "Export PDF" button on Game Stats page.
- [x] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [x] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [x] Inclusion of the Scoring Flow visualization in the PDF.

## Free Throw Sequence Workflow
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [x] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [x] One-tap recording for each attempt in the sequence.
- [x] Automatically attributes points and attempts to the selected player.
- [x] Closes automatically after the designated number of attempts are recorded.

## Intelligent Linked Event Chaining
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**What:** Implement a "Chained Action" flow in the `GameMode` recording dialog. When a `MAKE` is saved, if an on-court teammate hasn't already been credited with an assist, immediately prompt "Who assisted?" with one-tap teammate buttons. Similarly, after a `MISS`, prompt for "Who rebounded?".
**Acceptance Criteria:**
- [x] After clicking "Save" on a `MAKE` event, display a "Teammate Assist?" overlay if tracking "Our Team".
- [x] After clicking "Save" on a `MISS` event, display "Offensive Reb?" and "Defensive Reb?" quick-tap options.
- [x] If a teammate is tapped, record the second event (ASSIST or REBOUND) with the same `timestamp`, `period`, and `clockTime` as the shot.
- [x] Option to "Skip" or "No Assist/Rebound" to close the chain.

## Scoring Run & Drought "Coaching Alerts"
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [x] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [x] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [x] Alerts should include a "Suggest Timeout" visual cue.
- [x] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

## Shot Quality & Process Tagging
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A "good" shot can miss and a "bad" shot can go in. Coaches need to evaluate the *process* of their offense, not just the result, to make halftime adjustments.
**What:** Add an optional "Shot Quality" toggle to the `MAKE`/`MISS` recording dialog (e.g., "Open" vs "Contested").
**Acceptance Criteria:**
- [x] Add `shotQuality` (OPEN, CONTESTED) to the `StatEvent` schema.
- [x] Add a simple toggle or button group in the shot recording dialog to tag quality.
- [x] Display "Process Efficiency" in `GameStats` (e.g., "EFG% on Open Shots" vs "EFG% on Contested Shots").
- [x] Filter Shot Chart by Shot Quality.

## Interactive Game Flow & Momentum Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Box scores are static. A flow chart shows *when* the game was won or lost and how specific lineups affected the lead.
**What:** Add a "Game Flow" visualization to the `GameStats` page—a line graph showing the point spread over the course of the game clock.
**Acceptance Criteria:**
- [x] Interactive line chart showing `Our Score - Opponent Score` on the Y-axis and `Game Time` on the X-axis.
- [ ] Mark key events on the timeline (Timeouts, Period ends).
- [ ] Hovering over the line shows the score and active lineup at that specific time.
- [x] Color-code the background to show who was "in control" (e.g., blue for home lead, red for away lead).

## Multi-Game Lineup Net Rating Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game Plus/Minus can be noisy. Coaches need to know which 5-man combinations are most effective over a season or tournament.
**What:** Aggregate lineup performance data across multiple games for a team.
**Acceptance Criteria:**
- [ ] New "Lineup Analytics" tab on the `TeamStats` or `My Team` (Dashboard) page.
- [ ] Table of 5-man units (lineups) that have played together.
- [ ] Metrics per lineup: Total Minutes, Points For, Points Against, Net Rating (Diff per 100 possessions or per 40 mins).
- [ ] Ability to filter by "Last 5 Games" or "Season".

## Halftime Tactical Adjustment Summary
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches have only 10 minutes to make game-winning adjustments. They need a 1-page "War Room" summary of what's working and what's failing immediately after the first half buzzer.
**What:** Build a dedicated Halftime Report view that highlights the team's best/worst lineups, most successful plays, and opponent scoring trends from the first half.
**Acceptance Criteria:**
- [ ] Auto-trigger Halftime Report when the second period (or first half) ends.
- [ ] Top 3 "Positive Lineups" (+/-) and Bottom 3 "Negative Lineups".
- [ ] Comparison of PPP (Points Per Possession) between Half 1 and season average.
- [ ] List of "Opponent Streaks" - which opponent players are causing the most damage.

## Clutch-Time "Winning Time" Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Games are won or lost in the final 4 minutes. Stats often change under pressure; coaches need to know who their "closers" are based on performance in high-leverage situations.
**What:** Define "Clutch Time" (last 4 mins of game, score within 5 pts) and calculate specialized metrics for this window.
**Acceptance Criteria:**
- [ ] New "Clutch" filter on the Game Stats and Player Stats pages.
- [ ] Metric: Clutch eFG% and Clutch Assist-to-Turnover ratio.
- [ ] Lineup efficiency specifically during clutch situations across the season.
- [ ] "Points Per Clutch Possession" comparison against non-clutch time.

## Real-Time Opponent Threat Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [x] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [x] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [ ] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## Possession-Based Efficiency Metrics (PPP)
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**What:** Transition the internal stats engine to calculate total possessions and derive PPP for teams, lineups, and individual players.
**Acceptance Criteria:**
- [ ] Calculate "Possessions" for both teams (FGA + 0.44*FTA + TO - OREB).
- [ ] Display PPP on the GameMode sidebar and Game Stats dashboard.
- [ ] Defensive PPP (Points Allowed Per Possession) to measure defensive quality independently of pace.
- [ ] Trend line showing PPP fluctuation throughout the game.

## Visual Rotation & Stint Timeline Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Coaches manage the game in "waves." Seeing a visual timeline of when players were on and off the court helps identify fatigue patterns and rotation gaps that raw minute totals hide.
**What:** Create a horizontal Gantt-style timeline chart showing exactly when each player was on the floor throughout the game.
**Acceptance Criteria:**
- [ ] Interactive timeline on the Game Stats page with a row for each player.
- [ ] Color-coded bars showing "On Court" periods.
- [ ] Overlay "Runs" (Team scoring bursts) on the timeline to see which players were present during big momentum shifts.
- [ ] Toggle to show "Personal Fouls" markers on the timeline.

## Defensive Assignment & Matchup Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know who is responsible for opponent scoring. Raw team defensive stats don't tell you which individual player is failing to stop their man.
**What:** Add a "Matchup" layer to the live game tracking. Allow coaches to assign a "Primary Defender" to each active opponent. When an opponent scores, the points are automatically attributed as "Points Allowed" to their defender.
**Acceptance Criteria:**
- [ ] UI in GameMode to "Drag and Drop" our players onto opponent players to set assignments.
- [ ] Tracking of "Points Allowed" per player.
- [ ] "Defensive Stop %" per player (how often an opponent possession ends in a stop while they are the primary defender).
- [ ] Summary in GameStats showing "Matchup Battle" (Our #5 vs Their #10).

## On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Acceptance Criteria:**
- [ ] New "Impact" tab in Player Stats or Team Analytics.
- [ ] Display "Team Net Rating (ON)" vs "Team Net Rating (OFF)" for each player.
- [ ] "Impact Differential" (The difference between ON and OFF metrics).
- [ ] Support for filtering by season or last X games to identify recent trends.

## Automated "Next Up" Rotation Suggester
**Priority:** HIGH
**Type:** Feature
**Why:** Managing a 12-player roster under pressure is mentally taxing. An automated suggester helps coaches stick to their rotation plan while accounting for foul trouble and fatigue.
**What:** Build a "Rotation Engine" that suggests which players should be subbed in based on pre-game "Target Minutes" and live fatigue/foul status.
**Acceptance Criteria:**
- [ ] "Rotation Plan" UI in Team Settings to set target minutes and preferred pairings.
- [ ] Live "Suggestion HUD" in GameMode showing "Next Up" players with one-tap substitution.
- [ ] Automatic adjustment of suggestions based on live foul counts (e.g., suggesting a sub for a player with 2 fouls in the 1st quarter).

## Live Opponent Tendency Scouting Report
**Priority:** HIGH
**Type:** Feature
**Why:** Opponents often repeat successful patterns (e.g., always driving left, or a specific player only shooting from the corner). Live tendency alerts allow for mid-game defensive adjustments.
**What:** Analyze opponent shot locations and drive directions in real-time to identify "Hot Zones" and "Directional Tendencies."
**Acceptance Criteria:**
- [ ] "Opponent Tendency" card in GameMode sidebar.
- [ ] Visual alerts for patterns (e.g., "Opponent #12: 80% of shots are in the paint").
- [ ] "Shot Type" breakdown for top opponent scorers (Catch-and-shoot vs Off-the-dribble).

## Team Wide "Four Factors" Performance HUD
**Priority:** HIGH
**Type:** Feature
**Why:** The "Four Factors" (eFG%, Turnover Rate, Offensive Rebound Rate, Free Throw Rate) are the most reliable predictors of winning. Seeing these in real-time tells a coach *why* they are winning or losing.
**What:** Add a "Four Factors" comparison dashboard to the GameMode and GameStats pages.
**Acceptance Criteria:**
- [ ] Real-time calculation of eFG%, TO%, ORB%, and FTR for both teams.
- [ ] "Success Threshold" indicators (e.g., highlighting in green if eFG% is > 55%).
- [ ] Comparison against season averages to see if the team is over/under performing in key areas.
