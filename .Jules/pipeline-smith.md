# Pipeline Smith's Journal ⚙️

## 2025-05-15 - Initial Optimization Run
**Bottlenecks Discovered:**
- Sequential `pnpm install` and build for backend and frontend in `ci.yml`.
- Missing Terraform provider caching in `deploy.yml`.
- Multiple redundant `pnpm install` calls in `deploy.yml` without `--prefer-offline`.
- Basic Job Summary in `ci.yml` lacked clear status at a glance.

**Improvements Implemented:**
- **Parallel Builds:** Combined backend and frontend install/build steps in `ci.yml` using background processes and `wait`, reducing critical path when both components change.
- **Terraform Caching:** Added `actions/cache@v4` for `infra/.terraform` in `deploy.yml` keyed by `versions.tf` and `.terraform.lock.hcl`.
- **pnpm Optimization:** Added `--prefer-offline` to secondary install steps in `deploy.yml` to leverage the local store populated by earlier steps.
- **Enhanced Visibility:**
    - Updated `ci.yml` Job Summary with a Markdown status table.
    - Added `lambda.zip` to failure artifacts in `deploy.yml` for easier debugging.

**Impact:**
- Reduced CI execution time for multi-component changes.
- Sped up deployment infrastructure steps.
- Improved developer feedback with better logs and summaries.
