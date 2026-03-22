# Pipeline Smith's Journal

## 2025-05-14 - Initial CI/CD Audit
Learning: Discovered that existing workflows (`ci.yml`, `deploy.yml`, `terratest.yml`) lack concurrency controls and explicit job timeouts. This can lead to resource waste (stale runs) and hanging processes that consume runner minutes. Caching strategy is currently using `npm`, but there's room for improvement in artifact handling on failures to improve visibility.
Action: Implement `concurrency` groups and `timeout-minutes` across all primary workflows. Add artifact uploads for failed test runs.
