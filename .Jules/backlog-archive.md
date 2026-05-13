# Scorebook Backlog Archive

## [Refactor] Split index.ts into per-resource handler modules
**Priority:** HIGH
**Type:** Technical Debt
**Why:** index.ts was becoming a monolith (800+ lines), hindering agent performance and maintainability.
**What:** Extracted domain logic into `players.ts`, `games.ts`, `teams.ts`, and `cleanup.ts`.
**Status:** [x] COMPLETE (2026-05-20)

## [x] Dexie Test Harness Mocking for Fast Vitest Runs
**Priority:** HIGH
**Type:** Test Infrastructure
**Why:** Vitest runtime is being inflated by heavy `waitFor` polling against real async Dexie/IndexedDB behavior.
**Status:** [x] COMPLETE

## [x] [HYGIENE] Refactor: Split useGameMode.ts into focused domain hooks
**Priority:** HIGH
**Type:** Refactor
**Why:** `useGameMode.ts` was the central coordinator carrying too many responsibilities.
**Status:** [x] COMPLETE

## [x] HALT (High-Leverage Alerting) System
**Priority:** HIGH
**Type:** Enhancement
**Why:** Critical game situations require immediate tactical shifts.
**Status:** [x] COMPLETE

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

## [x] Live Lineup Impact (+/-) Dashboard Overlay
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *immediately* if a specific 5-man unit is being outscored, even if individual players look okay. Plus/Minus for the current lineup is the ultimate efficiency truth.
**What:** Add a "Live Lineup Impact" section to the `GameMode` page that displays the +/- for the currently active 5-man unit since they were subbed in.
**Acceptance Criteria:**
- [x] Real-time display of the "Current Lineup +/-" (e.g., "+4 since last sub").
- [ ] Comparison metric showing points scored vs. points allowed for the active unit.
- [x] "Stint Duration" timer for the current 5-man unit as a whole.
## [x] Defensive Assignment & Matchup Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know who is responsible for opponent scoring. Raw team defensive stats don't tell you which individual player is failing to stop their man.
**What:** Add a "Matchup" layer to the live game tracking. Allow coaches to assign a "Primary Defender" to each active opponent. When an opponent scores, the points are automatically attributed as "Points Allowed" to their defender.
**Acceptance Criteria:**
- [x] UI in GameMode to "Drag and Drop" or tap to assign our players onto opponent players.
- [x] Update `StatEvent` to include `primaryDefenderId` for opponent scoring events.
- [ ] Calculate "Points Allowed" per player in `impact.ts`.
- [ ] "Defensive Stop %" per player: (Possessions as Primary Defender - Points Allowed Possessions) / Total Possessions.
- [ ] Summary in GameStats showing "Matchup Battle" table (Our Player vs Their Player).

## [x] On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Acceptance Criteria:**
- [x] New "Impact" tab in Player Stats and Team Analytics.
- [x] Implement `calculateOnOffStats` in `impact.ts` using stint durations and scores.
- [x] Display "Team Net Rating (ON)" vs "Team Net Rating (OFF)" for each player.
- [x] Calculate "Impact Differential" (Net Rating ON - Net Rating OFF).
- [ ] Support filtering by season or last X games.

## [x] Shot Clock Process Analysis
**Priority:** HIGH
**Type:** Feature
**Why:** Rushing shots early in the clock or settling for late-clock heaves is a "process" failure. This feature distinguishes between quick-hit offensive success and disciplined late-clock execution.
**What:** Automatically categorize every shot into "Early Clock" (first 25% of clock), "Mid Clock", and "Late Clock" (last 5 seconds) based on game clock and period length.
**Acceptance Criteria:**
- [x] Logic in `analytics.ts` to derive "Clock Phase" from `StatEvent.clockTime` and `periodLength`.
- [x] "Shot Rhythm" chart in GameStats showing volume and eFG% by clock phase.
- [ ] Visual alert in GameMode if team is shooting < 30% on "Early Clock" shots (suggesting poor shot selection).
- [ ] Trend line showing how shot selection (Clock Phase) shifts during the 4th quarter.

