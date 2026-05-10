# Scorebook Backlog

## [x] [Defensive Breakdown Attribution (The Accountability Layer)]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *why* a bucket was allowed to fix it in practice. This layer separates physical skill makes from tactical mental errors.
**What:** Enhance opponent scoring events with a mandatory (optional toggle) breakdown reason and provide a post-game integrity report.
**Acceptance Criteria:**
- [x] Quick-select "Breakdown Reason" overlay after recording an opponent make: "Missed Rotation", "Transition Leak", "Poor Closeout", "Out-Hustled", "Great Contest".
- [x] "Defensive Integrity" report in GameStats summarizing % of points allowed by breakdown category.
- [x] "Tactical Weak Link" identification: Highlight the most frequent breakdown type in the current game.
- [ ] Filter opponent shot chart markers by breakdown type.

## [x] [Special Situation (ATO/SLOB/BLOB) Analytical Engine]
**Priority:** HIGH
**Type:** Feature
**Why:** Designing the perfect play is useless if you don't know if it works. This engine moves beyond raw stats to show efficiency in high-leverage set plays.
**What:** Build a dedicated analytics module and UI to visualize PPP and eFG% for possessions tagged as ATO, SLOB, BLOB, or EOP.
**Acceptance Criteria:**
- [x] Add `calculateSituationalStats` to the stats engine to derive PPP/eFG% filtered by situation.
- [x] New "Specialty Execution" card in GameStats showing a performance table by situation.
- [ ] "Execution Delta" metric comparing Situational PPP vs. standard Half-Court PPP.
- [ ] Visualization of "Success Rate" (Possessions ending in score or shooting foul) per situation.

## [x] [Voice-Driven Live Scorekeeping]
**Priority:** HIGH
**Type:** Feature
**Why:** Solo scorekeepers struggle to keep up with high-intensity transition play. Voice commands eliminate "tap lag" and allow the user to keep their eyes on the floor.
**What:** Implement a Web Speech API layer in GameMode to record events via voice.
**Acceptance Criteria:**
- [x] "Voice Mode" toggle in GameMode header with microphone permission handling.
- [x] Support for standard grammar: "[Jersey] [Action]" (e.g., "Five make two", "Ten assist").
- [x] Support for opponent actions: "Opponent twelve miss".
- [x] Chained commands: "Twenty-four make three assist five".
- [x] Visual HUD feedback showing "Last Heard: #24 Make 3PT".
- [x] High-confidence threshold filtering to prevent background noise errors.

## [x] [Holistic Matchup Efficiency Matrix]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to see the entire defensive landscape at once, not just isolated mismatches. A 5x5 Matrix reveals the most exploitable and vulnerable points of the current unit-on-unit battle.
**What:** Build a visual matrix component in GameMode that maps our 5 active players (Y-axis) against the 5 opponent players (X-axis) using color-coded efficiency (Stop %).
**Acceptance Criteria:**
- [x] 5x5 "Efficiency Matrix" accessible via a sidebar toggle in GameMode.
- [x] Color-coded cells: Green (High Stop %), Red (Low Stop %), Gray (Insufficient Data).
- [x] One-tap reassignment by clicking a cell in the matrix.
- [ ] "Unit Optimization" score summarizing the total defensive parity of the current 5-man unit.

## [x] [Spark Plug Momentum Index]
**Priority:** HIGH
**Type:** Feature
**Why:** Some players provide value that doesn't show up in the box score but triggers team-wide energy shifts (e.g., a floor dive or a charge taken).
**What:** A specialized metric that weighs "Blue Collar" hustle stats against immediate subsequent team scoring runs to identify "Momentum Starters."
**Acceptance Criteria:**
- [x] "Spark Plug" score for every player who records a FLOOR_DIVE, CHARGE_TAKEN, or GREAT_CONTEST.
- [x] Correlation of hustle events to 2-minute scoring runs.
- [x] "Energy Alert" in GameMode suggesting when to bring in a high-momentum player.

