# Palette's Journal

## 2026-05-27 - Initial UX Audit
Learning: The application has a strong "Moleskine" aesthetic but lacks some standard feedback mechanisms (like confirmations for destructive actions) and accessibility shortcuts (like "Skip to Content").
Action: Implement 10 micro-UX improvements focusing on feedback, accessibility, and clarity.

## 2026-05-27 - Micro-UX Improvements Implementation
Learning: Small changes like adding keyboard hints and replacing native confirm dialogs significantly improve the "feel" of the app. Centralized focus-visible styles in index.css help ensure consistent accessibility.
Action: Implemented 10+ improvements across Opponents, SubstitutionAudit, GameMode, and Navigation.

## 2026-05-11 - Polish & Accessibility Suite
Learning: `useLiveQuery` returns `undefined` while loading, which often causes a "flicker" of empty states. Mapping `undefined` to `null` in the query itself allows for clean `if (val === undefined) return <Loader />` logic.
Action: Implemented 10+ micro-UX improvements including loading states, inline UNDO actions, shortcut discovery, and global focus indicators.

## 2026-08-20 - Design Tokens & Accessibility Polish Audit
Learning: In components with jersey number map lookups, logical OR (`|| "??"`) overrides jersey number `0` causing it to render as `"??"`. Using nullish coalescing (`?? "??"`) preserves valid jersey number `0`. Replacing raw CSS variable strings with `useTokens()` and adding explicit table/button ARIA labels provides consistent design token safety and improved screen reader navigation.
Action: Implemented 10 micro-UX, accessibility, and token improvements across ClutchPerformanceHUD, MatchupMatrix, TacticalIdentityHUD, SparkPlugTable, OnOffImpactTable, PlayerGameLogCard, PlayerActionLogCard, OpponentScoutingPanel, PlayerPerformancePanel, and HalftimeReportDialog.
