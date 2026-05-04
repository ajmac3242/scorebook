# Scorebook Backlog

## Maintenance Note
Completed items are archived to `.Jules/backlog-archive.md` to maintain optimal performance for agent context. Active `backlog.md` should aim for a soft cap of ~200 lines.

## Dexie Test Harness Mocking for Fast Vitest Runs
**Priority:** HIGH **Type:** Test Infrastructure **Why:** Vitest runtime is being inflated by heavy `waitFor` polling against real async Dexie/IndexedDB behavior and MUI re-renders in jsdom. Fully mocking Dexie at the test boundary will make async assertions resolve immediately and reduce suite cancellation risk. **What:** Introduce a global Vitest test setup that mocks the app’s Dexie-backed database layer so component and hook tests do not hit real IndexedDB stubs.

**Acceptance Criteria:**

* [ ] Add a shared Vitest setup file for frontend tests.
* [ ] Mock the app’s Dexie/database module at the import boundary used by components and hooks.
* [ ] Ensure common table methods (`toArray`, `get`, `put`, `add`, `update`, `delete`, `bulkPut`, query-chain helpers) resolve immediately in tests.
* [ ] Replace test reliance on real IndexedDB behavior so `waitFor` completes without 50ms polling against Dexie async state.
* [ ] Keep mock behavior override-friendly per test file for custom scenarios.
* [ ] Verify frontend test runtime improves and affected test files pass consistently in CI.


## [HYGIENE] Refactor: Split useGameMode.ts into focused domain hooks
**Priority:** HIGH **Type:** Refactor **Why:** `useGameMode.ts` is the central coordinator for all live game state and currently carries too many unrelated responsibilities under one return surface, making it difficult to unit test, extend, or hand off to an agent without full-file context. **What:** Decompose the hook into focused domain hooks that are composed back into a thin `useGameMode` coordinator.

**Acceptance Criteria:**

* [ ] Extract `useGameClock` — clock tick, pause/resume, period transitions.
* [ ] Extract `useLineupState` — on-court player tracking, substitution draft state.
* [ ] Extract `useStatWriter` — all DB write helpers + `syncService.pushUpdates()` calls, consolidated into a single `writeStat()` utility.
* [ ] Extract `usePossessionTracker` — possession arrow, live PPP derivation.
* [ ] `useGameMode.ts` becomes a thin coordinator (~100 lines) that composes the above hooks.
* [ ] All existing tests pass; new unit tests added for each extracted hook.
* [ ] No regression to GameMode.tsx rendering or live game behavior.

---

## [HYGIENE] Refactor: Extract data layer and types out of db.ts
**Priority:** HIGH **Type:** Refactor **Why:** `db.ts` currently mixes domain interfaces, schema/version history, Dexie table setup, and a singleton DB instance in one runtime file. This creates tight coupling between types and persistence that makes it impossible to import types without pulling in Dexie as a side effect. **What:** Split into dedicated modules with clean import boundaries.

**Acceptance Criteria:**

* [ ] Extract all domain interfaces/types into `src/types/` (e.g., `game.ts`, `player.ts`, `stat.ts`).
* [ ] Extract Dexie schema and version history into `src/db/schema.ts`.
* [ ] `db.ts` becomes a thin singleton setup file that imports from the above.
* [ ] All existing imports updated throughout the codebase — no broken references.
* [ ] Types can be imported without triggering Dexie initialization as a side effect.
* [ ] All tests pass after the restructure.

---

## [HYGIENE] Refactor: Break GameStats.tsx into data hook + display components
**Priority:** HIGH **Type:** Refactor **Why:** `GameStats.tsx` combines page rendering, business action handlers, sorting logic, and export functionality in a single file. This makes it hard to test individual concerns and will become a maintenance bottleneck as new stat categories and export formats are added. **What:** Separate data/action concerns from display.

**Acceptance Criteria:**

* [ ] Extract `useGameStats` hook — all `useLiveQuery` calls, derived stat aggregations, sort state, and export handlers.
* [ ] Extract `PlayerStatRow.tsx` — individual player row rendering.
* [ ] Extract `StatExportMenu.tsx` — export format selection and trigger logic.
* [ ] `GameStats.tsx` becomes a layout-only page component (~100 lines) that wires hook → components.
* [ ] Export functionality (CSV/PDF) remains fully operational after refactor.
* [ ] All tests pass; add tests for `useGameStats` derivations.

