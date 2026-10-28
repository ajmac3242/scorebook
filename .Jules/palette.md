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

## 2026-09-18 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When setting focus-visible outline width and offset in MUI `sx` objects, pass explicit `"px"` suffixes (e.g. `${tokens.semantic.focus.width}px`) to ensure valid CSS outline declarations across browsers. For MUI `sx` padding/margin props, pass unitless numeric multipliers (`tokens.semantic.spacing.md / 8`) rather than string pixel concatenations.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across Navigation, WorkflowDialogShell, PlayerWorkflowDialog, StartingLineupDialog, QuickSubDialog, VerifiedPeriodModal, EntityRowCard, and AvatarColorPicker.

## 2026-09-19 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When expressing fractional padding or spacing in MUI `sx` props using tokens, derive values using design token division (e.g. `tokens.semantic.spacing.xs / 16`) rather than raw numeric literals to strictly adhere to token-based styling rules.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across OnOffImpactTable, ClutchPerformanceHUD, BoxScoreSection, DefensiveIntegrityDialog, HalftimeReportDialog, PlayerPerformancePanel, SparkPlugTable, PlayerActionLogCard, LineupsTab, and StatsTab.

## 2026-09-21 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When customizing border properties or preview radii in MUI `sx` props, pass explicit token calculations formatted as string pixel values (e.g. `${tokens.semantic.focus.width}px` or `${previewRadius}px`) to guarantee exact pixel rendering without falling back to MUI's default shape multiplier scaling.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across MatchupMatrix, StatTable, OnOffImpactTable, ClutchPerformanceHUD, SparkPlugTable, ThemePresetCard, OmniSearch, EntityBanner, ActionControls, and TeamPanel.

## 2026-09-22 - Micro-UX, Accessibility & Design Token Refactoring
Learning: For screen reader regions and accessibility context in custom widgets, adding `role="region"` alongside `aria-label` guarantees that assistive technologies announce section boundaries clearly. On summary rows in tables, specifying `component="th"` and `scope="row"` ensures accessible row identification without interfering with layout styles.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across TacticalIdentityHUD, TacticalAlertsSidebar, PlaybookEfficiencyWidget, OffensiveKPICard, CourtMarkerFilters, DefensiveSchemeSelector, OpponentBonusChip, VoiceModeBanner, AddOpponentDialog, and BoxScoreSection.

## 2026-09-23 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding `aria-labelledby` or `role="region"` context to dialogs and filter toolbars, ensuring touch target dimensions utilize `tokens.touch.targetComfortable` with explicit `"px"` formatting guarantees accessible touch targets across browsers.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across ScoreAdjustmentDialog, OvertimeTransitionDialog, PlayerStatsFilterBar, PlayerSummaryCard, ScheduleTab, AvatarColorPicker, ActionControls, RecentActionsPanel, StatTable, and EditClockDialog.

## 2026-09-26 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In custom steppers and dialog action controls, specifying `aria-current="step"` on active step nodes and setting explicit `minHeight: `${tokens.touch.targetComfortable}px`` on all interactive buttons ensures accessible screen reader step tracking and comfortable touch target sizing.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across WorkflowStepper, SurfaceCard, EntityRowCard, JumpBallDialog, EndGameDialog, DefensiveBreakdownDialog, FreeThrowWorkflowDialog, QuickSubDialog, QuickEditRosterDialog, and MatchupMatrix.

## 2026-09-27 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Combining `role="region"` and `aria-label` on sub-containers and dialog content ensures screen readers properly communicate landmark regions, while setting `minWidth`/`minHeight` with `tokens.touch.targetComfortable` guarantees consistent touch target accessibility across mobile viewports.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across MatchupMatrix, SubstitutionAuditDialog, ActionControls, MatchupAnalyticsCard, ExpandedSectionDialog, StatTable, ClutchPerformanceHUD, HalftimeReportDialog, SparkPlugTable, and PlayerPerformancePanel.

## 2026-09-28 - Micro-UX, Accessibility & Design Token Refactoring
Learning: On table header cells (`TableCell` in `TableHead`), specifying `component="th"` and `scope="col"` guarantees correct accessibility tree relationships for tabular data. Replacing raw string pixel border declarations (e.g. `1px solid`) with token-derived width templates (e.g. `${tokens.semantic.focus.width}px solid`) eliminates residual magic values in component files.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across OpponentScoutingReport, SubstitutionAuditDialog, QuickEditRosterDialog, PlaybookEfficiencyWidget, ActionControls, RecentActionItem, TeamPanel, EntityCard, EmptyState, and EditClockDialog.

