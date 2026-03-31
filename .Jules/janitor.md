# Janitor's Journal 🧹

## 2026-03-31 - ESLint Flat Config & Standardized Logging

Learning: ESLint Flat Config (eslint.config.mjs) requires global ignores to be in a separate object at the top of the export array. Mixing ignores with other properties in a single config object can lead to parsing errors if the file is still matched by other config objects in the array.
Action: Always separate global ignores from project-specific rules in ESLint Flat Config.

Learning: Cognito session tokens and user attributes are frequently logged via console.log in development but present a security risk in production.
Action: Systematically audit authentication flows for leftover console.log statements and replace with standardized, redacted logging or remove entirely.

Learning: Standardized frontend logging via a dedicated utility (e.g., utils/logger.ts) improves consistency and allows for easy extension to external services.
Action: Enforce the use of the project's logger over raw console.log in all frontend utility and service classes.
