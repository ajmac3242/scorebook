# Scorebook Backlog

## Maintenance Note
Completed items are archived to `.Jules/backlog-archive.md` to maintain optimal performance for agent context. Active `backlog.md` should aim for a soft cap of ~200 lines.

## Live "Game Identity" Radar
**Priority:** HIGH
**Type:** UX
**Why:** Teams often lose their "Identity" (e.g., "We are a fast-break team") during high-pressure games. A radar chart comparing live performance against the "Team Blueprint" keeps the team focused.
**What:** A real-time Radar Chart in GameMode that compares current game Four Factors and Pace against the team's season-long averages (the "Blueprint").
**Acceptance Criteria:**
- [ ] Interactive Radar Chart in the GameMode sidebar.
- [ ] Overlay of "Current Game" (Solid) vs "Season Average" (Dashed) for: Pace, eFG%, TO%, ORB%, and FT Rate.
- [ ] "Identity Alert" when a core metric deviates by more than 20% from the blueprint.

## Integrated Practice Prescription Engine
**Priority:** HIGH
**Type:** Feature
**Why:** The best coaches use game data to plan the next practice. This feature closes the loop by suggesting specific drills based on the team's statistical failures in the last game.
**What:** A logic engine that maps low KPI performance (e.g., low FT%, high TOs) to a library of suggested practice drills.
**Acceptance Criteria:**
- [ ] "Practice Planner" button on the Game Stats page.
- [ ] Automatic suggestion of 3 "Focus Areas" based on the game's worst-performing metrics.
- [ ] Linkage to a (mock) library of drills (e.g., "Poor 3PT% -> Suggest '100 Makes' Drill").

## Automated Defensive Synergy Analysis (2-3 Player Units)
**Priority:** HIGH
**Type:** Feature
**Why:** Some defensive pairings are greater than the sum of their parts. Coaches need to know which duos/trios anchor the defense most effectively, beyond just 5-man units which can have small sample sizes.
**What:** Build a "Defensive Synergy" report that calculates Opponent PPP and Forced Turnover % for every 2-player and 3-player combination that has played significant minutes together.
**Acceptance Criteria:**
- [ ] New "Synergy" tab in Team Analytics.
- [ ] Table showing 2-player and 3-player units with Defensive Rating (DRtg) and Net Rating.
- [ ] Filter to show only units with > 10 minutes played.
- [ ] Highlight "Shut-Down Units" (units with DRtg significantly better than team average).

## Multi-Game Shot Location Trend Analysis
**Priority:** HIGH
**Type:** Enhancement
**Why:** A team's shooting identity shifts throughout a season due to confidence or coaching changes. Identifying that a team has stopped attacking the rim over the last 5 games allows for immediate practice adjustments.
**What:** Implement a "Trend Mode" for the Team Heatmap that compares shot frequency and accuracy between two time periods (e.g., "Last 5 Games" vs "Season Average").
**Acceptance Criteria:**
- [ ] "Trend Comparison" toggle on the Dashboard and Team Stats heatmaps.
- [ ] Visual indicators (e.g., color-coded arrows) showing if shot frequency in a zone has increased or decreased relative to baseline.
- [ ] Efficiency delta overlay (e.g., "+5% EFG vs Season Avg") per zone.

## Predictive Foul Strategy Assistant
**Priority:** HIGH
**Type:** Enhancement
**Why:** Managing foul trouble for star players is a high-stakes balancing act. Coaches need to know if they can afford to leave a player in or if they are mathematically likely to foul out before the game ends.
**What:** Implement a predictive model in the GameMode that calculates "Foul Risk" for active players based on their current foul rate, historical foul frequency, and the remaining game clock.
**Acceptance Criteria:**
- [ ] "Foul Risk" percentage displayed on player cards in GameMode (e.g., "75% chance to foul out").
- [ ] Dynamic recommendation for when to bench a player based on foul count vs. remaining time (e.g., "Sit until final 4:00").
- [ ] Proactive alert when a player's "Projected Final Fouls" exceeds the limit.