---

## [HYGIENE] Frontend Structure Cleanup (Grouped Small Refactors)
**Priority:** HIGH **Type:** Refactor **Why:** Several files have outgrown their original scope or contain obvious extraction seams. These are bundled as lower-risk, mechanical refactors that can be tackled incrementally. **What:** Clean up 5 files with clear, contained seams.

**Scope:**

### App.tsx
* [ ] Extract `ProtectedRoute` into `src/components/ProtectedRoute.tsx`.
* [ ] Extract route declarations into `src/router/routes.tsx`.
* [ ] `App.tsx` becomes provider wiring + layout shell only.

### SharedUI.tsx
* [ ] Move each exported component (`MoleskineCard`, `PageHeader`, `StatItem`, `StatCard`, `AnimatedNumber`) into its own file under `src/components/ui/`.
* [ ] Update all import sites.

### Scoreboard.tsx
* [ ] Convert internal `renderTeamSection` function into a typed `TeamPanel.tsx` sub-component.
* [ ] Add props interface for `TeamPanel`.

### OpponentScoutingReport.tsx
* [ ] Extract chained `useLiveQuery` calls and sorted stat derivations into `useOpponentScouting` hook.
* [ ] Page component becomes layout + wiring only.

### Dashboard.tsx
* [ ] Extract inline queries and derived stats into `useDashboardData` hook.
* [ ] Page component becomes layout + wiring only.

**Acceptance Criteria:**
* [ ] All 5 files refactored per scope above.
* [ ] No change to rendered UI or user-facing behavior.
* [ ] All existing tests pass.

---


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

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Tracking a high-intensity game is too much for one person. A bridge allowing one person to track shots/lineups and another to track defensive "hustle" stats (deflections, floor dives) ensures 100% data accuracy.
**What:** Implement a real-time WebSocket or pub/sub layer (e.g., via AWS AppSync or similar) that allows multiple users to contribute to the same `gameId` simultaneously with conflict resolution.
**Acceptance Criteria:**
- [ ] Real-time sync of `StatEvent` records across multiple devices.
- [ ] Visual indicator of "connected assistants" in the GameMode header.
- [ ] Optimistic UI updates with "Syncing..." and "Synced" states for every contributed event.
- [ ] Mechanism to handle duplicate events from different devices (last-write-wins or prompt).

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

## [ ] Live Game Identity Radar Chart
**Priority:** HIGH
**Type:** UX
**Why:** Teams often lose their "Identity" (e.g., "We are a fast-break team") during high-pressure games. A radar chart comparing live performance against the "Team Blueprint" keeps the team focused.
**What:** A real-time Radar Chart in GameMode that compares current game Four Factors and Pace against the team's season-long averages (the "Blueprint").
**Acceptance Criteria:**
- [ ] Interactive Radar Chart in the GameMode sidebar.
- [ ] Overlay of "Current Game" (Solid) vs "Season Average" (Dashed) for: Pace, eFG%, TO%, ORB%, and FT Rate.
- [ ] "Identity Alert" when a core metric deviates by more than 20% from the blueprint.

## [ ] Defensive Synergy Analysis (2-3 Player Units)
**Priority:** HIGH
**Type:** Feature
**Why:** Some defensive pairings are greater than the sum of their parts. Coaches need to know which duos/trios anchor the defense most effectively, beyond just 5-man units which can have small sample sizes.
**What:** Build a "Defensive Synergy" report that calculates Opponent PPP and Forced Turnover % for every 2-player and 3-player combination that has played significant minutes together.
**Acceptance Criteria:**
- [ ] New "Synergy" tab in Team Analytics.
- [ ] Table showing 2-player and 3-player units with Defensive Rating (DRtg) and Net Rating.
- [ ] Filter to show only units with > 10 minutes played.
- [ ] Highlight "Shut-Down Units" (units with DRtg significantly better than team average).