## 2026-09-29 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Explicitly setting `aria-sort="none"` on unsorted table column headers provides assistive technologies with complete sort state awareness. In MUI `Chip` components, formatting `height` as explicit pixel strings (`${tokens.semantic.spacing.lg}px`) prevents MUI from treating numeric token quotients as raw multiplier values.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across CourtSightLogo, StatRankCard, EntityBanner, SortableHeader, SurfaceCard, EntityCard, EntityRowCard, KpiStat, SyncBadge, and BottomNav.

## 2026-10-01 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Relying on global theme `:focus-visible` ring rules and stripping redundant call-site `sx` focus overrides keeps component code lean and consistent across light/dark themes. Replacing pixel string padding literals with design token calculations ensures exact alignment.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across EditClockDialog, SubstitutionAuditDialog, ActionControls, RecentActionItem, StatTable, TeamPanel, PlaybookEfficiencyWidget, EntityCard, SideNav, and Scoreboard.

## 2026-10-02 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When generating `aria-label` strings for components accepting `ReactNode` values (e.g. `KpiStat`), safely inspect the value type (`typeof value === 'string' || typeof value === 'number'`) before interpolation to prevent rendering `"[object Object]"` in accessibility trees. Combining `role="region"` with `aria-label` landmark attributes on visualization containers (`BasketballCourt`, `EmptyState`) guarantees landmark navigation for screen readers.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across ConfirmDialog, EmptyState, PageSnackbar, KpiStat, EntityCard, Scoreboard, TacticalIdentityHUD, PlaybookEfficiencyWidget, BasketballCourt, and AddOpponentDialog.

## 2026-10-03 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Ensure screen reader landmark regions (`role="region"` with `aria-label`) are unique and not duplicated on child container elements to prevent Axe landmark-unique violations. In table cells (`MatchupMatrix`), set unassigned cell borders to `${tokens.semantic.focus.width}px solid transparent` to eliminate subtle layout shifts on cell selection.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across LiveLineupCard, FoulTroubleAlertBanner, StatEntryDialog, OpponentJerseyPicker, MatchupMatrix, StatTable, ActionControls, Scoreboard, RecentActionItem, and SubstitutionAuditDialog.

## 2026-10-04 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding touch target sizing (`minHeight: `${tokens?.touch?.targetComfortable ?? 44}px``) or typography tokens in components, using safe optional chaining and default numeric fallbacks prevents unit test failures when tests mock `useTokens()` partially without full token sub-trees. Specifying `aria-current="step"` on active step labels in `Stepper` workflows gives assistive technology complete screen reader step context.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across TacticalAlertsSidebar, ActionBar, DefensiveMetricsCard, LineupEfficiencyCard, SpecialtyExecutionCard, PlayerStatRow, BottomNav, SettingsRow, VerifiedPeriodModal, PageToolbar, and SectionCard.

## 2026-10-05 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding touch target sizing (`minHeight: `${tokens?.touch?.targetComfortable ?? 44}px``) or typography tokens in components, using safe optional chaining and default numeric fallbacks prevents unit test failures when tests mock `useTokens()` partially without full token sub-trees. Specifying `aria-current="step"` on active step labels in `Stepper` workflows gives assistive technology complete screen reader step context.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across StartingLineupDialog, JumpBallDialog, OvertimeTransitionDialog, ScoreAdjustmentDialog, AddGameDialog, ExpandedSectionDialog, BoxScoreCard, ScoreFlowCard, PlayerWorkflowDialog, and PageSectionCard.

## 2026-10-06 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `sx` props, numeric `borderRadius` values (e.g. `borderRadius: 1` or `borderRadius: 999`) get evaluated as shape multipliers (`1 * theme.shape.borderRadius` = 8px) or unsemantic numbers. Explicitly passing token templates (`${tokens.semantic.shape.radius.full}px`, `${tokens.semantic.shape.radius.none}px`, `${tokens.semantic.shape.radius.xs}px`) guarantees type-safe and theme-driven border curvature across dark/light themes.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across ThemePresetCard, VerifiedPeriodModal, Scoreboard, CreateTeamWorkflow, BottomNav, ActionControls, StatEntryDialog, QuickSubDialog, OvertimeTransitionDialog, and EndGameDialog.

## 2026-10-07 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI component architectures, avoid adding call-site `sx` overrides for `borderRadius`, `fontWeight`, or `minHeight` on `<Button>` components when `buildTheme.ts` defines global `MuiButton` defaults. Retain call-site `sx` only for positioning or contextual styling to honor design system encapsulation rules.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across PracticePlannerDialog, ExpandedSectionDialog, EditGameDialog, ManageRosterDialog, AddGameDialog, TeamSettingsDialog, AddOpponentDialog, ConfirmDialog, SubstitutionAuditDialog, and PageToolbar.

