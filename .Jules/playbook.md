# 📋 Playbook Journal

## End-of-Day Insights - 2026-04-12
- **Patterns in what gets left incomplete**: Opponent quick-actions were limited to scores and fouls, making it slow to record common turnovers and rebounds.
- **Recurring issues agents create**: Unused variables in statistical aggregation utilities can lead to linting failures.
- **End-of-Day improvement patterns**: Adding high-frequency actions to the primary scoreboard interface significantly improves real-world scorekeeping speed.
- **End-of-Day Insights - 2026-04-13**:
    - **Patterns in what gets left incomplete**: Real-time clock state was not being accurately captured in event callbacks due to stale closures.
    - **Recurring issues agents create**: Forgetting to add `clockSeconds` to `useCallback` dependency arrays in the `GameMode` component.
    - **End-of-Day improvement patterns**: Adding visual icons to the chronological action feed drastically improves the coach's ability to scan for key game events like possession changes or timeouts.
