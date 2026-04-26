# Assistant Coach Journal 🏀

## 2025-05-22: Advanced Coaching Analytics & Film Room

### Discovered Insights
- **Defensive Scheme Granularity**: Coaches often struggle to remember *when* they switched to a zone. Real-time tagging on the sidebar ensures that opponent scoring is immediately attributed to the active strategy, making halftime adjustments data-driven.
- **Film Review Efficiency**: A chronological log with tactical metadata (Shot Quality, Play Name) is more useful for film sessions than a simple box score. It bridges the gap between what happened and why it happened.
- **Halftime War Room**: Automated insights should focus on deltas (e.g., current game vs season average) rather than raw totals to give coaches immediate perspective.

### Implementation Patterns
- **Stateful Event Tagging**: Using a top-level `activeDefensiveScheme` state in `GameMode` that automatically populates the `StatEvent` on save minimizes scorekeeper burden.
- **Toggleable View Modes**: Using a conditional rendering pattern for "Film Room View" in `GameStats` allows the page to remain clean for standard review while offering deep-dive capabilities.
- **Bookmarking Flow**: The "Flag Play" button in `GameMode` acts as an executive bookmark, allowing coaches to mark critical moments for later without leaving the live tracking screen.

### Basketball Edge Cases for Future Attention
- **Sub-Period Scheme Changes**: If a coach switches from Man to Zone mid-possession, the current logic tags the *next* event. Refined state-machine tracking might be needed for absolute precision.
- **Complex "Kills"**: Defensive Kills (3 stops) are currently tracked in the stats engine. Integrating these more tightly into the automated halftime insights could provide a "Defensive Momentum" score.