## 2026-10-07 - Shared Components Micro-UX, Accessibility & Token Refactoring
Learning: When adding `role="region"` attributes to repetitive sub-components (such as `KpiStat` cells rendered within data tables), verify that every instance produces a unique `aria-label` name to avoid Axe `landmark-unique` accessibility violations across repeated table columns or rows.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across SurfaceCard, EntityCard, EntityRowCard, SideNav, RecentActionItem, StatRankCard, WorkflowStepper, KpiStat, CourtSightLogo, and EmptyState.

## 2026-10-08 - Micro-UX, Accessibility & Design Token Refactoring
Learning: `tokens.semantic.focus.width` is reserved specifically for `:focus-visible` ring outlines, not general element border strokes. Keep standard component border stroke widths (`1px`, `1.5px`) intact while standardizing border radius templates (`${tokens.semantic.shape.radius.*}px`) and landmark navigation regions (`component="nav"`, `role="region"`).
Action: Executed 10 micro-UX, accessibility, and design token refactorings across TimeoutDots, BoxScoreCard, PageBreadcrumb, OffensiveKPICard, OpponentBonusChip, StatRankRow, PageSectionIntro, PageSectionCard, TeamIdentityPreview, and ScoreFlowTooltip.

## 2026-10-10 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Standard border strokes (`1px solid`) should rely on CSS standard declarations rather than arbitrary token arithmetic on `tokens.semantic.focus.width`. Ensure clean component prop typings when adding landmark region attributes (`role="region"`, `aria-label`) to layout cards.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across MatchupAnalyticsCard, DefensiveMetricsCard, ImpactAnalyticsSection, AvatarColorPicker, OmniSearch, OnOffImpactTable, PlayerIdentityPreview, SettingsRow, WorkflowDialogShell, and SectionCard.

## 2026-10-12 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding landmark region accessibility attributes (`role="region"`, `aria-label`) to page shells or containers, ensure the wrapper component definition accepts `role` and `aria-label` in its props interface (e.g. `AppPageShellProps`). Stripping redundant call-site `<Button>` `fontWeight` overrides allows global `buildTheme.ts` defaults to manage typography consistently.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across LineupEfficiencyCard, ScoreFlowTooltip, ShotChartCard, Games, Login, OpponentScoutingReport, Opponents, PlayerGameLogCard, PlayerSummaryCard, and Reports (and added role / aria-label support to AppPageShell).

## 2026-10-15 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When standardizing element sizing across complex pages, replace raw pixel literals and magic numbers with semantic tokens (e.g., `${tokens.touch.targetComfortable}px`, `tokens.semantic.spacing.xl * 2`, `${tokens.semantic.spacing.appBarHeight}px`). Adding `role="region"` and `role="navigation"` with explicit `aria-label` strings across page sections, toolbars, and control panels provides screen reader users with distinct landmark navigation.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across GameStats, Dashboard, PlayerStats, OmniSearch, EntityBanner, AppTopBar, PageToolbar, SideNav, TeamPanel, and ActionControls.

## 2026-10-16 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding `role="region"` attributes to cards or panels that use `SurfaceCard` or other cards with internal `role="region"`, ensure landmark labels are unique and avoid redundant nested landmark declarations that trigger Axe `landmark-unique` violations. Adding explicit `aria-sort` values (`"ascending"`, `"descending"`, `"none"`) on sortable table headers gives screen readers complete sorting awareness.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across OpponentScoutingPanel, PlayerPerformancePanel, RecentActionsPanel, QuickSubDialog, StatEntryDialog, DefensiveBreakdownDialog, VerifiedPeriodModal, GameFilterBar, ShotChartFilters, and SpecialtyExecutionCard.

## 2026-10-17 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When standardizing component borders and padding, prefer unitless token division for MUI spacing multipliers (`tokens.semantic.spacing.md / 8`) and strip redundant call-site `textTransform`, `borderRadius`, and `minHeight` overrides on standard `<Button>` components to let global `buildTheme.ts` defaults rule consistently.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across Games, Reports, Teams, Players, Opponents, StatRankCard, StatRankRow, ThemePresetCard, SettingsRow, WorkflowStepper, and AvatarColorPicker.

## 2026-10-18 - Micro-UX, Accessibility & Design Token Refactoring
Learning: `tokens.semantic.focus.width` is reserved for focus-visible ring outlines rather than general element border strokes. Standardize component container borders using standard `1px solid` or `1.5px solid` CSS declarations while preserving `${tokens.semantic.shape.radius.full}px` for circular indicator radii.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across AddOpponentDialog, OpponentJerseyPicker, TimeoutDots, TacticalIdentityHUD, FoulTroubleAlertBanner, SparkPlugTable, ActionControls, Scoreboard, TeamPanel, SurfaceCard, and EntityCard.

