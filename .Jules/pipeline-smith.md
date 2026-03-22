# Pipeline Smith's Journal

## 2025-05-14 - Initial CI/CD Audit
Learning: Discovered that existing workflows (`ci.yml`, `deploy.yml`, `terratest.yml`) lack concurrency controls and explicit job timeouts. This can lead to resource waste (stale runs) and hanging processes that consume runner minutes. Caching strategy is currently using `npm`, but there's room for improvement in artifact handling on failures to improve visibility.
Action: Implement `concurrency` groups and `timeout-minutes` across all primary workflows. Add artifact uploads for failed test runs.

## 2025-05-14 - Broken Terratest Suite
Learning: The Terratest suite in `infra/tests` is broken due to several compilation errors: unused imports (`fmt`, `random`) and calls to non-existent or deprecated `aws` module functions (e.g., `GetDynamoDBTableSchema`). Additionally, the test expectations for Lambda runtime (`nodejs20.x`) are outdated compared to the codebase (`nodejs22.x`).
Action: Fix compilation errors in `infra/tests/terraform_test.go`, remove unused imports, and update validation logic to use current Terratest patterns. Update Lambda runtime expectations.