## Interactive Halftime "Adjustment Board"
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is the most critical window for tactical pivots. Coaches need a workspace to select specific adjustments based on data and then track if those adjustments actually worked in the second half.
**What:** Enhance the Halftime Report with an interactive "Adjustment Board" where coaches can select from a list of data-driven recommendations and save them to the game record as a "Tactical Pivot."
**Acceptance Criteria:**
- [ ] "Adjustment Planner" section in the HalftimeReportDialog.
- [ ] List of "Smart Suggestions" (e.g., "Opponent #24 driving left 80% - Force Right").
- [ ] Ability to "Commit" an adjustment, adding a tagged event to the game timeline.
- [ ] Post-game comparison showing PPP and EFG% before and after the adjustment was activated.

## Player Assist Network & Offensive Chemistry Map
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding who makes whom better is the key to elite playcalling. Raw assist totals don't show the "Gravity" or "Chemistry" between specific player pairings.
**What:** Create a visual "Assist Network" diagram that shows the volume and efficiency of passes between teammates.
**Acceptance Criteria:**
- [ ] Interactive Node-Link diagram where nodes are players and edges represent assists.
- [ ] Edge thickness represents assist volume; edge color represents the EFG% of shots resulting from those assists.
- [ ] Filter by "Game" or "Season" to see how chemistry develops.
- [ ] Highlight "Primary Engines" (players who facilitate the most efficient shots for others).

## Voice-Driven Live Scorekeeping
**Priority:** HIGH
**Type:** Feature
**Why:** Tapping a screen during a 90-foot transition is difficult and leads to errors. Voice commands allow the scorekeeper to keep their eyes on the floor and record actions with 100% focus.
**What:** Implement a Web Speech API layer that listens for a specific command grammar (e.g., "Five make two", "Ten assist", "Opponent miss").
**Acceptance Criteria:**
- [ ] Wake-word or "always listening" mode toggle in GameMode.
- [ ] Support for commands: "[Jersey] [Action]" (e.g., "Twenty-four make three").
- [ ] Support for chained commands: "Five make two assist ten".
- [ ] Visual confirmation "Heard: #5 Make 2PT" in the HUD.

## Advanced Opponent Drive & Finish Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Knowing a player is "Hot" is good; knowing they always drive LEFT and finish with a FLOAT is game-changing. This data drives the most effective defensive adjustments.
**What:** Enhance the opponent shot recording to include "Drive Direction" (Left, Right, Straight) and "Finish Type" (Layup, Jumper, Float, Dunk, Hook).
**Acceptance Criteria:**
- [ ] Optional "Drive/Finish" selector in the Opponent shot dialog.
- [ ] "Tendency Map" in GameStats showing drive direction arrows per player.
- [ ] Real-time alert: "Opponent #12 has driven LEFT on 4/5 attempts."
- [ ] Filter opponent heatmaps by Finish Type.

## "Blue Collar" Hustle & Identity Tracker
**Priority:** HIGH
**Type:** Feature
**Why:** Winning teams are built on "Hustle Stats" (Deflections, Dives, Great Contests). These aren't in a standard box score but are the primary way coaches measure team culture and effort.
**What:** Add a dedicated "Hustle Mode" toggle in GameMode to track non-standard defensive impact events.
**Acceptance Criteria:**
- [ ] Quick-action buttons for: Deflection, Floor Dive (Loose Ball), Great Contest, Charge Taken.
- [ ] "Hustle Leaderboard" in GameStats and Team Analytics.
- [ ] "Effort Points" system (e.g., Deflection = 2 pts) to rank players by total hustle impact.
- [ ] Visual pulse on the scoreboard when a "Hustle Event" is recorded.

## Predictive Performance & Fatigue Modeling
**Priority:** HIGH
**Type:** Enhancement
**Why:** A player's impact doesn't drop off exactly at 8 minutes. We need to predict when a player is *about* to hit their wall based on season-long stint performance and live intensity.
**What:** Build a model that compares a player's live stint efficiency (PPP, eFG%) against their fresh-state averages to predict performance decline.
**Acceptance Criteria:**
- [ ] "Performance Warning" on player cards when live stint efficiency drops 20% below season average.
- [ ] Projection of "Effective Remaining Minutes" before significant performance dip.
- [ ] Integration with Rotation Suggester to prioritize subbing out "Gassed" players over just "Timed" players.

