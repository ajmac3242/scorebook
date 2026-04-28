# Scribe & Guardian Journal

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

## 2026-05-15 - Improving Clarity and Reliability
Issue: Complex state-machine logic in `calculateStopsAndKills` was only partially documented, making it hard to understand how defensive stops are tracked across multi-miss possessions. Optimization in `calculateOnOffStats` was not explicitly explained, risking future regressions that might re-introduce (N \times P)$ loops.
Learning: Explicitly documenting "WHY" behind state-machine transitions and performance optimizations ensures that future developers maintain these critical paths correctly. High-quality tests for previously untested functions like `calculatePlayerStintTimeline` and `calculateMatchupStats` provide a safety net for future refactors.
Pattern: Use JSDoc to explain the "WHY" of complex logic (e.g., timing safe comparisons, mass assignment protection) and provide detailed tests for state-driven statistical functions to verify behavior across all edge cases (multi-period, game boundaries).

## 2026-05-20 - Explicit Boundary Documentation
Issue: Logic that relies on external data formats (like fixed ISO string indices in `formatTimestampToTime`) or complex mathematical conservations (like "OFF-as-Difference" in `calculateOnOffStats`) often lacks explicit boundary documentation.
Learning: Without "CONSTRAINT" or "METHODOLOGY" comments, these optimizations appear fragile or magical. Documenting the underlying math (e.g., Total - ON = OFF) provides the necessary context for safe refactoring.
Pattern: For any logic that depends on a fixed data format or uses a mathematical shortcut for performance, add an explicit "CONSTRAINT" or "METHODOLOGY" comment to serve as a guardrail.

## 2026-05-22 - Improving Analytical Clarity & Reliability
Issue: Several core statistical functions and validation helpers relied on implicit constraints or complex state transitions that were not fully documented. Specifically, period transition logic in `isEventInPeriod` and the state machine in `calculateStopsAndKills` were difficult to audit without deeper context.
Learning: Explicitly documenting "WHY" certain boundaries exist (like OT inclusion in HALVES) and providing tests for these edge cases significantly increases confidence for future refactors.
Pattern: Pair complex logic updates with "WHY" comments and specific edge-case tests to ensure behavior remains consistent across game formats.

## 2026-05-25 - Performance & Security Guardrails
Issue: Critical performance optimizations (Bitwise OR for floor) and security boundaries (Mass Assignment Protection) often lack explicit constraint documentation, leading to potential regressions (e.g., bitwise wrapping at 32-bit boundary) or accidental exposure of internal data structures.
Learning: Documenting the exact boundaries of optimizations (like the 35 million hour limit for `formatClock`) and the role of security layers (like `sanitizeOutput` as a contract enforcer) provides essential guardrails for future maintainers.
Pattern: For every optimization or security filter, document the "BOUNDARY" (where it fails) and the "RATIONALE" (why it exists) to ensure long-term stability and security.