---

## Documentation & Knowledge Layer
**Priority:** MEDIUM
**Type:** Documentation
**Why:** Maintain systemic clarity for future agents and human contributors as the "Causal Accountability" logic grows.
**Acceptance Criteria:**
- [x] Update SCHEMA.md with extended StatEvent attributes (breakdownReason, defensiveScheme, opponentPlayType).
- [x] Document "Jersey Prefix" playerId format in SCHEMA.md.
- [x] Deep-dive into "Causal Accountability" principles in README.md.
- [ ] Create ARCHITECTURE.md for high-level system overview (Offline-first sync, Snapshot architecture).
- [ ] Document internal analytical formulas (PPP, Spark Plug Index, Fatigue Decay) in a dedicated ANALYTICS.md.

---

## [x] [Ref-Identity Conflict Alert System]
**Priority:** HIGH
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out. Proactive alerts allow the coach to adjust aggressiveness before the game is lost.
**What:** A predictive engine that compares live Officiating FPM (Fouls Per Minute) against the Team's active defensive scheme.
**Acceptance Criteria:**
- [x] Live "Ref Tightness" meter in GameMode sidebar.
- [x] Conflict Alert (Visual) when Foul Rate exceeds 0.8 FPM while in a "High Pressure" scheme (Press/Double).
- [x] Recommendation to "Dial Back Pressure" or "Sub Fresh Legs" based on foul distribution.

## [x] [Opponent "Go-To" Usage Analytics (Clutch)]
**Priority:** HIGH
**Type:** Feature
**Why:** In "Winning Time," every team has a primary option. Identifying this player's usage rate and preferred shot type in the clutch allows for specialized defensive counters.
**What:** An analytical tool that identifies opponent usage rates and eFG% specifically in clutch situations (final 4 mins, < 5pt spread).
**Acceptance Criteria:**
- [x] "Clutch Threat" indicator on the opponent roster card during Winning Time.
- [x] Breakdown of "Clutch Action Type" (e.g., "ISO Drive", "PnR Handler").
- [x] Comparison of Opponent X's Clutch Usage vs. Regulation Usage.

## [x] ["Defensive Scheme" Real-Time PPP Analyzer]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which defensive set is most effective *now*. PPP allowed by scheme is the ultimate truth for mid-game adjustments.
**What:** Enhance "Defensive Scheme" tracking to provide live PPP (Points Per Possession) allowed for Man vs. Zone vs. Press.
**Acceptance Criteria:**
- [x] Sidebar toggle in GameMode to select active defensive scheme.
- [x] Real-time PPP display for the active scheme.
- [x] "Scheme Efficiency" comparison table in the Halftime Report.

## [ ] [Lineup "Offensive Chemistry" Connectivity Map]
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding who makes whom better is the key to elite playcalling. Connectivity maps show which duos create the most efficient shots.
**What:** Create a visual "Assist Network" diagram for the active 5-man unit.
**Acceptance Criteria:**
- [ ] Visual graph in GameStats showing assist/pass connectivity between players.
- [ ] Weighting of connections by eFG% (e.g., "Player A to Player B results in 65% eFG%").
- [ ] Identification of "Primary Playmaker" and "Primary Finisher" nodes for the current lineup.

## [ ] Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** A cold shooting night shouldn't result in a tactical pivot if the "Process" is correct. xPTS moves the conversation from results to quality.
**What:** A model that assigns Expected Points (xPTS) to every shot based on location and the "Shot Quality" (Open/Contested) tag.
**Acceptance Criteria:**
- [ ] Implement a lookup table for xPTS based on zone averages and shot quality weights.
- [ ] "Shot ROI" metric in GameStats: (Total Points / Total xPTS) - 1.0.
- [ ] "Quality Control" HUD in GameMode showing average xPTS per possession for the current lineup.
- [ ] Post-game "Process Report" highlighting high xPTS shots that missed vs. low xPTS shots that went in.

