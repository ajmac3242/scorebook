# Janitor's Journal 🧹

2026-03-31 - Standardized Logging and Dependency Alignment

Learning: The codebase was using a mix of `console.log/error` and a standardized `logger` utility. Standardizing on `logger` improved consistency and testability (by spying on the logger). Additionally, missing `@typescript-eslint` dependencies in `frontend/package.json` were causing linting failures.
Action: Always verify `package.json` against `eslint.config.js` imports. Prefer `logger` utility for all user-facing and service-level logging.

2026-03-31 - Type Hygiene in Stats Utilities

Learning: Generic `Record<string, any>[]` in JSDoc was obscuring the actual types (`Player[]`, `Game[]`) used in `stats.ts`, leading to poor IDE support and potential type errors. Untyped `new Map()` calls were also allowing `any` to creep into the code.
Action: Enforce specific entity types in JSDoc and always provide type arguments to `Map` and `Set` constructors.

## 2026-04-03 - [Linting / formatting improvement]
Learning: ESLint warnings in the `backend/coverage/` directory were causing noise in reports. Automated project-wide formatting (Prettier) can inadvertently touch machine-generated files like `pnpm-lock.yaml` and `coverage/`, which creates massive PR noise and potential issues.
Action: Always add `coverage/` to ESLint and Prettier ignore lists. Use targeted formatting (e.g., `prettier --write <file>`) instead of project-wide runs to keep PRs small and atomic.

## 2026-04-12 - Elite Code Hygiene Improvements
Learning: Redundant JSDoc blocks often accumulate when refactoring large files like `backend/src/index.ts`. Nullish coalescing (`??`) is preferred over logical OR (`||`) for jersey numbers to avoid treating "0" as a missing value.
Action: Periodically scan for "orphan" JSDoc blocks and enforce `??` for numeric string properties.

## 2026-04-14 - React Hook and Memoization Hygiene
Learning: Inline `useCallback` hooks within JSX can lead to `react-hooks/rules-of-hooks` violations if they appear after early returns. Furthermore, incomplete dependency arrays in `useMemo` can prevent the React Compiler from optimizing components and lead to stale calculations.
Action: Always extract `useCallback` hooks to the component body before any early returns. Ensure `useMemo` dependency arrays are exhaustive to preserve memoization and ensure correctness.
