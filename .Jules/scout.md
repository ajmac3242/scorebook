# 🔍 Scout Journal

## 2025-05-23 - Initial Quality Audit

### Findings & Fixed Bugs

- **Bug 1: Multi-period Minutes Played**: Discovered that `calculatePlayerAggregates` incorrectly calculates minutes played when a player remains on the court across periods. It simply subtracts the `SUB_OUT` clock time from the `SUB_IN` clock time without accounting for period resets (e.g., 10:00 in P1 to 5:00 in P2 was calculated as 5 mins instead of 15 mins).
- **Bug 2: Lineup Efficiency Duration**: Similarly to Bug 1, `calculateLineupStats` failed to correctly track the duration of 5-man lineups when they played across period boundaries.
- **Bug 3: Free Throws in FG Stats**: Found that Free Throws (makes with 1 point) were being incorrectly counted as Field Goal Attempts (FGA) and Field Goals Made (FGM) in the statistical aggregation logic.

- **Bug 4: Overstated Live Minutes**: Found that players in ongoing games were credited with playing until 0:00 of the current period even if the clock hadn't reached it yet. Fixed by introducing `liveContext` to stint calculations.
- **Bug 5: Inaccurate TS%**: True Shooting Percentage was an approximation because Free Throw Attempts (FTA) weren't tracked. Added `fta` tracking and updated the formula to `Points / (2 * (FGA + 0.44 * FTA))`.
- **Bug 6: Multi-game Stint Leakage**: `calculatePlayerAggregates` could leak active stints across different games if the event stream wasn't perfectly isolated. Added `gameId` isolation logic to the stint tracker.

### Critical Test Gaps
- Bonus situation logic (QUARTERS vs HALVES) - still needs more granular edge case testing.
- Technical foul impact on team fouls and bonus.

### Fragile Patterns to Avoid
- Assuming `clockTime` is monotonically decreasing across the entire `StatEvent` stream without checking for `period` or `gameId` changes.
- Calculating advanced metrics like TS% without all variables (like FTA) leads to significant "stat inflation".

## 2025-05-24 - Quality Improvement & Advanced Metrics

### Findings & Fixed Bugs
- **Bug 7: Scoreflow Timeline Inaccuracy**: Discovered that `calculateScoreFlow` used wall-clock ISO timestamps, which failed for games recorded after the fact or games with long pauses. Refactored to use `period` and `clockTime` for a true game-time timeline.
- **Bug 8: Defensive Sequence Double-Counting**: Found that `calculateStopsAndKills` could double-count stops if an opponent missed twice in the same possession before a rebound was recorded. Added a look-ahead and index-skipping logic to fix this.
- **Bug 9: Hardcoded Foul Limits**: The UI was hardcoded to a 5-foul limit for "foul out" and 4 for "foul trouble". Standardized this to use `game.foulLimit` or `team.defaultFoulLimit`.

### Critical Test Gaps Filled
- Comprehensive unit tests for `calculateStopsAndKills` covering turnovers, defensive rebounds, offensive rebounds, and multi-miss possessions.
- New test for `calculateScoreFlow` using multi-period clock time.

### Basketball Edge Cases
- **Stops Tracking**: Possession termination is the key. A stop isn't just a miss; it's a miss *that ends the possession* (captured by a defensive rebound).
- **Foul Limits**: Different leagues have different rules (High School: 5, NBA: 6). Hardcoding these leads to incorrect tactical alerts.

## 2025-05-25 - Stat Precision & Momentum Audit

### Findings & Fixed Bugs
- **Bug 10: Incomplete Team Foul Calculation**: Discovered that `GameMode.tsx` only counted the base `FOUL` type for period team fouls, missing `FOUL_SHOOTING`, `FOUL_NON_SHOOTING`, and `TECHNICAL_FOUL`. This led to incorrect bonus status displays.
- **Bug 11: Missing Free Throw Tracking**: Players were missing `FTM` (Free Throws Made) and `FT%` in their box scores. Added explicit tracking for 1-point makes and attempts.
- **Bug 12: Momentum Leakage**: Found that `calculateStopsAndKills` did not reset the stop streak when the defensive team committed a foul. A foul resets defensive momentum and should terminate the current "Kill" pursuit.

### Critical Test Gaps Filled
- Comprehensive audit tests in `scout_audit.test.ts` verifying FT tracking, team foul types, and momentum reset logic.
- Technical foul support added to both aggregation and momentum logic.

### Basketball Edge Cases
- **Momentum & Fouls**: A defensive stop requires terminating a possession cleanly. Fouls (even non-shooting) reset the streak.
- **FT/FG Separation**: Always keep `makes`/`attempts` strictly for Field Goals (2pt/3pt) and use `ftm`/`fta` for Free Throws to maintain NBA/FIBA/NCAA box score standards.

## 2025-05-26 - Advanced Logic & Boundary Audit

