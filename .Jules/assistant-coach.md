## 2026-04-14 - Redesigned Dashboard & Improved Game Setup

### Basketball Workflow Insights
- Coaches prioritize their own team's data above general app metrics. A "My Team" dashboard provides immediate tactical value upon opening the app.
- Multi-step workflows for game creation reduce cognitive load during the pre-game rush, especially when default settings are automatically applied.
- "Starring" a team is an intuitive way to define the user's primary focus without complex configuration.

### Implementation Patterns
- Using `dexie-react-hooks`' `useLiveQuery` with `.where('isFavorite').equals(1).first()` is an efficient way to retrieve the primary entity for a personalized dashboard.
- MUI `Stepper` combined with local state management for each step ensures a clean and validated user journey for complex entity creation.
- Centralizing game defaults (period length, timeouts, etc.) at the Team level ensures consistency and speeds up game day operations.

### Edge Cases
- When starring a team, care must be taken to unstar any other team to maintain a single "My Team" context.
- Default settings should be pre-filled in the game creation workflow but remain editable for one-off game variations (e.g., tournament rules).

## 2026-04-15 - Data Integrity Audits & Play Tracking

### Basketball Workflow Insights
- Even elite scorekeepers make mistakes during live play. Retroactive audit tools like the "Substitution Timeline" are essential for maintaining high trust in advanced analytics (MIN, +/-, Lineup Efficiency).
- Raw statistics (makes/misses) are more useful when tied to coaching strategy. "Play Tagging" bridges the gap between raw data and tactical execution, allowing coaches to see which sets are actually yielding efficient shots.

### Implementation Patterns
- **Database Schema Evolution**: Using Dexie's versioned stores facilitates safe data migration when adding high-impact coaching fields like `playbook` and `playName`.
- **HeroUI Integration**: Transitioning to HeroUI while maintaining a JSDOM test environment requires robust component mocking in `setupTests.ts` to prevent "undefined" component errors while preserving logic verification.
- **Analytics Aggregation**: Calculating "Play Efficiency" on-the-fly using pre-sorted event streams in `useMemo` keeps the UI snappy even with thousands of game events.

### Edge Cases
- Editing substitution times out-of-order can break stint calculation logic; the UI should ideally visualize these as a timeline to prevent overlaps.
- When tagging plays, "None" must be an explicit option to ensure users can still record broken plays or fast breaks without forced categorization.
