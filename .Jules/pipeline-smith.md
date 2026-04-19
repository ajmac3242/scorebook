# Pipeline Smith's Journal ⚙️

## 2025-04-19 - CI Pipeline Parallelization and Optimization

**Learning:** The current `ci.yml` workflow uses a monolithic `quality-and-tests` job that handles backend, frontend, and documentation tasks sequentially. This leads to slow feedback loops and unnecessary resource consumption when only one part of the codebase is modified. Additionally, `terratest.yml` lacks Node.js/pnpm caching, increasing build times for infrastructure tests.

**Action:**
1.  **Parallelize CI:** Split `ci.yml` into granular parallel jobs (`backend-ci`, `frontend-ci`, `docs-and-auto-fix`) triggered by a shared `filter` job.
2.  **Optimize Caching:** Implement `actions/setup-node` caching in `terratest.yml` and ensure consistent `pnpm install` patterns across all workflows.
3.  **Enhance Visibility:** Add artifact uploads for Terraform plans and build logs on failure in `deploy.yml`.
4.  **Improve Reliability:** Standardize step timeouts and retry logic for dependency installations.
