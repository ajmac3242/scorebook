# 📋 Playbook Journal

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

## End-of-Day Insights - 2026-04-15
- **Patterns in what gets left incomplete**: Advanced shooting percentages (3P%, FT%) were being approximated because miss metadata was lost, leading to 'ghost' attempts not being tracked.
- **Recurring issues agents create**: Dependency drift in the frontend (missing @testing-library/dom) often breaks the PR verification pipeline for subsequent agents.
- **End-of-Day improvement patterns**: Implementing 'Point-Aware Misses' allows the statistical engine to provide professional-grade analytics (3PA/FTA) without increasing the scorekeeper's workload.
