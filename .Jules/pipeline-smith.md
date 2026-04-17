# ⚙️ Pipeline Smith's Journal

## 2025-05-15 - CI/CD Optimization Suite

### Learning: Pipeline Inefficiencies
- **Visibility:** Plain text job summaries are hard to parse at a glance.
- **Reliability:** ESM-based tests in Node.js require explicit `NODE_OPTIONS` to avoid execution failures.
- **Speed:** Redundant network calls during `pnpm install` and `terraform init` significantly slow down execution.
- **Safety:** Missing step-level timeouts can cause runners to hang indefinitely on flaky network operations.

### Action: Implemented Ten High-Impact Improvements
1. **Enhanced Visibility:** Converted `ci.yml` Job Summary to a Markdown table for better scannability.
2. **ESM Compatibility:** Added `NODE_OPTIONS: --experimental-vm-modules` to Backend test steps.
3. **Pnpm Optimization (CI):** Added `--prefer-offline` to all `pnpm install` steps in `ci.yml`.
4. **Pnpm Optimization (Deploy):** Added `--prefer-offline` to all `pnpm install` steps in `deploy.yml`.
5. **Pnpm Optimization (Terratest):** Added `--prefer-offline` to all `pnpm install` steps in `terratest.yml`.
6. **Terraform Caching (Deploy):** Implemented provider caching in `deploy.yml` using `actions/cache@v4`.
7. **Terraform Caching (Terratest):** Implemented provider caching in `terratest.yml`.
8. **Cleanup:** Removed redundant `strategy: fail-fast` block from `deploy.yml` (no matrix used).
9. **Timeout Protection (Deploy):** Added `timeout-minutes: 5` to all individual steps in `deploy.yml`.
10. **Timeout Protection (Terratest):** Added `timeout-minutes: 5` to all individual steps in `terratest.yml`.

## 2025-05-22 - Second CI/CD Optimization Suite

### Learning: Deterministic CI Environments
- **Stability:** Using `latest` OS tags can introduce non-deterministic failures when GitHub updates their runner images.
- **Experience:** ANSI color output and warning suppression improve developer focus in CI logs.
- **Enforcement:** Linting errors should be blocking to prevent technical debt from creeping in.
- **Hygiene:** Artifacts should be strictly for debugging; avoid cluttering runs with build hashes or documentation unless requested.

### Action: Implemented Ten High-Impact Improvements
1. **Pinned OS Version:** Switched all workflows to `ubuntu-24.04` for reproducible environments.
2. **Log Colorization:** Enabled `FORCE_COLOR: 3` globally for high-fidelity log output.
3. **Log Hygiene:** Added `NODE_NO_WARNINGS: 1` globally to suppress noisy experimental warnings.
4. **Strict Quality:** Removed `|| true` from ESLint steps to enforce code quality standards.
5. **Granular Timeouts:** Added `timeout-minutes: 5` to all previously unprotected steps.
6. **Noisy Command Reduction:** Optimized `apt-get` with `-qq` and `pnpm install` with `--reporter=appendonly`.
7. **Refined Visibility:** Improved `ci.yml` Job Summary table headers and status indicators.
8. **Focused Debugging:** Removed redundant artifacts (build hashes, READMEs) from failure uploads.
9. **Standardized Naming:** Ensured all steps have clear, descriptive names for better log navigation.
10. **Global Config Standard:** Unified global environment variables across CI, Deploy, and Terratest workflows.
