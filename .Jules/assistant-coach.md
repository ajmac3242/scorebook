# Assistant Coach Journal 🏀

## 2026-04-13 - Individual Opponent Tracking & Tactical Dashboards

### Basketball Workflow Insights
- **Individual Opponent Tracking**: Coaches often focus on the "star" of the other team. Tracking opponent stats by jersey number rather than a generic "OPPONENT" entity allows for immediate tactical adjustments (e.g., "Opponent #12 has 15 points in the 1st quarter, we need to switch defenders").
- **Fatigue Monitoring (T-MIN)**: Total minutes (MIN) is a box-score stat, but Time-in-Stint (T-MIN) is a coaching stat. A player with 20 total minutes but 10 consecutive minutes on court is in a high-risk fatigue zone.
- **Foul Strategy**: The "Foul Watch" thresholds (2 fouls in 1st half, 4 fouls in 4th) mirror real-world coaching "risk management." Automating this warning reduces the cognitive load on the scorekeeper/coach.

### Implementation Patterns
- **Memo Isolation**: I initially ran into a `ReferenceError` by trying to share state between memos (`statsMap` and `gameData`). It's better to use localized aggregations (like `calculatePlayerAggregates`) within complex memos to ensure data integrity and avoid order-of-initialization bugs.
- **Reusable Box Score**: Refactoring the box score into a reusable component in `GameStats.tsx` made it trivial to add an Opponent Box Score that looks and feels identical to the team's.

### Edge Cases to Watch
- **Starter Stints**: When a game starts, there are no `SUB_IN` events for starters. Defaulting stint start time to `periodLength` (or 10:00) is necessary to track fatigue from the jump.
- **Overtime Foul Rules**: Foul watch thresholds may need adjustment for overtime periods (where the "4 fouls in 4th quarter" rule might be too aggressive if OT is long).
