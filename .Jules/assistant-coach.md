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
