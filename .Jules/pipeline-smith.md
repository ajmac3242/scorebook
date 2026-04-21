# Pipeline Smith's Journal ⚙️

## 2025-05-14 - CI/CD Audit and Initial Optimizations

### Findings:
- **Redundant Lockfiles**: `frontend/package-lock.json` exists alongside `pnpm-lock.yaml`, causing potential confusion and non-deterministic builds if `npm` is accidentally used.
- **Missing Timeouts**: Several jobs and critical network-dependent steps lack `timeout-minutes`, which could lead to hung pipelines and wasted CI minutes.
- **Suboptimal Checkout**: `fetch-depth: 0` is used in multiple CI jobs where it isn't required, unnecessarily increasing clone time.
- **Caching Efficiency**: `pnpm install` commands are missing the `--prefer-offline` flag, which can speed up installations by prioritizing the local content-addressable store.
- **Visibility**: Some workflow steps are anonymous (missing `name:`), making logs harder to navigate.
- **Build Parity**: Terratest build steps don't perfectly match production deployment build steps (e.g., missing `package.json` in Lambda zip).

### Actions:
- Remove redundant `package-lock.json`.
- Apply `timeout-minutes` to jobs and critical steps.
- Optimize checkout depth for CI jobs.
- Standardize `pnpm install` with `--prefer-offline`.
- Add descriptive names to all workflow steps.
- Ensure build parity across workflows.

## 2024-04-21 - Standardizing and Hardening Pipelines

### Learning:
Inconsistent shell environments and missing timeouts can lead to flaky or hung pipelines. Decoupled `cache-dependency-path` ensures that backend dependency changes do not invalidate the frontend cache, improving overall CI speed in monorepos.

### Action:
- **Standardized Shell**: Set `shell: bash` as the global default for all `run` steps to ensure consistent execution environments across all jobs.
- **Improved Caching Strategy**: Decoupled `cache-dependency-path` for backend and frontend jobs, ensuring independent cache invalidation and faster CI runs.
- **Harden Pipeline with Timeouts**: Added `timeout-minutes` to critical setup steps and ensured consistent job-level timeouts to prevent hung workflows.
- **Enhanced Visibility**: Improved artifact naming by appending `${{ github.run_id }}-${{ github.run_attempt }}` for better traceability of failure logs.
- **Workflow Cleanup**: Removed redundant `ref` and `token` parameters from `actions/checkout` in CI jobs, simplifying the workflow definitions.
