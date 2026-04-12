# Refactor Architect's Journal

## 2025-05-15 - Multi-Layer Code Quality Pass
Smell: Large monolithic functions in backend and stats logic; highly repetitive synchronization loops in frontend.
Learning: Centralizing cross-cutting concerns like API authentication and S3 uploads drastically reduces boilerplate and improves maintenance safety. Breaking down complex aggregation logic into focused helpers makes the code read like a story rather than a math problem.
Pattern:
1. Extract routing and specialized calculation logic into standalone helpers in Lambda.
2. Use generic `pushEntity` and `fetchApi` patterns in sync services to handle repetitive CRUD.
3. Decompose state initialization and inner-loop logic in stat calculators to improve readability.
4. Enhance string utilities (`getInitials`) with robust regex-based splitting and filtering.

## 2025-05-16 - Consolidation and Standardization
Smell: Repetitive math formatting, redundant collection iterations, manual resource management (ETags, DB counts), and inconsistent error logging.
Learning: Shared formatting utilities (`roundToOne`) significantly reduce visual noise. Declarative collection checks (mapping table names) improve maintainability over hardcoded lists. Extracting core logic from complex loops (Inner loop extraction) makes functions easier to test and reason about.
Pattern:
1. Implement `roundToOne`/`formatToOne` for consistent numeric display.
2. Use single-pass `reduce` instead of multiple `filter`/`reduce` chains for score calculations.
3. Promisify complex callback-based flows (auth sessions) to flatten async logic.
4. Centralize resource management (ETag keys, DynamoDB key sets) to prevent string interpolation drift.
5. Standardize backend logging with a `logError` helper for consistent observability.

## 2026-04-01 - Component Decomposition and Constant Standardization
Smell: Monolithic UI components with deeply nested JSX; magic strings for 'special' entity IDs; repetitive logic in stat aggregation.
Learning: Extracting repetitive UI sub-trees into local functional components drastically improves the "scannability" of complex pages like GameMode. Centralizing special IDs prevents reference drift between the data layer and UI.
Pattern:
1. Decompose large React components into focused sub-components (`PlayerStatRow`, `RecentActionItem`) to improve maintainability of complex tracking interfaces.
2. Standardize 'magic' strings into shared constants (`SPECIAL_PLAYER_IDS`) for special entities like 'OPPONENT' and 'TEAM_TIMEOUT'.
3. Use early returns and defensive checks (`!result?.Item`) to flatten deeply nested backend logic and prevent runtime crashes.
4. Extract pure business logic (`getBonusStatus`) from stateful hooks to improve testability and clarity.

## 2026-04-12 - Code Structure and DRY Pass
Smell: Redundant score accumulation and stat counter logic across multiple utility functions; monolithic backend handler with nested routing; cluttered UI components with inline complex logic.
Learning: Centralizing shared domain logic (like score updates and stat increments) into small, pure helpers significantly reduces duplication and the risk of calculation drift. Moving infrastructure concerns (response formatting, security headers) to dedicated modules cleans up the core business logic.
Pattern:
1. Extract shared state transition logic (, ) from aggregation loops.
2. Use early returns and delegation chains to flatten complex routing and conditional blocks.
3. Replace manual loops with idiomatic language features (, , ) to improve readability without sacrificing performance for typical data sizes.
4. Decompose large calculation functions () into smaller, focused helpers with clear responsibilities.

## 2026-04-12 - Code Structure and DRY Pass
Smell: Redundant score accumulation and stat counter logic across multiple utility functions; monolithic backend handler with nested routing; cluttered UI components with inline complex logic.
Learning: Centralizing shared domain logic (like score updates and stat increments) into small, pure helpers significantly reduces duplication and the risk of calculation drift. Moving infrastructure concerns (response formatting, security headers) to dedicated modules cleans up the core business logic.
Pattern:
1. Extract shared state transition logic (`updateScores`, `applyActionToAggregate`) from aggregation loops.
2. Use early returns and delegation chains to flatten complex routing and conditional blocks.
3. Replace manual loops with idiomatic language features (`split`, `filter`, `map`) to improve readability without sacrificing performance for typical data sizes.
4. Decompose large calculation functions (`calculateLineupStats`) into smaller, focused helpers with clear responsibilities.
