# CourtSight Backlog Archive

## [Action-Clock Interlock (Safety)]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** In basketball, the clock stops on every whistle (fouls, violations, timeouts). Manual clock stops are error-prone and slow.
**What:** Implement a safety interlock that automatically pauses the game clock when a FOUL or TIMEOUT event is recorded.
**Status:** [x] COMPLETE (2026-07-10)

## [Period-End 'Last Shot' Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** High-leverage buckets at the buzzer are the most frequent source of table discrepancies.
**What:** Implement a "Last Shot" confirmation in the `VerifiedPeriodModal` that specifically asks if the final shot of the period was valid (good) or late (no basket).
**Status:** [x] COMPLETE (2026-07-09)

## [Overtime Ruleset Governance]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Rules for timeouts and fouls often change in overtime. Critical for competitive integrity.
**What:** Implement logic to grant an additional timeout at the start of each overtime period and ensure fouls carry over correctly from regulation.
**Status:** [x] COMPLETE (2026-07-09)

## [Automated Period-Start Possession]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** The alternating possession rule must be enforced at the start of every period except the first. Manual entry is prone to error.
**What:** Automatically record a `POSSESSION` event for the team indicated by the possession arrow when a new period (Period > 1) begins.
**Status:** [x] COMPLETE (2026-07-09)

## [Consolidated Game Clock Hook]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Technical Debt
**Why:** Duplicate clock logic in `hooks/useGameClock.ts` and `pages/GameMode/hooks/useGameClock.ts` is a "Split-Brain" risk. Logic drift has already been detected where possession arrow automation and period-end triggers are inconsistently applied.
**What:** Consolidate all game clock management into a single, shared hook in `src/hooks/`.
**Status:** [x] COMPLETE (2026-07-09)

## [x] [Numerical Scoreboard Foul Display]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Coaches require exact numerical team foul counts (not just dots/bonus indicators) on the live scoreboard for precise game management and bonus strategy.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Corrected Free Throw Attribution Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** The current free throw workflow incorrectly attributes points to the player who committed the foul (the defender); it must be updated to attribute shots to the player who was fouled (the shooter).
**Status:** [x] COMPLETE (2026-07-06)

## [x] [1-and-1 Bonus Free Throw Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Many leagues (High School/College) use "1-and-1" bonus rules where the second shot is only awarded if the first is made. Essential for accurate foul strategy.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [DEPS] Upgrade jest to 30.x
**Priority:** MEDIUM
**Type:** Technical Debt
**Status:** [x] COMPLETE (2026-07-06)

## [x] [DEPS] Upgrade @types/node to 26.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE (2026-07-06)

## [x] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE (2026-07-06)

## [x] [DEPS] Upgrade eslint and @eslint/js to 10.x in Frontend
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE (2026-07-06)

## [x] [DEPS] Upgrade @jest/globals, @types/jest, and jest-environment-node to 30.x in Backend
**Priority:** CRITICAL
**Type:** Technical Debt
**Status:** [x] COMPLETE (2026-07-06)

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
**Status:** [x] COMPLETE

## [x] Live Lineup Impact (+/-) Dashboard Overlay
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *immediately* if a specific 5-man unit is being outscored, even if individual players look okay. Plus/Minus for the current lineup is the ultimate efficiency truth.
**What:** Add a "Live Lineup Impact" section to the `GameMode` page that displays the +/- for the currently active 5-man unit since they were subbed in.
**Status:** [x] COMPLETE

## [x] Defensive Assignment & Matchup Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know who is responsible for opponent scoring. Raw team defensive stats don't tell you which individual player is failing to stop their man.
**What:** Add a "Matchup" layer to the live game tracking. Allow coaches to assign a "Primary Defender" to each active opponent. When an opponent scores, the points are automatically attributed as "Points Allowed" to their defender.
**Status:** [x] COMPLETE

## [x] On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Status:** [x] COMPLETE

