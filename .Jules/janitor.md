# Janitor's Journal 🧹

2026-03-31 - Standardized Logging and Dependency Alignment

Learning: The codebase was using a mix of `console.log/error` and a standardized `logger` utility. Standardizing on `logger` improved consistency and testability (by spying on the logger). Additionally, missing `@typescript-eslint` dependencies in `frontend/package.json` were causing linting failures.
Action: Always verify `package.json` against `eslint.config.js` imports. Prefer `logger` utility for all user-facing and service-level logging.

2026-03-31 - Type Hygiene in Stats Utilities

Learning: Generic `Record<string, any>[]` in JSDoc was obscuring the actual types (`Player[]`, `Game[]`) used in `stats.ts`, leading to poor IDE support and potential type errors. Untyped `new Map()` calls were also allowing `any` to creep into the code.
Action: Enforce specific entity types in JSDoc and always provide type arguments to `Map` and `Set` constructors.