## [x] Executive Halftime Talking Points Generator
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is only 10 minutes. Coaches need automated synthesis of complex data into 3 punchy, actionable directives for the locker room.
**What:** An automated engine that analyzes game aggregates vs. season averages (or league benchmarks) to generate 3 executive-level bullet points.
**Acceptance Criteria:**
- [ ] "Talking Points" section in the Halftime Report Dialog.
- [ ] Generate 1 Offensive insight (e.g., "eFG% is low because 40% of shots are Contested; move the ball").
- [ ] Generate 1 Defensive insight (e.g., "Opponent #24 is 5/5 on drives; force him Left").
- [ ] Generate 1 Lineup insight (e.g., "Lineup [A,B,C,D,E] is +12; use them to start the 3rd").
- [ ] "Copy to Clipboard" button for quick sharing with assistants.

## [x] Integrated Practice Prescription Engine
**Priority:** HIGH
**Type:** Feature
**Why:** The best coaches use game data to plan the next practice. This feature closes the loop by suggesting specific drills based on the team statistical failures.
**What:** A logic engine that maps low KPI performance (e.g., low FT%, high TOs) to a library of suggested practice drills.
**Acceptance Criteria:**
- [ ] "Practice Planner" button on the Game Stats page.
- [ ] Identify 3 "Focus Areas" based on the game worst-performing metrics (metrics > 1 standard deviation below average).
- [ ] Mapping table: "Poor FT%" -> "Pressure Free Throws", "High TO%" -> "3-on-2 Transition Drill", etc.
- [ ] Generate a "Practice Summary PDF" with the suggested drills.

## [HYGIENE] Epic: Frontend Architectural Decoupling & Performance
**Priority:** HIGH
**Type:** Refactor
**Why:** Several core files and modules have outgrown their scope, leading to tight coupling, maintenance bottlenecks, and decreased agent performance.
**What:** Execute a multi-phase refactor to modularize data layers, extract domain hooks, and right-size large files.
**Acceptance Criteria:**
- [ ] Extract data layer/types from `db.ts` into `src/types/` and `src/db/schema.ts`.
- [ ] Break `GameStats.tsx` into `useGameStats` hook and focused sub-components.
- [ ] Modularize Statistics Engine: Extract logic into `aggregators.ts`, `lineups.ts`, `impact.ts`, `analytics.ts`.
- [ ] Decouple `App.tsx` by extracting `ProtectedRoute` and route declarations.
- [ ] Split `utils.ts` into `security-utils.ts` and `data-utils.ts`.
- [ ] Ensure all backend projections in `games.ts` align with frontend metadata needs (e.g., `isBookmarked`).
- [ ] Ensure no source file exceeds ~300 lines unless logically unavoidable.

## [x] Real-Time "Pace & Pressure" Analytics HUD
**Priority:** HIGH
**Type:** UX
**Why:** Losing control of the game's tempo is a primary cause of blown leads. Real-time monitoring of Pace (Possessions per 40m) and Shot-Clock Pressure ensures the team sticks to the "Winning Blueprint."
**What:** Integrate live tempo tracking into the GameMode sidebar, comparing current pace against the target "Identity" pace.
**Acceptance Criteria:**
- [ ] "Pace Meter" showing live possessions-per-40m calculation.
- [ ] Visual indicator of "Tempo Delta" (Difference between our target pace and current game pace).
- [ ] "Pace Shift" notification when the game tempo changes by more than 15% in a single period.

## [x] [Defensive "Kill" & Momentum Tracker]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** A "Kill" (3 consecutive defensive stops) is the gold standard for defensive momentum. Visualizing this in real-time motivates the unit and triggers timeout decisions.
**What:** Add a live "Kill Streak" counter and visual pulse in the GameMode scoreboard that tracks consecutive defensive stops.
**Acceptance Criteria:**
- [x] Real-time "Stop Streak" counter in the GameMode header.
- [x] Visual animation/notification when a "Kill" (3 stops) is achieved.
- [x] "Kill Count" added to the Team Stats card.
- [x] Historical "Kill Log" in the game timeline.

