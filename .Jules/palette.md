## 2026-09-02 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `sx` props, passing unitless numbers to spacing properties (`gap`, `px`, `py`) multiplies them by `theme.spacing` (8px). Passing pixel strings with token math (e.g., `${tokens.semantic.spacing.xs / 2}px`) ensures precise pixel rendering without unpredictable fractional multiplier scaling.
Action: Executed 10 micro-UX, accessibility, and design token improvements across Games, Reports, Opponents, OpponentScoutingReport, OffensiveKPICard, StatRankRow, SyncBadge, TimeoutDots, AppTopBar, and VoiceModeBanner.
