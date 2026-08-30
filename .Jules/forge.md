# Forge Insights & Architecture Journal

## Overtime Transition Dialog & Period Length Configurator (September 2026)
- **Overtime Transition Triggering**: When regulation (period 4 for Quarters, period 2 for Halves) or any subsequent OT period ends in a tie game during period verification (`handleVerifyPeriod`), `useGameMode` opens the `OvertimeTransitionDialog`.
- **Custom Overtime Length**: Allows scorekeepers to confirm or adjust the Overtime duration (1-20 minutes, defaulting to `team.defaultOvertimeLength` or standard ruleset default of 5 minutes).
- **Persistence & Intermission**: Updating the OT duration persists the team's `defaultOvertimeLength` preference to IndexedDB, starts a 2-minute quarter break intermission countdown, and seamlessly increments the period counter in `useGameClock`.