## [x] [Archetype-Based Matchup Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Coaches shouldn't just know who is scoring, but *how* to stop them. Linking defender Stop % to opponent "Play Types" (PnR, ISO, etc.) identifies the optimal personnel counter.
**What:** Enhance the Matchup Matrix to suggest the best defender for a specific opponent player based on their performance against that player's most frequent Play Type.
**Acceptance Criteria:**
- [x] "Recommended Matchup" badge in the Matchup Matrix.
- [x] Correlation of Defender X's Stop % specifically against "PnR Handler" or "ISO" actions.
- [x] Alert when a "Mismatched Archetype" occurs (e.g., a slow defender on a high-transition scorer).

## [x] ["Winning Time" (Clutch) Performance HUD]
**Priority:** HIGH
**Type:** UX / Feature
**Why:** The final 4 minutes of a close game require different tactical data (Usage Rate, Clutch eFG%). This HUD removes the "noise" and focuses only on high-pressure performance.
**What:** Automatically trigger a "Clutch Mode" UI state when the game clock is < 4:00 and the spread is < 5 points.
**Acceptance Criteria:**
- [x] High-contrast "Winning Time" visual state for the GameMode sidebar.
- [x] Highlight "Clutch usage" leaders for both teams (who wants the ball?).
- [x] Show "Free Throw Reliability" for the 5 players currently on the floor.
- [x] Proactive timeout/foul strategy alerts based on the "Winning Time" context.

## [x] [DESIGN-001-A: Design Tokens — Token Interface & Electric Orange Values]
**Priority:** CRITICAL
**Type:** Design System
**Why:** All CourtSight UI stories depend on a single source of truth for color. Without this file every component uses hardcoded hex values that cannot be swapped for theming. This is the hard blocker for all other DESIGN stories.
**What:** Create `src/theme/tokens.ts`. Define the `ThemeTokens` interface and export the default `electricOrangeTokens` object.
**Scope:** `src/theme/tokens.ts` (new file only — do not touch any other file)
**Acceptance Criteria:**
- [x] `ThemeTokens` interface exported with fields: `primary`, `primaryDark`, `primaryContainer`, `onPrimary`, `onPrimaryContainer`, `background`, `surface`, `surfaceVariant`, `elevatedCard`, `outline`, `textPrimary`, `textSecondary`, `success`, `warning`, `error`, `info`
- [x] `electricOrangeTokens` object exported implementing `ThemeTokens`: primary `#FF6B1A`, primaryDark `#D9550D`, primaryContainer `#3A2418`, onPrimary `#1A0F09`, onPrimaryContainer `#FFD9C7`, background `#0F1115`, surface `#151922`, surfaceVariant `#1C2230`, elevatedCard `#222A3A`, outline `#384256`, textPrimary `#F3F6FA`, textSecondary `#AAB4C5`, success `#35C759`, warning `#FFB020`, error `#FF5D73`, info `#5AA9FF`
- [x] File compiles with no TypeScript errors
- [x] No other files are modified

