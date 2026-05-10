# Refactor Architect's Journal

2024-05-27 - Initial Mission
Smell: Multiple small inconsistencies and duplications in validation and utility logic.
Learning: Even in a well-maintained codebase, utility functions can benefit from modernization (e.g., padStart) and better abstraction of repeated validation patterns.
Pattern: Centralize validation logic and use modern JS/TS features for cleaner utility code.

2024-05-28 - Maintenance & Readability
Smell: Inconsistent use of rounding utilities (toFixed vs formatToOne) and bitwise operations for floor.
Learning: Prioritize explicit logic (Math.floor) over bitwise operations for clarity, and reuse existing formatting utilities to ensure consistent decimal precision across the app.
Pattern: Extract complex conditional logic (like bonus alerts) into dedicated pure helper functions to keep main domain functions focused.
