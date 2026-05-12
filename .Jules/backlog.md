# Scorebook Backlog

## [x] [Defensive "Kill" & Momentum Tracker]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** A "Kill" (3 consecutive defensive stops) is the gold standard for defensive momentum. Visualizing this in real-time motivates the unit and triggers timeout decisions.
**What:** Add a live "Kill Streak" counter and visual pulse in the GameMode scoreboard that tracks consecutive defensive stops.
**Acceptance Criteria:**
- [ ] Real-time "Stop Streak" counter in the GameMode header.
- [ ] Visual animation/notification when a "Kill" (3 stops) is achieved.
- [ ] "Kill Count" added to the Team Stats card.
- [ ] Historical "Kill Log" in the game timeline.

## [x] [Archetype-Based Matchup Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Coaches shouldn't just know who is scoring, but *how* to stop them. Linking defender Stop % to opponent "Play Types" (PnR, ISO, etc.) identifies the optimal personnel counter.
**What:** Enhance the Matchup Matrix to suggest the best defender for a specific opponent player based on their performance against that player's most frequent Play Type.
**Acceptance Criteria:**
- [ ] "Recommended Matchup" badge in the Matchup Matrix.
- [ ] Correlation of Defender X's Stop % specifically against "PnR Handler" or "ISO" actions.
- [ ] Alert when a "Mismatched Archetype" occurs (e.g., a slow defender on a high-transition scorer).

## [x] ["Winning Time" (Clutch) Performance HUD]
**Priority:** HIGH
**Type:** UX / Feature
**Why:** The final 4 minutes of a close game require different tactical data (Usage Rate, Clutch eFG%). This HUD removes the "noise" and focuses only on high-pressure performance.
**What:** Automatically trigger a "Clutch Mode" UI state when the game clock is < 4:00 and the spread is < 5 points.
**Acceptance Criteria:**
- [ ] High-contrast "Winning Time" visual state for the GameMode sidebar.
- [ ] Highlight "Clutch usage" leaders for both teams (who wants the ball?).
- [ ] Show "Free Throw Reliability" for the 5 players currently on the floor.
- [ ] Proactive timeout/foul strategy alerts based on the "Winning Time" context.

## [ ] [Live On/Off Team Impact HUD]
**Priority:** HIGH
**Type:** Feature / Analytics
**Why:** Plus/Minus is noisy. On/Off Net Rating shows a player's true relative value. Knowing the team is -10.0 per 100 possessions when Player X sits is the ultimate subbing directive.
**What:** A live "Impact HUD" that shows the On/Off Net Rating delta for all rostered players relative to the current game's pace.
**Acceptance Criteria:**
- [ ] "Impact" column in the GameMode player table showing (Team Net Rating ON) - (Team Net Rating OFF).
- [ ] Color-coded "Relative Value" pips (Green: Team better with them, Red: Team better without).
- [ ] Integration into the "Halt" fatigue alert (e.g., "Player X is tired but Team is -15 with them OFF").

## [ ] [Post-Game "Process vs. Result" Scorecard]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Coaches need to know if they lost because of "bad luck" (cold shooting on good looks) or "bad process." Separating shot quality from the result preserves team confidence.
**What:** An automated post-game report that compares "Actual Score" vs "Expected Score" (based on xPTS/Shot Quality).
**Acceptance Criteria:**
- [ ] "Process Report Card" in GameStats (A through F grade based on Shot Quality ROI).
- [ ] "Win/Loss Logic" breakdown: "We lost the game but won the process (Shot Quality +12%)."
- [ ] Identification of the "Process MVP" (Player with highest xPTS creation regardless of makes).

## [x] [DESIGN-001-A: Design Tokens — Token Interface & Electric Orange Values]
**Priority:** CRITICAL
**Type:** Design System
**Why:** All CourtSight UI stories depend on a single source of truth for color. Without this file every component uses hardcoded hex values that cannot be swapped for theming. This is the hard blocker for all other DESIGN stories.
**What:** Create `src/theme/tokens.ts`. Define the `ThemeTokens` interface and export the default `electricOrangeTokens` object.
**Scope:** `src/theme/tokens.ts` (new file only — do not touch any other file)
**Acceptance Criteria:**
- [x] `ThemeTokens` interface exported with fields: `primary`, `primaryDark`, `primaryContainer`, `onPrimary`, `onPrimaryContainer`, `background`, `surface`, `surfaceVariant`, `elevatedCard`, `outline`, `textPrimary`, `textSecondary`, `success`, `warning`, `error`, `info`
- [x] `electricOrangeTokens` object exported implementing `ThemeTokens`: primary `#FF6B1A`, primaryDark `#D9550D`, primaryContainer `#3A2418`, onPrimary `#1A0F09`, onPrimaryContainer `#FFD9C7`, background `#0F1115`, surface `#151922`, surfaceVariant `#1C2230`, elevatedCard `#222A3A`, outline `#384256`, textPrimary `#F3F6FA`, textSecondary `#AAB4C5`, success `#35C759`, warning `#FFB020`, error `#FF5D73`, info `#5AA9FF`
- [x] File compiles with no TypeScript errors
- [x] No other files are modified

## [x] [DESIGN-001-B: Design Tokens — MUI Theme Builder Function]
**Priority:** CRITICAL
**Type:** Design System
**Why:** Token values from DESIGN-001-A need to be translated into a MUI `Theme` object. The builder must accept any `ThemeTokens` object so runtime theme switching (DESIGN-011) works without additional changes.
**What:** Create `src/theme/buildTheme.ts`. Export a `buildCourtSightTheme(tokens: ThemeTokens): Theme` function.
**Scope:** `src/theme/buildTheme.ts` (new file only — do not touch any other file)
**Depends on:** DESIGN-001-A
**Acceptance Criteria:**
- [x] `buildCourtSightTheme` accepts a `ThemeTokens` argument
- [x] MUI palette mapped: `primary.main` → `tokens.primary`, `primary.dark` → `tokens.primaryDark`, `primary.contrastText` → `tokens.onPrimary`, `background.default` → `tokens.background`, `background.paper` → `tokens.surface`, `text.primary` → `tokens.textPrimary`, `text.secondary` → `tokens.textSecondary`, `divider` → `tokens.outline`, `success.main` → `tokens.success`, `warning.main` → `tokens.warning`, `error.main` → `tokens.error`, `info.main` → `tokens.info`
- [x] `mode` set to `dark`
- [x] No other files are modified