## [x] [DESIGN-001-B: Design Tokens — MUI Theme Builder Function]
**Priority:** CRITICAL
**Type:** Design System
**Why:** Token values from DESIGN-001-A need to be translated into a MUI `Theme` object. The builder must accept any `ThemeTokens` object so runtime theme switching (DESIGN-011) works without additional changes.
**What:** Create `src/theme/buildTheme.ts`. Export a `buildCourtSightTheme(tokens: ThemeTokens): Theme` function.
**Scope:** `src/theme/buildTheme.ts` (new file only — do not touch any other file)
**Depends on:** DESIGN-001-A
**Acceptance Criteria:**
- [x] `buildCourtSightTheme` accepts a `ThemeTokens` argument
- [x] MUI palette mapped: `primary.main` → `tokens.primary`, `primary.dark` → `tokens.primaryDark`, `primary.contrastText` → `tokens.onPrimary`, `background.default` → `tokens.background`, `background.paper` → `tokens.surface`, `text.primary` → `tokens.textPrimary`, `text.secondary` → `tokens.textSecondary`, `divider` → `tokens.outline`, `success.main` → `tokens.success`, `warning.main` → `tokens.warning`, `error.main` → `tokens.error`, `info.main` → `tokens.info`
- [x] `mode` set to `dark`
- [x] No other files are modified

## [x] [DESIGN-001-C: Design Tokens — Wire Theme into App]
**Priority:** CRITICAL
**Type:** Design System
**Why:** The theme builder is useless until applied to the running app. This story wires `electricOrangeTokens` through `buildCourtSightTheme` into MUI's `ThemeProvider` so the new palette is live immediately.
**What:** Update `App.tsx` to apply the CourtSight theme. Update `index.html` meta tags.
**Scope:** `src/App.tsx`, `index.html` only — do not touch any page or component files
**Depends on:** DESIGN-001-B
**Acceptance Criteria:**
- [x] `App.tsx` imports `buildCourtSightTheme` and `electricOrangeTokens`
- [x] `ThemeProvider` wraps the app with `buildCourtSightTheme(electricOrangeTokens)`
- [x] `CssBaseline` included inside `ThemeProvider`
- [x] `index.html` `<title>` updated to `CourtSight`
- [x] `index.html` `theme-color` meta set to `#FF6B1A`
- [x] App still loads and runs without errors
- [x] No page or feature component files are modified

## [x] [DESIGN-011-A: Theme Editor — Preset Token Files]
**Priority:** HIGH
**Type:** Feature
**Why:** Before the theme switching UI can be built, all preset token objects need to exist as data. This story creates the 8 preset token files so DESIGN-011-B can import them without any business logic changes.
**What:** Create `src/theme/presets/` directory with one file per preset, each exporting a `ThemeTokens` object.
**Scope:** `src/theme/presets/` directory (new files only) — do not touch App.tsx, ThemeContext, or any component
**Depends on:** DESIGN-001-A
**Acceptance Criteria:**
- [x] 8 preset files created: `electricOrange.ts`, `midnightNavy.ts`, `championshipGold.ts`, `emeraldCourt.ts`, `electricViolet.ts`, `crimsonBlaze.ts`, `arcticWhite.ts`, `stealth.ts`
- [x] Each file exports a named `ThemeTokens` object, a `label` string, and a `previewColor` hex string
- [x] Token values per preset:
  - **Electric Orange** (default): primary `#FF6B1A`, background `#0F1115`, surface `#151922`
  - **Midnight Navy**: primary `#3B82F6`, background `#0A0F1E`, surface `#111827`
  - **Championship Gold**: primary `#F5B800`, background `#0F0E09`, surface `#1A1810`
  - **Emerald Court**: primary `#10B981`, background `#091510`, surface `#0F1F18`
  - **Electric Violet**: primary `#8B5CF6`, background `#0D0A1E`, surface `#13102A`
  - **Crimson Blaze**: primary `#EF4444`, background `#150A0A`, surface `#1F1010`
  - **Arctic White** (light mode): primary `#FF6B1A`, background `#F8F9FA`, surface `#FFFFFF`, textPrimary `#0F1115`, textSecondary `#6B7280`, mode override `light`
  - **Stealth**: primary `#9CA3AF`, background `#000000`, surface `#0A0A0A`
- [x] All files compile with no TypeScript errors
- [x] No other files are modified