## Executive Halftime Talking Points Generator
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches have 10 minutes to deliver a life-changing speech. They don't need raw data; they need 3 executive-level talking points that summarize the most critical game-winning adjustments.
**What:** An automated NLP-style engine that synthesizes game stats into 3 punchy, coach-ready bullet points (e.g., "We are -14 on the glass; put #5 in for size", "Stop playing Zone; Opponent scoring 1.4 PPP against it").
**Acceptance Criteria:**
- [ ] "Talking Points" tab in the Halftime Report.
- [ ] Exactly 3 bullets: 1 Offensive insight, 1 Defensive insight, 1 Personnel adjustment.
- [ ] "Copy to Clipboard" for sharing with assistant coaches via text.
- [ ] Highlight the specific stat that drove each bullet (e.g., "Why? Team ORB% is 12%").

## Defensive Breakdown Attribution (The Accountability Layer)
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding *why* the defense failed is the first step to fixing it. Separating "Coaching/Rotation Errors" from "Skill/Make" buckets allows for objective post-game accountability.
**What:** Add an optional "Breakdown Reason" tag to opponent scoring events (Missed Rotation, Transition Leak, Poor Closeout, Out-Hustled, Great Contest).
**Acceptance Criteria:**
- [ ] "Breakdown" selector appears after recording an opponent make.
- [ ] "Defensive Integrity" report in GameStats showing % of points allowed by breakdown category.
- [ ] "Accountability HUD" in GameMode highlighting the primary breakdown cause in the current half.

## Special Situations Efficiency Tracker (ATO/SLOB/BLOB)
**Priority:** HIGH
**Type:** Feature
**Why:** High-leverage execution on set plays (After Timeouts, Side-Line OB, Base-Line OB) is the hallmark of championship teams. Raw PPP doesn't isolate these critical tactical moments.
**What:** Implement a "Situation Tag" for possessions to track execution on specialized set plays.
**Acceptance Criteria:**
- [ ] One-tap tags for: ATO (After Timeout), SLOB, BLOB, EOP (End of Period).
- [ ] "Specialty Execution" table in GameStats showing PPP and EFG% isolated by situation.
- [ ] Dashboard insight: "Your team is +0.4 PPP higher on ATOs than standard possessions."

## Live Opponent Personnel Intelligence HUD
**Priority:** HIGH
**Type:** UX
**Why:** Scouting reports are often forgotten in the heat of a game. Surfacing "How to play him" tendencies directly on the player selection screen reduces scorekeeper error and aids coaching pivots.
**What:** Integrate persistent scouting notes (e.g., "Force Left", "Elite Shooter", "Non-Threat") into the live GameMode opponent cards.
**Acceptance Criteria:**
- [ ] Opponent cards in GameMode display a 1-line scouting "Key" (e.g., "FORCE LEFT").
- [ ] "Personnel Alert" pulses when a player with "Elite Shooter" tag takes an open attempt.
- [ ] Integration with Target Attack HUD to explain *why* a player is being targeted based on scouting.

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Elite programs use multiple sets of eyes. One person tracking fouls/subs while another tracks shots ensures 100% data fidelity during high-intensity 4th quarter runs.
**What:** A multi-device websocket or real-time sync layer that allows two "Scorekeeper" roles to update the same game instance simultaneously.
**Acceptance Criteria:**
- [ ] "Invite Assistant" QR code/Link in GameMode.
- [ ] Real-time (sub-500ms) propagation of events across devices.
- [ ] Conflict resolution logic (e.g., if two people record a sub, only one is committed).