## [ ] Halftime "War Room" Tactical Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** The 10 minutes of halftime are frantic. A "Tactical Advisor" that delivers 3-5 punchy, data-driven bullet points allows the coach to walk into the locker room with immediate answers.
**What:** An automated insight engine in the Halftime Report that identifies the most impactful trends (e.g., "Lineup X is -12", "Opponent #24 scoring 1.8 PPP on drives").
**Acceptance Criteria:**
- [ ] "Coach's Notes" section in the Halftime Report Dialog.
- [ ] Automated bullets for: Most effective/ineffective 5-man unit.
- [ ] Automated bullets for: Top 3 opponent threats with "Points Allowed" attribution.
- [ ] Automated bullets for: Primary "Four Factor" deficit (e.g., "We are losing the ORB battle 12% to 35%").

## [ ] On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Acceptance Criteria:**
- [ ] New "Impact" tab in Player Stats or Team Analytics.
- [ ] Display "Team Net Rating (ON)" vs "Team Net Rating (OFF)" for each player.
- [ ] "Impact Differential" (The difference between ON and OFF metrics).
- [ ] Support for filtering by season or last X games to identify recent trends.

## [ ] Integrated Practice Prescription Engine
**Priority:** HIGH
**Type:** Feature
**Why:** The best coaches use game data to plan the next practice. This feature closes the loop by suggesting specific drills based on the team's statistical failures in the last game.
**What:** A logic engine that maps low KPI performance (e.g., low FT%, high TOs) to a library of suggested practice drills.
**Acceptance Criteria:**
- [ ] "Practice Planner" button on the Game Stats page.
- [ ] Automatic suggestion of 3 "Focus Areas" based on the game's worst-performing metrics.
- [ ] Linkage to a library of drills (e.g., "Poor 3PT% -> Suggest '100 Makes' Drill").

## [ ] Redesign Dashboard page
**Priority:** HIGH
**Type:** Feature
**Why:** The current Dashboard page does not offer any benefits.
**What:** Swap out the dashboard page for "My Team" page. My team will be determined by adding a star next to the individual team name on the team page. The team that has the star enabled will now represent the My Team page.
**Acceptance Criteria:**
- [ ] My Team page will show overall stats, heatmaps, and upcoming games for the team
- [ ] More data can be added to this page. The intent is to give coaches all the high-level information they need at a quick glance.

## [ ] Update Edit Team Details
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to be able to set default settings for a team
**What:** On the Edit Team Details dialog, we need to add a defaults section where we can add/update game defaults. These game defaults can be overwritten when setting up a game but these should be the default values.
**Acceptance Criteria:**
- [ ] All customizable basketball settings should be in this dialog. These settings should include period types, minutes for each period, number of timeouts allowed, and number of fouls allowed. As others are discovered, they should go here.

