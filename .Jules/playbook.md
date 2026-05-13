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

## End-of-Day Insights - 2026-04-18
- **Patterns in what gets left incomplete**: Complex multi-step workflows like Free Throw sequences are often deferred because they require significant state management and UI modal logic.
- **Recurring issues agents create**: Inconsistent bonus/foul logic across different UI components (Scoreboard vs. Action Dialog). Centralizing these checks into utilities like 'getBonusStatus' prevents drift.
- **End-of-Day improvement patterns**: Implementing a "Sequence Mode" for rapid data entry (like Free Throws) significantly reduces the mental load for scorekeepers during high-pressure game moments.

## End-of-Day Insights - 2026-04-19
- **Patterns in what gets left incomplete**: Tactical visualization often lags behind data collection. While we could record many stats, seeing the "spread" over time (momentum) provides immediate coaching context that raw scores don't.
- **Recurring issues agents create**: Neglecting to update visualization dependency arrays in React hooks when adding new filtering dimensions (like heatmap result filtering).
- **End-of-Day improvement patterns**: Closing the loop between data entry (Shot Quality) and data visualization (Heatmap Filtering) ensures new features are immediately useful for post-game analysis.

## End-of-Day Insights - 2026-04-20
- **Patterns in what gets left incomplete**: Defensive efficiency (Opponent PPP) is often neglected in favor of offensive metrics, leaving coaches with only half the tactical picture.
- **Recurring issues agents create**: Hard-coding game lengths (e.g., 40 mins) in UI components instead of deriving them from team settings or calculating a standardized rate (NET/40).
- **End-of-Day improvement patterns**: Implementing 'Temporal Windowing' (Last 5/10 games) provides immediate value for scouting and performance trend analysis without requiring complex backend filtering.

## End-of-Day Insights - 2026-05-13
- **Patterns in what gets left incomplete**: Global layout refactors can easily leave orphan routes or missing imports if not audited across all device viewports.
- **Recurring issues agents create**: Leaving unused MUI imports (like Typography or useTheme) after refactoring component structures.
- **End-of-Day improvement patterns**: Using a centralized AppShell with dedicated slots for nav components ensures a consistent UI across the entire application while simplifying individual page logic.