### Findings & Fixed Bugs
- **Bug 13: Offensive Foul Momentum Reset**: Discovered that `calculateStopsAndKills` incorrectly reset the defensive stop streak on offensive fouls. Fixed by implementing possession tracking to ensure only defensive or technical fouls break the streak.
- **Bug 14: Overtime Bonus Gap**: Found that in `QUARTERS` mode, team fouls in overtime were not being grouped with the 4th quarter, causing the bonus status to reset. Updated `isEventInPeriod` to group P5+ with P4.
- **Bug 15: Silent Period Minute Loss**: Identified a bug where players/lineups lost minutes if entire periods passed without a recorded event (e.g., if a player played all of P2 but P2 had no stats). Added skip-period detection to stint calculations.

### Critical Test Gaps Filled
- New edge case tests in `scout_audit.test.ts` for offensive fouls during streaks, overtime grouping, and skipped period minutes.
- Verified that these fixes maintain 100% accuracy in box score and momentum metrics.

### Basketball Edge Cases
- **Momentum vs. Possession**: A stop streak tracks defensive success. Offensive fouls end a possession but are not defensive failures.
- **OT Continuation**: Most competitive rulesets treat OT as an extension of the 4th quarter for the purpose of team foul penalties.

## 2025-05-27 - Data Isolation & Scouting Audit

### Findings & Fixed Bugs
- **Bug 16: Multi-Game Analytics Leakage**: Discovered that several cumulative analytics (`calculateStopsAndKills`, `calculateOpponentThreats`, `calculatePlayerStreaks`) did not reset state when processing an event stream containing multiple games. Added `gameId` tracking to ensure data isolation.
- **Bug 17: Inaccurate Clutch Definition**: The `isClutchEvent` helper didn't treat overtime as clutch if the clock was above 4 minutes, and used a 4-minute window for `HALVES` mode (which should be 2 mins). Refined to better reflect competitive standards.
- **Bug 18: Inefficient Scouting Stats**: `calculateOpponentScoutingStats` used O(N*P) complexity by filtering the entire event stream for every player to find Free Throws. Refactored to a single-pass O(N) loop using `applyActionToAggregate`.

### Critical Test Gaps Filled
- New reproduction suite `scout_repro.test.ts` verifying game isolation, scouting efficiency, and clutch boundary conditions.

### Basketball Edge Cases
- **Clutch Windows**: Quarters (4 mins) and Halves (2 mins) have different "winning time" definitions. Overtime is *always* clutch if the score is close.
- **Batch Processing**: When running stats over a season, analytics must explicitly watch for `gameId` changes to avoid "bleeding" momentum or streaks from one game into the next.

## 2025-05-28 - Boundary Precision & Performance Optimization

### Findings & Fixed Bugs
- **Bug 19: Incorrect On/Off Metrics**: Discovered that `calculateOnOffStats` failed to track global game totals (PTS, FGA, TO, etc.), leading to zero or negative "OFF" statistics for all players. Fixed by implementing a single-pass global total accumulator.
- **Bug 20: OT Minute Distortion**: Found that player and lineup minute calculations used hardcoded regulation period lengths for overtime. Implemented `getPeriodLen` helper to support variable OT lengths (default 5 mins).
- **Bug 21: Missing Opponent Offensive Foul Stops**: `calculateStopsAndKills` did not count opponent offensive fouls as stops. Updated logic to treat non-technical fouls by the offensive team as possession-ending stops.

### Critical Test Gaps Filled
- New comprehensive audit suite `scout_audit_v2.test.ts` verifying On/Off derivations, variable OT minutes, and offensive foul stop tracking.
- Optimized `calculateOnOffStats` from $O(N \times P)$ to $O(N + P)$ by deriving OFF stats via subtraction.

### Basketball Edge Cases
- **OT Transitions**: Overtime periods are shorter than regulation. Any minute tracking must check the period number against the game format.
- **Offensive Fouls**: A defensive stop occurs whenever a defensive possession ends without a score. Opponent offensive fouls are the ultimate defensive stop.

## 2025-05-29 - Logic Precision & Boundary Refinement

### Findings & Fixed Bugs
- **Bug 22: HALVES Mode OT Leakage**: Discovered that `isEventInPeriod` incorrectly showed 2nd Half (P2) events when viewing an OT period (P3+) in HALVES mode. Standardized it so specific OT views only show their own events.
- **Bug 23: Play Efficiency Possession Gap**: Found that `calculatePlayEfficiency` ignored offensive rebounds, leading to inflated possession counts for plays that were kept alive. Added `oreb` tracking and updated the formula.
- **Bug 24: Clutch Minute Rounding**: Identified that `clutchOnly` statistics were inaccurate because they only recorded stints that *ended* during clutch time. Refactored the engine to use interval-based accumulation (sweep-line) to capture playing time exactly as it crosses the clutch boundary.

### Critical Test Gaps Filled
- New comprehensive suite `scout_audit_v3.test.ts` verifying OT isolation in HALVES mode, OREB inclusion in play PPP, and precise minute tracking for clutch boundaries.

### Basketball Edge Cases
- **Clutch Boundaries**: Calculating stats for a sub-window of a game (like Clutch or a specific period) requires an interval-based approach. A player might start a stint before clutch time and end it after; only the overlapping seconds should count.
- **Play Possessions**: A "play" isn't a single shot; it's a sequence. Offensive rebounds reset the 24-second clock but do not start a new team possession for that specific set.
