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

## 2025-05-25 - Cross-Game Isolation & Multi-Period Accuracy

### Findings & Fixed Bugs
- **Bug 10: Cross-Game Streak Leakage**: Discovered that `calculateStopsAndKills` and `calculatePlayerStreaks` leaked state across games when processing multiple games in a single event stream. Added `currentGameId` tracking to isolate streaks per game.
- **Bug 11: Stint Look-Ahead Leakage**: Fixed a bug where the look-ahead logic in `calculateStopsAndKills` could satisfy a MISS event in one game with a REBOUND event from the next game.
- **Bug 12: Skipped Period Minutes**: Fixed `calculatePlayerAggregates` and `calculateLineupStats` to correctly attribute minutes/duration for "skipped" periods (e.g., if a game jumps from P1 to P3).

### Critical Test Gaps Filled
- New test suite `scout_discovery.test.ts` specifically targeting cross-game transitions and multi-period gaps.
- Added tie-breaking logic to `sortStats` to ensure stable event ordering for identical timestamps.