## 2026-10-19 - Micro-UX, Accessibility & Design Token Refactoring across Dialog Components
Learning: On dialog control buttons, stripping redundant call-site `fontWeight` and `borderRadius` overrides lets global `buildTheme.ts` defaults manage button styling consistently, while adding explicit `aria-pressed`, `aria-label`, and `role="region"` attributes gives screen reader users complete interaction context.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across FreeThrowWorkflowDialog, StatEntryDialog, QuickSubDialog, JumpBallDialog, EditClockDialog, ScoreAdjustmentDialog, OvertimeTransitionDialog, EndGameDialog, SubstitutionAuditDialog, and DefensiveBreakdownDialog.

## 2026-10-20 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When adding explicit `aria-current="page"` attributes to navigation links and `aria-label` strings to form input fields, ensure token-based border stroke declarations rely on unitless quotients or standard 1px definitions rather than raw focus ring widths.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across PlayerWorkflowDialog, PlayerIdentityPreview, CreateTeamWorkflow, TeamIdentityPreview, ActionBar, PageToolbar, AppTopBar, BottomNav, SideNav, and WorkflowDialogShell.

## 2026-10-22 - Micro-UX, Accessibility & Design Token Refactoring
Learning: In MUI `sx` props, passing string pixel templates for button/toggle touch target bounds (e.g. `minWidth: \`${tokens.touch.targetComfortable}px\``, `minHeight: \`${tokens.touch.targetComfortable}px\``) guarantees precise 44px comfortable touch targets across mobile and desktop viewports, while deriving layout container heights using token arithmetic (`tokens.semantic.spacing.xl * 12.5`) eliminates hardcoded pixel literals.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across DefensiveSchemeSelector, FoulTroubleAlertBanner, OffensiveKPICard, DefensiveIntegrityDialog, BoxScoreCard, ScoreFlowCard, PlayerStatsFilterBar, GameFilterBar, ShotChartFilters, EditPlayerDialog, and AddPlayerDialog.

## 2026-10-25 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Prefer separating `border` properties (`borderStyle: "solid"`, `borderWidth: 1`) when specifying semantic border colors (`borderColor: tokens.semantic.color.border.subtle`) in MUI `sx` props to avoid CSS shorthand overrides that drop token color values.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across TrackingModeToolbar, QuickSubDialog, VoiceModeBanner, AddGameDialog, ManageRosterDialog, VerifiedPeriodModal, Dashboard, Login, PracticePlannerDialog, and Settings.

## 2026-10-26 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Standardize component border stroke declarations (`1px solid`, `1.5px solid`, `2px solid`) in MUI `sx` props rather than using arithmetic operations on `tokens.semantic.focus.width`, which is strictly reserved for focus ring outlines (`outline`).
Action: Executed 10 micro-UX, accessibility, and design token refactorings across EntityBanner, EntityCard, EntityRowCard, EmptyState, MatchupMatrix, BottomNav, SideNav, ActionBar, PageToolbar, and AvatarColorPicker.

## 2026-10-27 - Micro-UX, Accessibility & Design Token Refactoring
Learning: When standardizing component dimensions and typography on layout tabs and game cards, use string pixel token templates (`${tokens.touch.targetComfortable}px`, `${tokens.semantic.spacing.md}px`) and typography token strings (`tokens.typography.fontSize.xs`) to eliminate raw rem and pixel literals while maintaining clean snapshot parity.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across AppPageShell, LiveLineupCard, GameModeComponents, BoxScoreCard, LineupsTab, StatsTab, RosterTab, ScheduleTab, ShotChartCard, and EfficiencyAnalyticsCard.

## 2026-10-28 - Micro-UX, Accessibility & Design Token Refactoring
Learning: Adding explicit `aria-sort="none"` to unsorted table headers (`<TableCell component="th" scope="col">`) provides assistive technologies with complete sort awareness, while converting raw spacing and dimension numbers into design token quotients (`tokens.semantic.spacing.md / 8`) enforces consistent spacing across views.
Action: Executed 10 micro-UX, accessibility, and design token refactorings across ClutchPerformanceHUD, OnOffImpactTable, AvatarColorPicker, OmniSearch, StatTable, TacticalAlertsSidebar, PlaybookEfficiencyWidget, WorkflowStepper, EntityCard, and Navigation.

## 2026-10-28 - Shared Cards & Banners Border Stroke & Accessibility Refactoring
Learning: Standardizing container border strokes using explicit MUI `borderStyle`, `borderWidth`, and `borderColor` token properties prevents shorthand property collisions when overriding card border colors (such as favorite accent highlights).
Action: Executed micro-UX, accessibility, and design token refactorings across EntityCard, EntityRowCard, SurfaceCard, EntityBanner, CourtSightLogo, and EmptyState.
