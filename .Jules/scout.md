# 🔍 Scout Journal

## 2025-05-23 - Initial Quality Audit

### Findings & Fixed Bugs

- **Bug 1: Multi-period Minutes Played**: Discovered that `calculatePlayerAggregates` incorrectly calculates minutes played when a player remains on the court across periods. It simply subtracts the `SUB_OUT` clock time from the `SUB_IN` clock time without accounting for period resets (e.g., 10:00 in P1 to 5:00 in P2 was calculated as 5 mins instead of 15 mins).
- **Bug 2: Lineup Efficiency Duration**: Similarly to Bug 1, `calculateLineupStats` failed to correctly track the duration of 5-man lineups when they played across period boundaries.
- **Bug 3: Free Throws in FG Stats**: Found that Free Throws (makes with 1 point) were being incorrectly counted as Field Goal Attempts (FGA) and Field Goals Made (FGM) in the statistical aggregation logic.

### Critical Test Gaps
- Multi-period stint tracking (Minutes Played, Lineup Net Rating).
- Bonus situation logic (QUARTERS vs HALVES).
- Technical and Free Throw impact on field goal percentages.

### Fragile Patterns to Avoid
- Assuming `clockTime` is monotonically decreasing across the entire `StatEvent` stream without checking for `period` changes.
- Using a single `lastClockTime` variable for stints that may span multiple periods.