## [x] [DESIGN-001-C: Design Tokens — Wire Theme into App]
**Priority:** CRITICAL
**Type:** Design System
**Why:** The theme builder is useless until applied to the running app. This story wires `electricOrangeTokens` through `buildCourtSightTheme` into MUI's `ThemeProvider` so the new palette is live immediately.
**What:** Update `App.tsx` to apply the CourtSight theme. Update `index.html` meta tags.
**Scope:** `src/App.tsx`, `index.html` only — do not touch any page or component files
**Depends on:** DESIGN-001-B
**Acceptance Criteria:**
- [x] `App.tsx` imports `buildCourtSightTheme` and `electricOrangeTokens`
- [x] `ThemeProvider` wraps the app with `buildCourtSightTheme(electricOrangeTokens)`
- [x] `CssBaseline` included inside `ThemeProvider`
- [x] `index.html` `<title>` updated to `CourtSight`
- [x] `index.html` `theme-color` meta set to `#FF6B1A`
- [x] App still loads and runs without errors
- [x] No page or feature component files are modified

## [ ] [DESIGN-002: Rebrand — App Name, Logo & Favicon]
**Priority:** CRITICAL
**Type:** Rebrand
**Why:** Every visible reference to "Scorebook" must be replaced with "CourtSight" before layout work begins so agents do not create new components with the old name.
**What:** Replace all UI-visible "Scorebook" references. Create `CourtSightLogo` SVG component. Replace favicon.
**Scope:** `src/components/CourtSightLogo.tsx` (new), `public/favicon.svg`, any file containing "Scorebook" in UI-visible text — do not touch routing logic, data models, or API calls
**Depends on:** DESIGN-001-C
**Acceptance Criteria:**
- [ ] `CourtSightLogo.tsx` created as an SVG React component — wordmark "CourtSight" in Inter Bold with a basketball-arc icon in `#FF6B1A`
- [ ] `favicon.svg` updated to match logo mark
- [ ] All UI-visible strings "Scorebook" replaced with "CourtSight"
- [ ] No route names, API endpoints, database keys, or Dexie schema fields changed
- [ ] App compiles and loads without errors

## [ ] [DESIGN-003-A: App Shell — Layout Wrapper Component]
**Priority:** CRITICAL
**Type:** Layout
**Why:** Before nav drawer or bottom nav can be built, the app needs a shell wrapper defining the three-panel layout: drawer slot, top bar slot, and main content area.
**What:** Create `src/components/layout/AppShell.tsx`. Wire into router mount as top-level layout wrapper.
**Scope:** `src/components/layout/AppShell.tsx` (new), router mount file only — do not build drawer or nav contents yet
**Depends on:** DESIGN-001-C
**Acceptance Criteria:**
- [ ] `AppShell` renders a full-viewport `Box` with CSS grid: `[drawer][main]` on ≥768px, `[main]` + bottom slot on mobile
- [ ] Drawer slot 240px wide on ≥768px, hidden on smaller screens
- [ ] Main content area fills remaining space with `overflow-y: auto`
- [ ] Bottom slot reserved (empty `Box` 56px height) on <768px
- [ ] `children` rendered inside main content area
- [ ] All existing pages still render correctly inside the new shell
- [ ] No nav contents, icons, or route links added yet

## [ ] [DESIGN-003-B: App Shell — Side Navigation Drawer]
**Priority:** CRITICAL
**Type:** Navigation
**Why:** Coaches on iPad need persistent one-tap access to all six sections. The drawer should be always visible on tablet and collapse on mobile.
**What:** Create `src/components/layout/SideNav.tsx` and mount it in the drawer slot of `AppShell`.
**Scope:** `src/components/layout/SideNav.tsx` (new), `AppShell.tsx` update only
**Depends on:** DESIGN-003-A
**Acceptance Criteria:**
- [ ] MUI `Drawer` variant `permanent` on ≥768px, `temporary` on smaller screens
- [ ] Nav items in order: Dashboard, Games, Live, Players, Teams, Reports — each with MUI icon and label
- [ ] Active item uses `primaryContainer` background and `primary` text color from theme
- [ ] Live item has animated orange dot badge when game in progress (prop-driven, defaults false)
- [ ] Coach profile pill at drawer bottom: avatar initial + display name
- [ ] Drawer background uses `background.paper` token
- [ ] No hardcoded hex colors

## [ ] [DESIGN-003-C: App Shell — Bottom Navigation for Mobile]
**Priority:** CRITICAL
**Type:** Navigation
**Why:** On phones, a bottom nav gives coaches thumb-accessible navigation to the five most-used sections.
**What:** Create `src/components/layout/BottomNav.tsx` and mount it conditionally in the bottom slot of `AppShell` on <768px.
**Scope:** `src/components/layout/BottomNav.tsx` (new), `AppShell.tsx` update only
**Depends on:** DESIGN-003-B
**Acceptance Criteria:**
- [ ] MUI `BottomNavigation` with five items: Dashboard, Games, Live, Players, Teams
- [ ] Only visible on screens <768px
- [ ] Active item uses `primary` color
- [ ] Live item shows orange dot indicator when game in progress (prop-driven)
- [ ] Background uses `surface` token
- [ ] No hardcoded hex colors

## [ ] [DESIGN-004: App Shell — Top App Bar]
**Priority:** CRITICAL
**Type:** Navigation
**Why:** The top bar is the coach's command strip — it holds team switcher, sync/live status, omnisearch trigger, notifications, and profile. Must be slim and always visible.
**What:** Create `src/components/layout/AppTopBar.tsx` and `src/components/layout/SyncBadge.tsx`. Mount in `AppShell`.
**Scope:** `src/components/layout/AppTopBar.tsx` (new), `src/components/layout/SyncBadge.tsx` (new), `AppShell.tsx` update only
**Depends on:** DESIGN-003-A
**Acceptance Criteria:**
- [ ] MUI `AppBar` with `position="sticky"`, background matches `surface` token
- [ ] Left: `CourtSightLogo` mark + starred team name/switcher chip
- [ ] Center: OmniSearch trigger button (logic wired in DESIGN-005)
- [ ] Right: `SyncBadge` (green pulse when live, grey when offline), notification bell, profile avatar
- [ ] `SyncBadge` is its own component — animated green dot with "LIVE" label when active
- [ ] AppBar height 56px mobile, 64px tablet+
- [ ] No hardcoded hex colors

## [ ] [DESIGN-005-A: OmniSearch — Input Shell & Dropdown Container]
**Priority:** CRITICAL
**Type:** Feature
**Why:** Coaches must find any player, team, game, from one place. This story builds the visual shell only — input field and empty dropdown. Logic comes in DESIGN-005-B.
**What:** Create `src/components/search/OmniSearch.tsx`. Wire trigger button in `AppTopBar`.
**Scope:** `src/components/search/OmniSearch.tsx` (new), `AppTopBar.tsx` trigger wire-up only
**Depends on:** DESIGN-004
**Acceptance Criteria:**
- [ ] Search input renders as full-width modal overlay on mobile, inline expanded panel on tablet+
- [ ] Placeholder: `Search players, games, teams, stats, or actions…`
- [ ] Dropdown container renders below input with grouped section headers: Players, Games, Teams, Reports, Actions
- [ ] Keyboard shortcut hint shown: `⌘K` on desktop
- [ ] Empty state shows recent searches (static placeholder data acceptable)
- [ ] Close on Escape key or outside click
- [ ] No search logic yet — dropdown shows empty sections with headers only
- [ ] No hardcoded hex colors

