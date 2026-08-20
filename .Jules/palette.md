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

## 2026-08-21 - Micro-UX, Accessibility & Token Standardization Audit
Learning: Replacing raw CSS variable strings (`var(--cs-...)`) with `useTokens()` hook references ensures type-safety and proper theme reactivity. Adding explicit ARIA labels on form text fields and toggle buttons improves screen reader clarity without changing layout appearance.
Action: Implemented 10 micro-UX, accessibility, and design token improvements across VerifiedPeriodModal, LiveLineupCard, ActionControls, ManageRosterDialog, EntityBanner, Scoreboard, TeamStats, SortableHeader, TeamPanel, and TacticalAlertsSidebar.

## 2026-08-22 - Micro-UX, Accessibility & Design Token Audit
Learning: Wrapping disabled `<IconButton>` elements inside `<span>` tags within Material-UI `<Tooltip>` components ensures tooltips remain interactive and hoverable when buttons are disabled without throwing console warnings or blocking mouse events. Adding `aria-live="polite"` status regions to filter headers provides immediate screen reader feedback when data tables change.
Action: Implemented 10 micro-UX, accessibility, and design token improvements across QuickSubDialog, Scoreboard, ThemePresetCard, PlayerStatRow, EntityCard, SideNav, SubstitutionAuditDialog, RecentActionItem, ActionControls, and VerifiedPeriodModal.

## 2026-08-23 - Micro-UX, Accessibility & Token Standardization Polish
Learning: When using `useTokens()` values in Material-UI `sx` numeric spacing properties (`mb`, `px`, `rowGap`), the numeric token value represents raw pixels and must be divided by 8 (e.g. `tokens.semantic.spacing.md / 8`) so MUI multiplies it back to the exact intended pixel value. Always use default imports with subpaths when importing MUI icons (e.g., `import SearchIcon from "@mui/icons-material/Search"`).
Action: Executed 10 micro-UX, accessibility, and design token enhancements across OmniSearch, SubstitutionAuditDialog, SideNav, EntityCard, WorkflowDialogShell, TacticalAlertsSidebar, TeamPanel, CreateTeamWorkflow, KpiStat, and SettingsRow.
