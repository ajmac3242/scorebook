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

## 2025-05-25: Prescriptive Intelligence & Situational Coaching

### Discovered Insights
- **Inverted Matchup Tracking**: To identify attack targets, we must track defensive efficiency from the opponent's perspective. Correlating our team scores with the assigned opponent defender reveals the "weak link" in their defense.
- **Situational Urgency**: Real-time advice is most effective when it categorizes urgency. A 10-0 run requires a "HIGH" urgency timeout recommendation, while foul trouble in the first half is a "MEDIUM" urgency sub/adjustment prompt.
- **Post-Game Narratives**: Players respond better to rule-based qualitative feedback (e.g., "High-impact defensive presence") than just looking at a box score. This humanizes the data and makes it immediately actionable for the next practice.

### Implementation Patterns
- **HUD-First Architecture**: Adding intelligence layers as self-contained "HUD" components in the sidebar allows coaches to see insights without losing focus on the live court tracking.
- **Aggregated Interface Extensions**: Extending core stats interfaces (like `TeamAggregates`) to include missing raw totals (TO, AST, OREB) is necessary for high-fidelity situational advising and Four Factors comparison.

### Basketball Edge Cases for Future Attention
- **Opponent Defender Identification**: Currently, the "Target Attack" identifier relies on manual matchup assignment. If assignments aren't updated, the data shifts to team-level averages.
- **Narrative Complexity**: Rule-based narratives can sometimes conflict (e.g., high efficiency but high turnovers). Future iterations should use a priority system to ensure the most "coachable" insight is presented first.