## [ ] [DESIGN-005-B: OmniSearch — Search Hook & Grouped Results]
**Priority:** CRITICAL
**Type:** Feature
**Why:** The search shell needs to return real results from existing app data (players, games, teams).
**What:** Create `src/hooks/useOmniSearch.ts` and `src/components/search/SearchDropdown.tsx`. Wire into `OmniSearch.tsx`.
**Scope:** `src/hooks/useOmniSearch.ts` (new), `src/components/search/SearchDropdown.tsx` (new), `OmniSearch.tsx` update only
**Depends on:** DESIGN-005-A
**Acceptance Criteria:**
- [ ] `useOmniSearch(query: string)` returns `{ players, games, teams, reports, actions }` filtered from existing app data
- [ ] Results update on each keystroke with 150ms debounce
- [ ] `SearchDropdown` renders each group with icon + label rows
- [ ] Best match pinned to top of dropdown
- [ ] Each result row is keyboard navigable (arrow keys + Enter)
- [ ] Selecting a result navigates to the correct page
- [ ] No hardcoded hex colors

## [ ] [DESIGN-010-A: Design Audit — Layout & Navigation Files]
**Priority:** HIGH
**Type:** Quality
**Why:** After all layout and nav stories land, a dedicated audit pass ensures no hardcoded colors, incorrect spacing, or missing theme token usage slipped through.
**What:** Audit all files in `src/components/layout/` and `src/components/search/` for design compliance.
**Scope:** `src/components/layout/` and `src/components/search/` — read and fix only, no new features
**Depends on:** DESIGN-005-C
**Acceptance Criteria:**
- [ ] Zero hardcoded hex color values in any layout or search component
- [ ] All spacing values use MUI `theme.spacing()` — no raw pixel strings except where explicitly documented
- [ ] All font sizes use MUI typography variants — no raw `fontSize` strings
- [ ] Tabular numeral font feature applied to all numeric stat displays
- [ ] Border radius consistent: cards `12px`, buttons `8px`, chips `8px`
- [ ] All components pass a manual visual review on iPad (768px) and mobile (390px) viewport sizes

## [x] [DESIGN-011-A: Theme Editor — Preset Token Files]
**Priority:** HIGH
**Type:** Feature
**Why:** Before the theme switching UI can be built, all preset token objects need to exist as data. This story creates the 8 preset token files so DESIGN-011-B can import them without any business logic changes.
**What:** Create `src/theme/presets/` directory with one file per preset, each exporting a `ThemeTokens` object.
**Scope:** `src/theme/presets/` directory (new files only) — do not touch App.tsx, ThemeContext, or any component
**Depends on:** DESIGN-001-A
**Acceptance Criteria:**
- [x] 8 preset files created: `electricOrange.ts`, `midnightNavy.ts`, `championshipGold.ts`, `emeraldCourt.ts`, `electricViolet.ts`, `crimsonBlaze.ts`, `arcticWhite.ts`, `stealth.ts`
- [x] Each file exports a named `ThemeTokens` object, a `label` string, and a `previewColor` hex string
- [x] Token values per preset:
  - **Electric Orange** (default): primary `#FF6B1A`, background `#0F1115`, surface `#151922`
  - **Midnight Navy**: primary `#3B82F6`, background `#0A0F1E`, surface `#111827`
  - **Championship Gold**: primary `#F5B800`, background `#0F0E09`, surface `#1A1810`
  - **Emerald Court**: primary `#10B981`, background `#091510`, surface `#0F1F18`
  - **Electric Violet**: primary `#8B5CF6`, background `#0D0A1E`, surface `#13102A`
  - **Crimson Blaze**: primary `#EF4444`, background `#150A0A`, surface `#1F1010`
  - **Arctic White** (light mode): primary `#FF6B1A`, background `#F8F9FA`, surface `#FFFFFF`, textPrimary `#0F1115`, textSecondary `#6B7280`, mode override `light`
  - **Stealth**: primary `#9CA3AF`, background `#000000`, surface `#0A0A0A`
- [x] All files compile with no TypeScript errors
- [x] No other files are modified

## [ ] [DESIGN-011-B: Theme Editor — Theme Context & Runtime Switching]
**Priority:** HIGH
**Type:** Feature
**Why:** Preset files are useless until the app can switch between them at runtime without a page reload. This story wires a React context that holds the active token set and rebuilds the MUI theme on change, persisting the coach's choice to localStorage.
**What:** Create `src/theme/ThemeContext.tsx`. Refactor `App.tsx` to consume context instead of using `electricOrangeTokens` directly.
**Scope:** `src/theme/ThemeContext.tsx` (new), `src/App.tsx` refactor only
**Depends on:** DESIGN-011-A
**Acceptance Criteria:**
- [ ] `ThemeContext` provides `{ activeTokens, setPreset, presets }` to the component tree
- [ ] `presets` is an array of all 8 preset objects with `id`, `label`, `previewColor`, and `tokens`
- [ ] `setPreset(id: string)` updates `activeTokens` and triggers MUI theme rebuild — no page reload
- [ ] Active preset `id` persisted to `localStorage` key `courtsight_theme_preset` and restored on app load
- [ ] `App.tsx` reads `activeTokens` from context and passes to `buildCourtSightTheme`
- [ ] Default preset is `electricOrange` if nothing stored in localStorage
- [ ] App compiles and switches themes correctly with no errors

## [ ] [DESIGN-011-C: Theme Editor — Settings Page Preset Gallery]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need a visual way to browse and select presets. A settings page with a click-to-activate preset gallery is the clearest UX for this.
**What:** Create `src/pages/Settings.tsx` with a preset gallery section. Add Settings to the nav.
**Scope:** `src/pages/Settings.tsx` (new), `SideNav.tsx` and `BottomNav.tsx` to add Settings nav item
**Depends on:** DESIGN-011-B, DESIGN-003-B, DESIGN-003-C
**Acceptance Criteria:**
- [ ] Settings page accessible via nav (gear icon at bottom of SideNav)
- [ ] "Appearance" section on Settings page with heading "Theme"
- [ ] Preset gallery renders one card per preset showing: preview swatch circle in `previewColor`, preset `label`, active checkmark if currently selected
- [ ] Clicking a preset card calls `setPreset(id)` — entire app repaints immediately with no reload
- [ ] Active preset card has `primary` border and checkmark indicator
- [ ] Arctic White preset card clearly labelled "(Light Mode)"
- [ ] No hardcoded hex colors — all card styles from theme tokens

