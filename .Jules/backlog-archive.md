# Scorebook - Backlog Archive

This file contains completed backlog items to keep the active `backlog.md` concise and performant for agent context.

## [x] Live "Game Identity" Radar
**Priority:** HIGH
**Type:** UX
**Why:** Teams often lose their "Identity" (e.g., "We are a fast-break team") during high-pressure games. A radar chart comparing live performance against the "Team Blueprint" keeps the team focused.
**What:** A real-time Radar Chart in GameMode that compares current game Four Factors and Pace against the team's season-long averages (the "Blueprint").
**Acceptance Criteria:**
- [x] Interactive Radar Chart in the GameMode sidebar.
- [x] Overlay of "Current Game" (Solid) vs "Season Average" (Dashed) for: Pace, eFG%, TO%, ORB%, and FT Rate.
- [x] "Identity Alert" when a core metric deviates by more than 20% from the blueprint.
**Status:** [x] COMPLETE

## [x] Integrated Practice Prescription Engine
**Priority:** HIGH
**Type:** Feature
**Why:** The best coaches use game data to plan the next practice. This feature closes the loop by suggesting specific drills based on the team's statistical failures in the last game.
**What:** A logic engine that maps low KPI performance (e.g., low FT%, high TOs) to a library of suggested practice drills.
**Acceptance Criteria:**
- [x] "Practice Planner" button on the Game Stats page.
- [x] Automatic suggestion of 3 "Focus Areas" based on the game's worst-performing metrics.
- [x] Linkage to a (mock) library of drills (e.g., "Poor 3PT% -> Suggest '100 Makes' Drill").
**Status:** [x] COMPLETE

## [x] Automated Defensive Synergy Analysis (2-3 Player Units)
**Priority:** HIGH
**Type:** Feature
**Why:** Some defensive pairings are greater than the sum of their parts. Coaches need to know which duos/trios anchor the defense most effectively, beyond just 5-man units which can have small sample sizes.
**What:** Build a "Defensive Synergy" report that calculates Opponent PPP and Forced Turnover % for every 2-player and 3-player combination that has played significant minutes together.
**Acceptance Criteria:**
- [x] New "Synergy" tab in Team Analytics.
- [x] Table showing 2-player and 3-player units with Defensive Rating (DRtg) and Net Rating.
- [x] Filter to show only units with > 10 minutes played.
- [x] Highlight "Shut-Down Units" (units with DRtg significantly better than team average).
**Status:** [x] COMPLETE

