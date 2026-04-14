# Forge 🔨 - Domain Journal

## 2024-05-24 - Individual Opponent Tracking

### Architectural Decisions
- **Prefix-based Opponent Identification**: Established the `OPPONENT:{jersey}` pattern for identifying specific opponent players. This allows the system to distinguish between general opponent stats (assigned to `OPPONENT`) and specific ones without requiring a full "Opponent Team" entity management system.
- **Dynamic Roster Management**: Added `opponentRoster` to the `Game` object in IndexedDB. This allows coaches to "discover" and track opponent players on-the-fly during a game using their jersey numbers.
- **Symmetric Box Score UI**: Decided to mirror the detailed table structure of the home team for the opponent tracking. This ensures that advanced stats (eEFG%, TS%, etc.) are calculated identically for both sides when individual tracking is used.

### Patterns Established
- **Special Player ID Namespace**: `SPECIAL_PLAYER_IDS` now includes a prefix pattern. Future features (like tracking specific referees or coaches) should follow this namespace pattern to avoid collision with UUID-based player IDs.
- **Quick-Action Roster Injection**: The pattern of using a `window.prompt` (or a more formal modal) to inject new entities into a game's roster mid-flight is established as a lightweight alternative to a full management screen.

### Basketball Domain Insights
- Coaches often don't know opponent names but always know jersey numbers. Tracking by jersey is the primary use case.
- Grouping "General Opponent" stats (rim coordinates 50,10) with "Specific Opponent" stats in the aggregate total ensures the scoreboard always matches the box score sum.
- Individual tracking allows for "Defensive Assignment" analysis in the future (e.g., who was guarding Opponent #24 during their scoring run).