## [ ] [DESIGN-011-D: Theme Editor — Custom Color Override & Live Preview Strip]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches who want to match their team colors exactly need the ability to override the primary accent on top of any preset. The live preview strip gives immediate feedback before committing.
**What:** Add a custom color override section to `src/pages/Settings.tsx`. Create `src/components/theme/LivePreviewStrip.tsx`.
**Scope:** `src/pages/Settings.tsx` update, `src/components/theme/LivePreviewStrip.tsx` (new)
**Depends on:** DESIGN-011-C
**Acceptance Criteria:**
- [ ] "Custom Accent" section below preset gallery on Settings page
- [ ] Color input (MUI `TextField` type `color` + hex text input) lets coach enter any hex value
- [ ] `LivePreviewStrip` renders horizontally below the input showing: primary button, active nav chip, live badge, foul pip dots — all using the preview color in real time as the coach types
- [ ] "Apply" button calls `setCustomPrimary(hex: string)` context method that overrides only the `primary`, `primaryDark`, and `primaryContainer` tokens of the active preset
- [ ] "Reset" button reverts to the base preset's primary values
- [ ] Custom primary persisted

## [x] [HALT: Proactive Tactical Intervention System]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss critical tactical risks (foul trouble, fatigue, mismatch exploitation) in the heat of a game. A persistent "Heads-Up" alert system transforms raw data into immediate coaching directives.
**What:** Elevate the existing "HALT" logic from a passive scoreboard overlay to a proactive side-rail HUD in GameMode that provides specific "Actions" (e.g., "Sub #5 - High Foul Risk").
**Acceptance Criteria:**
- [ ] Dedicated "Tactical Alerts" panel in the GameMode sidebar.
- [ ] Color-coded severity (Warning: Yellow, Critical: Red).
- [ ] Direct action buttons within alerts (e.g., "Open Sub Dialog" for a fatigue alert).
- [ ] Integration of Ref-Identity conflict alerts ("Dial back pressure").

## [x] [Tactical Identity HUD (KPI Adherence)]
**Priority:** HIGH
**Type:** Feature
**Why:** Every coach enters a game with a specific "Identity" (e.g., "We attack the paint"). A live HUD tracking these specific goals ensures the team doesn't drift into inefficient play.
**What:** A customizable header widget in GameMode that tracks 3 user-selected Tactical KPIs (e.g., Paint Touches, Early Clock eFG%, Turnover Rate).
**Acceptance Criteria:**
- [ ] KPI selector in Game Setup (e.g., Choose 3 from a list of 10).
- [ ] Real-time progress bars/counters in the GameMode header.
- [ ] Visual pulse/alert when a goal is met or a limit is exceeded.
- [ ] Post-game "Identity Scorecard" summarizing KPI performance.

## [x] [Verified Period Workflow (Reconciliation)]
**Priority:** HIGH
**Type:** UX / Data Integrity
**Why:** Official scores and fouls often drift from the app. A forced reconciliation at every period break ensures the analytics engine remains a "Source of Truth."
**What:** A mandatory modal at the end of each period that requires the scorekeeper to verify Score and Team Fouls against the official table.
**Acceptance Criteria:**
- [ ] Trigger modal immediately when clock hits 0:00 or "Next Period" is clicked.
- [ ] Side-by-side comparison of "App Totals" vs "Official Totals."
- [ ] "Balance" feature: Automatically insert a `SYSTEM_ADJUSTMENT` event to fix discrepancies.
- [ ] Period stats are locked (read-only) once verified.

## [ ] [Strategic Timeout & Game State Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Timeout management in the 4th quarter is high-stress. An advisor removes the mental math of "How many do we have left?" and "Is this the right time?"
**What:** A decision-support engine that analyzes Momentum, Timeouts Remaining, and Score Spread to suggest optimal timeout windows.
**Acceptance Criteria:**
- [ ] "Timeout Advisor" HUD element that glows when a timeout is mathematically recommended (e.g., 8-0 Opponent run).
- [ ] "Winning Time" logic: Specialized advice for the final 2 minutes (e.g., "Save one for the advance").
- [ ] Visual indicator of "Effective Timeouts" relative to the game's remaining pace.

## [ ] [Opponent Play-Type "Counter-Strike" Analytics]
**Priority:** HIGH
**Type:** Feature
**Why:** Knowing an opponent is scoring on "PnR" is step one. Knowing *how* to stop it (e.g., "Switch" vs "Hedge") based on their efficiency is the winning adjustment.
**What:** Enhance Opponent Play-Type tracking to recommend specific defensive adjustments based on live PPP.
**Acceptance Criteria:**
- [ ] Live indicator in GameMode: "Opponent scoring 1.4 PPP on PnR."
- [ ] "Adjustment Suggestion" based on active scheme (e.g., "Switch screens to neutralize #24").
- [ ] Post-game breakdown in GameStats showing "Points Allowed by Action Type x Our Scheme."

---

## [x] [Defensive Breakdown Attribution (The Accountability Layer)]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know *why* a bucket was allowed to fix it in practice. This layer separates physical skill makes from tactical mental errors.
**What:** Enhance opponent scoring events with a mandatory (optional toggle) breakdown reason and provide a post-game integrity report.
**Acceptance Criteria:**
- [x] Quick-select "Breakdown Reason" overlay after recording an opponent make: "Missed Rotation", "Transition Leak", "Poor Closeout", "Out-Hustled", "Great Contest".
- [x] "Defensive Integrity" report in GameStats summarizing % of points allowed by breakdown category.
- [x] "Tactical Weak Link" identification: Highlight the most frequent breakdown type in the current game.
- [x] Filter opponent shot chart markers by breakdown type.

## [x] [Special Situation (ATO/SLOB/BLOB) Analytical Engine]
**Priority:** HIGH
**Type:** Feature
**Why:** Designing the perfect play is useless if you don't know if it works. This engine moves beyond raw stats to show efficiency in high-leverage set plays.
**What:** Build a dedicated analytics module and UI to visualize PPP and eFG% for possessions tagged as ATO, SLOB, BLOB, or EOP.
**Acceptance Criteria:**
- [x] Add `calculateSituationalStats` to the stats engine to derive PPP/eFG% filtered by situation.
- [x] New "Specialty Execution" card in GameStats showing a performance table by situation.
- [x] "Execution Delta" metric comparing Situational PPP vs. standard Half-Court PPP.
- [x] Visualization of "Success Rate" (Possessions ending in score or shooting foul) per situation.

