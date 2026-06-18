# CourtSight Backlog

## [ ] [DEPS] Upgrade jest to 30.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep testing infrastructure up to date and benefit from new features/performance improvements in the latest major version.
**What:** Upgrade jest and related packages (@jest/globals, @types/jest, jest-environment-node, ts-jest) to 30.x across backend. (Frontend uses Vitest).
**Acceptance Criteria:**
- [ ] All backend tests pass with Jest 30.
- [ ] No regressions in test reporting or coverage.

## [ ] [DEPS] Upgrade @types/node to 25.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Align with the latest Node.js type definitions.
**What:** Upgrade @types/node to 25.x in both backend and frontend. Current backend: 22.13.4, Current frontend: 24.12.2.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in both directories.

## [ ] [DEPS] Upgrade eslint-plugin-jsdoc to 63.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep documentation linting rules current.
**What:** Upgrade eslint-plugin-jsdoc to 63.x. Current: 62.9.0.
**Acceptance Criteria:**
- [ ] pnpm lint passes with no new errors.

## [ ] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep uuid type definitions current. Note: uuid@11.0.0 is deprecated, investigate alternative or higher version.
**What:** Upgrade @types/uuid to 11.x in backend. Current: 10.0.0.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in backend.

## [ ] [DEPS] Upgrade @mui dependencies to 9.1.x+
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Stay current with MUI features and fixes.
**What:** Upgrade @mui/material, @mui/icons-material to 9.1.1+, and @mui/x-date-pickers to 9.5.0+. Note: 9.1.1 caused a regression in Vitest during the last update attempt.
**Acceptance Criteria:**
- [ ] Frontend tests pass with new MUI versions.
- [ ] Build and lint pass.