## [x] Shot Clock Process Analysis
**Priority:** HIGH
**Type:** Feature
**Why:** Rushing shots early in the clock or settling for late-clock heaves is a "process" failure. This feature distinguishes between quick-hit offensive success and disciplined late-clock execution.
**What:** Automatically categorize every shot into "Early Clock" (first 25% of clock), "Mid Clock", and "Late Clock" (last 5 seconds) based on game clock and period length.
**Status:** [x] COMPLETE

## [x] [Tactical Identity HUD (KPI Adherence)]
**Priority:** HIGH
**Type:** Feature
**Why:** Every coach enters a game with a specific "Identity" (e.g., "We attack the paint"). A live HUD tracking these specific goals ensures the team doesn't drift into inefficient play.
**Status:** [x] COMPLETE

## [x] [Verified Period Workflow (Reconciliation)]
**Priority:** HIGH
**Type:** UX / Data Integrity
**Why:** Official scores and fouls often drift from the app. A forced reconciliation at every period break ensures the analytics engine remains a "Source of Truth."
**Status:** [x] COMPLETE

## [x] [Defensive Breakdown Attribution (The Accountability Layer)]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *why* a bucket was allowed to fix it in practice. This layer separates physical skill makes from tactical mental errors.
**Status:** [x] COMPLETE

## [x] [Special Situation (ATO/SLOB/BLOB) Analytical Engine]
**Priority:** HIGH
**Type:** Feature
**Why:** Designing the perfect play is useless if you don't know if it works. This engine moves beyond raw stats to show efficiency in high-leverage set plays.
**Status:** [x] COMPLETE

## [x] [Voice-Driven Live Scorekeeping]
**Priority:** HIGH
**Type:** Feature
**Why:** Solo scorekeepers struggle to keep up with high-intensity transition play. Voice commands eliminate "tap lag" and allow the user to keep their eyes on the floor.
**Status:** [x] COMPLETE

## [x] [Holistic Matchup Efficiency Matrix]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to see the entire defensive landscape at once, not just isolated mismatches. A 5x5 Matrix reveals the most exploitable and vulnerable points of the current unit-on-unit battle.
**Status:** [x] COMPLETE

## [x] [Spark Plug Momentum Index]
**Priority:** HIGH
**Type:** Feature
**Why:** Some players provide value that doesn't show up in the box score but triggers team-wide energy shifts (e.g., a floor dive or a charge taken).
**Status:** [x] COMPLETE

## [x] [Ref-Identity Conflict Alert System]
**Priority:** HIGH
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out. Proactive alerts allow the coach to adjust aggressiveness before the game is lost.
**Status:** [x] COMPLETE

## [x] [Opponent "Go-To" Usage Analytics (Clutch)]
**Priority:** HIGH
**Type:** Feature
**Why:** In "Winning Time," every team has a primary option. Identifying this player's usage rate and preferred shot type in the clutch allows for specialized defensive counters.
**Status:** [x] COMPLETE

## [x] ["Defensive Scheme" Real-Time PPP Analyzer]
**Priority:** HIGH
**Type:** Feature
**Why:** Which defensive set is most effective *now*. PPP allowed by scheme is the ultimate truth for mid-game adjustments.
**Status:** [x] COMPLETE

## [x] Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** A cold shooting night shouldn't result in a tactical pivot if the "Process" is correct. xPTS moves the conversation from results to quality.
**Status:** [x] COMPLETE

## [x] [Executive Halftime Talking Points Generator]
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is only 10 minutes. Coaches need automated synthesis of complex data into 3 punchy, actionable directives for the locker room.
**Status:** [x] COMPLETE

## [x] [Paint Touches & Rim Pressure Analytics]
**Priority:** HIGH
**Type:** Feature
**Why:** Shooting selection is only half the battle. Coaches need to know if their offense is "settling" or actively attacking the heart of the defense.
**Status:** [x] COMPLETE

## [x] [Individual Defensive Breakdown Accountability Metrics]
**Priority:** HIGH
**Type:** Feature
**Why:** We track *why* a bucket was allowed, but we need to tie it back to *who* was responsible to drive causal accountability.
**Status:** [x] COMPLETE

