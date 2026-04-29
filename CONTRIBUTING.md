# Contributing to Scorebook

Thank you for your interest in contributing to Scorebook! This project uses a specialized agent-based development workflow.

## Development Workflow

### Local Development Setup

Refer to the [README.md](README.md) for detailed setup instructions for both the frontend and backend.

### Targeted Testing

To maintain fast feedback loops, we use a targeted testing strategy. Instead of running the full test suite (100+ tests), use the provided script:

```bash
bash scripts/jules-test.sh
```

This script automatically detects changed files and runs only the relevant tests for those modules. **Never run full test suites (`npm test`) in the development environment.**

### Environment Snapshots

If your changes involve adding, removing, or upgrading any package (modifying `package.json` or `pnpm-lock.yaml`), you must include the following line in your Pull Request description:

`ACTION REQUIRED: Re-run Jules environment snapshot (deps changed)`

## Agent Coordination

This project utilizes a set of specialized AI agents (the "Jules" system) to assist with development. Their coordination notes and logs are stored in the `.Jules/` directory.

- **Scribe & Guardian**: Owns documentation and knowledge layer.
- **Scout**: Focuses on testing and QA.
- **Forge**: Handles core feature development.
- **Janitor**: Maintains code hygiene and linting.
- **Bolt**: Optimizes performance.
- **Refactor Architect**: Performs structural improvements.

When working with these agents, please respect their designated roles and refer to their respective `.md` files in `.Jules/` for specific directives and history.

## Documentation Standards

- **README.md**: Should always reflect the current state of the application, setup procedures, and architecture.
- **SCHEMA.md**: Must be kept in sync with the actual API implementation and DynamoDB single-table design.
- **API Documentation**: Document all new endpoints including method, path, request/response shapes, and security requirements.

## Pull Request Guidelines

1.  **Branch Naming**: Use short, descriptive branch names.
2.  **Commit Messages**: Follow standard conventions (short subject, blank line, detailed body if needed).
3.  **Verification**: Always verify your changes using `jules-test.sh` and manual checks before submitting.
4.  **No Artifacts**: Do not commit build artifacts or generated snapshots.