## Ref-Identity Conflict Alert System
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out by halftime. This alert forces a tactical pivot before the game is lost to the free-throw line.
**What:** A predictive engine that compares live Officiating FPM (Fouls Per Minute) against the Team's active defensive scheme.
**Acceptance Criteria:**
- [ ] "Conflict Warning" alert: "Ref Tightness is HIGH. Pressing Identity at risk of foul trouble."
- [ ] Suggestion to shift to "Soft Zone" or "MAN-Contain" when tightness exceeds 1.5x baseline.
- [ ] Real-time projection of "Team Fouls at Period End" based on current ref tightness.

## Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to move beyond "Results-Based" analysis to "Process-Based" analysis. Knowing that a missed wide-open corner 3 has a higher Expected Value than a contested long 2 helps maintain tactical discipline despite cold streaks.
**What:** Build a model that assigns an "Expected Points" (xPTS) value to every shot based on location and shot quality (Open/Contested), and compare it to actual results (ROI).
**Acceptance Criteria:**
- [ ] "Expected Value" (xPTS) attribute added to shot events.
- [ ] "Shot ROI" metric in GameStats comparing Total Points to Total xPTS.
- [ ] "Quality Control" HUD in GameMode showing average xPTS per possession.
- [ ] Post-game report highlighting "High-Quality Misses" vs "Low-Quality Makes".

## Situational Opponent "Go-To" Playmaker Analysis
**Priority:** HIGH
**Type:** Feature
**Why:** In winning time, every team has a "Go-To" player. Identifying who the opponent relies on in specific high-leverage situations allows for elite defensive "pre-pivots."
**What:** An analytical tool that identifies opponent usage rates and PPP in specific situational buckets (e.g., Under 2:00, After Timeouts, End of Shot Clock).
**Acceptance Criteria:**
- [ ] "Opponent Go-To" report in GameStats.
- [ ] Situational filters for opponent usage: Clutch, ATO, EOP.
- [ ] Real-time "Personnel Warning" in GameMode when a situational "Go-To" player enters the court or handles the ball in high-leverage moments.

## Longitudinal Official/Referee Scouting Database
**Priority:** HIGH
**Type:** Feature
**Why:** Officiating is the "Third Team" on the court. Understanding referee tendencies (e.g., "Home/Away Bias", "Foul Frequency by Period") allows coaches to adjust their team's aggressiveness to match the whistle.
**What:** Implement a season-wide database of officiating stats, tracking Foul-Per-Minute (FPM) and distribution by specific referee or "Ref Profile".
**Acceptance Criteria:**
- [ ] "Official Scouting" tab in Team Analytics.
- [ ] Foul distribution heatmap per official (or profile).
- [ ] Comparison of Team Aggressiveness vs. Referee Whistle Tightness across multiple games.
- [ ] Pre-game "Referee Briefing" summary.

## Bench Momentum & "Spark Plug" Impact Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Some players provide value that doesn't show up in a box score but is felt in momentum shifts. Identifying "Spark Plugs"—players who consistently trigger scoring runs or defensive stops—helps optimize mid-game rotation adjustments.
**What:** Create a "Momentum Impact" metric that measures Team Net Rating and "Run Frequency" specifically in the 2 minutes following a player's substitution into the game.
**Acceptance Criteria:**
- [ ] "Spark Plug" leaderboard in Team Analytics.
- [ ] "Momentum Delta" displayed on player cards in GameMode (e.g., "+4.5 Net since entry").
- [ ] Visual highlight of "Momentum Units" (bench pairings that drive the highest positive runs).

## Program-Wide Optimal Rotation Optimizer
**Priority:** HIGH
**Type:** Feature
**Why:** Managing a roster across a long season requires identifying which units are mathematically most effective. Moving beyond 5-man lineups to identify the "Optimal Starting 5" based on season-long synergy and net ratings.
**What:** A prescriptive engine that analyzes season-wide unit data to suggest the statistically most effective starting lineup and rotation patterns.
**Acceptance Criteria:**
- [ ] "Rotation Optimizer" tool in the Team Dashboard.
- [ ] Ranking of 5-man units by Net Rating, adjusted for sample size and opponent strength.
- [ ] Suggested "Closer Unit" based on Clutch performance data.
- [ ] Visualization of "Chemistry Gaps" (efficient players who rarely play together).
