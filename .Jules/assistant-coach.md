# Assistant Coach Journal 🏀

## Basketball Workflow Insights
- Substitution errors are the most common source of stat discrepancies. A timeline-based audit is essential for trust.
- Chaining events (Make -> Assist, Miss -> Rebound) reduces cognitive load for the scorekeeper and ensures higher data completion.
- Offensive play tracking bridges the gap between raw stats and tactical coaching.

## Implementation Patterns
- Use Dexie `useLiveQuery` to ensure that edits in the timeline audit reflect immediately across the app.
- Multi-step dialogs or overlays in `GameMode` should be non-intrusive and "one-tap" focused.

## Edge Cases to Watch
- Substitution audit needs to handle "Empty" slots or unknown players.
- Linked event chaining should be skippable to avoid blocking the scorekeeper during fast play.
- Deleting a "Make" that has a linked "Assist" should probably offer to delete the assist too.

## Basketball Workflow Insights (Session 2)
- Scouting is only as good as its persistence. Auto-updating opponent rosters from live game tracking ensures scouting data grows passively with every game played.
- Official table reconciliation (Verified Period Workflow) prevents "drift" in fouls and scores, which is critical for high-stakes late-game scenarios where bonus status or foul-out limits are key.
- Tactical analysis often requires relative context (e.g., "Why were we better in the 1st vs 2nd?"). Side-by-side (or swipeable) heatmap comparisons provide immediate visual answers.

## Implementation Patterns (Session 2)
- Exposing the database instance to `window` in development mode drastically simplifies automated verification and seeding.
- Using `SYSTEM_CORRECTION` event types allows manual stat overrides while preserving the integrity of the original event stream.

## Session: 2024-05-22 - Assistant Coach 🏀

### Basketball Workflow Insights
- **Opponent Scouting Persistence**: Moving opponent roster/stats from per-game state to a persistent "Library" allows for multi-game trend analysis (e.g., identifying "Heat Check" threats over a season).
- **Process vs. Outcome**: Coaching decisions benefit more from knowing if a shot was "Open" or "Contested" (Process Efficiency) than just if it went in. Tagging this live provides immediate halftime adjustments.
- **Play Efficiency Context**: PPP (Points Per Possession) is the gold standard for Playbook analysis. Including turnovers in the possession denominator ensures that high-risk plays are penalized correctly in the data.

### Implementation Patterns
- **Dexie Schema Evolution**: Version 19 update to include `opponents` table and `opponentId` in Games. Using `name` as an index facilitates fast lookups for Autocomplete components.
- **Stat Aggregation Cache**: Reusing `calculatePlayEfficiency` logic in both live HUD and post-game stats ensures consistency.

### Edge Cases
- **Duplicate Players in Scouting**: Need to handle cases where an opponent is faced multiple times. Roster syncing should merge rather than overwrite.
- **Turnover Attribution in Plays**: Turnovers during a set play must be tagged with the `playName` to accurately reflect efficiency.