## [x] [Voice-Driven Live Scorekeeping]
**Priority:** HIGH
**Type:** Feature
**Why:** Solo scorekeepers struggle to keep up with high-intensity transition play. Voice commands eliminate "tap lag" and allow the user to keep their eyes on the floor.
**What:** Implement a Web Speech API layer in GameMode to record events via voice.
**Acceptance Criteria:**
- [x] "Voice Mode" toggle in GameMode header with microphone permission handling.
- [x] Support for standard grammar: "[Jersey] [Action]" (e.g., "Five make two", "Ten assist").
- [x] Support for opponent actions: "Opponent twelve miss".
- [x] Chained commands: "Twenty-four make three assist five".
- [x] Visual HUD feedback showing "Last Heard: #24 Make 3PT".
- [x] High-confidence threshold filtering to prevent background noise errors.

## [x] [Holistic Matchup Efficiency Matrix]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to see the entire defensive landscape at once, not just isolated mismatches. A 5x5 Matrix reveals the most exploitable and vulnerable points of the current unit-on-unit battle.
**What:** Build a visual matrix component in GameMode that maps our 5 active players (Y-axis) against the 5 opponent players (X-axis) using color-coded efficiency (Stop %).
**Acceptance Criteria:**
- [x] 5x5 "Efficiency Matrix" accessible via a sidebar toggle in GameMode.
- [x] Color-coded cells: Green (High Stop %), Red (Low Stop %), Gray (Insufficient Data).
- [x] One-tap reassignment by clicking a cell in the matrix.
- [x] "Unit Optimization" score summarizing the total defensive parity of the current 5-man unit.

## [x] [Spark Plug Momentum Index]
**Priority:** HIGH
**Type:** Feature
**Why:** Some players provide value that doesn't show up in the box score but triggers team-wide energy shifts (e.g., a floor dive or a charge taken).
**What:** A specialized metric that weighs "Blue Collar" hustle stats against immediate subsequent team scoring runs to identify "Momentum Starters."
**Acceptance Criteria:**
- [x] "Spark Plug" score for every player who records a FLOOR_DIVE, CHARGE_TAKEN, or GREAT_CONTEST.
- [x] Correlation of hustle events to 2-minute scoring runs.
- [x] "Energy Alert" in GameMode suggesting when to bring in a high-momentum player.

---

## Documentation & Knowledge Layer
**Priority:** MEDIUM
**Type:** Documentation
**Why:** Maintain systemic clarity for future agents and human contributors as the "Causal Accountability" logic grows.
**Acceptance Criteria:**
- [x] Update SCHEMA.md with extended StatEvent attributes (breakdownReason, defensiveScheme, opponentPlayType).
- [x] Document "Jersey Prefix" playerId format in SCHEMA.md.
- [x] Deep-dive into "Causal Accountability" principles in README.md.
- [x] Create ARCHITECTURE.md for high-level system overview (Offline-first sync, Snapshot architecture).
- [x] Document internal analytical formulas (PPP, Spark Plug Index, Fatigue Decay) in a dedicated ANALYTICS.md.

---

## [x] [Ref-Identity Conflict Alert System]
**Priority:** HIGH
**Type:** Enhancement
**Why:** If a team's identity is "High Pressure" but the officiating "Tightness" is high, they will foul out. Proactive alerts allow the coach to adjust aggressiveness before the game is lost.
**What:** A predictive engine that compares live Officiating FPM (Fouls Per Minute) against the Team's active defensive scheme.
**Acceptance Criteria:**
- [x] Live "Ref Tightness" meter in GameMode sidebar.
- [x] Conflict Alert (Visual) when Foul Rate exceeds 0.8 FPM while in a "High Pressure" scheme (Press/Double).
- [x] Recommendation to "Dial Back Pressure" or "Sub Fresh Legs" based on foul distribution.

## [x] [Opponent "Go-To" Usage Analytics (Clutch)]
**Priority:** HIGH
**Type:** Feature
**Why:** In "Winning Time," every team has a primary option. Identifying this player's usage rate and preferred shot type in the clutch allows for specialized defensive counters.
**What:** An analytical tool that identifies opponent usage rates and eFG% specifically in clutch situations (final 4 mins, < 5pt spread).
**Acceptance Criteria:**
- [x] "Clutch Threat" indicator on the opponent roster card during Winning Time.
- [x] Breakdown of "Clutch Action Type" (e.g., "ISO Drive", "PnR Handler").
- [x] Comparison of Opponent X's Clutch Usage vs. Regulation Usage.

## [x] ["Defensive Scheme" Real-Time PPP Analyzer]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which defensive set is most effective *now*. PPP allowed by scheme is the ultimate truth for mid-game adjustments.
**What:** Enhance "Defensive Scheme" tracking to provide live PPP (Points Per Possession) allowed for Man vs. Zone vs. Press.
**Acceptance Criteria:**
- [x] Sidebar toggle in GameMode to select active defensive scheme.
- [x] Real-time PPP display for the active scheme.
- [x] "Scheme Efficiency" comparison table in the Halftime Report.

## [x] Lineup "Offensive Chemistry" Connectivity Map
**Priority:** HIGH
**Type:** Feature
**Why:** Understanding who makes whom better is the key to elite playcalling. Connectivity maps show which duos create the most efficient shots.
**What:** Create a visual "Assist Network" diagram for the active 5-man unit.
**Acceptance Criteria:**
- [x] Visual graph in GameStats showing assist/pass connectivity between players.
- [x] Weighting of connections by eFG% (e.g., "Player A to Player B results in 65% eFG%").
- [x] Identification of "Primary Playmaker" and "Primary Finisher" nodes for the current lineup.

## [x] Expected Value (xPTS) & Shot Quality ROI Engine
**Priority:** HIGH
**Type:** Feature
**Why:** A cold shooting night shouldn't result in a tactical pivot if the "Process" is correct. xPTS moves the conversation from results to quality.
**What:** A model that assigns Expected Points (xPTS) to every shot based on location and the "Shot Quality" (Open/Contested) tag.
**Acceptance Criteria:**
- [x] Implement a lookup table for xPTS based on zone averages and shot quality weights.
- [x] "Shot ROI" metric in GameStats: (Total Points / Total xPTS) - 1.0.
- [x] "Quality Control" HUD in GameMode showing average xPTS per possession for the current lineup.
- [x] Post-game "Process Report" highlighting high xPTS shots that missed vs. low xPTS shots that went in.

## [x] [Executive Halftime Talking Points Generator]
**Priority:** HIGH
**Type:** Feature
**Why:** Halftime is only 10 minutes. Coaches need automated synthesis of complex data into 3 punchy, actionable directives for the locker room.
**What:** An automated NLP-style engine that analyzes game aggregates vs. season averages to generate 3 executive-level bullet points.
**Acceptance Criteria:**
- [x] "Talking Points" tab in the Halftime Report Dialog.
- [x] Bullet 1 (Offensive): Efficiency insight (e.g., "eFG% is 12% below average; stop settling for long 2s").
- [x] Bullet 2 (Defensive): Personnel threat (e.g., "Opponent #24 is 4/4 on drives; force him left").
- [x] Bullet 3 (Personnel): Lineup suggestion (e.g., "Lineup [5,10,12] is +8; keep them together").
- [x] "Copy for Assistant" button to send talking points via clipboard.

