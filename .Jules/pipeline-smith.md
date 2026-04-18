# Pipeline Smith Journal

## 2025-05-14 - Initial CI/CD Audit
Learning: Discovered several opportunities for improvement in the current CI/CD pipelines:
- **Linting Reliability:** ESLint steps currently use `|| true`, which allows linting failures to go unnoticed.
- **Log Noise:** `pnpm install` output is verbose and lacks modern coloring/warning suppression for cleaner CI logs.
- **Missing Protections:** Several jobs and steps lack explicit timeouts, which could lead to hung runners and wasted minutes.
- **Visibility:** Job summaries are plain text; switching to Markdown tables will improve at-a-glance status checks.
- **Standardization:** Inconsistent use of environment variables and pnpm configurations across `ci.yml`, `deploy.yml`, and `terratest.yml`.

Action: Implement TEN high-impact improvements focusing on Speed, Reliability, Visibility, and DX.
