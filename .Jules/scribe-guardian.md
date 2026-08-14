# Scribe & Guardian Journal

## 2026-08-15 - API and Analytics Alignment
Issue: Standardized and whitelisted action types on the backend (`validation.ts`) and analytics rules (`impact.ts`) were not fully described or documented in the public `SCHEMA.md` and `ANALYTICS.md` files. This created potential gaps for future developer agents and contributors trying to align features with core logic.
Learning: Maintaining an absolute "Digital Twin" parity requires matching documentation with implementation. Undocumented features or formulas lead to accidental re-implementation or omission.
Pattern: Regularly audit `validation.ts` (for supported API fields/payloads) and core utility/aggregator files (like `impact.ts` and `aggregators.ts` for calculations) against `SCHEMA.md` and `docs/ANALYTICS.md` to ensure a consistent, accurate source of truth for the codebase.

## 2026-04-18 - Logic Boundaries & Testing Strategies
Issue: Attempted to "harden" scoring logic in `backend/src/scoring.ts` during a documentation/testing pass, which violated the "Never: Change application logic" constraint and introduced a subtle `NaN` regression.
Learning: Scribe & Guardian should focus on reflecting the *current* reality of the code through tests and comments. If a bug is found, it should be documented or tested as-is, and only fixed if explicitly within scope. Defensive code that changes behavior (like `typeof` checks) is a logic change.
Pattern: Use tests to document existing behavior (even if suboptimal) before proposing refactors. Always prioritize the "WHY" in comments over implementing new safety checks that alter execution flow.

## 2026-05-12 - Explicit Logic Boundaries
Issue: Utility functions like `formatTimestampToTime` and `isValidPlayerId` relied on implicit formatting or length assumptions that were not documented.
Learning: Without explicit comments, these "magic" constraints can be accidentally broken during refactoring (e.g., changing timestamp format or extending ID prefixes).
Pattern: Always document the "WHY" behind hardcoded indices or length checks and provide example formats in comments to serve as a guardrail for future changes.

## 2026-05-13 - Security vs. Efficiency Documentation
Issue: High-performance optimizations (like bitwise OR for floor or state-machine possession tracking) can appear "clever" but confusing to future maintainers.
Learning: Documentation should explicitly link the "WHY" (performance in hot paths) with the "WHAT" (the optimization), while also noting the safety boundaries (e.g. strict ISO formats).
Pattern: For every non-standard optimization, add a "WHY" comment and a "CONSTRAINT" or "BOUNDARY" comment to prevent accidental breakages during future refactors.
