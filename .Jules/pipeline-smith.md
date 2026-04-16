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
