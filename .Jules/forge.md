# Forge Journal

## Linked Events & Momentum Alerts Implementation

### Architectural Decisions
- **Event Chaining:** Integrated follow-up prompts directly into `handleSaveStat` in `GameMode.tsx`. This avoids the need for a complex state machine while ensuring statistical accuracy by cloning metadata (period, clockTime, timestamp) from the original shot.
- **Momentum Logic:** Decoupled scoring run and drought detection into the `eventAggregates` memoized block. This ensures high-frequency renders (due to the clock) don't re-process the entire stat stream unless a new event is recorded.
- **Configurable Thresholds:** Expanded the `Team` interface to support `foulWarningThresholds`. This required a schema-less approach for the Record type to handle any period ID.

### Patterns Established
- **O(N) single-pass derivation:** Continued the "Bolt" pattern of processing the sorted event stream once to derive multiple statistical sets (scores, fouls, alerts, lineups).
- **HUD Alerts:** Introduced a high-visibility, pulsed `Alert` overlay in the Scoreboard for momentum shifts, providing immediate "Suggest Timeout" visual cues.

### Basketball Domain Edge Cases
- **Multi-Period Droughts:** Correctly handled droughts that span across period boundaries (e.g. not scoring in the last 2 mins of P1 and first 2 mins of P2) by calculating total elapsed game clock.
- **Run Breaks:** Ensured that *any* scoring event by our team immediately terminates an opponent run, regardless of point value.
- **Assist Ownership:** Prevented a player from being credited with an assist on their own made field goal in the chaining UI.
- **Free Throw Exclusion:** Field goal streaks and momentum runs correctly exclude free throws (points=1) to focus on dynamic play flow.

## Matchups, On/Off Analytics, and Rotation Suggester

### Architectural Decisions
- **Matchup State in Event Stream:** Matchups are tracked using standard `StatEvent` records of type `MATCHUP`. This allows retroactive analysis and ensures "points allowed" are attributed to the defender assigned at the exact time of the score.
- **On/Off Domain Logic:** `calculateOnOffStats` uses separate Team/Opponent possession counters for ON and OFF states to produce standard basketball ratings (per 100 possessions).
- **Lightweight Rotation Logic:** The `RotationSuggester` uses scaled target minutes (`target * progress`) to identify players trailing their rotation plan, providing proactive sub suggestions without overcomplicating the live HUD.

### Patterns Established
- **Multi-Player Events:** Using `relatedPlayerId` on `StatEvent` established a pattern for recording interactions between two players (e.g., defender/offensive player, screener/ball-handler).
- **Analytics Tabs:** Standardized the "Impact" tab pattern in player/team stats for displaying secondary advanced analytics without cluttering the primary box score.

### Basketball Domain Edge Cases
- **Posession Estimation:** On/Off ratings correctly account for offensive rebounds (subtracting them from the denominator) to align with standard possession-based efficiency metrics.
- **Defensive Stop Attribution:** Stops are attributed to the defender of the player who missed or turned the ball over, falling back to the "Team Defender" if no specific assignment exists.

## Tactical Goals, Bookmarking, and HALT Alerting

### Architectural Decisions
- **Tactical KPI HUD:** Used a dynamic KPI mapper in `GameMode.tsx` to translate raw `StatEvent` aggregates (TO, AST, OREB, etc.) into user-defined goal progress. This ensures the HUD remains decoupled from the specific stats being tracked.
- **HALT Alert Engine:** Implemented a prioritized notification system in the `Scoreboard` using a combination of `Alert` components and `pulse` animations. This ensures critical state changes (Clutch/Bonus/Foul Trouble) are immediately visible without cluttering the primary game-tracking UI.
- **Bookmarking Schema:** Leveraging the `isBookmarked` flag on the existing `StatEvent` interface for "Key Moments" allows for efficient filtering and CSV export without needing a separate mapping table, maintaining database simplicity and performance.

### Patterns Established
- **KPI Summary Component:** The `TacticalGoalHUD` establishes a pattern for visualizing target-based progress that can be reused across live game, halftime, and post-game views.
- **CSV Export Engine:** Implementation of the "Film Room" export in `GameStats.tsx` provides a template for future integrations with video platforms (Hudl/Synergy).

### Basketball Domain Edge Cases
- **Clutch Sensitivity:** Clutch alerts are grounded in the specific `periodType` (Quarters vs Halves), correctly adjusting the time threshold (4 mins vs 2 mins) to align with standard high-school and college rules.
- **Bonus Warning:** The "Bonus Approaching" alert uses a 1-foul buffer (threshold - 1) to give coaches a "next foul is bonus" warning, facilitating proactive substitution or defensive scheme changes.

## Target Attack, Strategic Advisor, and Performance Narratives

### Architectural Decisions
- **Two-Way Matchup Tracking:** Refactored `calculateMatchupStats` to simultaneously track our defenders guarding opponents and opponent defenders guarding our players. This is achieved by tracking both `inOpponentPossession` and `inOurPossession` state variables in a single $O(N)$ pass.
- **Intelligence Layer Integration:** HUD elements for Target Attack and Strategic Advisor are memoized in `GameMode.tsx`, decoupled from the high-frequency clock updates by depending only on the derived `eventAggregates` and `matchupStats`.
- **Narrative Logic:** Implemented `generatePlayerNarrative` as a deterministic function mapping statistical outliers (efficiency, playmaking, glass-eating, rim protection) to human-readable summaries, avoiding the need for expensive LLM calls during post-game review.

### Patterns Established
- **Advisor Widgets:** Established a pattern for "Intelligence Widgets" in the sidebar that provide proactive tactical advice rather than just reactive data.
- **Mismatch UI:** Introduced the "Mismatch Alert" pattern (pulsing red borders on opponent cards) to direct scorekeeper attention to actionable statistical anomalies.

### Basketball Domain Edge Cases
- **Posession Resets:** Matchup tracking correctly resets both team's possession states on scores and turnovers, preventing "stale" possession data from causing false Stop% attribution.
- **Clutch Timeout Logic:** Strategic Advisor considers specific late-game clock thresholds (e.g., < 30s) and score differentials to recommend timeouts for set-play drawing.
- **Floor Time for Feedback:** Performance narratives are strictly filtered by a 5-minute floor to ensure summaries are based on a representative sample of play.
