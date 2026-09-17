## 2026-09-02 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `sx` props, passing unitless numbers to spacing properties (`gap`, `px`, `py`) multiplies them by `theme.spacing` (8px). Passing pixel strings with token math (e.g., `${tokens.semantic.spacing.xs / 2}px`) ensures precise pixel rendering without unpredictable fractional multiplier scaling.
Action: Executed 10 micro-UX, accessibility, and design token improvements across Games, Reports, Opponents, OpponentScoutingReport, OffensiveKPICard, StatRankRow, SyncBadge, TimeoutDots, AppTopBar, and VoiceModeBanner.

## 2026-09-04 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Typography font size tokens (`tokens.typography.fontSize.*`) are exported as CSS string values with rem units (e.g., `"0.75rem"`). Appending `"px"` string literals to font size tokens creates invalid CSS syntax like `"0.75rempx"`. Pass font size tokens directly without `"px"` suffixes, or use pixel numbers when numeric calculation is required.
Action: Executed 10 micro-UX, accessibility, and design token improvements across Dashboard, BasketballCourt, BoxScoreSection, SparkPlugTable, ClutchPerformanceHUD, PlaybookEfficiencyWidget, CreateTeamWorkflow, TeamIdentityPreview, SortableHeader, and KpiStat.

## 2026-09-06 - Micro-UX, Accessibility & Design Token Refactoring
Learning: On MUI `Chip` components, customizing the delete icon's accessible label requires passing `deleteIcon={<CancelIcon aria-label="..." />}` instead of non-existent `deleteIconProps` props to prevent TypeScript build failures during type checking.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across MatchupAnalyticsCard, LiveLineupCard, RecentActionsPanel, DefensiveSchemeSelector, CourtMarkerFilters, OpponentBonusChip, QuickEditRosterDialog, VerifiedPeriodModal, EditGameDialog, and TeamSettingsDialog.

## 2026-09-07 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `sx` props, numeric `borderRadius` values (e.g., `borderRadius: 8`) are treated as multiplier values (`8 * theme.shape.borderRadius`), resulting in unexpectedly large radii (e.g. 64px instead of 8px). Pass explicitly formatted string values (e.g., `${tokens.semantic.component.radius.button}px`) to guarantee exact pixel rendering.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across RecentActionsPanel, EditGameDialog, ManageRosterDialog, LineupsTab, StatEntryDialog, SectionCard, OpponentScoutingReport, PlayerSummaryCard, Scoreboard, and CreateTeamWorkflow.

## 2026-09-08 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When applying token-based border radius values, pass token values (e.g. `tokens.semantic.shape.radius.full`) directly without appending `%` or `"px"` string suffixes to avoid invalid CSS syntax such as `"9999%"`. In MUI `sx` props, numeric spacing multipliers (e.g. `p: 0.25`, `width: 90`) are preferred over hardcoded string pixel literals.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across SubstitutionAuditDialog, WorkflowStepper, Navigation, TeamPanel, Scoreboard, EditClockDialog, QuickEditRosterDialog, RecentActionItem, ActionControls, EntityCard, and PlaybookEfficiencyWidget.

## 2026-09-09 - Micro-UX, Accessibility & Design Token Refactoring
Learning: On MUI Grid components, passing string pixel values to `spacing` (e.g. `spacing={`${tokens.semantic.spacing.md}px`}`) causes invalid layout math because Grid expects numeric spacing multipliers (e.g. `tokens.semantic.spacing.md / 8` = 2). Use numeric token division for Grid `spacing` props and direct typography token references without `"px"` suffixes.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across GameStats, LiveLineupCard, ShotChartCard, PracticePlannerDialog, DefensiveIntegrityDialog, EfficiencyAnalyticsCard, GameFilterBar, ScheduleTab, StatsTab, ScoreFlowTooltip, and OpponentScoutingPanel.

## 2026-09-10 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding accessibility attributes to buttons with visible labels, avoid adding redundant `aria-label` props as they override visible button text in accessibility trees and break existing exact-name test queries. For touch targets, set explicit `minWidth` and `minHeight` props using `tokens.touch.targetComfortable` (44px).
Action: Executed 10 micro-UX, accessibility, and design token refactorings across ConfirmDialog, PracticePlannerDialog, LiveLineupCard, RecentActionsPanel, TrackingModeToolbar, GameStats, OpponentScoutingPanel, AddOpponentDialog, Settings, and OmniSearch.

## 2026-09-11 - Micro-UX, Accessibility & Design Token Refactoring
Learning: For SVG elements such as `<text>`, passing CSS string tokens (e.g. `fontSize="0.75rem"`) as element attributes can trigger DOM/SVG warnings in certain browsers. Prefer setting font size via element `style={{ fontSize: tokens.typography.fontSize.xs }}` to ensure consistent SVG text rendering across all targets.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across BasketballCourt, TrackingModeToolbar, EntityCard, Games, Navigation, ShotChartCard, Opponents, Reports, Settings, and ConfirmDialog.

## 2026-09-12 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When refactoring table headers for accessibility, adding `component="th"` and `scope="col"` to `TableCell` elements in `TableHead` provides screen readers with proper column context without disrupting layout or breaking component tests.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across HalftimeReportDialog, JumpBallDialog, FreeThrowWorkflowDialog, EndGameDialog, DefensiveBreakdownDialog, FoulTroubleAlertBanner, PlayerActionLogCard, PlayerShotChartCard, LineupEfficiencyCard, and PlayerPerformancePanel.

## 2026-09-13 - Micro-UX, Accessibility & Design Token Refactoring
Learning: On MUI `Checkbox` components, pass accessibility labels using `slotProps={{ input: { "aria-label": "..." } }}` to conform to TypeScript definitions and ensure proper screen reader label association. When applying focus ring styles (`tokens.semantic.focus.width`), append `"px"` to numeric token values inside CSS shorthand string templates to ensure valid CSS syntax.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across SideNav, StartingLineupDialog, QuickSubDialog, FoulTroubleAlertBanner, PlayerWorkflowDialog, TeamSettingsDialog, ShotChartFilters, RosterTab, PlayerGameLogCard, and OpponentJerseyPicker.

## 2026-09-15 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `ActionBar` and `StatTable` components, avoid concatenating `"px"` string suffixes onto spacing token values divided by 8 (e.g. `px: "${tokens.semantic.spacing.md / 8}px"` resulted in `2px` instead of `16px`). Pass unitless spacing numbers (`px: tokens.semantic.spacing.md / 8`) so MUI correctly applies its 8px theme spacing multiplier.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across PlayerStatRow, SubstitutionAuditDialog, OmniSearch, TeamPanel, ActionControls, WorkflowStepper, ActionBar, EntityCard, RecentActionItem, and StatTable.

## 2026-09-17 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When setting explicit pixel border radius tokens in MUI `sx` props (e.g. `${tokens.semantic.shape.radius.sm}px`), ensure string template evaluation includes the `"px"` suffix to avoid invalid CSS values like `"6"` that fall back to browser defaults.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across RecentActionsPanel, ActionControls, OmniSearch, SubstitutionAuditDialog, LineupsTab, StatsTab, HalftimeReportDialog, PlayerActionLogCard, PlayerGameLogCard, and EfficiencyAnalyticsCard.
