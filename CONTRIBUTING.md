# Contributing to Scorebook

Thank you for contributing to Scorebook! This document outlines the development workflow, coding standards, and testing policies for the project.

## Development Workflow

### Agent-Based Development
This project utilizes specialized AI agents (Jules) to maintain and evolve the codebase. Coordination is handled through the `.Jules/` directory:
- **backlog.md**: The active list of features and maintenance tasks.
- **backlog-archive.md**: History of completed tasks to keep the active context small.
- **Agent Roles**: Specialized files (e.g., `scout.md`, `scribe-guardian.md`) define the ownership and responsibilities of different agent personas.

When working on a task, ensure you:
1.  Read the relevant agent documentation in `.Jules/`.
2.  Update `backlog.md` and `backlog-archive.md` as you progress.
3.  Follow the instructions in any `AGENTS.md` files found in the repository.

## Coding Standards

### Performance & Hygiene
- **File Size**: Aim to keep source files under **300 lines**. If a file exceeds this limit, consider refactoring it into smaller, focused modules.
- **Dependency Management**: Use `pnpm` exclusively for managing dependencies.
- **Offline-First**: Maintain the offline-first architecture by ensuring data is first persisted to IndexedDB (frontend) and eventually synced to the backend.

### Security
- **Sanitization**: Always sanitize and validate incoming API payloads.
- **Data Redaction**: Use the `maskEvent` and `stripLocalFields` utilities to prevent leakage of sensitive information in logs or API responses.

## Testing Policy

### Targeted Testing
To maintain high velocity while ensuring reliability, we use targeted testing during development.
- **Command**: `bash scripts/jules-test.sh`
- **Behavior**: This script automatically identifies modified files and runs only the relevant Jest (backend) or Vitest (frontend) tests.
- **Rule**: Do **NOT** run the full test suite (`pnpm test`) inside the development environment as it is time-consuming.

### Continuous Integration (CI)
The full suite of 100+ tests runs on every Pull Request via GitHub Actions. Ensure all targeted tests pass locally before submitting your changes.

## Submission Guidelines

### Pull Requests
- **Title**: Use a clear, descriptive title following the format `[Agent Persona]: [Short Description]`.
- **Description**: Detail the changes made, the rationale, and confirm that all relevant tests pass.
- **Environment Snapshot**: If you modify `package.json` or `pnpm-lock.yaml`, include the following line in your PR description:
  `ACTION REQUIRED: Re-run Jules environment snapshot (deps changed)`
