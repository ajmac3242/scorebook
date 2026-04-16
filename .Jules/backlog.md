## Swap out component library
**Priority:** HIGH
**Type:** UX
**Why:** Material Design 3 is too heavy and not the look I am going for.
**What:** Swap out Material 3 components and moleskine references for a more modern design with HeroUI component library. Only use the open source version of HeroUI
**Acceptance Criteria:**
- [ ] Swap out all Material3 components for Hero. (Vertical Slice Complete: Navigation, SharedUI, and GameStats migrated)
- [x] Remove references to Moleskine. (SharedUI components renamed to AppCard)

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

## Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [ ] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [ ] "Load Roster" option in Create Game workflow for selected opponents.
- [ ] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## Verified Period Workflow
**Priority:** MEDIUM
**Type:** UX
**Why:** Official scores and fouls often drift from the app during high-intensity games. A scheduled reconciliation ensures data integrity before moving to the next phase of the game.
**What:** At the end of every period, show a mandatory "Verify Stats" dialog. The scorekeeper must confirm the score and team fouls against the official table before the period is marked "Verified."
**Acceptance Criteria:**
- [ ] Automated dialog trigger when the clock hits 0:00 or "Next Period" is clicked.
- [ ] Display summarized period stats (Score, Fouls) with input fields for "Correction" if they differ from the app.
- [ ] Generate a `SYSTEM_CORRECTION` event to balance totals if manual overrides are entered.

## Advanced Fatigue & Rotation Alerts
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Managing player fatigue is critical for performance and injury prevention. Proactive alerts help coaches stick to their rotation plan during the intensity of a live game.
**What:** Implement configurable fatigue thresholds. Provide visual cues and alerts when players exceed their target stint lengths or total game minutes.
**Acceptance Criteria:**
- [ ] Input fields in Player/Team details for "Max Stint Duration" and "Game Minute Limit."
- [ ] Visual pulse or color change in the Game Mode "Live Lineup" for players over their limit.
- [ ] Fatigue indicators in the Quick Substitution dialog to help identify rested bench players.
- [ ] Real-time stint timer logic that accounts for clock pauses.

## Automated PDF Box Score & Game Summary Export
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [ ] "Export PDF" button on Game Stats page.
- [ ] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [ ] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [ ] Inclusion of the Scoring Flow visualization in the PDF.

## Free Throw Sequence Workflow
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [ ] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [ ] One-tap recording for each attempt in the sequence.
- [ ] Automatically attributes points and attempts to the selected player.
- [ ] Closes automatically after the designated number of attempts are recorded.

## Season-Wide Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game shot charts are useful, but season-long patterns reveal a player's true "hot zones" and offensive tendencies.
**What:** Create a "Season Analytics" view that aggregates all shot data for a team or player across multiple games into a single heatmap.
**Acceptance Criteria:**
- [ ] New "Season Stats" tab in the Team Detail page.
- [ ] High-density heatmap showing shot frequency and efficiency (eFG%) by zone.
- [ ] Ability to filter the heatmap by specific player or specific offensive "Play".

## Defensive Momentum & "Run" Tracker
**Priority:** MEDIUM
**Type:** UX
**Why:** Coaches often struggle to feel the exact "momentum" of a game under pressure. Visualizing scoring runs helps in deciding when to call a timeout or change defensive schemes.
**What:** Implement a "Momentum Bar" or "Run Tracker" in the Game Mode scoreboard that highlights consecutive scores or stops (e.g., "8-0 Run" or "3 Consecutive Stops").
**Acceptance Criteria:**
- [ ] Real-time "Run" indicator in the Scoreboard (e.g., "Lakers: 10-2 Run").
- [ ] Visual alert when a team achieves a "Kill" (3 consecutive stops).
- [ ] Historical "Run" list in the Game Summary to review game-changing stretches.

## Pre-Game Rotation Planner
**Priority:** LOW
**Type:** Feature
**Why:** Elite coaches go into a game with a plan for minutes and substitutions. Comparing the "Plan" vs "Actual" helps improve coaching discipline and player management.
**What:** A tool within Team Settings to define a target rotation (minutes per player) and then visualize the "Minutes Variance" in post-game stats.
**Acceptance Criteria:**
- [ ] "Rotation Plan" interface in Team Details to set target MPG for each player.
- [ ] "Minutes Variance" column in Game Stats/Season Stats comparing planned vs. actual minutes.
- [ ] Warning in Game Mode if a player is significantly over their planned minute allocation.
