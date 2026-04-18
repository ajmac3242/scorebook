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
