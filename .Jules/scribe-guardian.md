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