## [x] [HALT: Proactive Tactical Intervention System]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss critical tactical risks (foul trouble, fatigue, mismatch exploitation) in the heat of a game. A persistent "Heads-Up" alert system transforms raw data into immediate coaching directives.
**What:** Elevate the existing "HALT" logic from a passive scoreboard overlay to a proactive side-rail HUD in GameMode that provides specific "Actions" (e.g., "Sub #5 - High Foul Risk").
**Acceptance Criteria:**
- [x] Dedicated "Tactical Alerts" panel in the GameMode sidebar.
- [x] Color-coded severity (Warning: Yellow, Critical: Red).
- [x] Direct action buttons within alerts (e.g., "Open Sub Dialog" for a fatigue alert).
- [x] Integration of Ref-Identity conflict alerts ("Dial back pressure").

## [x] [Tactical Identity HUD (KPI Adherence)]
**Priority:** HIGH
**Type:** Feature
**Why:** Every coach enters a game with a specific "Identity" (e.g., "We attack the paint"). A live HUD tracking these specific goals ensures the team doesn't drift into inefficient play.
**What:** A customizable header widget in GameMode that tracks 3 user-selected Tactical KPIs (e.g., Paint Touches, Early Clock eFG%, Turnover Rate).
**Acceptance Criteria:**
- [x] KPI selector in Game Setup (e.g., Choose 3 from a list of 10).
- [x] Real-time progress bars/counters in the GameMode header.
- [x] Visual pulse/alert when a goal is met or a limit is exceeded.
- [x] Post-game "Identity Scorecard" summarizing KPI performance.

## [x] [Verified Period Workflow (Reconciliation)]
**Priority:** HIGH
**Type:** UX / Data Integrity
**Why:** Official scores and fouls often drift from the app. A forced reconciliation at every period break ensures the analytics engine remains a "Source of Truth."
**What:** A mandatory modal at the end of each period that requires the scorekeeper to verify Score and Team Fouls against the official table.
**Acceptance Criteria:**
- [x] Trigger modal immediately when clock hits 0:00 or "Next Period" is clicked.
- [x] Side-by-side comparison of "App Totals" vs "Official Totals."
- [x] "Balance" feature: Automatically insert a `SYSTEM_ADJUSTMENT` event to fix discrepancies.
- [x] Period stats are locked (read-only) once verified.

## [x] [Defensive Breakdown Attribution (The Accountability Layer)]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *why* a bucket was allowed to fix it in practice. This layer separates physical skill makes from tactical mental errors.
**What:** Enhance opponent scoring events with a mandatory (optional toggle) breakdown reason and provide a post-game integrity report.
**Acceptance Criteria:**
- [x] Quick-select "Breakdown Reason" overlay after recording an opponent make: "Missed Rotation", "Transition Leak", "Poor Closeout", "Out-Hustled", "Great Contest".
- [x] "Defensive Integrity" report in GameStats summarizing % of points allowed by breakdown category.
- [x] "Tactical Weak Link" identification: Highlight the most frequent breakdown type in the current game.
- [x] Filter opponent shot chart markers by breakdown type.

## [x] [Special Situation (ATO/SLOB/BLOB) Analytical Engine]
**Priority:** HIGH
**Type:** Feature
**Why:** Designing the perfect play is useless if you don't know if it works. This engine moves beyond raw stats to show efficiency in high-leverage set plays.
**What:** Build a dedicated analytics module and UI to visualize PPP and eFG% for possessions tagged as ATO, SLOB, BLOB, or EOP.
**Acceptance Criteria:**
- [x] Add `calculateSituationalStats` to the stats engine to derive PPP/eFG% filtered by situation.
- [x] New "Specialty Execution" card in GameStats showing a performance table by situation.
- [x] "Execution Delta" metric comparing Situational PPP vs. standard Half-Court PPP.
- [x] Visualization of "Success Rate" (Possessions ending in score or shooting foul) per situation.

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
- [x] "Unit Optimization" score summarizing the total defensive parity of the current 5-man unit.

