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
