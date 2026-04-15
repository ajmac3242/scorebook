# Pipeline Smith's Journal ⚙️

## 2025-05-14 - Initial CI/CD Audit
Learning: The current CI/CD pipelines are functional but lack optimal caching for Go and use slightly outdated action versions (pnpm/action-setup@v3). Log organization is minimal, making it harder to debug failures in large jobs like `quality-and-tests`.
Action: Pin to latest action versions, implement log grouping with `::group::`, and enable Go caching.

## 2026-04-13 - Pipeline Visibility and Reliability Enhancements
Learning: Standardizing the use of `::group::` markers across all workflows significantly improves log navigability, especially for documentation, diagram generation, and Terraform steps. Adding explicit `timeout-minutes` to every critical step prevents silent hangs and improves pipeline reliability.
Action: Implemented log grouping and granular timeouts in `ci.yml`, `deploy.yml`, and `terratest.yml`.

## 2026-04-14 - CI/CD Optimization Suite
Learning: Implementing robust bash retry loops for package installations (`pnpm install`) significantly reduces CI flakiness caused by transient network issues. It is critical to ensure the loop correctly exits with a non-zero code if all attempts fail to avoid "false green" steps. Using `--prefer-offline` for secondary production-only installs in deployment pipelines speeds up builds by leveraging the local pnpm store. Enhanced `$GITHUB_STEP_SUMMARY` reports across all workflows improve developer experience by providing immediate visibility into complex job outcomes (docs, diagrams, infra IDs, test results) without digging into logs.
Action: Standardized robust retry loops, optimized deployment installs, and expanded job summaries implemented in `ci.yml`, `deploy.yml`, and `terratest.yml`.
