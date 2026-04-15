# Scribe & Guardian Journal

## 2025-05-15 - Stats Utility Tests & Documentation
Issue: The core statistical utility functions (`calculatePlayerAggregates`, `calculateTeamAggregates`, etc.) lacked unit tests, making them a high-risk area for regressions during refactoring.
Learning: Adding a dedicated test file `stats.test.ts` uncovered the need to handle players with zero games played to prevent division by zero in average calculations.
Pattern: Ensure all utility functions that perform data transformations or mathematical operations have 100% path coverage for both normal and edge cases (nulls, empty arrays).

## 2025-05-20 - Navigation UI Redesign (Pill Style)
Issue: The previous full-width navigation bars (top for desktop, bottom for mobile) were visually inconsistent with the desired modern "pill" aesthetic and had unnecessary spacing.
Learning: By clustering navigation items into a centered, dark `#121212` Box with `borderRadius: "32px"`, and conditionally rendering labels only for active items, we achieved a much cleaner "pill" look that matches the user's reference.
Pattern: Use `isMobile` media queries to transition from a fixed top bar (with logo/settings) to a centered floating bottom pill on smaller screens. Ensure `App.tsx` layout paddings are adjusted to prevent content occlusion when moving to transparent or floating navigation elements.

## 2026-03-29 - Initial Improvements for Clarity and Reliability
Issue: Core utilities and security logic lacked deep "WHY" documentation and some edge-case test coverage.
Learning: Strengthening the "WHY" behind security logic (like `sanitizeOutput`) makes it safer for future developers to modify without accidentally introducing leaks. Unit testing small math utilities provides a solid foundation for more complex stats calculations.
Pattern: Every utility file should have a corresponding `.test.ts` file, and security-critical functions must explicitly document their purpose in defense-in-depth.

## 2026-04-05 - Event Masking Security & Performance
Issue: The `maskEvent` function in the backend lacked explicit documentation regarding its "WHY" (performance-security tradeoff of shallow cloning) and had no test coverage for case-insensitive header redaction.
Learning: Strengthening the documentation for security-critical utilities prevents future developers from accidentally removing necessary optimizations (like shallow cloning) or security checks (case-insensitivity). Using a Jest spy to verify log output is a reliable way to test internal masking logic that is otherwise hard to reach.
Pattern: Security utilities that redact or sanitize data must be tested against varying inputs (e.g., character casing) to ensure compliance with standards like RFC 9110. Original objects must always be checked for non-mutation after a "sanitization" pass to verify cloning logic.

## 2026-04-12 - Critical Logic & Documentation
Issue: Complex basketball rules (bonus fouls, streaks) and infrastructure patterns (concurrency, DB sanitization) were implemented but lacked explanatory context and edge-case testing.
Learning: Documenting the "WHY" for specific thresholds (like 3-shot streaks or CHUNK_SIZE=5) and foul rules (NCAA vs NBA) preserves business knowledge. Adding tests for period transitions in lineup tracking protects against regression in temporal logic, which is the most common source of stats inaccuracies.
Pattern: For temporal data processing (like game clocks), always add tests that span period/game boundaries. Documentation for security-critical functions should explicitly mention "Defense-in-Depth" or "Performance-Security Tradeoffs" to guide future auditors.

## 2026-04-14 - Multi-Game Stats Isolation & Input Validation
Issue: Statistical utilities lacked robustness when processing multi-game event streams, and security utilities lacked explicit "WHY" documentation for timing-safe comparisons and redaction.
Learning: Strengthening the "WHY" behind security logic (like `safeCompare` and `INTERNAL_KEYS`) makes the codebase safer for future refactors by clarifying the threat model (e.g., timing attacks). Adding multi-game isolation tests for lineup efficiency revealed that shared context (like `liveContext`) must be carefully scoped to the correct `gameId` in aggregated streams.
Pattern: For any utility that processes arrays of events from multiple sources (games/teams), always verify that game-specific logic (like clock time offsets) doesn't "leak" across context boundaries. Use comprehensive UUID validation test suites to ensure edge cases (empty strings, non-string types) are handled gracefully before reaching the database layer.

## 2026-04-15 - Advanced Stats & Defensive Logic Documentation
Issue: Complex basketball metrics (TS%, Stops/Kills) and security utilities (safeCompare, stripLocalFields) lacked explicit documentation explaining the "WHY" behind their specific constants or implementation choices.
Learning: Documenting the specific rationale for statistical constants (like 0.44 for TS%) and security measures (like hashing before timing-safe comparison) preserves critical domain and security knowledge. Adding tests for period transitions and deleted event filtering ensures data integrity in temporal and soft-delete scenarios.
Pattern: Every domain-specific constant or security-critical utility must have a "WHY" comment. High-impact tests should prioritize data isolation (multi-game), temporal boundaries (periods), and lifecycle states (deletedAt).