## [x] [Spark Plug Momentum Index]
**Priority:** HIGH
**Type:** Feature
**Why:** Some players provide value that doesn't show up in the box score but triggers team-wide energy shifts (e.g., a floor dive or a charge taken).
**What:** A specialized metric that weighs "Blue Collar" hustle stats against immediate subsequent team scoring runs to identify "Momentum Starters."
**Acceptance Criteria:**
- [x] "Spark Plug" score for every player who records a FLOOR_DIVE, CHARGE_TAKEN, or GREAT_CONTEST.
- [x] Correlation of hustle events to 2-minute scoring runs.
- [x] "Energy Alert" in GameMode suggesting when to bring in a high-momentum player.

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

## [x] Lineup "Offensive Chemistry" Connectivity Map
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding who makes whom better is the key to elite playcalling. Connectivity maps show which duos create the most efficient shots.
**What:** Create a visual "Assist Network" diagram for the active 5-man unit.
**Acceptance Criteria:**
- [x] Visual graph in GameStats showing assist/pass connectivity between players.
- [x] Weighting of connections by eFG% (e.g., "Player A to Player B results in 65% eFG%").
- [x] Identification of "Primary Playmaker" and "Primary Finisher" nodes for the current lineup.

## [x] Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** A cold shooting night shouldn't result in a tactical pivot if the "Process" is correct. xPTS moves the conversation from results to quality.
**What:** A model that assigns Expected Points (xPTS) to every shot based on location and the "Shot Quality" (Open/Contested) tag.
**Acceptance Criteria:**
- [x] Implement a lookup table for xPTS based on zone averages and shot quality weights.
- [x] "Shot ROI" metric in GameStats: (Total Points / Total xPTS) - 1.0.
- [x] "Quality Control" HUD in GameMode showing average xPTS per possession for the current lineup.
- [x] Post-game "Process Report" highlighting high xPTS shots that missed vs. low xPTS shots that went in.

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

## [x] [Paint Touches & Rim Pressure Analytics]
**Priority:** HIGH
**Type:** Feature
**Why:** Shooting selection is only half the battle. Coaches need to know if their offense is "settling" or actively attacking the heart of the defense.
**What:** Implement a "Paint Touch" event type and a live counter in the GameMode. Correlate Paint Touches with subsequent eFG% to prove the value of rim pressure.
**Acceptance Criteria:**
- [x] New "Paint Touch" quick-action button in GameMode.
- [x] Live HUD indicator showing "Paint Touches" for the current period.
- [x] Analytics bridge: "Points Per Paint Touch" (PPPT) metric in GameStats.
- [x] Visualization on the Shot Chart showing where paint touches originated.

## [x] [Individual Defensive Breakdown Accountability Metrics]
**Priority:** HIGH
**Type:** Feature
**Why:** We track *why* a bucket was allowed, but we need to tie it back to *who* was responsible to drive causal accountability.
**What:** Aggregate Defensive Breakdown Reasons by the "Primary Defender" identified in Matchup Tracking.
**Acceptance Criteria:**
- [x] "Individual Accountability" table in GameStats.
- [x] Breakdown of Points Allowed per player by category (e.g., "Player X: 6 pts via Poor Closeouts").
- [x] "Coach's Note" auto-generation: "Focus on Rotations with Player Y" based on breakdown trends.

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

## [x] [Shot Clock Process Analysis]
**Priority:** HIGH
**Type:** Feature
**Why:** Rushing shots early in the clock or settling for late-clock heaves is a "process" failure. This feature distinguishes between quick-hit offensive success and desperation shots.
**What:** Categorize every shot into "Early Clock" (first 10s), "Mid Clock", and "Late Clock" (last 5s) buckets and track EFG% for each.
**Acceptance Criteria:**
- [x] "Clock Phase" tagging automatically derived from StatEvent.clockTime and periodLength.
- [x] "Shot Rhythm" chart in GameStats showing volume and efficiency by clock phase.
- [x] "Decision Alert" in GameMode if team is shooting < 20% on Early Clock shots.