## [ ] Workflows for game creation
**Priority:** MEDIUM
**Type:** UX
**Why:** Creating a game contains to many things to enter at once. Introduce a workflow to help streamline the process.
**What:** Enhance the `Create Game` dialog to be a workflow similar to this example on Dribbble [https://dribbble.com/shots/26448955-Hotel-Booking-Mobile-App]. This is just an example and is not meant to be copied exactly. This example shows a workflow that A user can follow to create something. The first part of the workflow would be opponent information, the second part would be game date/time information, the last part would be game settings information (period type, fouls, time, etc.)
**Acceptance Criteria:**
- [ ] Transition `Create Game` dialog to a workflow.
- [ ] After all information is entered, there should be a create game button. Once the button is clicked, the game should be created.
- [ ] On the first two parts of the workflow, once the required information has been entered, show a `continue` button.
- [ ] Like the example, show the steps to the user and which ones have been completed

## [ ] Substitution Timeline Audit
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**What:** Build a "Timeline Audit" view that shows a vertical chronological list of all substitution events. Allow users to edit the time of a sub, change the players involved, or insert a missing sub event.
**Acceptance Criteria:**
- [ ] Accessible from the Game Stats or Game Mode page.
- [ ] Displays a chronological list of SUB_IN and SUB_OUT events.
- [ ] Allows editing the `clockTime` and `playerId` of any substitution event.
- [ ] Recalculates all dependent stats (MIN, +/-, Lineup Efficiency) immediately upon saving changes.

## [ ] Offensive Play/Set Success Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**What:** Introduce "Play Tagging" for offensive events. Allow coaches to define a playbook in Team Settings and tag MAKE/MISS events with specific play names during the game.
**Acceptance Criteria:**
- [ ] CRUD interface in Team Details to manage a "Playbook" (list of play names).
- [ ] Optional "Play" dropdown in the MAKE/MISS recording dialog in Game Mode.
- [ ] "Play Efficiency" table in Game Stats showing: Play Name, Frequency, Points, and EFG% for each set.
- [ ] Filter Shot Chart by specific Play Name.

## [ ] Live Defensive Momentum HUD (Stops & Kills)
**Priority:** HIGH
**Type:** UX
**Why:** Defensive intensity is driven by momentum. Visualizing "Stops" and "Kills" (3 consecutive stops) on the live scoreboard motivates the team and helps coaches identify defensive runs.
**What:** Integrate the `calculateStopsAndKills` logic into the `GameMode` scoreboard. Display a "Defensive Momentum Bar" or series of icons that light up as stops are earned, with a special visual for a "Kill."
**Acceptance Criteria:**
- [ ] Real-time "Stop" counter on the GameMode scoreboard.
- [ ] "Kill" indicator (e.g., three flame icons or a "3 STOPS" badge) that resets after 3.
- [ ] Total "Kills" count for the game displayed in the scoreboard sub-header.
- [ ] Pulse animation when a Stop is recorded.

## [ ] Real-Time Foul Trouble & Fatigue Rotation Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**What:** Implement visual and haptic/audio alerts in `GameMode` when a player reaches configured thresholds (e.g., 2 fouls in Q1, 4 fouls total, or 8 consecutive minutes).
**Acceptance Criteria:**
- [ ] "Foul Trouble" pulse on the player's lineup card (e.g., orange at limit-1, red at limit).
- [ ] "Fatigue Alert" visual (e.g., a "Needs Sub" icon) when a player's current stint exceeds the "Max Stint Duration" from Team Settings.
- [ ] Configuration in Team Details to set "Foul Warning Thresholds" by period.

## [ ] Live Lineup Impact (+/-) Dashboard Overlay
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *immediately* if a specific 5-man unit is being outscored, even if individual players look okay. Plus/Minus for the current lineup is the ultimate efficiency truth.
**What:** Add a "Live Lineup Impact" section to the `GameMode` page that displays the +/- for the currently active 5-man unit since they were subbed in.
**Acceptance Criteria:**
- [ ] Real-time display of the "Current Lineup +/-" (e.g., "+4 since last sub").
- [ ] Comparison metric showing points scored vs. points allowed for the active unit.
- [ ] "Stint Duration" timer for the current 5-man unit as a whole.

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

## [ ] Automated PDF Box Score & Game Summary Export
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [ ] "Export PDF" button on Game Stats page.
- [ ] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [ ] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [ ] Inclusion of the Scoring Flow visualization in the PDF.

## [ ] Free Throw Sequence Workflow
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [ ] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [ ] One-tap recording for each attempt in the sequence.
- [ ] Automatically attributes points and attempts to the selected player.
- [ ] Closes automatically after the designated number of attempts are recorded.

## [ ] Intelligent Linked Event Chaining
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**What:** Implement a "Chained Action" flow in the `GameMode` recording dialog. When a `MAKE` is saved, if an on-court teammate hasn't already been credited with an assist, immediately prompt "Who assisted?" with one-tap teammate buttons. Similarly, after a `MISS`, prompt for "Who rebounded?".
**Acceptance Criteria:**
- [ ] After clicking "Save" on a `MAKE` event, display a "Teammate Assist?" overlay if tracking "Our Team".
- [ ] After clicking "Save" on a `MISS` event, display "Offensive Reb?" and "Defensive Reb?" quick-tap options.
- [ ] If a teammate is tapped, record the second event (ASSIST or REBOUND) with the same `timestamp`, `period`, and `clockTime` as the shot.
- [ ] Option to "Skip" or "No Assist/Rebound" to close the chain.

## [ ] Scoring Run & Drought "Coaching Alerts"
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [ ] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [ ] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [ ] Alerts should include a "Suggest Timeout" visual cue.
- [ ] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

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

## [ ] Halftime Tactical Adjustment Summary
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches have only 10 minutes to make game-winning adjustments. They need a 1-page "War Room" summary of what's working and what's failing immediately after the first half buzzer.
**What:** Build a dedicated Halftime Report view that highlights the team's best/worst lineups, most successful plays, and opponent scoring trends from the first half.
**Acceptance Criteria:**
- [ ] Auto-trigger Halftime Report when the second period (or first half) ends.
- [ ] Top 3 "Positive Lineups" (+/-) and Bottom 3 "Negative Lineups".
- [ ] Comparison of PPP (Points Per Possession) between Half 1 and season average.
- [ ] List of "Opponent Streaks" - which opponent players are causing the most damage.

## [ ] Clutch-Time "Winning Time" Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Games are won or lost in the final 4 minutes. Stats often change under pressure; coaches need to know who their "closers" are based on performance in high-leverage situations.
**What:** Define "Clutch Time" (last 4 mins of game, score within 5 pts) and calculate specialized metrics for this window.
**Acceptance Criteria:**
- [ ] New "Clutch" filter on the Game Stats and Player Stats pages.
- [ ] Metric: Clutch eFG% and Clutch Assist-to-Turnover ratio.
- [ ] Lineup efficiency specifically during clutch situations across the season.
- [ ] "Points Per Clutch Possession" comparison against non-clutch time.

## [ ] Real-Time Opponent Threat Alerts
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [ ] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [ ] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [ ] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## [ ] Possession-Based Efficiency Metrics (PPP)
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**What:** Transition the internal stats engine to calculate total possessions and derive PPP for teams, lineups, and individual players.
**Acceptance Criteria:**
- [ ] Calculate "Possessions" for both teams (FGA + 0.44*FTA + TO - OREB).
- [ ] Display PPP on the GameMode sidebar and Game Stats dashboard.
- [ ] Defensive PPP (Points Allowed Per Possession) to measure defensive quality independently of pace.
- [ ] Trend line showing PPP fluctuation throughout the game.

## [x] Refactor & Right-Size Large Files to Improve Jules Performance
**Priority:** HIGH **Type:** Technical Debt
**Why:** Jules is exhibiting slowdowns and "file too large" issues because several core files have grown beyond effective context window limits.
**What:**
1. Split `index.ts` into per-resource handler modules. (COMPLETE: Router reduced to ~100 lines, helpers moved to `database.ts`)
2. Split `utils.ts` (339 lines) — separate `logging.ts`, `security.ts`, and `request.ts`.
3. Consolidate sentinel test files — merge `sentinel_enhancements.test.ts`, `sentinel_v3.test.ts`, etc. into `security.test.ts`. (COMPLETE: Redundant files deleted.)
4. Add a guardrail note to `playbook.md`: Jules should flag any file approaching 300 lines and propose a split before continuing.
**Acceptance Criteria:**
- [x] `index.ts` is under 150 lines (router only)
- [x] No source file in `backend/src/` exceeds 300 lines unless it logically makes sense.
- [x] Total test file count in `__tests__/` reduced by at least 4
- [x] All existing tests continue to pass
- [x] `playbook.md` updated with file size guardrail rule

## [ ] Holistic Matchup Efficiency Matrix
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to see the entire defensive landscape at once, not just isolated mismatches. A 5x5 Matrix reveals the most exploitable and vulnerable points of the current unit-on-unit battle.
**What:** Build a visual matrix component in GameMode that maps our 5 active players (Y-axis) against the 5 opponent players (X-axis) using color-coded efficiency (Stop %).
**Acceptance Criteria:**
- [ ] 5x5 "Efficiency Matrix" accessible via a sidebar toggle in GameMode.
- [ ] Color-coded cells: Green (High Stop %), Red (Low Stop %), Gray (Insufficient Data).
- [ ] One-tap reassignment by clicking a cell in the matrix.
- [ ] "Unit Optimization" score summarizing the total defensive parity of the current 5-man unit.

## [ ] "Locker Room" Post-Game Learning System
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
