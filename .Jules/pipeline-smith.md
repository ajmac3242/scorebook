# Pipeline Smith's Journal ⚙️

## 2025-05-14 - Initial CI/CD Audit
Learning: The current CI/CD pipelines are functional but lack optimal caching for Go and use slightly outdated action versions (pnpm/action-setup@v3). Log organization is minimal, making it harder to debug failures in large jobs like `quality-and-tests`.
Action: Pin to latest action versions, implement log grouping with `::group::`, and enable Go caching.

## 2026-04-13 - Pipeline Visibility and Reliability Enhancements
Learning: Standardizing the use of `::group::` markers across all workflows significantly improves log navigability, especially for documentation, diagram generation, and Terraform steps. Adding explicit `timeout-minutes` to every critical step prevents silent hangs and improves pipeline reliability.
Action: Implemented log grouping and granular timeouts in `ci.yml`, `deploy.yml`, and `terratest.yml`.
