# Contributing to CourtSight

Welcome! CourtSight is a **Tactical Operating System** for basketball, built with an offline-first, agent-centric development model.

## Agent-Based Development

This project heavily utilizes AI agents (Jules) for development. Coordination is managed through the `.Jules/` directory:

-   **Backlog Management**: The active roadmap is in `.Jules/backlog.md`. Completed items are archived to `.Jules/backlog-archive.md`.
-   **Agent Personas**: Specific agent roles (Scribe, Scout, Forge, etc.) are defined in markdown files within `.Jules/`.
-   **Playbook**: The `.Jules/playbook.md` (if present) contains shared conventions and architectural decisions.

### PR Conventions

To maintain a clear history for both humans and agents, use the following PR title formats:
-   `📒 Scribe: [What was documented/updated]`
-   `🏀 Assistant Coach: [Feature implemented]`
-   `🔍 Scout: [Test/Hygiene changes]`
-   `🛠️ Forge: [Core feature development]`

## Development Workflow

### Targeted Testing
The project has over 100 tests. To keep the development cycle fast, **do not run the full suite** during active development.

Use the targeted test script:
```bash
bash scripts/jules-test.sh
```
This script automatically identifies changed files and runs only the relevant backend (Jest) or frontend (Vitest) tests.

### Environment Snapshot Policy
If your changes modify dependencies (i.e., you touch `package.json` or lock files):
1.  Add the following line to your PR description:
    `ACTION REQUIRED: Re-run Jules environment snapshot (deps changed)`
2.  A human must manually re-run the environment snapshot after the PR is merged.

### File Size Guardrail
To maintain optimal performance for AI agents, we enforce a **300-line soft cap** on source files. If a file exceeds this limit, consider splitting it into smaller, domain-focused modules.

## Tech Stack
-   **Frontend**: React 19, Vite, MUI 6, Dexie.js (IndexedDB).
-   **Backend**: Node.js 22, AWS Lambda, DynamoDB, S3.
-   **Infrastructure**: Terraform, GitHub Actions.

## Security
-   Sensitive fields are redacted in logs using `sanitizeForLog`.
-   Internal DynamoDB keys (PK/SK) are stripped from public responses.
-   Admin endpoints are protected via high-entropy API keys.
