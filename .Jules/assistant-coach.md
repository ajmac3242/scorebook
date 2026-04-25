# Assistant Coach Journal 🏀

## 2024-05-22: Multi-Feature implementation session

### Features Implemented
- **Visual Rotation Timeline**: Enhanced with Scoring Runs, Foul markers, and detailed stint tooltips.
- **Opponent Tendency Scouting**: Added "Shot Type" tagging and real-time "PAINT" threat analysis.
- **Four Factors HUD**: Integrated team-wide efficiency metrics with season-average comparisons.

### Learnings
- **Basketball Logic**: Four Factor ORB% is more accurately calculated as `Team_OREB / (Team_OREB + Opp_DREB)`.
- **Implementation Patterns**: Single-pass aggregation in `calculateTeamAggregates` is critical for performance but must be meticulously updated when new metrics (like 3PM) are needed.
- **UI Architecture**: Using a shared `FourFactorsHUD` component simplifies maintenance between live (`GameMode`) and post-game (`GameStats`) views.
- **Regression Risk**: Heavy file updates (like `GameMode.tsx`) can lead to accidental deletion of bottom-of-file components if not careful with diff tools.

## 2026-04-25: Live Sync, Video Export, and KPI Dashboard

### Features Implemented
- **Coach-Assistant Live Sync Bridge**: Implemented a Direct API polling mechanism (15s) to sync stats across multiple devices. Added visual HUD indicators for sync status.
- **Standardized Video Export**: Added support for Hudl and Synergy CSV exports directly from the box score view, mapping granular game events to platform-specific tagging columns.
- **Program Health Dashboard**: Added a longitudinal trend analysis tab to the starred team dashboard, visualizing Four Factor health and goal achievement over time.

### Learnings
- **Synchronization Strategy**: Polling `/api/games/{id}/stats` provides a reliable vertical slice for multi-device sync without requiring complex WebSocket infrastructure for early-stage implementation.
- **Data Interoperability**: Video platforms require specific column naming and time formatting (MM:SS) that must be handled in a dedicated mapping layer to avoid polluting the core domain model.
- **Performance**: Leveraging `Recharts` for season-long trends provides high-impact visual feedback with minimal overhead when data is filtered to a sliding window (Last 10 games).
