# Scribe & Guardian Journal

## 2025-05-15 - Stats Utility Tests & Documentation
Issue: The core statistical utility functions (`calculatePlayerAggregates`, `calculateTeamAggregates`, etc.) lacked unit tests, making them a high-risk area for regressions during refactoring.
Learning: Adding a dedicated test file `stats.test.ts` uncovered the need to handle players with zero games played to prevent division by zero in average calculations.
Pattern: Ensure all utility functions that perform data transformations or mathematical operations have 100% path coverage for both normal and edge cases (nulls, empty arrays).
