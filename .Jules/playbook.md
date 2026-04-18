# 📋 Playbook Journal

## Testing Policy for Jules

**Do NOT run the full test suite.** The full suite (`npm test` / `pnpm test` / `vitest run` without filters) runs 100+ tests and takes too long inside the Jules VM. CI handles the full suite on every PR.

Instead, after making your code changes, run ONLY the targeted test script:

```bash
bash scripts/jules-test.sh
```

This script auto-detects which `backend/` and/or `frontend/` source files you changed and runs only the Jest/Vitest tests that cover those modules.

If you need to run tests manually for a single workspace:

```bash
# Backend only (from repo root)
cd backend && pnpm jest --testPathPattern="<module-name>"

# Frontend only (from repo root)
cd frontend && pnpm vitest run "<module-name>"
```

Or use the convenience npm scripts added to each workspace:

```bash
# Backend
cd backend && pnpm test:jules -- --testPathPattern="<module-name>"

# Frontend
cd frontend && pnpm test:jules -- "<module-name>"
```

**Never run `pnpm test` or `jest` without a `--testPathPattern` argument inside the Jules VM.** Leave the full regression suite to CI.


## End-of-Day Insights - 2026-04-12
- **Patterns in what gets left incomplete**: Opponent quick-actions were limited to scores and fouls, making it slow to record common turnovers and rebounds.
- **Recurring issues agents create**: Unused variables in statistical aggregation utilities can lead to linting failures.
- **End-of-Day improvement patterns**: Adding high-frequency actions to the primary scoreboard interface significantly improves real-world scorekeeping speed.
- **End-of-Day Insights - 2026-04-13**:
    - **Patterns in what gets left incomplete**: Real-time clock state was not being accurately captured in event callbacks due to stale closures.
    - **Recurring issues agents create**: Forgetting to add `clockSeconds` to `useCallback` dependency arrays in the `GameMode` component.
    - **End-of-Day improvement patterns**: Adding visual icons to the chronological action feed drastically improves the coach's ability to scan for key game events like possession changes or timeouts.
- **End-of-Day Insights - 2026-04-14**:
    - **Patterns in what gets left incomplete**: Complex React state dependencies in large components like `GameMode` often result in stale closure bugs if not carefully audited.
    - **Recurring issues agents create**: Missing dependencies in `useMemo` and `useCallback` hooks, especially when adding new reactive state like `selectedOpponentId`.
    - **End-of-Day improvement patterns**: Implementing 'discovery-based' tracking (like individual opponent jerseys) allows users to start high-value tracking immediately without setup overhead, bridging the gap between simple and advanced modes.
