# Refactor Architect's Journal

2024-05-27 - Initial Mission
Smell: Multiple small inconsistencies and duplications in validation and utility logic.
Learning: Even in a well-maintained codebase, utility functions can benefit from modernization (e.g., padStart) and better abstraction of repeated validation patterns.
Pattern: Centralize validation logic and use modern JS/TS features for cleaner utility code.

2024-05-28 - Maintenance & Readability
Smell: Inconsistent use of rounding utilities (toFixed vs formatToOne) and bitwise operations for floor.
Learning: Prioritize explicit logic (Math.floor) over bitwise operations for clarity, and reuse existing formatting utilities to ensure consistent decimal precision across the app.
Pattern: Extract complex conditional logic (like bonus alerts) into dedicated pure helper functions to keep main domain functions focused.

2024-05-29 - High-Impact Engine Refactoring
Smell: Duplicated scoring and percentage logic across the stats engine; positional argument fatigue in complex functions.
Learning: Object-based parameters for internal utilities (like `calculatePossessions`) significantly reduce cognitive load at call sites. Extracting sub-logic (like `updateAssistNode`) into helpers eliminates massive copy-paste blocks for similar entities (passer vs finisher).
Pattern: Standardize all stats calculations around shared helpers (`calcPct`, `updateScores`, `isActive`) and use object params for functions exceeding 3 arguments.

2024-05-30 - Comprehensive Utility Refactoring
Smell: Redundant logic for foul/scoring checks; complex return objects; repetitive game transition resets.
Learning: Centralizing predicate helpers (isFoulAction, isScoringEvent) across all modules (impact, aggregators) ensures logic consistency. Grouping related case statements in aggregators and using compound assignments for status resets in impact.ts significantly cleans up the "hot path" logic.
Pattern: Use object destructuring for cleaner property access from large result objects and prefer unified predicate helpers over manual type checks.
