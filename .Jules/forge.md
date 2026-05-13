# Forge Journal 🔨

## Architectural Decisions

- **Connectivity Maps (Assist Network):** Established a pattern of using temporal matching for assists in `calculateAssistNetwork`. Decided that a passer's eFG% within the network should reflect the team's efficiency on those generated shots (e.g., assisting a 3PT results in 1.5 eFG% contribution) rather than just a binary make/miss.
- **xPTS Logic:** Centralized shot quality expected values in `frontend/src/utils/shotZones.ts` using a 2D map of [Zone][Quality]. This allows other agents to easily update the "baseline" as the competitive level of the team changes (e.g., NBA vs High School averages).
- **ROI Metric:** Defined "Shot ROI" as `(Actual / Expected) - 1.0`. This provides a normalized percentage (e.g., +15%) that coaches can use to distinguish between "bad luck" and "bad selection."

## Patterns Established

- **Chained HUD Indicators:** Integrated the xPTS and Paint Touch stats into the `GameMode` sidebar. This establishes a pattern of "Strategic KPIs" that update in real-time alongside the raw score, reinforcing "The Process."
- **Keyboard Shortcuts:** Reserved 'p' for Paint Touches. Shortcuts should be documented in the Stat recording dialog to encourage high-speed tracking.

## Basketball Domain Insights

- **Paint Touch Window:** Settled on a 15-second window for `calculatePaintTouchStats`. This accounts for the time it takes to collapse a defense, kick out, and find the open shooter while still attributing the efficiency gain to the original rim pressure.
- **Shot Clock Phase Definitions:** 'EARLY' (0-10s), 'MID' (10-20s), and 'LATE' (20s+) phases are now standard across the engine for shot rhythm analysis.

## Data Model Decisions

- **StatEvent Extensions:** Leveraged `situation` and `shotClockPhase` fields to drive the new analytics. These fields are critical for separating "Transition" performance from "Half-Court" performance.
## 🔨 Forge: [Voice-Command Substitution Entry]
- Implemented voice command parsing for player substitutions: '[Jersey] in for [Jersey]', '[Jersey] sub [Jersey]', and 'sub [Jersey] for [Jersey]'.
- Integrated voice substitution into 'useGameMode.ts' using the 'quickSub' utility for atomic lineup updates.
- Added unit tests in 'voiceParser.test.ts' covering all substitution patterns and opponent substitutions.
