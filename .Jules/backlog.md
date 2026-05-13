# Scorebook Backlog

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

## [UX] Epic: Administrative Workflow & Dashboard Streamlining
**Priority:** MEDIUM
**Type:** UX / Enhancement
**Why:** Current administrative workflows (game creation, team editing) are high-friction, and the dashboard lacks actionable information.
**What:** Redesign the administrative experience to be workflow-driven and transform the dashboard into a high-value "My Team" hub.
**Acceptance Criteria:**
- [ ] Replace static Dashboard with a dynamic "My Team" hub driven by "Star Team" selection.
- [ ] Implement a multi-step workflow for the `Create Game` dialog (Opponent -> Date/Time -> Settings).
- [ ] Update `Edit Team Details` to include global game defaults (period lengths, foul limits, timeout counts).
