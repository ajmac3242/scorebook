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

2026-07-18 - Tactical Structural Cleanliness
Smell: Redundant database retrieval functions and duplicate restoration patterns in backend handlers. Nested logic in validation and aggregators.
Learning: Centralizing item restoration and merging redundant DB helpers reduces the risk of inconsistent behavior (e.g. missing snapshot triggers). Simplifing complex switch statements in aggregators improves maintainability as action types grow.
Pattern: Unify retrieval helpers (`getItems`); extract shared state transition logic (`restoreItem`).

2026-08-14 - Utility Cleanliness & DRY Enhancements
Smell: Duplicate 3-point geometry math between court display and shot zone mapping; duplicated parameter branching in possessions calculation; redundant log stringification logic; duplicate time calculations in clock formatting.
Learning: Consolidating repeated court geometry checks into `isThreePointCoord` keeps rules synchronized when SVG or court specs change. Normalizing polymorphic arguments into a clean object at the top of a calculation function eliminates duplicated math branches. Extracting formatting helpers simplifies logging functions.
Pattern: Reuse base formatting utilities (`formatClock` inside `formatClockWithTenths`); extract geometry checks (`isThreePointCoord`); normalize arguments early.
