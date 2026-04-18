# Scribe & Guardian Journal

## 2026-04-18 - Logic Boundaries & Testing Strategies
Issue: Attempted to "harden" scoring logic in `backend/src/scoring.ts` during a documentation/testing pass, which violated the "Never: Change application logic" constraint and introduced a subtle `NaN` regression.
Learning: Scribe & Guardian should focus on reflecting the *current* reality of the code through tests and comments. If a bug is found, it should be documented or tested as-is, and only fixed if explicitly within scope. Defensive code that changes behavior (like `typeof` checks) is a logic change.
Pattern: Use tests to document existing behavior (even if suboptimal) before proposing refactors. Always prioritize the "WHY" in comments over implementing new safety checks that alter execution flow.
