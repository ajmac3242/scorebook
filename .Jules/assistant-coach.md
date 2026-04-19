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
