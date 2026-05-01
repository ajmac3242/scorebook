# Scorebook Backlog

## Maintenance Note
Completed items are archived to `.Jules/backlog-archive.md` to maintain optimal performance for agent context. Active `backlog.md` should aim for a soft cap of ~200 lines.

## Voice-Driven Live Scorekeeping
**Priority:** HIGH
**Type:** Feature
**Why:** Solo scorekeepers struggle to keep up with high-intensity transition play. Voice commands eliminate "tap lag" and allow the user to keep their eyes on the floor.
**What:** Implement a Web Speech API layer in GameMode to record events via voice.
**Acceptance Criteria:**
- [ ] "Voice Mode" toggle in GameMode header with microphone permission handling.
- [ ] Support for standard grammar: "[Jersey] [Action]" (e.g., "Five make two", "Ten assist").
- [ ] Support for opponent actions: "Opponent twelve miss".
- [ ] Chained commands: "Twenty-four make three assist five".
- [ ] Visual HUD feedback showing "Last Heard: #24 Make 3PT".
- [ ] High-confidence threshold filtering to prevent background noise errors.

## Special Situation (ATO/SLOB/BLOB) Analytical Engine
**Priority:** HIGH
**Type:** Feature
**Why:** Designing the perfect play is useless if you don't know if it works. This engine moves beyond raw stats to show efficiency in high-leverage set plays.
**What:** Build a dedicated analytics module and UI to visualize PPP and eFG% for possessions tagged as ATO, SLOB, BLOB, or EOP.
**Acceptance Criteria:**
- [ ] Add `calculateSituationalStats` to the stats engine to derive PPP/eFG% filtered by situation.
- [ ] New "Specialty Execution" card in GameStats showing a performance table by situation.
- [ ] "Execution Delta" metric comparing Situational PPP vs. standard Half-Court PPP.
- [ ] Visualization of "Success Rate" (Possessions ending in score or shooting foul) per situation.

## Defensive Breakdown Attribution (The Accountability Layer)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *why* a bucket was allowed to fix it in practice. This layer separates physical skill makes from tactical mental errors.
**What:** Enhance opponent scoring events with a mandatory (optional toggle) breakdown reason and provide a post-game integrity report.
**Acceptance Criteria:**
- [ ] Quick-select "Breakdown Reason" overlay after recording an opponent make: "Missed Rotation", "Transition Leak", "Poor Closeout", "Out-Hustled", "Great Contest".
- [ ] "Defensive Integrity" report in GameStats summarizing % of points allowed by breakdown category.
- [ ] "Tactical Weak Link" identification: Highlight the most frequent breakdown type in the current game.
- [ ] Filter opponent shot chart markers by breakdown type.

## Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** A cold shooting night shouldn't result in a tactical pivot if the "Process" is correct. xPTS moves the conversation from results to quality.
**What:** A model that assigns Expected Points (xPTS) to every shot based on location and the "Shot Quality" (Open/Contested) tag.
**Acceptance Criteria:**
- [ ] Implement a lookup table for xPTS based on zone averages and shot quality weights.
- [ ] "Shot ROI" metric in GameStats: (Total Points / Total xPTS) - 1.0.
- [ ] "Quality Control" HUD in GameMode showing average xPTS per possession for the current lineup.
- [ ] Post-game "Process Report" highlighting high xPTS shots that missed vs. low xPTS shots that went in.

## Executive Halftime Talking Points Generator
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is only 10 minutes. Coaches need automated synthesis of complex data into 3 punchy, actionable directives for the locker room.
**What:** An automated NLP-style engine that analyzes game aggregates vs. season averages to generate 3 executive-level bullet points.
**Acceptance Criteria:**
- [ ] "Talking Points" tab in the Halftime Report Dialog.
- [ ] Bullet 1 (Offensive): Efficiency insight (e.g., "eFG% is 12% below average; stop settling for long 2s").
- [ ] Bullet 2 (Defensive): Personnel threat (e.g., "Opponent #24 is 4/4 on drives; force him left").
- [ ] Bullet 3 (Personnel): Lineup suggestion (e.g., "Lineup [5,10,12] is +8; keep them together").
- [ ] "Copy for Assistant" button to send talking points via clipboard.

## [HYGIENE] Modularize Statistics Engine (stats.ts / core.ts)
**Priority:** HIGH
**Type:** Refactor
**Why:** The statistics engine is tightly coupled and exceeds 3500 lines, making it difficult to maintain and test. Modularization is required to keep Jules performant.
**What:** Surgically extract logical blocks into dedicated modules within `src/utils/stats/`.
**Acceptance Criteria:**
- [ ] Extract Base Aggregators & Action Appliers (move `applyActionToAggregate`, `initializeStatsMap` to `aggregators.ts`)
- [ ] Extract Lineup & Stint Logic (move `calculateLineupStats`, `calculatePlayerStintTimeline` to `lineups.ts`)
- [ ] Extract Impact & Streak Metrics (move `calculateOnOffStats`, `calculatePlayerStreaks` to `impact.ts`)
- [ ] Extract Advanced Analytics (move `calculateClutchPlaybookRanking`, `calculateOfficiatingStats`, `calculatePaceAnalytics` to `analytics.ts`)
- [ ] Standardize Types across all stats modules in `types.ts`.
- [ ] Ensure all 100+ tests pass using `bash scripts/jules-test.sh`.

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

## Player Assist Network & Offensive Chemistry Map
**Priority:** MEDIUM
**Type:** Feature
**Why:** Understanding who makes whom better is the key to elite playcalling.
**What:** Create a visual "Assist Network" diagram.

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

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Elite programs use multiple sets of eyes.
**What:** A multi-device websocket or real-time sync layer.

## Ref-Identity Conflict Alert System
**Priority:** LOW
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out.
**What:** A predictive engine that compares live Officiating FPM against the Team's active defensive scheme.

## Situational Opponent "Go-To" Playmaker Analysis
**Priority:** MEDIUM
**Type:** Feature
**Why:** In winning time, every team has a "Go-To" player.
**What:** An analytical tool that identifies opponent usage rates in clutch situations.

## Longitudinal Official/Referee Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Officiating is the "Third Team" on the court.
**What:** Implement a season-wide database of officiating stats.

## Bench Momentum & "Spark Plug" Impact Tracking
**Priority:** MEDIUM
**Type:** Feature
**Why:** Some players provide value that doesn't show up in a box score but is felt in momentum shifts.
**What:** Create a "Momentum Impact" metric.

## Program-Wide Optimal Rotation Optimizer
**Priority:** MEDIUM
**Type:** Feature
**Why:** Managing a roster across a long season requires identifying which units are mathematically most effective.
**What:** A prescriptive engine that analyzes season-wide unit data.
