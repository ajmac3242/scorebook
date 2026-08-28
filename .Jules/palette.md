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

## 2026-08-24 - Micro-UX, Accessibility & Design Token Audit
Learning: Adding explicit `aria-label` to buttons with visible text changes their screen reader accessible name from the text content to the aria-label string, which can break test queries expecting button text. Only use `aria-label` on icon-only buttons or inputs without visible labels. Replaced raw `var(--cs-...)` CSS variable strings and hardcoded hex defaults with `useTokens()` hook references across navigation, court, and analytics components.
Action: Executed 10 micro-UX, accessibility, and design token improvements across Navigation, LineupEfficiencyCard, SpecialtyExecutionCard, ShotChartFilters, ShotChartCard, BoxScoreSection, GameFilterBar, EfficiencyAnalyticsCard, BasketballCourt, and EntityBanner.

## 2026-08-25 - Micro-UX, Accessibility & Design Token Audit
Learning: Utilizing semantic typography tokens like `tokens.typography.fontWeight.bold` or `tokens.semantic.typography.h6.fontWeight` avoids runtime errors caused by missing properties on nested token objects. Replacing CSS variable strings (`var(--cs-...)`) and MUI color shorthands (`"text.secondary"`, `"divider"`, `"background.paper"`) with `useTokens()` hook references ensures complete design token alignment and theme reactivity.
Action: Executed 10 micro-UX, accessibility, and design token enhancements across EntityRowCard, TeamIdentityPreview, PlayerIdentityPreview, PageSectionIntro, TokenLayout, PlaybookEfficiencyWidget, ScoreAdjustmentDialog, QuickEditRosterDialog, Scoreboard, and EntityBanner.

## 2026-08-26 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In components with nullish coalescing for jersey number lookups across local and roster maps, chaining nullish coalescing (`??`) (e.g., `localJerseyNumbers[pId] ?? sortedRosterJerseyMap.get(pId) ?? "??"`) avoids syntax parse errors caused by mixing logical OR (`||`) with `??`. Wrapping tests with `renderWithProviders` provides theme context required by `useTokens()`.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across FreeThrowWorkflowDialog, OffensiveKPICard, DefensiveSchemeSelector, TeamSettingsDialog, AddGameDialog, LineupsTab, StatsTab, PlayerSummaryCard, Login, and ScoreFlowTooltip.

## 2026-08-28 - Micro-UX, Accessibility & Design Token Polish Audit
Learning: Consolidating theme token consumption through `useTokens()` and replacing legacy MUI palette shorthands (e.g. `"primary.main"`, `"text.secondary"`) with type-safe semantic tokens eliminates raw string duplication and ensures proper theme reactivity. Adding explicit ARIA labels to select controls, icon action buttons, and keyboard handlers improves screen reader navigation and accessibility compliance.
Action: Implemented 10 micro-UX, accessibility, and design token enhancements across WorkflowStepper, PlayerWorkflowDialog, SubstitutionAuditDialog, Navigation, ThemePresetCard, AddOpponentDialog, EditClockDialog, VerifiedPeriodModal, QuickEditRosterDialog, and RecentActionItem.

## 2026-08-29 - Micro-UX, Accessibility & Token Standardization Refactoring
Learning: Replacing CSS variable strings (`var(--cs-...)`) and MUI shorthand strings (`"text.secondary"`, `"text.primary"`) with direct type-safe `useTokens()` hook references ensures complete theme reactivity across different themes. Adding `role="status"`, `aria-live="polite"`, `aria-label`, and `aria-pressed` to interactive components improves screen reader experience without altering visually clean UI layouts.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across AppTopBar, ActionBar, BottomNav, DefensiveBreakdownDialog, JumpBallDialog, PlayerWorkflowDialog, StartingLineupDialog, OpponentBonusChip, PageBreadcrumb, and OpponentJerseyPicker.

## 2026-08-30 - Micro-UX, Accessibility & Token Standardization Refactoring
Learning: Replacing raw CSS variable strings (`var(--cs-...)`) and MUI shorthand color strings (`"text.secondary"`, `"text.primary"`) with direct type-safe `useTokens()` hook references ensures full theme reactivity. Adding accessible landmarks (`role="region"`, explicit `aria-label`) and keyboard focus management (`tabIndex={0}`) on scrollable log views enhances screen reader usability without visual disruption.
Action: Executed 10 micro-UX, accessibility, and design token improvements across App, Settings, TeamSettingsDialog, PlayerStats, BasketballCourt, GameModeComponents, and ThemePresetCard.

## 2026-08-31 - Micro-UX, Accessibility & Design Token Polish Audit
Learning: Consolidating theme token consumption in non-component files (e.g., domain hooks) by importing static `tokens` directly from `tokens/tokens.ts` avoids context provider missing-wrapper runtime errors in unit tests while replacing legacy raw CSS variable strings (`var(--cs-...)`). Standardizing MUI color shorthands (`text.secondary`) to `tokens.semantic.color.text.secondary` ensures design token consistency across components.
Action: Executed 10 micro-UX, accessibility, and design token improvements across MatchupAnalyticsCard, TrackingModeToolbar, EditClockDialog, HalftimeReportDialog, LiveLineupCard, RecentActionsPanel, SectionCard, StatRankCard, StatTable, and useGameMode.
