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

## [x] Ref-Identity Conflict Alert System
**Priority:** HIGH
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out. Proactive alerts allow the coach to adjust aggressiveness before the game is lost.
**Status:** [x] COMPLETE (2026-05-26)

## [x] Opponent "Go-To" Usage Analytics (Clutch)
**Priority:** HIGH
**Type:** Feature
**Why:** In "Winning Time," every team has a primary option. Identifying this player's usage rate and preferred shot type in the clutch allows for specialized defensive counters.
**Status:** [x] COMPLETE (2026-05-26)

## [x] "Defensive Scheme" Real-Time Analyzer
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which defensive set is most effective now. PPP allowed by scheme is the ultimate truth for mid-game adjustments.
**Status:** [x] COMPLETE (2026-05-26)