## Coach-Assistant Live Sync Bridge
**Priority:** HIGH
**Type:** Feature
**Why:** Elite programs use multiple sets of eyes.
**What:** A multi-device websocket or real-time sync layer.

## [ ] Dynamic "Target Attack" Identifier
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss which opponent defender is the "weak link" or which specific matchup is most exploitable in real-time. This tool automates the identification of mismatches to drive play-calling.
**What:** Implement an intelligence layer that correlates Matchup Tracking with Points Per Possession (PPP). It should highlight which opponent player is allowing the highest PPP and suggest which of our players should be the primary attacker.
**Acceptance Criteria:**
- [ ] Live HUD element in GameMode showing "Top Attack Target" (Opponent Jersey #).
- [ ] Real-time "Mismatch Alert" when a specific defender's Stop % drops below a configurable threshold.
- [ ] "Targeted Play" recommendation based on which of our players has the best eFG% against that specific defender's archetype.

## [ ] Automated Post-Game Player Performance Narratives
**Priority:** HIGH
**Type:** Feature
**Why:** Players often don't understand raw stats. Converting data into "Narratives" (e.g., "You were elite at closing out but struggled with ball security") makes coaching feedback more digestible and actionable.
**What:** Use the accumulated StatEvents to generate a 3-sentence performance summary for every player who played > 5 minutes.
**Acceptance Criteria:**
- [ ] "Player Feedback" section in the Game Stats page.
- [ ] Automated generation of one "Strength" (e.g., "High Efficiency from Corner 3") and one "Growth Area" (e.g., "High TO rate on drives").
- [ ] Ability for the coach to "Approve & Send" the narrative to the player via text/email.

## Standardized Video Platform Export (Hudl/Synergy)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches spend hours manually tagging film. Exporting our granular game data into formats compatible with Hudl, Synergy, or VidSwap bridges the gap between stats and film.
**What:** Create an export engine that generates CSV or XML files mapped to the specific column requirements of major video analysis platforms.
**Acceptance Criteria:**
- [ ] "Export for Video" button in Game Stats.
- [ ] Dropdown to select platform (Hudl, Synergy, VidSwap).
- [ ] Export includes `clockTime`, `period`, `playerName`, `actionType`, and `playName`.
- [ ] Properly formatted CSV/XML file downloaded to the user's device.

## Program-Wide Tactical KPI Dashboard
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to see if their team's identity (e.g., "We are a transition team") is holding up over months, not just individual games.
**What:** Build a longitudinal dashboard that tracks specific team-defined KPIs (e.g., OREB%, TO Rate, PPP) across the entire season with trend lines.
**Acceptance Criteria:**
- [ ] New "Program Health" tab on the Dashboard/My Team page.
- [ ] Multi-game trend charts for the "Four Factors."
- [ ] "Identity Goals" section where coaches see % of games where goals were met.
- [ ] Filter by date range or opponent strength.

## [x] [Paint Touches & Rim Pressure Analytics]
**Priority:** HIGH
**Type:** Feature
**Why:** Shooting selection is only half the battle. Coaches need to know if their offense is "settling" or actively attacking the heart of the defense.
**What:** Implement a "Paint Touch" event type and a live counter in the GameMode. Correlate Paint Touches with subsequent eFG% to prove the value of rim pressure.
**Acceptance Criteria:**
- [x] New "Paint Touch" quick-action button in GameMode.
- [x] Live HUD indicator showing "Paint Touches" for the current period.
- [x] Analytics bridge: "Points Per Paint Touch" (PPPT) metric in GameStats.
- [x] Visualization on the Shot Chart showing where paint touches originated.

## [ ] ["Hockey Assist" (Secondary Assist) & Playmaking Chain]
**Priority:** HIGH
**Type:** Feature
**Why:** The player who makes the "extra pass" often goes unrewarded in traditional stats. Identifying secondary assists reveals the true floor generals who drive offensive flow.
**What:** Allow for a secondary "Hockey Assist" to be recorded during the "Who Assisted?" chain.
**Acceptance Criteria:**
- [x] Enhance "Teammate Assist?" overlay to allow selecting a second player for a "Hockey Assist."
- [x] "Hockey Assist" column in the Box Score and Player Stats.
- [ ] "Offensive Flow Rating" per player: (Assists + Hockey Assists) / Possessions.

## [ ] [Lineup "Defensive Synergy" (Lineup x Scheme Efficiency)]
**Priority:** HIGH
**Type:** Feature
**Why:** Some 5-man units are elite in a 2-3 Zone but struggle in Man-to-Man. Identifying these synergies allows for precise defensive substitutions based on the active scheme.
**What:** Build a matrix in GameStats that cross-references Lineup Efficiency with the Active Defensive Scheme.
**Acceptance Criteria:**
- [ ] "Scheme Synergy" table in GameStats showing PPP Allowed by Lineup *filtered by* Defensive Scheme.
- [ ] "Best Scheme" recommendation for the currently active on-court lineup.
- [ ] Identification of "Defensive Anchor" duos who maintain low PPP across all schemes.

## [x] [Individual Defensive Breakdown Accountability Metrics]
**Priority:** HIGH
**Type:** Feature
**Why:** We track *why* a bucket was allowed, but we need to tie it back to *who* was responsible to drive causal accountability.
**What:** Aggregate Defensive Breakdown Reasons by the "Primary Defender" identified in Matchup Tracking.
**Acceptance Criteria:**
- [x] "Individual Accountability" table in GameStats.
- [x] Breakdown of Points Allowed per player by category (e.g., "Player X: 6 pts via Poor Closeouts").
- [ ] "Coach's Note" auto-generation: "Focus on Rotations with Player Y" based on breakdown trends.

## [x] [Substitution Timeline Audit]
**Priority:** HIGH
**Type:** Feature
**Why:** Inaccurate substitution data ruins plus/minus and lineup efficiency metrics. Coaches need a way to retroactively fix the on-court lineup without deleting and re-entering every subsequent play.
**What:** Build a "Timeline Audit" view that shows a vertical chronological list of all substitution events. Allow users to edit the time of a sub, change the players involved, or insert a missing sub event.
**Acceptance Criteria:**
- [x] Accessible from the Game Stats or Game Mode page.
- [x] Displays a chronological list of SUB_IN and SUB_OUT events.
- [x] Allows editing the `clockTime` and `playerId` of any substitution event.
- [x] Recalculates all dependent stats (MIN, +/-, Lineup Efficiency) immediately upon saving changes.

## [x] [Offensive Play/Set Success Tracking]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which offensive sets are yielding results. Raw stats don't show if a bucket came from a specific designed play or a broken-down possession.
**What:** Introduce "Play Tagging" for offensive events. Allow coaches to define a playbook in Team Settings and tag MAKE/MISS events with specific play names during the game.
**Acceptance Criteria:**
- [x] CRUD interface in Team Details to manage a "Playbook" (list of play names).
- [x] Optional "Play" dropdown in the MAKE/MISS recording dialog in Game Mode.
- [x] "Play Efficiency" table in Game Stats showing: Play Name, Frequency, Points, and EFG% for each set.
- [x] Filter Shot Chart by specific Play Name.

## [x] [Real-Time Foul Trouble & Fatigue Rotation Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of a game, coaches often miss when a player is one foul away from disqualification or has exceeded their physical "red-line." Proactive alerts prevent tactical errors.
**What:** Implement visual and haptic/audio alerts in `GameMode` when a player reaches configured thresholds (e.g., 2 fouls in Q1, 4 fouls total, or 8 consecutive minutes).
**Acceptance Criteria:**
- [x] "Foul Trouble" pulse on the player's lineup card (e.g., orange at limit-1, red at limit).
- [x] "Fatigue Alert" visual (e.g., a "Needs Sub" icon) when a player's current stint exceeds the "Max Stint Duration" from Team Settings.
- [x] Configuration in Team Details to set "Foul Warning Thresholds" by period.

## [x] [Automated PDF Box Score & Game Summary Export]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to share game results with players, parents, and local media immediately after the buzzer. Manual data entry into other systems is a major pain point.
**What:** Add a "Export PDF" button to the Game Stats page that generates a professional, formatted box score including team totals, player stats, and the scoring flow chart.
**Acceptance Criteria:**
- [x] "Export PDF" button on Game Stats page.
- [x] PDF includes Team Logo, Game Info (Date, Opponent, Score).
- [x] Table for Player Stats (PTS, REB, AST, etc.) and Team Totals.
- [x] Inclusion of the Scoring Flow visualization in the PDF.

## [x] [Free Throw Sequence Workflow]
**Priority:** HIGH
**Type:** UX
**Why:** Recording free throws one-by-one is slow and prone to errors during fast-paced games. A dedicated workflow ensures every attempt is captured correctly without context switching.
**What:** Trigger a "Free Throw Mode" overlay when a shooting foul is recorded or via a quick-action button. This overlay should allow the scorekeeper to quickly tap "Make" or "Miss" for 1, 2, or 3 attempts for a specific player.
**Acceptance Criteria:**
- [x] Modal overlay triggered by FOUL_SHOOTING or a dedicated FT button.
- [x] One-tap recording for each attempt in the sequence.
- [x] Automatically attributes points and attempts to the selected player.
- [x] Closes automatically after the designated number of attempts are recorded.

## [x] [Intelligent Linked Event Chaining]
**Priority:** HIGH
**Type:** UX
**Why:** Basketball is a game of connected actions. Requiring separate taps for a make and the assist that led to it is slow and leads to missed data.
**What:** Implement a "Chained Action" flow in the `GameMode` recording dialog. When a `MAKE` is saved, if an on-court teammate hasn't already been credited with an assist, immediately prompt "Who assisted?" with one-tap teammate buttons. Similarly, after a `MISS`, prompt for "Who rebounded?".
**Acceptance Criteria:**
- [x] After clicking "Save" on a `MAKE` event, display a "Teammate Assist?" overlay if tracking "Our Team".
- [x] After clicking "Save" on a `MISS` event, display "Offensive Reb?" and "Defensive Reb?" quick-tap options.
- [x] If a teammate is tapped, record the second event (ASSIST or REBOUND) with the same `timestamp`, `period`, and `clockTime` as the shot.
- [x] Option to "Skip" or "No Assist/Rebound" to close the chain.

## [ ] [Scoring Run & Drought "Coaching Alerts"]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [x] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [ ] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [ ] Alerts should include a "Suggest Timeout" visual cue.
- [ ] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

## [ ] [Real-Time Opponent Threat Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [ ] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [ ] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [ ] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## [x] [Possession-Based Efficiency Metrics (PPP)]
**Priority:** HIGH
**Type:** Feature
**Why:** Raw scores are misleading if one team plays much faster than the other. Points Per Possession (PPP) is the gold standard for measuring true offensive and defensive efficiency.
**What:** Transition the internal stats engine to calculate total possessions and derive PPP for teams, lineups, and individual players.
**Acceptance Criteria:**
- [x] Calculate "Possessions" for both teams (FGA + 0.44*FTA + TO - OREB).
- [x] Display PPP on the GameMode sidebar and Game Stats dashboard.
- [x] Defensive PPP (Points Allowed Per Possession) to measure defensive quality independently of pace.
- [x] Trend line showing PPP fluctuation throughout the game.

## [ ] [Locker Room] Post-Game Learning System
**Priority:** HIGH
**Type:** UX
**Why:** The learning gap between games is where championships are won. A guided review mode turns a static box score into an interactive teaching tool for coaches and players.
**What:** Implement a "Coaching Clinic" mode in the Game Stats page that automatically identifies and walks through the 5 most critical game-changing moments.
**Acceptance Criteria:**
- [ ] "Start Clinic" button in Game Stats.
- [ ] Guided walkthrough identifying: 3 "Execution Wins" and 3 "Tactical Errors" based on PPP and Score Flow.
- [ ] Integrated "Momentum Shift" analyzer that highlights the specific play or sub that triggered a scoring run.
- [ ] "Coach's Reflection" text area to save takeaways for the next practice plan.

## [x] [Shot Clock Process Analysis]
**Priority:** HIGH
**Type:** Feature
**Why:** Rushing shots early in the clock or settling for late-clock heaves is a "process" failure. This feature distinguishes between quick-hit offensive success and desperation shots.
**What:** Categorize every shot into "Early Clock" (first 10s), "Mid Clock", and "Late Clock" (last 5s) buckets and track EFG% for each.
**Acceptance Criteria:**
- [x] "Clock Phase" tagging automatically derived from StatEvent.clockTime and periodLength.
- [x] "Shot Rhythm" chart in GameStats showing volume and efficiency by clock phase.
- [x] "Decision Alert" in GameMode if team is shooting < 20% on Early Clock shots.

## [ ] Automated Referee Profile HUD
**Priority:** HIGH
**Type:** Feature
**Why:** Referee "tightness" (fouls per minute) and bias (home/away split) should dictate how aggressive a team plays. A coach who knows the ref is calling it tight can adjust defensive pressure before foul trouble hits.
**What:** An intelligence layer that analyzes the frequency and distribution of fouls called by the current officiating crew.
**Acceptance Criteria:**
- [ ] "Ref Tightness Meter" in GameMode comparing current game Fouls Per Minute (FPM) against a historical baseline.
- [ ] "Foul Bias" indicator showing the split between Our Team vs Opponent fouls.
- [ ] "Aggression Advisor" suggesting "Press Hard" or "Play Soft" based on FPM.

## [ ] Program-Wide "Tactical DNA" Comparison
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to know if their team is evolving or regressing in their core identity (e.g., "Are we still an elite rebounding team?").
**What:** A longitudinal comparison tool that overlays current game "Four Factors" against the season-to-date "DNA" blueprint.
**Acceptance Criteria:**
- [ ] "Program DNA" Radar Chart in GameStats.
- [ ] Overlay of "Last 3 Games" vs "Season Average" to identify recent trends.
- [ ] "Identity Crisis" alert if more than 3 of the Four Factors deviate by >15% from the season mean.

## [UX] Epic: Administrative Workflow & Dashboard Streamlining
**Priority:** MEDIUM
**Type:** UX / Enhancement
**Why:** Current administrative workflows (game creation, team editing) are high-friction, and the dashboard lacks actionable information.
**What:** Redesign the administrative experience to be workflow-driven and transform the dashboard into a high-value "My Team" hub.
**Acceptance Criteria:**
- [ ] Replace static Dashboard with a dynamic "My Team" hub driven by "Star Team" selection.
- [ ] Implement a multi-step workflow for the `Create Game` dialog (Opponent -> Date/Time -> Settings).
- [ ] Update `Edit Team Details` to include global game defaults (period lengths, foul limits, timeout counts).

## Multi-Game Shot Location Trend Analysis
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A team's shooting identity shifts throughout a season. Identifying that a team has stopped attacking the rim over the last 5 games allows for immediate practice adjustments.
**What:** Implement a "Trend Mode" for the Team Heatmap.

## Predictive Foul Strategy Assistant
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Managing foul trouble for star players is a high-stakes balancing act.
**What:** Implement a predictive model in the GameMode that calculates "Foul Risk".

## Interactive Halftime "Adjustment Board"
**Priority:** MEDIUM
**Type:** Feature
**Why:** Halftime is the most critical window for tactical pivots.
**What:** Enhance the Halftime Report with an interactive "Adjustment Board".

## Advanced Opponent Drive & Finish Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Knowing a player is "Hot" is good; knowing they always drive LEFT and finish with a FLOAT is game-changing.
**What:** Enhance the opponent shot recording to include "Drive Direction".

## "Blue Collar" Hustle & Identity Tracker
**Priority:** MEDIUM
**Type:** Feature
**Why:** Winning teams are built on "Hustle Stats" (Deflections, Dives, Great Contests).
**What:** Add a dedicated "Hustle Mode" toggle in GameMode.

## Predictive Performance & Fatigue Modeling
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A player's impact doesn't drop off exactly at 8 minutes.
**What:** Build a model that compares a player's live stint efficiency against fresh-state averages.

## Live Opponent Personnel Intelligence HUD
**Priority:** MEDIUM
**Type:** UX
**Why:** Scouting reports are often forgotten in the heat of a game.
**What:** Integrate persistent scouting notes into the live GameMode opponent cards.

## Longitudinal Official/Referee Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Officiating is the "Third Team" on the court.
**What:** Implement a season-wide database of officiating stats.

## Program-Wide Optimal Rotation Optimizer
**Priority:** MEDIUM
**Type:** Feature
**Why:** Managing a roster across a long season requires identifying which units are mathematically most effective.
**What:** A prescriptive engine that analyzes season-wide unit data.

## [ ] Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [ ] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [ ] "Load Roster" option in Create Game workflow for selected opponents.
- [ ] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## [ ] Multi-Period Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Shooting patterns change as a game progresses due to fatigue or defensive adjustments. Coaches need to see *when* their team stopped getting to the rim.
**What:** Enhance the Shot Chart in `GameStats` and `Dashboard` to allow filtering heatmaps by specific period or "Half."
**Acceptance Criteria:**
- [ ] Period-selector filter (P1, P2, P3, P4, OT) on the Shot Chart view.
- [ ] "Compare Periods" mode showing two heatmaps side-by-side (e.g., 1st Half vs 2nd Half).
- [ ] Toggle to show "Only Misses" or "Only Makes" on the heatmap.

## [ ] Interactive Playbook Efficiency HUD
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know *during* the game if a specific offensive set is failing. Waiting for post-game stats to stop running an inefficient play is too late.
**What:** Add a "Playbook Performance" widget to the `GameMode` sidebar that shows the success rate (PPP) of the top 3 most-used plays in the current game.
**Acceptance Criteria:**
- [ ] Sidebar widget in GameMode showing Play Name, Frequency, and Points Per Possession (PPP).
- [ ] Color-coded efficiency indicator (Green/Yellow/Red) based on team-average PPP.
- [ ] One-tap access to see the shot chart for a specific play during timeouts.

## [ ] Shot Quality & Process Tagging
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A "good" shot can miss and a "bad" shot can go in. Coaches need to evaluate the *process* of their offense, not just the result, to make halftime adjustments.
**What:** Add an optional "Shot Quality" toggle to the `MAKE`/`MISS` recording dialog (e.g., "Open" vs "Contested").
**Acceptance Criteria:**
- [ ] Add `shotQuality` (OPEN, CONTESTED) to the `StatEvent` schema.
- [ ] Add a simple toggle or button group in the shot recording dialog to tag quality.
- [ ] Display "Process Efficiency" in `GameStats` (e.g., "EFG% on Open Shots" vs "EFG% on Contested Shots").
- [ ] Filter Shot Chart by Shot Quality.

## [ ] Interactive Game Flow & Momentum Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Box scores are static. A flow chart shows *when* the game was won or lost and how specific lineups affected the lead.
**What:** Add a "Game Flow" visualization to the `GameStats` page—a line graph showing the point spread over the course of the game clock.
**Acceptance Criteria:**
- [ ] Interactive line chart showing `Our Score - Opponent Score` on the Y-axis and `Game Time` on the X-axis.
- [ ] Mark key events on the timeline (Timeouts, Period ends).
- [ ] Hovering over the line shows the score and active lineup at that specific time.
- [ ] Color-code the background to show who was "in control" (e.g., blue for home lead, red for away lead).

## [ ] Multi-Game Lineup Net Rating Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game Plus/Minus can be noisy. Coaches need to know which 5-man combinations are most effective over a season or tournament.
**What:** Aggregate lineup performance data across multiple games for a team.
**Acceptance Criteria:**
- [ ] New "Lineup Analytics" tab on the `TeamStats` or `My Team` (Dashboard) page.
- [ ] Table of 5-man units (lineups) that have played together.
- [ ] Metrics per lineup: Total Minutes, Points For, Points Against, Net Rating (Diff per 100 possessions or per 40 mins).
- [ ] Ability to filter by "Last 5 Games" or "Season".
