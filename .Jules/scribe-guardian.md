# Scribe & Guardian Journal

## 2026-04-18 - Logic Boundaries & Testing Strategies
Issue: Attempted to "harden" scoring logic in `backend/src/scoring.ts` during a documentation/testing pass, which violated the "Never: Change application logic" constraint and introduced a subtle `NaN` regression.
Learning: Scribe & Guardian should focus on reflecting the *current* reality of the code through tests and comments. If a bug is found, it should be documented or tested as-is, and only fixed if explicitly within scope. Defensive code that changes behavior (like `typeof` checks) is a logic change.
Pattern: Use tests to document existing behavior (even if suboptimal) before proposing refactors. Always prioritize the "WHY" in comments over implementing new safety checks that alter execution flow.

## 2026-05-12 - Explicit Logic Boundaries
Issue: Utility functions like `formatTimestampToTime` and `isValidPlayerId` relied on implicit formatting or length assumptions that were not documented.
Learning: Without explicit comments, these "magic" constraints can be accidentally broken during refactoring (e.g., changing timestamp format or extending ID prefixes).
Pattern: Always document the "WHY" behind hardcoded indices or length checks and provide example formats in comments to serve as a guardrail for future changes.

## 2025-05-22 - Validation Boundaries & Possession Tracking
Issue: Several utility functions had implicit edge-case behavior (e.g., isValidPlayerId length guards, isEventInPeriod OT grouping) that were not fully exercised in tests. Possession tracking in stopsAndKills was non-obvious.
Learning: Testing defensive "guard" logic explicitly prevents regressions when business rules evolve. Differentiating fouls based on inferred possession state is a critical but fragile logic path that requires both detailed comments and specific edge-case tests.
Pattern: Pair length-based optimizations with specific boundary tests. Document the "WHY" behind state-machine transitions to assist future maintainers.
