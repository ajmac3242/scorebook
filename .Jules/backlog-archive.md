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
