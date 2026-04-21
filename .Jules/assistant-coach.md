# 🏀 Assistant Coach Journal

## Basketball Workflow Insights
- **Momentum Visibility**: Coaches need to see *why* a lead was lost. Combining the score spread with PPP (Points Per Possession) trends in the Game Flow chart allows identifying if a drought was due to poor offense (Team PPP drop) or defensive breakdown (Opponent PPP spike).
- **Lineup Context**: Stats like +/- are useful, but seeing the *lineup* active during a specific run (via the new chart tooltip) provides immediate tactical feedback for future rotations.
- **Analytics Windows**: A team's season average can mask recent struggles. Implementing "Last 5" and "Last 10" filters on the Dashboard and Team Stats pages helps coaches identify current trends versus historical performance.

## Implementation Patterns
- **Single-Pass Aggregation**: Enhanced `calculateScoreFlow` to compute possessions and PPP in the same pass as the score spread. This maintains O(N) performance while quadrupling the tactical data points available to the UI.
- **Tactical Tooltips**: Using `ComposedChart` allows mixing Area (Spread) and Line (PPP) charts. Custom tooltips that display jersey numbers (using the jersey map) bridge the gap between "abstract data" and "the players on the floor."
- **Dashboard Leadership**: Surfacing "Top Performing Lineups" directly on the team dashboard (with temporal filtering) moves lineup analytics from a "deep dive" tab to a "daily check" metric.

## Basketball Scoring Edge Cases
- **Garbage Time PPP**: Large runs at the end of blowouts can skew PPP metrics. Future iterations might benefit from a "Garbage Time" filter to keep efficiency metrics focused on competitive play.
- **Possession Estimation**: Using the standard (FGA + 0.44*FTA + TO - OREB) formula is reliable, but real-time possession tracking requires careful handling of technical fouls and floor violations which don't always result in a formal possession change.
- **Lineup Stability**: Lineups with very few minutes can have extreme Net Ratings. Adding a minimum minute threshold for the "Top Lineups" dashboard display was critical for data integrity.
