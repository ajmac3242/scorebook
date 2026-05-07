# Scorebook Backlog Archive

## [Refactor] Split index.ts into per-resource handler modules
**Priority:** HIGH
**Type:** Technical Debt
**Why:** index.ts was becoming a monolith (800+ lines), hindering agent performance and maintainability.
**What:** Extracted domain logic into `players.ts`, `games.ts`, `teams.ts`, and `cleanup.ts`.
**Status:** [x] COMPLETE (2026-05-20)

## [x] Dexie Test Harness Mocking for Fast Vitest Runs
**Priority:** HIGH
**Type:** Test Infrastructure
**Why:** Vitest runtime is being inflated by heavy `waitFor` polling against real async Dexie/IndexedDB behavior.
**Status:** [x] COMPLETE

## [x] [HYGIENE] Refactor: Split useGameMode.ts into focused domain hooks
**Priority:** HIGH
**Type:** Refactor
**Why:** `useGameMode.ts` was the central coordinator carrying too many responsibilities.
**Status:** [x] COMPLETE

## [x] HALT (High-Leverage Alerting) System
**Priority:** HIGH
**Type:** Enhancement
**Why:** Critical game situations require immediate tactical shifts.
**Status:** [x] COMPLETE
