# Pipeline Smith's Journal

## 2025-05-14 - Initial CI/CD Audit
Learning: Discovered that existing workflows (`ci.yml`, `deploy.yml`, `terratest.yml`) lack concurrency controls and explicit job timeouts. This can lead to resource waste (stale runs) and hanging processes that consume runner minutes. Caching strategy is currently using `npm`, but there's room for improvement in artifact handling on failures to improve visibility.
Action: Implement `concurrency` groups and `timeout-minutes` across all primary workflows. Add artifact uploads for failed test runs.

## 2025-05-14 - Broken Terratest Suite
Learning: The Terratest suite in `infra/tests` is broken due to several compilation errors: unused imports (`fmt`, `random`) and calls to non-existent or deprecated `aws` module functions (e.g., `GetDynamoDBTableSchema`). Additionally, the test expectations for Lambda runtime (`nodejs20.x`) are outdated compared to the codebase (`nodejs22.x`).
Action: Fix compilation errors in `infra/tests/terraform_test.go`, remove unused imports, and update validation logic to use current Terratest patterns. Update Lambda runtime expectations.

## 2025-05-14 - Infrastructure Risk Mitigation
Learning: Terratest currently operates against production state because it shares the S3 backend and state file defined in `infra/versions.tf`. This led to accidental destruction of production resources during a test run. Integration tests must use either a mock provider (like LocalStack) or a dedicated, ephemeral state file and workspace to ensure isolation.
Action: Disabled automatic Terratest execution on PRs by commenting out the `pull_request` trigger. Recommended re-architecting the test suite to use a separate backend/workspace before re-enabling.

## 2025-05-14 - targeted Hardening & Visibility
Learning: Implementing small, surgical improvements to existing workflows (concurrency, timeouts, and artifact uploads) provides immediate value without the risk of large-scale environment migrations.
Action:
1. Hardened `jules-fixer.yml` with concurrency and 10m timeouts.
2. Improved visibility in `deploy.yml` by adding artifact uploads for failed runs.
3. Updated `terratest.yml` to use the latest major version of `setup-terraform`.

## 2025-05-15 - Workflow Efficiency & Visibility
Learning: Ad-hoc package installations in CI (like `pip install diagrams`) bypass caching and increase execution time. Sequential `setup-node` calls in deployment workflows can be consolidated to improve speed and simplify configuration. Verbose test output is critical for debugging failures in headless environments.
Action:
1. Tightened job timeouts across `ci.yml` (10m) and `deploy.yml` (15m).
2. Consolidated `setup-node` in `deploy.yml` to use multi-path caching.
3. Implemented `pip` caching for documentation diagrams via `docs/requirements.txt`.
4. Enabled verbose test output (`--verbose`) in CI for better visibility.
5. Expanded artifact uploads on failure to include generated documentation and build hashes.

## 2025-05-15 - PNPM Migration and Pipeline Hardening
Learning: The codebase uses `pnpm` but CI was using `npm`, leading to sub-optimal caching and potential version drift. Native `pnpm` caching in `setup-node@v4` is significantly faster than standard `npm` caching. Mandatory best practices like `concurrency` and `artifact upload` on failure are essential for a robust CI/CD pipeline.
Action:
1. Migrated `ci.yml`, `deploy.yml`, and `terratest.yml` to use `pnpm/action-setup@v3`.
2. Updated `setup-node` to use `cache: pnpm` pointing to multiple lockfiles.
3. Added artifact uploads on failure for the `terratest.yml` workflow.
4. Ensured all sub-directories (`backend/`, `frontend/`) consistently use `pnpm install --frozen-lockfile`.
5. Hardened workflows with `strategy: fail-fast` and tightened timeouts.

## 2026-04-06 - Pipeline Optimization & Selective Execution
Learning: In a monorepo with separate lockfiles, `actions/setup-node@v4` requires an explicit `cache-dependency-path` listing all lockfiles to enable effective pnpm caching. Implementing `dorny/paths-filter` significantly reduces CI duration by skipping irrelevant jobs (e.g., frontend tests when only backend changed). Reliability is improved by adding retry logic to transient system-level steps like `apt-get install`.
Action: Consistently apply `cancel-in-progress: true` to all concurrency groups and set conservative `timeout-minutes` (10m) to optimize runner utilization and prevent hanging jobs.
