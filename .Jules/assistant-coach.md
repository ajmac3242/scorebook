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
