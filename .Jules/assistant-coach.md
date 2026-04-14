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
