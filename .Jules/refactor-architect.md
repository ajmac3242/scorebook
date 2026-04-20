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

## 2026-04-17 - Modular Architecture and Component Extraction
Smell: Monolithic backend handler; deeply nested ternary logic in stat utilities; oversized UI components with embedded dialogs.
Learning: Splitting a monolithic Lambda into domain-specific modules (validation, scoring, snapshots) significantly improves testability and reduces the cognitive load for maintaining individual routes. Transitioning complex UI sub-trees into dedicated components (QuickSubDialog) improves parent component readability and state management focus.
Pattern:
1. Decompose monolithic backend handlers into specialized modules (`validation.ts`, `scoring.ts`, `snapshots.ts`) to isolate business logic from routing.
2. Flatten complex conditional logic (e.g., `isEventInPeriod`) using clear `if/else` or `switch` blocks to improve readability for domain-specific rules.
3. Extract large Modal/Dialog sub-trees into standalone components (`QuickSubDialog.tsx`) to reduce parent file size and improve component "scannability".
4. Standardize backend utility functions (request metadata extraction, path normalization) in a shared `utils.ts` to ensure routing consistency.

## 2026-04-17 - Micro-Refactor Pass for Consistency
Smell: Redundant filtering of soft-deleted items; manual case-insensitive header lookups; fragmented stat validation; duplicated percentage logic in frontend.
Learning: Centralizing common data access patterns (like  and ) reduces boilerplate and prevents subtle bugs. Consolidating domain validation logic into specialized modules improves code scannability and testability.
Pattern:
1. Use `filterActive` helper in backend to standardize soft-deletion filtering across API and snapshot layers.
2. Centralize header access with `getHeader` to ensure case-insensitive lookups are consistent.
3. Modularize stat event validation into `validateStatEvent` within `validation.ts`.
4. Consolidate repetitive percentage calculations in frontend utilities using a shared `calcPct` helper.
5. Group related domain operations (e.g., team roster and games snapshots) into consolidated helpers like `snapshotTeam`.

## 2026-04-17 - Micro-Refactor Pass for Consistency
Smell: Redundant filtering of soft-deleted items; manual case-insensitive header lookups; fragmented stat validation; duplicated percentage logic in frontend.
Learning: Centralizing common data access patterns (like `filterActive` and `getHeader`) reduces boilerplate and prevents subtle bugs. Consolidating domain validation logic into specialized modules improves code scannability and testability.
Pattern:
1. Use `filterActive` helper in backend to standardize soft-deletion filtering across API and snapshot layers.
2. Centralize header access with `getHeader` to ensure case-insensitive lookups are consistent.
3. Modularize stat event validation into `validateStatEvent` within `validation.ts`.
4. Consolidate repetitive percentage calculations in frontend utilities using a shared `calcPct` helper.
5. Group related domain operations (e.g., team roster and games snapshots) into consolidated helpers like `snapshotTeam`.

## 2026-04-20 - Multi-Pass Maintainability Refactor
Smell: Inlined momentum detection logic; repetitive opponent and active checks in UI loops; monolithic Scoreboard component; verbose recursive cleaning in backend.
Learning: Isolating specialized domain logic (momentum detection) into dedicated utilities reduces cognitive load in UI components. Modularizing large components into focused sub-components improves scannability and state management clarity. Using functional patterns (reduce) for recursive operations simplifies complex logic.
Pattern:
1. Extract complex calculation logic (detectOpponentRun, detectScoringDrought) into standalone domain utilities.
2. Standardize data filtering and identification using shared helpers (isActive, isOpponentId, isScoringEvent, isFoulAction).
3. Decompose monolithic UI components into focused sub-components (TeamScoreSection, MomentumAlerts) to improve readability.
4. Simplify recursive data processing using modern JS/TS patterns like `Object.entries().reduce()`.

## 2026-04-20 - Domain Logic and UI Standardization
Smell: Inlined domain logic for fouls and free throws; inconsistent plus-minus formatting in JSX; manual path slicing.
Learning: Centralizing domain-specific conditions (isFoulAction, isFreeThrow) improves scannability of aggregation logic. Moving UI formatting logic to utilities (formatPlusMinus) significantly reduces JSX clutter and ensures visual consistency. Regex-based path normalization is more robust and concise than manual slicing.
Pattern:
1. Extract basketball domain logic into semantic helpers (isFoulAction, isFreeThrow) in stats utilities.
2. Standardize UI-specific formatting (plus-minus colors and signs) in shared math utilities.
3. Use regex for string normalization tasks like API path routing.
4. Bolt-optimize recursive cleaners with Object.entries() and standard loops.