## [x] [Executive Halftime Talking Points Generator]
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is only 10 minutes. Coaches need automated synthesis of complex data into 3 punchy, actionable directives for the locker room.
**What:** An automated NLP-style engine that analyzes game aggregates vs. season averages to generate 3 executive-level bullet points.
**Acceptance Criteria:**
- [x] "Talking Points" tab in the Halftime Report Dialog.
- [x] Bullet 1 (Offensive): Efficiency insight (e.g., "eFG% is 12% below average; stop settling for long 2s").
- [x] Bullet 2 (Defensive): Personnel threat (e.g., "Opponent #24 is 4/4 on drives; force him left").
- [x] Bullet 3 (Personnel): Lineup suggestion (e.g., "Lineup [5,10,12] is +8; keep them together").
- [x] "Copy for Assistant" button to send talking points via clipboard.

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Elite programs use multiple sets of eyes.
**What:** A multi-device websocket or real-time sync layer.

## [ ] Dynamic "Target Attack" Identifier
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss which opponent defender is the "weak link" or which specific matchup is most exploitable in real-time. This tool automates the identification of mismatches to drive play-calling.
**What:** Implement an intelligence layer that correlates Matchup Tracking with Points Per Possession (PPP). It should highlight which opponent player is allowing the highest PPP and suggest which of our players should be the primary attacker.
**Acceptance Criteria:**
- [ ] Live HUD element in GameMode showing "Top Attack Target" (Opponent Jersey #).
- [ ] Real-time "Mismatch Alert" when a specific defender's Stop % drops below a configurable threshold.
- [ ] "Targeted Play" recommendation based on which of our players has the best eFG% against that specific defender's archetype.

## [ ] Strategic Timeout & Game State Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** Timeout decisions in the 4th quarter are high-stress. An advisor that considers remaining timeouts, foul situation, and momentum helps coaches make the "mathematically correct" call.
**What:** Build a "Decision Support" engine that analyzes game state (Score, Time, Fouls, Momentum) and provides a recommended action during dead balls.
**Acceptance Criteria:**
- [ ] "Timeout Logic" that triggers a recommendation when the opponent is on a 6-0 run OR when a star player enters foul trouble.
- [ ] Late-game "Situational HUD" (e.g., "Down 2, 10s left: Recommendation - Attack the rim for 2PT to tie").
- [ ] Visual indicator of "Effective Timeouts Remaining" considering the game's current pace and remaining duration.

## [ ] Automated Post-Game Player Performance Narratives
**Priority:** HIGH
**Type:** Feature
**Why:** Players often don't understand raw stats. Converting data into "Narratives" (e.g., "You were elite at closing out but struggled with ball security") makes coaching feedback more digestible and actionable.
**What:** Use the accumulated StatEvents to generate a 3-sentence performance summary for every player who played > 5 minutes.
**Acceptance Criteria:**
- [ ] "Player Feedback" section in the Game Stats page.
- [ ] Automated generation of one "Strength" (e.g., "High Efficiency from Corner 3") and one "Growth Area" (e.g., "High TO rate on drives").
- [ ] Ability for the coach to "Approve & Send" the narrative to the player via text/email.

## Standardized Video Platform Export (Hudl/Synergy)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches spend hours manually tagging film. Exporting our granular game data into formats compatible with Hudl, Synergy, or VidSwap bridges the gap between stats and film.
**What:** Create an export engine that generates CSV or XML files mapped to the specific column requirements of major video analysis platforms.
**Acceptance Criteria:**
- [ ] "Export for Video" button in Game Stats.
- [ ] Dropdown to select platform (Hudl, Synergy, VidSwap).
- [ ] Export includes `clockTime`, `period`, `playerName`, `actionType`, and `playName`.
- [ ] Properly formatted CSV/XML file downloaded to the user's device.

## Program-Wide Tactical KPI Dashboard
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to see if their team's identity (e.g., "We are a transition team") is holding up over months, not just individual games.
**What:** Build a longitudinal dashboard that tracks specific team-defined KPIs (e.g., OREB%, TO Rate, PPP) across the entire season with trend lines.
**Acceptance Criteria:**
- [ ] New "Program Health" tab on the Dashboard/My Team page.
- [ ] Multi-game trend charts for the "Four Factors."
- [ ] "Identity Goals" section where coaches see % of games where goals were met.
- [ ] Filter by date range or opponent strength.

## [x] [Substitution Timeline Audit]
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**What:** Build a "Timeline Audit" view that shows a vertical chronological list of all substitution events. Allow users to edit the time of a sub, change the players involved, or insert a missing sub event.
**Acceptance Criteria:**
- [x] Accessible from the Game Stats or Game Mode page.
- [x] Displays a chronological list of SUB_IN and SUB_OUT events.
- [x] Allows editing the `clockTime` and `playerId` of any substitution event.
- [x] Recalculates all dependent stats (MIN, +/-, Lineup Efficiency) immediately upon saving changes.

## [x] [Offensive Play/Set Success Tracking]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**What:** Introduce "Play Tagging" for offensive events. Allow coaches to define a playbook in Team Settings and tag MAKE/MISS events with specific play names during the game.
**Acceptance Criteria:**
- [x] CRUD interface in Team Details to manage a "Playbook" (list of play names).
- [x] Optional "Play" dropdown in the MAKE/MISS recording dialog in Game Mode.
- [x] "Play Efficiency" table in Game Stats showing: Play Name, Frequency, Points, and EFG% for each set.
- [x] Filter Shot Chart by specific Play Name.

## [x] [Real-Time Foul Trouble & Fatigue Rotation Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**What:** Implement visual and haptic/audio alerts in `GameMode` when a player reaches configured thresholds (e.g., 2 fouls in Q1, 4 fouls total, or 8 consecutive minutes).
**Acceptance Criteria:**
- [x] "Foul Trouble" pulse on the player's lineup card (e.g., orange at limit-1, red at limit).
- [x] "Fatigue Alert" visual (e.g., a "Needs Sub" icon) when a player's current stint exceeds the "Max Stint Duration" from Team Settings.
- [x] Configuration in Team Details to set "Foul Warning Thresholds" by period.

## [x] [Automated PDF Box Score & Game Summary Export]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [x] "Export PDF" button on Game Stats page.
- [x] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [x] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [x] Inclusion of the Scoring Flow visualization in the PDF.

## [x] [Free Throw Sequence Workflow]
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [x] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [x] One-tap recording for each attempt in the sequence.
- [x] Automatically attributes points and attempts to the selected player.
- [x] Closes automatically after the designated number of attempts are recorded.

## [x] [Intelligent Linked Event Chaining]
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**What:** Implement a "Chained Action" flow in the `GameMode` recording dialog. When a `MAKE` is saved, if an on-court teammate hasn't already been credited with an assist, immediately prompt "Who assisted?" with one-tap teammate buttons. Similarly, after a `MISS`, prompt for "Who rebounded?".
**Acceptance Criteria:**
- [x] After clicking "Save" on a `MAKE` event, display a "Teammate Assist?" overlay if tracking "Our Team".
- [x] After clicking "Save" on a `MISS` event, display "Offensive Reb?" and "Defensive Reb?" quick-tap options.
- [x] If a teammate is tapped, record the second event (ASSIST or REBOUND) with the same `timestamp`, `period`, and `clockTime` as the shot.
- [x] Option to "Skip" or "No Assist/Rebound" to close the chain.

## [ ] [Scoring Run & Drought "Coaching Alerts"]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [ ] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [ ] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [ ] Alerts should include a "Suggest Timeout" visual cue.
- [ ] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

## [ ] [Real-Time Opponent Threat Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [ ] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [ ] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [ ] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## [x] [Possession-Based Efficiency Metrics (PPP)]
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**What:** Transition the internal stats engine to calculate total possessions and derive PPP for teams, lineups, and individual players.
**Acceptance Criteria:**
- [x] Calculate "Possessions" for both teams (FGA + 0.44*FTA + TO - OREB).
- [x] Display PPP on the GameMode sidebar and Game Stats dashboard.
- [x] Defensive PPP (Points Allowed Per Possession) to measure defensive quality independently of pace.
- [x] Trend line showing PPP fluctuation throughout the game.

## [ ] [Locker Room] Post-Game Learning System
**Priority:** HIGH
**Type:** UX
**Why:** The learning gap between games is where championships are won. A guided review mode turns a static box score into an interactive teaching tool for coaches and players.
**What:** Implement a "Coaching Clinic" mode in the Game Stats page that automatically identifies and walks through the 5 most critical game-changing moments.
**Acceptance Criteria:**
- [ ] "Start Clinic" button in Game Stats.
- [ ] Guided walkthrough identifying: 3 "Execution Wins" and 3 "Tactical Errors" based on PPP and Score Flow.
- [ ] Integrated "Momentum Shift" analyzer that highlights the specific play or sub that triggered a scoring run.
- [ ] "Coach's Reflection" text area to save takeaways for the next practice plan.

## [ ] Opponent Play-Type Breakdown (PnR vs ISO vs Post)
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding *how* an opponent is scoring (e.g., Pick-and-Roll vs. Isolation) is the first step to stopping them. Defensive adjustments are only as good as the underlying data.
**What:** Add a "Play Type" tag to opponent scoring events. Allow the scorekeeper to quickly categorize opponent buckets as "PnR", "ISO", "Post", "Transition", or "Off-Screen".
**Acceptance Criteria:**
- [ ] Optional "Play Type" selector in the opponent shot recording dialog.
- [ ] "Opponent Scoring Breakdown" table in GameStats showing efficiency by Play Type.
- [ ] Real-time alerts for recurring threats (e.g., "Opponent scoring 1.8 PPP on Pick-and-Rolls").
- [ ] Filter opponent shot chart by Play Type.

## [ ] Live Defensive Scheme Effectiveness Dashboard
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often stick to a defensive scheme (e.g., 2-3 Zone) because it's "safe," even when it's being shredded. A live efficiency dashboard allows for data-driven adjustments mid-quarter.
**What:** Build a real-time monitor that tracks Points Per Possession (PPP) allowed for the current active defensive scheme (Man, Zone, Press) and compares it to the season average.
**Acceptance Criteria:**
- [ ] "Active Defense" toggle in GameMode header.
- [ ] Real-time PPP display for the active scheme.
- [ ] "Switch Defense" alert if current scheme PPP is > 1.2 for 3 consecutive possessions.
- [ ] Breakdown table in GameStats showing PPP Allowed by Scheme.

## [x] [Shot Clock Process Analysis]
**Priority:** HIGH
**Type:** Feature
**Why:** Rushing shots early in the clock or settling for late-clock heaves is a "process" failure. This feature distinguishes between quick-hit offensive success and desperation shots.
**What:** Categorize every shot into "Early Clock" (first 10s), "Mid Clock", and "Late Clock" (last 5s) buckets and track EFG% for each.
**Acceptance Criteria:**
- [x] "Clock Phase" tagging automatically derived from StatEvent.clockTime and periodLength.
- [x] "Shot Rhythm" chart in GameStats showing volume and efficiency by clock phase.
- [x] "Decision Alert" in GameMode if team is shooting < 20% on Early Clock shots.

## [ ] Automated Referee Profile HUD
**Priority:** HIGH
**Type:** Feature
**Why:** Referee "tightness" (fouls per minute) and bias (home/away split) should dictate how aggressive a team plays. A coach who knows the ref is calling it tight can adjust defensive pressure before foul trouble hits.
**What:** An intelligence layer that analyzes the frequency and distribution of fouls called by the current officiating crew.
**Acceptance Criteria:**
- [ ] "Ref Tightness Meter" in GameMode comparing current game Fouls Per Minute (FPM) against a historical baseline.
- [ ] "Foul Bias" indicator showing the split between Our Team vs Opponent fouls.
- [ ] "Aggression Advisor" suggesting "Press Hard" or "Play Soft" based on FPM.

## [ ] Program-Wide "Tactical DNA" Comparison
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to know if their team is evolving or regressing in their core identity (e.g., "Are we still an elite rebounding team?").
**What:** A longitudinal comparison tool that overlays current game "Four Factors" against the season-to-date "DNA" blueprint.
**Acceptance Criteria:**
- [ ] "Program DNA" Radar Chart in GameStats.
- [ ] Overlay of "Last 3 Games" vs "Season Average" to identify recent trends.
- [ ] "Identity Crisis" alert if more than 3 of the Four Factors deviate by >15% from the season mean.

## [UX] Epic: Administrative Workflow & Dashboard Streamlining
**Priority:** MEDIUM
**Type:** UX / Enhancement
**Why:** Current administrative workflows (game creation, team editing) are high-friction, and the dashboard lacks actionable information.
**What:** Redesign the administrative experience to be workflow-driven and transform the dashboard into a high-value "My Team" hub.
**Acceptance Criteria:**
- [ ] Replace static Dashboard with a dynamic "My Team" hub driven by "Star Team" selection.
- [ ] Implement a multi-step workflow for the `Create Game` dialog (Opponent -> Date/Time -> Settings).
- [ ] Update `Edit Team Details` to include global game defaults (period lengths, foul limits, timeout counts).

## Multi-Game Shot Location Trend Analysis
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A team's shooting identity shifts throughout a season. Identifying that a team has stopped attacking the rim over the last 5 games allows for immediate practice adjustments.
**What:** Implement a "Trend Mode" for the Team Heatmap.

## Predictive Foul Strategy Assistant
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Managing foul trouble for star players is a high-stakes balancing act.
**What:** Implement a predictive model in the GameMode that calculates "Foul Risk".

## Interactive Halftime "Adjustment Board"
**Priority:** MEDIUM
**Type:** Feature
**Why:** Halftime is the most critical window for tactical pivots.
**What:** Enhance the Halftime Report with an interactive "Adjustment Board".

## Advanced Opponent Drive & Finish Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Knowing a player is "Hot" is good; knowing they always drive LEFT and finish with a FLOAT is game-changing.
**What:** Enhance the opponent shot recording to include "Drive Direction".

## "Blue Collar" Hustle & Identity Tracker
**Priority:** MEDIUM
**Type:** Feature
**Why:** Winning teams are built on "Hustle Stats" (Deflections, Dives, Great Contests).
**What:** Add a dedicated "Hustle Mode" toggle in GameMode.

## Predictive Performance & Fatigue Modeling
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A player's impact doesn't drop off exactly at 8 minutes.
**What:** Build a model that compares a player's live stint efficiency against fresh-state averages.

## Live Opponent Personnel Intelligence HUD
**Priority:** MEDIUM
**Type:** UX
**Why:** Scouting reports are often forgotten in the heat of a game.
**What:** Integrate persistent scouting notes into the live GameMode opponent cards.

## Longitudinal Official/Referee Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Officiating is the "Third Team" on the court.
**What:** Implement a season-wide database of officiating stats.

## Program-Wide Optimal Rotation Optimizer
**Priority:** MEDIUM
**Type:** Feature
**Why:** Managing a roster across a long season requires identifying which units are mathematically most effective.
**What:** A prescriptive engine that analyzes season-wide unit data.

## [ ] Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [ ] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [ ] "Load Roster" option in Create Game workflow for selected opponents.
- [ ] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## [ ] Verified Period Workflow
**Priority:** MEDIUM
**Type:** UX
**Why:** Official scores and fouls often drift from the app during high-intensity games. A scheduled reconciliation ensures data integrity before moving to the next phase of the game.
**What:** At the end of every period, show a mandatory "Verify Stats" dialog. The scorekeeper must confirm the score and team fouls against the official table before the period is marked "Verified."
**Acceptance Criteria:**
- [ ] Automated dialog trigger when the clock hits 0:00 or "Next Period" is clicked.
- [ ] Display summarized period stats (Score, Fouls) with input fields for "Correction" if they differ from the app.
- [ ] Generate a `SYSTEM_CORRECTION` event to balance totals if manual overrides are entered.

## [ ] Multi-Period Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Shooting patterns change as a game progresses due to fatigue or defensive adjustments. Coaches need to see *when* their team stopped getting to the rim.
**What:** Enhance the Shot Chart in `GameStats` and `Dashboard` to allow filtering heatmaps by specific period or "Half."
**Acceptance Criteria:**
- [ ] Period-selector filter (P1, P2, P3, P4, OT) on the Shot Chart view.
- [ ] "Compare Periods" mode showing two heatmaps side-by-side (e.g., 1st Half vs 2nd Half).
- [ ] Toggle to show "Only Misses" or "Only Makes" on the heatmap.

## [ ] Interactive Playbook Efficiency HUD
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know *during* the game if a specific offensive set is failing. Waiting for post-game stats to stop running an inefficient play is too late.
**What:** Add a "Playbook Performance" widget to the `GameMode` sidebar that shows the success rate (PPP) of the top 3 most-used plays in the current game.
**Acceptance Criteria:**
- [ ] Sidebar widget in GameMode showing Play Name, Frequency, and Points Per Possession (PPP).
- [ ] Color-coded efficiency indicator (Green/Yellow/Red) based on team-average PPP.
- [ ] One-tap access to see the shot chart for a specific play during timeouts.

## [ ] Shot Quality & Process Tagging
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A "good" shot can miss and a "bad" shot can go in. Coaches need to evaluate the *process* of their offense, not just the result, to make halftime adjustments.
**What:** Add an optional "Shot Quality" toggle to the `MAKE`/`MISS` recording dialog (e.g., "Open" vs "Contested").
**Acceptance Criteria:**
- [ ] Add `shotQuality` (OPEN, CONTESTED) to the `StatEvent` schema.
- [ ] Add a simple toggle or button group in the shot recording dialog to tag quality.
- [ ] Display "Process Efficiency" in `GameStats` (e.g., "EFG% on Open Shots" vs "EFG% on Contested Shots").
- [ ] Filter Shot Chart by Shot Quality.

## [ ] Interactive Game Flow & Momentum Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Box scores are static. A flow chart shows *when* the game was won or lost and how specific lineups affected the lead.
**What:** Add a "Game Flow" visualization to the `GameStats` page—a line graph showing the point spread over the course of the game clock.
**Acceptance Criteria:**
- [ ] Interactive line chart showing `Our Score - Opponent Score` on the Y-axis and `Game Time` on the X-axis.
- [ ] Mark key events on the timeline (Timeouts, Period ends).
- [ ] Hovering over the line shows the score and active lineup at that specific time.
- [ ] Color-code the background to show who was "in control" (e.g., blue for home lead, red for away lead).

## [ ] Multi-Game Lineup Net Rating Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game Plus/Minus can be noisy. Coaches need to know which 5-man combinations are most effective over a season or tournament.
**What:** Aggregate lineup performance data across multiple games for a team.
**Acceptance Criteria:**
- [ ] New "Lineup Analytics" tab on the `TeamStats` or `My Team` (Dashboard) page.
- [ ] Table of 5-man units (lineups) that have played together.
- [ ] Metrics per lineup: Total Minutes, Points For, Points Against, Net Rating (Diff per 100 possessions or per 40 mins).
- [ ] Ability to filter by "Last 5 Games" or "Season".