## [x] [Substitution Timeline Audit]
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**Status:** [x] COMPLETE

## [x] [Offensive Play/Set Success Tracking]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**Status:** [x] COMPLETE

## [x] [Real-Time Foul Trouble & Fatigue Rotation Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**Status:** [x] COMPLETE

## [x] [Automated PDF Box Score & Game Summary Export]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**Status:** [x] COMPLETE

## [x] [Free Throw Sequence Workflow]
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**Status:** [x] COMPLETE

## [x] [Intelligent Linked Event Chaining]
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**Status:** [x] COMPLETE

## [x] [Possession-Based Efficiency Metrics (PPP)]
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**Status:** [x] COMPLETE

## [x] [Strict Foul-Out Enforcement]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Players who exceed the foul limit must be disqualified to maintain game integrity. Currently, they can remain on court and continue to record stats.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Dynamic Period & Overtime Clock Management]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Different levels of play have different period and OT lengths. Hardcoding these leads to incorrect game timing and coach confusion.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Lineup Integrity Validation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** A standard basketball game requires exactly 5 players per team on the court. Allowing 4 or 6 players invalidates all lineup-based analytics and breaks core game rules.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Unified Timeout Governance & Data Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Redundant and incorrect mapping (using `team.fouls` for timeouts) creates a "Split-Brain" state where the scoreboard and team configuration disagree. Consolidating this is critical for game management reliability.
**What:** Remove all references to `team.fouls` being used as a timeout limit or count. Standardize on `team.timeoutsPerTeam` and `team.defaultTimeoutLimit`. Implement the `timeoutScope` logic to reset or carry over timeouts at halftime based on the team's configuration.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Full-Cycle Possession Arrow Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** While Held Ball triggers are implemented, the arrow must also automate for period starts (alternating possession rule) to be a true digital twin of the official table.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Game Clock / Period End Safety Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Data Integrity
**Why:** Recording statistical events after the buzzer or when the clock is stopped is a major source of data desynchronization with the official table.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Hardened Score Integrity & 'Ghost Point' Fix]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Current score calculation in `calculateGameResult` ignores `SYSTEM_ADJUSTMENT` events, meaning final game scores will be incorrect if adjustments were made during verification. This creates a discrepancy between the live scoreboard and the finalized record.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Standardized Data Correction Action Types]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Current system uses inconsistent "ADJUST_FOUL_REMOVE" labels that are missing from the formal `ACTION_TYPES` constant. Standardizing these ensures statistical aggregators can process corrections deterministically.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Initial Jump Ball Workflow Automation]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Games do not start in a vacuum. Capturing the jump ball winner and initial arrow direction ensures the game starts with 100% data fidelity without immediate manual corrections.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Proactive Period-End Reconciliation Trigger]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Verification is most accurate when done immediately. Waiting for the user to tap "Next Period" creates a window where discrepancies are forgotten.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Halftime Ruleset Governance]
**Priority:** MEDIUM
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Basketball rules change at the half (timeouts reset, team fouls reset). The app must automate these transitions to maintain the "digital twin" of the official table.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Individual Foul Reconciliation Workflow]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** UX
**Why:** Discrepancies often occur with *who* committed a foul. Correcting totals is not enough; individual player foul counts must match the official book to ensure accurate foul-out enforcement.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Illegal Lineup Clock Interlock]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Bug Fix
**Why:** Running the clock with an illegal lineup (e.g., 4 players) creates invalid stint and net-rating data.
**Status:** [x] COMPLETE (2026-07-06)

## [x] [Roster Jersey Number Integrity]
**Priority:** HIGH
**Phase:** 1 - Core Game Loop
**Type:** Feature
**Why:** Jersey numbers are the primary identifier for officials and scorekeepers. Allowing duplicate jersey numbers on the same team or empty numbers causes identification failure and data drift.
**Status:** [x] COMPLETE (2026-07-06)