## [x] Dynamic "Target Attack" Identifier
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss which opponent defender is the "weak link" or which specific matchup is most exploitable in real-time. This tool automates the identification of mismatches to drive play-calling.
**What:** Implement an intelligence layer that correlates Matchup Tracking with Points Per Possession (PPP). It should highlight which opponent player is allowing the highest PPP and suggest which of our players should be the primary attacker.
**Acceptance Criteria:**
- [x] Live HUD element in GameMode showing "Top Attack Target" (Opponent Jersey #).
- [x] Real-time "Mismatch Alert" when a specific defender's Stop % drops below a configurable threshold.
- [x] "Targeted Play" recommendation based on which of our players has the best eFG% against that specific defender's archetype.

## [x] Strategic Timeout & Game State Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** Timeout decisions in the 4th quarter are high-stress. An advisor that considers remaining timeouts, foul situation, and momentum helps coaches make the "mathematically correct" call.
**What:** Build a "Decision Support" engine that analyzes game state (Score, Time, Fouls, Momentum) and provides a recommended action during dead balls.
**Acceptance Criteria:**
- [x] "Timeout Logic" that triggers a recommendation when the opponent is on a 6-0 run OR when a star player enters foul trouble.
- [x] Late-game "Situational HUD" (e.g., "Down 2, 10s left: Recommendation - Attack the rim for 2PT to tie").
- [x] Visual indicator of "Effective Timeouts Remaining" considering the game's current pace and remaining duration.

## [x] Automated Post-Game Player Performance Narratives
**Priority:** HIGH
**Type:** Feature
**Why:** Players often don't understand raw stats. Converting data into "Narratives" (e.g., "You were elite at closing out but struggled with ball security") makes coaching feedback more digestible and actionable.
**What:** Use the accumulated StatEvents to generate a 3-sentence performance summary for every player who played > 5 minutes.
**Acceptance Criteria:**
- [x] "Player Feedback" section in the Game Stats page.
- [x] Automated generation of one "Strength" (e.g., "High Efficiency from Corner 3") and one "Growth Area" (e.g., "High TO rate on drives").
- [x] Ability for the coach to "Approve & Send" the narrative to the player via text/email.

## [x] Situational "Clutch-Mode" Playbook Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** Games are decided in high-pressure windows. Coaches need data-driven play suggestions that consider the active lineup's efficiency and the opponent's specific defensive vulnerabilities in the final 4 minutes.
**What:** Build an advisor that triggers in "Clutch Mode" (final 4 mins, <5pt spread) and recommends the top 3 offensive plays from the playbook based on current game PPP and defender archetype mismatches.
**Acceptance Criteria:**
- [x] "Clutch Playbook" overlay in GameMode HUD during clutch situations.
- [x] Dynamic ranking of playbook sets based on PPP in the current game.
- [x] Recommendation logic that filters for plays that attack the opponent's "weakest" active defender.
- [x] Manual toggle to view suggestions at any time.
**Status:** [x] COMPLETE

## [x] Official Tendency & Foul Context Tracker
**Priority:** HIGH
**Type:** Feature
**Why:** Officiating significantly impacts game flow. Tracking referee tendencies (e.g., calling 70% of fouls on the away team) allows coaches to adjust team aggressiveness and defensive style in real-time.
**What:** Add an "Officiating" section to the GameMode to track foul distribution and referee "Tightness" (fouls per minute).
**Acceptance Criteria:**
- [x] "Official Bias" HUD showing Team Foul % vs Opponent Foul % split.
- [x] "Referee Tightness Meter" comparing live game foul rate against analytical baseline.
- [x] Post-game summary of "Impact of Officiating" on the final score including Starter/Bench attribution.
**Status:** [x] COMPLETE

## [x] Real-Time "Pace & Pressure" Analytics HUD
**Priority:** HIGH
**Type:** UX
**Why:** Losing control of the game's tempo is a primary cause of blown leads. Real-time monitoring of Pace (Possessions per 40m) and Shot-Clock Pressure ensures the team sticks to the "Winning Blueprint."
**What:** Integrate live tempo tracking into the GameMode sidebar, comparing current pace against the target "Identity" pace.
**Acceptance Criteria:**
- [x] "Pace Meter" showing live possessions-per-40m calculation.
- [x] Visual indicator of "Tempo Delta" (Difference between our target pace and current game pace).
- [x] "Pace Shift" notification when the game tempo changes by more than 15% in a single period.
**Status:** [x] COMPLETE

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Tracking a high-intensity game is too much for one person. A bridge allowing one person to track shots/lineups and another to track defensive "hustle" stats (deflections, floor dives) ensures 100% data accuracy.
**What:** Implement a real-time WebSocket or pub/sub layer (e.g., via AWS AppSync or similar) that allows multiple users to contribute to the same `gameId` simultaneously with conflict resolution.
**Acceptance Criteria:**
- [x] Real-time sync of `StatEvent` records across multiple devices.
- [x] Visual indicator of "connected assistants" in the GameMode header.
- [x] Optimistic UI updates with "Syncing..." and "Synced" states for every contributed event.
- [x] Mechanism to handle duplicate events from different devices (last-write-wins or prompt).

## Standardized Video Platform Export (Hudl/Synergy)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches spend hours manually tagging film. Exporting our granular game data into formats compatible with Hudl, Synergy, or VidSwap bridges the gap between stats and film.
**What:** Create an export engine that generates CSV or XML files mapped to the specific column requirements of major video analysis platforms.
**Acceptance Criteria:**
- [x] "Export for Video" button in Game Stats.
- [x] Dropdown to select platform (Hudl, Synergy, VidSwap).
- [x] Export includes `clockTime`, `period`, `playerName`, `actionType`, and `playName`.
- [x] Properly formatted CSV/XML file downloaded to the user's device.

## Program-Wide Tactical KPI Dashboard
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to see if their team's identity (e.g., "We are a transition team") is holding up over months, not just individual games.
**What:** Build a longitudinal dashboard that tracks specific team-defined KPIs (e.g., OREB%, TO Rate, PPP) across the entire season with trend lines.
**Acceptance Criteria:**
- [x] New "Program Health" tab on the Dashboard/My Team page.
- [x] Multi-game trend charts for the "Four Factors."
- [x] "Identity Goals" section where coaches see % of games where goals were met.
- [x] Filter by date range or opponent strength.

## [x] Advanced Post-Game "Film Session" Report
**Priority:** HIGH
**Type:** UX
**Why:** Post-game review is for learning. Grouping stats by tactical context (e.g., "Show me all Contested Misses") helps coaches identify specific execution errors to fix in practice.
**What:** A specialized Game Stats view optimized for film review sessions, grouping events by "Play Name," "Shot Quality," and "Result."
**Acceptance Criteria:**
- [x] "Film Room View" toggle in Game Stats.
- [x] Chronological event log with expandable details (Matchup, Play Type).
- [x] One-tap filtering for "Key Moments" (Bookmarked events).
- [x] Grouped summary: EFG% by Play Name, PPP by Shot Quality.
**Status:** [x] COMPLETE

## [x] Halftime "War Room" Tactical Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** The 10 minutes of halftime are frantic. A "Tactical Advisor" that delivers 3-5 punchy, data-driven bullet points allows the coach to walk into the locker room with immediate answers.
**What:** An automated insight engine in the Halftime Report that identifies the most impactful trends (e.g., "Lineup X is -12", "Opponent #24 scoring 1.8 PPP on drives").
**Acceptance Criteria:**
- [x] "Coach's Notes" section in the Halftime Report.
- [x] Automated bullets for: Most effective/ineffective 5-man unit.
- [x] Automated bullets for: Top 3 opponent threats with "Points Allowed" attribution.
- [x] Automated bullets for: Primary "Four Factor" deficit (e.g., "We are losing the ORB battle 12% to 35%").
**Status:** [x] COMPLETE

## [x] Redesign Dashboard page
**Priority:** HIGH
**Type:** Feature
**Why:** The current Dashboard page does not offer any benefits.
**What:** Swap out the dashboard page for "My Team" page. My team will be determined by adding a star next to the individual team name on the team page. The team that has the star enabled will now represent the My Team page.
**Acceptance Criteria:**
- [x] My Team page will show overall stats, heatmaps, and upcoming games for the team
- [x] More data can be added to this page. The intent is to give coaches all the high-level information they need at a quick glance.

## [x] Update Edit Team Details
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to be able to set default settings for a team
**What:** On the Edit Team Details dialog, we need to add a defaults section where we can add/update game defaults. These game defaults can be overwritten when setting up a game but these should be the default values.
**Acceptance Criteria:**
- [x] All customizable basketball settings should be in this dialog. These settings should include period types, minutes for each period, number of timeouts allowed, and number of fouls allowed. As others are discovered, they should go here.

## [x] Workflows for game creation
**Priority:** MEDIUM
**Type:** UX
**Why:** Creating a game contains to many things to enter at once. Introduce a workflow to help streamline the process.
**What:** Enhance the `Create Game` dialog to be a workflow similar to this example on Dribbble [https://dribbble.com/shots/26448955-Hotel-Booking-Mobile-App]. This is just an example and is not meant to be copied exactly. This example shows a workflow that A user can follow to create something. The first part of the workflow would be opponent information, the second part would be game date/time information, the last part would be game settings information (period type, fouls, time, etc.)
**Acceptance Criteria:**
- [x] Transition `Create Game` dialog to a workflow.
- [x] After all information is entered, there should be a create game button. Once the button is clicked, the game should be created.
- [x] On the first two parts of the workflow, once the required information has been entered, show a `continue` button.
- [x] Like the example, show the steps to the user and which ones have been completed

## [x] Substitution Timeline Audit
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**What:** Build a "Timeline Audit" view that shows a vertical chronological list of all substitution events. Allow users to edit the time of a sub, change the players involved, or insert a missing sub event.
**Acceptance Criteria:**
- [x] Accessible from the Game Stats or Game Mode page.
- [x] Displays a chronological list of SUB_IN and SUB_OUT events.
- [x] Allows editing the `clockTime` and `playerId` of any substitution event.
- [x] Recalculates all dependent stats (MIN, +/-, Lineup Efficiency) immediately upon saving changes.

## [x] Offensive Play/Set Success Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**What:** Introduce "Play Tagging" for offensive events. Allow coaches to define a playbook in Team Settings and tag MAKE/MISS events with specific play names during the game.
**Acceptance Criteria:**
- [x] CRUD interface in Team Details to manage a "Playbook" (list of play names).
- [x] Optional "Play" dropdown in the MAKE/MISS recording dialog in Game Mode.
- [x] "Play Efficiency" table in Game Stats showing: Play Name, Frequency, Points, and EFG% for each set.
- [x] Filter Shot Chart by specific Play Name.

## [x] Live Defensive Momentum HUD (Stops & Kills)
**Priority:** HIGH
**Type:** UX
**Why:** Defensive intensity is driven by momentum. Visualizing "Stops" and "Kills" (3 consecutive stops) on the live scoreboard motivates the team and helps coaches identify defensive runs.
**What:** Integrate the `calculateStopsAndKills` logic into the `GameMode` scoreboard. Display a "Defensive Momentum Bar" or series of icons that light up as stops are earned, with a special visual for a "Kill."
**Acceptance Criteria:**
- [x] Real-time "Stop" counter on the GameMode scoreboard.
- [x] "Kill" indicator (e.g., three flame icons or a "3 STOPS" badge) that resets after 3.
- [x] Total "Kills" count for the game displayed in the scoreboard sub-header.
- [x] Pulse animation when a Stop is recorded.

## [x] Real-Time Foul Trouble & Fatigue Rotation Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**What:** Implement visual and haptic/audio alerts in `GameMode` when a player reaches configured thresholds (e.g., 2 fouls in Q1, 4 fouls total, or 8 consecutive minutes).
**Acceptance Criteria:**
- [x] "Foul Trouble" pulse on the player's lineup card (e.g., orange at limit-1, red at limit).
- [x] "Fatigue Alert" visual (e.g., a "Needs Sub" icon) when a player's current stint exceeds the "Max Stint Duration" from Team Settings.
- [x] Configuration in Team Details to set "Foul Warning Thresholds" by period.

## [x] Live Lineup Impact (+/-) Dashboard Overlay
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *immediately* if a specific 5-man unit is being outscored, even if individual players look okay. Plus/Minus for the current lineup is the ultimate efficiency truth.
**What:** Add a "Live Lineup Impact" section to the `GameMode` page that displays the +/- for the currently active 5-man unit since they were subbed in.
**Acceptance Criteria:**
- [x] Real-time display of the "Current Lineup +/-" (e.g., "+4 since last sub").
- [x] Comparison metric showing points scored vs. points allowed for the active unit.
- [x] "Stint Duration" timer for the current 5-man unit as a whole.

## [x] Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [x] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [x] "Load Roster" option in Create Game workflow for selected opponents.
- [x] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## [x] Verified Period Workflow
**Priority:** MEDIUM
**Type:** UX
**Why:** Official scores and fouls often drift from the app during high-intensity games. A scheduled reconciliation ensures data integrity before moving to the next phase of the game.
**What:** At the end of every period, show a mandatory "Verify Stats" dialog. The scorekeeper must confirm the score and team fouls against the official table before the period is marked "Verified."
**Acceptance Criteria:**
- [x] Automated dialog trigger when the clock hits 0:00 or "Next Period" is clicked.
- [x] Display summarized period stats (Score, Fouls) with input fields for "Correction" if they differ from the app.
- [x] Generate a `SYSTEM_CORRECTION` event to balance totals if manual overrides are entered.

## [x] Multi-Period Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Shooting patterns change as a game progresses due to fatigue or defensive adjustments. Coaches need to see *when* their team stopped getting to the rim.
**What:** Enhance the Shot Chart in `GameStats` and `Dashboard` to allow filtering heatmaps by specific period or "Half."
**Acceptance Criteria:**
- [x] Period-selector filter (P1, P2, P3, P4, OT) on the Shot Chart view.
- [x] "Compare Periods" mode showing two heatmaps side-by-side (e.g., 1st Half vs 2nd Half).
- [x] Toggle to show "Only Misses" or "Only Makes" on the heatmap.

## [x] Interactive Playbook Efficiency HUD
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know *during* the game if a specific offensive set is failing. Waiting for post-game stats to stop running an inefficient play is too late.
**What:** Add a "Playbook Performance" widget to the `GameMode` sidebar that shows the success rate (PPP) of the top 3 most-used plays in the current game.
**Acceptance Criteria:**
- [x] Sidebar widget in GameMode showing Play Name, Frequency, and Points Per Possession (PPP).
- [x] Color-coded efficiency indicator (Green/Yellow/Red) based on team-average PPP.
- [x] One-tap access to see the shot chart for a specific play during timeouts.

## [x] Automated PDF Box Score & Game Summary Export
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [x] "Export PDF" button on Game Stats page.
- [x] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [x] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [x] Inclusion of the Scoring Flow visualization in the PDF.

## [x] Free Throw Sequence Workflow
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [x] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [x] One-tap recording for each attempt in the sequence.
- [x] Automatically attributes points and attempts to the selected player.
- [x] Closes automatically after the designated number of attempts are recorded.

## [x] Intelligent Linked Event Chaining
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**What:** Implement a "Chained Action" flow in the `GameMode` recording dialog. When a `MAKE` is saved, if an on-court teammate hasn't already been credited with an assist, immediately prompt "Who assisted?" with one-tap teammate buttons. Similarly, after a `MISS`, prompt for "Who rebounded?".
**Acceptance Criteria:**
- [x] After clicking "Save" on a `MAKE` event, display a "Teammate Assist?" overlay if tracking "Our Team".
- [x] After clicking "Save" on a `MISS` event, display "Offensive Reb?" and "Defensive Reb?" quick-tap options.
- [x] If a teammate is tapped, record the second event (ASSIST or REBOUND) with the same `timestamp`, `period`, and `clockTime` as the shot.
- [x] Option to "Skip" or "No Assist/Rebound" to close the chain.

## [x] Scoring Run & Drought "Coaching Alerts"
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [x] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [x] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [x] Alerts should include a "Suggest Timeout" visual cue.
- [x] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

## [x] Shot Quality & Process Tagging
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A "good" shot can miss and a "bad" shot can go in. Coaches need to evaluate the *process* of their offense, not just the result, to make halftime adjustments.
**What:** Add an optional "Shot Quality" toggle to the `MAKE`/`MISS` recording dialog (e.g., "Open" vs "Contested").
**Acceptance Criteria:**
- [x] Add `shotQuality` (OPEN, CONTESTED) to the `StatEvent` schema.
- [x] Add a simple toggle or button group in the shot recording dialog to tag quality.
- [x] Display "Process Efficiency" in `GameStats` (e.g., "EFG% on Open Shots" vs "EFG% on Contested Shots").
- [x] Filter Shot Chart by Shot Quality.

## [x] Interactive Game Flow & Momentum Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Box scores are static. A flow chart shows *when* the game was won or lost and how specific lineups affected the lead.
**What:** Add a "Game Flow" visualization to the `GameStats` page—a line graph showing the point spread over the course of the game clock.
**Acceptance Criteria:**
- [x] Interactive line chart showing `Our Score - Opponent Score` on the Y-axis and `Game Time` on the X-axis.
- [x] Mark key events on the timeline (Timeouts, Period ends).
- [x] Hovering over the line shows the score and active lineup at that specific time.
- [x] Color-code the background to show who was "in control" (e.g., blue for home lead, red for away lead).

## [x] Multi-Game Lineup Net Rating Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game Plus/Minus can be noisy. Coaches need to know which 5-man combinations are most effective over a season or tournament.
**What:** Aggregate lineup performance data across multiple games for a team.
**Acceptance Criteria:**
- [x] New "Lineup Analytics" tab on the `TeamStats` or `My Team` (Dashboard) page.
- [x] Table of 5-man units (lineups) that have played together.
- [x] Metrics per lineup: Total Minutes, Points For, Points Against, Net Rating (Diff per 100 possessions or per 40 mins).
- [x] Ability to filter by "Last 5 Games" or "Season".

## [x] Halftime Tactical Adjustment Summary
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches have only 10 minutes to make game-winning adjustments. They need a 1-page "War Room" summary of what's working and what's failing immediately after the first half buzzer.
**What:** Build a dedicated Halftime Report view that highlights the team's best/worst lineups, most successful plays, and opponent scoring trends from the first half.
**Acceptance Criteria:**
- [x] Auto-trigger Halftime Report when the second period (or first half) ends.
- [x] Top 3 "Positive Lineups" (+/-) and Bottom 3 "Negative Lineups".
- [x] Comparison of PPP (Points Per Possession) between Half 1 and season average.
- [x] List of "Opponent Streaks" - which opponent players are causing the most damage.

## [x] Clutch-Time "Winning Time" Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Games are won or lost in the final 4 minutes. Stats often change under pressure; coaches need to know who their "closers" are based on performance in high-leverage situations.
**What:** Define "Clutch Time" (last 4 mins of game, score within 5 pts) and calculate specialized metrics for this window.
**Acceptance Criteria:**
- [x] New "Clutch" filter on the Game Stats and Player Stats pages.
- [x] Metric: Clutch eFG% and Clutch Assist-to-Turnover ratio.
- [x] Lineup efficiency specifically during clutch situations across the season.
- [x] "Points Per Clutch Possession" comparison against non-clutch time.

## [x] Real-Time Opponent Threat Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [x] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [x] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [x] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## [x] Possession-Based Efficiency Metrics (PPP)
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**What:** Transition the internal stats engine to calculate total possessions and derive PPP for teams, lineups, and individual players.
**Acceptance Criteria:**
- [x] Calculate "Possessions" for both teams (FGA + 0.44*FTA + TO - OREB).
- [x] Display PPP on the GameMode sidebar and Game Stats dashboard.
- [x] Defensive PPP (Points Allowed Per Possession) to measure defensive quality independently of pace.
- [x] Trend line showing PPP fluctuation throughout the game.

## [x] Visual Rotation & Stint Timeline Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Coaches manage the game in "waves." Seeing a visual timeline of when players were on and off the court helps identify fatigue patterns and rotation gaps that raw minute totals hide.
**What:** Create a horizontal Gantt-style timeline chart showing exactly when each player was on the floor throughout the game.
**Acceptance Criteria:**
- [x] Interactive timeline on the Game Stats page with a row for each player.
- [x] Color-coded bars showing "On Court" periods.
- [x] Overlay "Runs" (Team scoring bursts) on the timeline to see which players were present during big momentum shifts.
- [x] Toggle to show "Personal Fouls" markers on the timeline.
**Status:** [x] COMPLETE

## [x] Defensive Assignment & Matchup Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know who is responsible for opponent scoring. Raw team defensive stats don't tell you which individual player is failing to stop their man.
**What:** Add a "Matchup" layer to the live game tracking. Allow coaches to assign a "Primary Defender" to each active opponent. When an opponent scores, the points are automatically attributed as "Points Allowed" to their defender.
**Acceptance Criteria:**
- [x] UI in GameMode to "Drag and Drop" our players onto opponent players to set assignments.
- [x] Tracking of "Points Allowed" per player.
- [x] "Defensive Stop %" per player (how often an opponent possession ends in a stop while they are the primary defender).
- [x] Summary in GameStats showing "Matchup Battle" (Our #5 vs Their #10).
**Status:** [x] COMPLETE

## [x] On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Acceptance Criteria:**
- [x] New "Impact" tab in Player Stats or Team Analytics.
- [x] Display "Team Net Rating (ON)" vs "Team Net Rating (OFF)" for each player.
- [x] "Impact Differential" (The difference between ON and OFF metrics).
- [x] Support for filtering by season or last X games to identify recent trends.
**Status:** [x] COMPLETE

## [x] Automated "Next Up" Rotation Suggester
**Priority:** HIGH
**Type:** Feature
**Why:** Managing a 12-player roster under pressure is mentally taxing. An automated suggester helps coaches stick to their rotation plan while accounting for foul trouble and fatigue.
**What:** Build a "Rotation Engine" that suggests which players should be subbed in based on pre-game "Target Minutes" and live fatigue/foul status.
**Acceptance Criteria:**
- [x] "Rotation Plan" UI in Team Settings to set target minutes and preferred pairings.
- [x] Live "Suggestion HUD" in GameMode showing "Next Up" players with one-tap substitution.
- [x] Automatic adjustment of suggestions based on live foul counts (e.g., suggesting a sub for a player with 2 fouls in the 1st quarter).
**Status:** [x] COMPLETE

## [x] Live Opponent Tendency Scouting Report
**Priority:** HIGH
**Type:** Feature
**Why:** Opponents often repeat successful patterns (e.g., always driving left, or a specific player only shooting from the corner). Live tendency alerts allow for mid-game defensive adjustments.
**What:** Analyze opponent shot locations and drive directions in real-time to identify "Hot Zones" and "Directional Tendencies."
**Acceptance Criteria:**
- [x] "Opponent Tendency" card in GameMode sidebar.
- [x] Visual alerts for patterns (e.g., "Opponent #12: 80% of shots are in the paint").
- [x] "Shot Type" breakdown for top opponent scorers (Catch-and-shoot vs Off-the-dribble).
**Status:** [x] COMPLETE

## [x] Team Wide "Four Factors" Performance HUD
**Priority:** HIGH
**Type:** Feature
**Why:** The "Four Factors" (eFG%, Turnover Rate, Offensive Rebound Rate, Free Throw Rate) are the most reliable predictors of winning. Seeing these in real-time tells a coach *why* they are winning or losing.
**What:** Add a "Four Factors" comparison dashboard to the GameMode and GameStats pages.
**Acceptance Criteria:**
- [x] Real-time calculation of eFG%, TO%, ORB%, and FTR for both teams.
- [x] "Success Threshold" indicators (e.g., highlighting in green if eFG% is > 55%).
- [x] Comparison against season averages to see if the team is over/under performing in key areas.
**Status:** [x] COMPLETE

## [x] Defensive Scheme Efficiency Tracking (Man vs Zone vs Press)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which defensive scheme is most effective against the current opponent's offensive style. PPP allowed by scheme is the ultimate truth.
**What:** Introduce "Defensive Scheme" tagging. Allow coaches to toggle the current defensive set (e.g., 2-3 Zone, Man-to-Man) in GameMode. All opponent scoring events are then attributed to the active scheme.
**Acceptance Criteria:**
- [x] "Active Defense" toggle in GameMode (options: Man, Zone, Press, Special).
- [x] Track PPP Allowed for each scheme within the current game.
- [x] "Defensive Efficiency by Scheme" table in GameStats.
- [x] Season-wide analytics comparing scheme performance against different opponent archetypes.
**Status:** [x] COMPLETE

## [x] In-Game Tactical Goals & KPI HUD
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches enter games with specific tactical objectives (e.g., "Keep them under 8 offensive rebounds"). Live tracking of these KPIs keeps the team focused on the game plan.
**What:** Add a "Tactical Goals" section to Team Settings where coaches can set numeric targets for a game. Display a live "Goal Progress" HUD in GameMode.
**Acceptance Criteria:**
- [x] CRUD interface in Team Settings to define "Tactical Goals" (e.g., < 10 TOs, > 15 AST, < 30% Opp 3PT).
- [x] "Goal HUD" in GameMode showing real-time progress (e.g., "Offensive Rebounds: 4/8").
- [x] Visual celebration/alert when a goal is achieved or a limit is breached.
- [x] Post-game "Goal Performance" summary in GameStats.
**Status:** [x] COMPLETE

## [x] Live "Film Room" Event Bookmarking
**Priority:** HIGH
**Type:** UX
**Why:** Reviewing game film is tedious when you have to hunt for specific moments. One-tap bookmarking during the game allows coaches to jump straight to critical plays for post-game study.
**What:** Add a "Bookmark" (Star) icon to the recent actions list and a "Flag Play" button to the quick actions. These flagged events are highlighted in the post-game summary and exported CSVs.
**Acceptance Criteria:**
- [x] "Flag Play" button in GameMode for immediate bookmarking of the last event.
- [x] Bookmark icons next to each event in the Recent Actions list.
- [x] "Key Moments" filter in the GameStats event log.
- [x] Exportable list of bookmarked events with timestamps for easy film synchronization.
**Status:** [x] COMPLETE

## [x] HALT (High-Leverage Alerting) System
**Priority:** HIGH
**Type:** Enhancement
**Why:** Critical game situations (e.g., a star player with 3 fouls in the 1st half) require immediate tactical shifts. Automated alerts ensure coaches never miss a high-leverage decision window.
**What:** Implement a "High-Leverage Alert" engine that monitors game state and triggers intrusive HUD warnings for critical tactical scenarios.
**Acceptance Criteria:**
- [x] "Star Player Foul Warning" (e.g., 2 fouls in Q1, 3 in Q2).
- [x] "Bonus Approaching" alert when an opponent is at 4 fouls in a quarter.
- [x] "Time to Sub" fatigue alerts based on live stint duration vs target minutes.
- [x] "Clutch Mode" activation alert when entering the final 4 mins of a close game.
**Status:** [x] COMPLETE

## [x] Refactor & Right-Size Large Files to Improve Jules Performance
**Priority:** HIGH **Type:** Technical Debt
**Why:** Jules is exhibiting slowdowns and "file too large" issues because several core files have grown beyond effective context window limits. The monolithic `index.ts` (883 lines) forces Jules to load the entire API surface for any single endpoint change. The `backlog.md` (637 lines) is injected into every session regardless of relevance. Multiple overlapping sentinel test files add redundant context on every run.
**What:**
1. Split `index.ts` into per-resource handler modules: `handlers/players.ts`, `handlers/games.ts`, `handlers/teams.ts`, `handlers/stats.ts`, `handlers/cleanup.ts` — each under 200 lines. Keep `index.ts` as a thin router (~100 lines).
   - [x] `handlers/cleanup.ts` created and integrated.
2. Split `utils.ts` (420 lines) — separate `security-utils.ts` (sanitize, mask, safeCompare, normalizePath) from `data-utils.ts` (stripLocalFields, extractId, etc.).
3. Archive `backlog.md` — move all `[x]` completed items to a `backlog-archive.md`. Add a rule: completed items get archived after each sprint. Enforce a soft cap of ~200 lines on active `backlog.md`.
4. Consolidate sentinel test files — merge `sentinel_enhancements.test.ts`, `sentinel_dos.test.ts`, `sentinel_path.test.ts`, `sentinel_v3.test.ts`, `sentinel_v4.test.ts` into a single organized `security.test.ts` with `describe` blocks per concern. Target under 500 total lines.
5. Add a guardrail note to `playbook.md`: Jules should flag any file approaching 300 lines and propose a split before continuing.
**Acceptance Criteria:**
- [x] `index.ts` is under 150 lines (router only)
- [x] No source file in `backend/src/` exceeds 300 lines unless it logically makes sense. This is not a hard rule, but it's a refactor trigger.
- [x] `backlog.md` (active items only)
- [x] `backlog-archive.md` exists with all completed items
- [x] Total test file count in `__tests__/` reduced by at least 4
- [x] All existing tests continue to pass
- [x] `playbook.md` updated with file size guardrail rule

## [x] Holistic Matchup Efficiency Matrix
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to see the entire defensive landscape at once, not just isolated mismatches. A 5x5 Matrix reveals the most exploitable and vulnerable points of the current unit-on-unit battle.
**What:** Build a visual matrix component in GameMode that maps our 5 active players (Y-axis) against the 5 opponent players (X-axis) using color-coded efficiency (Stop %).
**Acceptance Criteria:**
- [x] 5x5 "Efficiency Matrix" accessible via a sidebar toggle in GameMode.
- [x] Color-coded cells: Green (High Stop %), Red (Low Stop %), Gray (Insufficient Data).
- [x] One-tap reassignment by clicking a cell in the matrix.
- [x] "Unit Optimization" score summarizing the total defensive parity of the current 5-man unit.

## [x] "Locker Room" Post-Game Learning System
**Priority:** HIGH
**Type:** UX
**Why:** The learning gap between games is where championships are won. A guided review mode turns a static box score into an interactive teaching tool for coaches and players.
**What:** Implement a "Coaching Clinic" mode in the Game Stats page that automatically identifies and walks through the 5 most critical game-changing moments.
**Acceptance Criteria:**
- [x] "Start Clinic" button in Game Stats.
- [x] Guided walkthrough identifying: 3 "Execution Wins" and 3 "Tactical Errors" based on PPP and Score Flow.
- [x] Integrated "Momentum Shift" analyzer that highlights the specific play or sub that triggered a scoring run.
- [x] "Coach's Reflection" text area to save takeaways for the next practice plan.

## [x] Opponent Play-Type Breakdown (PnR vs ISO vs Post)
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding *how* an opponent is scoring (e.g., Pick-and-Roll vs. Isolation) is the first step to stopping them. Defensive adjustments are only as good as the underlying data.
**What:** Add a "Play Type" tag to opponent scoring events. Allow the scorekeeper to quickly categorize opponent buckets as "PnR", "ISO", "Post", "Transition", or "Off-Screen".
**Acceptance Criteria:**
- [x] Optional "Play Type" selector in the opponent shot recording dialog.
- [x] "Opponent Scoring Breakdown" table in GameStats showing efficiency by Play Type.
- [x] Real-time alerts for recurring threats (e.g., "Opponent scoring 1.8 PPP on Pick-and-Rolls").
- [x] Filter opponent shot chart by Play Type.
