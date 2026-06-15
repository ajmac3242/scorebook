# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CourtSight Smoke Journeys >> Journey 3: Game Summary
- Location: e2e/smoke.spec.ts:176:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('10 - 5')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('10 - 5')

```

```yaml
- img "CourtSight":
  - paragraph: CourtSight
- button "Collapse navigation"
- button "Open search":
  - paragraph: Search
- list:
  - listitem:
    - link "Dashboard":
      - /url: /
  - listitem:
    - link "Games":
      - /url: /games
  - listitem:
    - link "Live":
      - /url: /game
  - listitem:
    - link "Opponents":
      - /url: /opponents
  - listitem:
    - link "Players":
      - /url: /players
  - listitem:
    - link "Teams":
      - /url: /teams
  - listitem:
    - link "Reports":
      - /url: /reports
- listitem:
  - link "Settings":
    - /url: /settings
- text: C
- paragraph: Coach
- main:
  - link "Skip to main content":
    - /url: "#main-content"
  - navigation "Breadcrumb":
    - link "Teams":
      - /url: /teams
    - text: /
    - link "Summary Team":
      - /url: /teams/summary-team-id
    - text: /
    - paragraph: vs Weak Opponent
  - button "Back to summary-team-id"
  - button "Practice Planner"
  - button "Export PDF"
  - button
  - text: VW
  - heading "vs Weak Opponent" [level=3]
  - heading "06-15-2026 | Away" [level=6]
  - paragraph: PPP
  - paragraph: "2.00"
  - paragraph: "|"
  - paragraph: Def. PPP
  - paragraph: "0.00"
  - group:
    - button "Standard" [pressed]
    - button "Impact (On/Off)"
  - group:
    - button "Full Game" [pressed]
    - button "Quarter 1"
    - button "Quarter 2"
    - button "Quarter 3"
    - button "Quarter 4"
  - button "🔥 CLUTCH MODE"
  - paragraph: Defensive Metrics
  - paragraph: TOTAL STOPS
  - paragraph: "0"
  - paragraph: KILLS (3x STOPS)
  - paragraph: "0"
  - paragraph: CURRENT STOP STREAK
  - paragraph: "0"
  - paragraph: Box Score
  - button "Expand section"
  - table:
    - rowgroup:
      - row "PLAYER Minutes Played Points Field Goals Made-Attempted Field Goal Percentage Effective Field Goal Percentage Offensive Rebounds Defensive Rebounds Total Rebounds Assists Hockey Assists (Secondary Assists) Steals Blocks Turnovers Personal Fouls Plus/Minus":
        - columnheader "PLAYER"
        - columnheader "Minutes Played": MIN
        - columnheader "Points": PTS ↓
        - columnheader "Field Goals Made-Attempted": FG
        - columnheader "Field Goal Percentage": FG%
        - columnheader "Effective Field Goal Percentage": eFG%
        - columnheader "Offensive Rebounds": OREB
        - columnheader "Defensive Rebounds": DREB
        - columnheader "Total Rebounds": REB
        - columnheader "Assists": AST
        - columnheader "Hockey Assists (Secondary Assists)": HA
        - columnheader "Steals": STL
        - columnheader "Blocks": BLK
        - columnheader "Turnovers": TO
        - columnheader "Personal Fouls": PF
        - columnheader "Plus/Minus": +/-
    - rowgroup:
      - row "23 Scoring Star 0 2 1-1 100.0% 100.0% 0 0 0 0 0 0 0 0 0 0":
        - cell "23 Scoring Star":
          - text: "23"
          - paragraph: Scoring Star
        - cell "0"
        - cell "2"
        - cell "1-1"
        - cell "100.0%"
        - cell "100.0%"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
      - 'row "TEAM TOTALS (PPP: 2.00) - 2 -"':
        - 'cell "TEAM TOTALS (PPP: 2.00)"'
        - cell "-"
        - cell "2"
        - cell "-"
      - 'row "OPPONENT (PPP: 0.00) - 0 0-0 0.0% - 0 0 0 0 0 0 0 0 -"':
        - 'cell "OPPONENT (PPP: 0.00)"'
        - cell "-"
        - cell "0"
        - cell "0-0"
        - cell "0.0%"
        - cell "-"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "0"
        - cell "-"
  - paragraph: Shot Chart
  - button "Expand section"
  - heading "Filters" [level=6]
  - button "Compare"
  - group:
    - button "Markers" [pressed]
    - button "Heatmap"
  - text: Player
  - combobox: All Players
  - text: Type
  - combobox: All Shots
  - text: Quality
  - combobox: All Qualities
  - text: Breakdown
  - combobox: All Breakdowns
  - img "Interactive basketball court map. Tap or use keyboard to record shot locations.":
    - 'button "MAKE by #23 at 0%, 0%"': "23"
  - paragraph: Score Flow
  - button "Expand section"
  - list:
    - listitem:
      - img "Opp PPP legend icon"
      - text: Opp PPP
    - listitem:
      - img "Spread legend icon"
      - text: Spread
    - listitem:
      - img "Team PPP legend icon"
      - text: Team PPP
  - application: 0:00 0 0.5 1 1.5 2 PPP Neutral 0 0.5 1 1.5 2
  - paragraph: Individual Defensive Accountability
  - table:
    - rowgroup:
      - row "Defender PTS Agn Primary Breakdown":
        - columnheader "Defender"
        - columnheader "PTS Agn"
        - columnheader "Primary Breakdown"
    - rowgroup:
      - row "No defensive breakdown data.":
        - cell "No defensive breakdown data.":
          - paragraph: No defensive breakdown data.
  - paragraph: Rim Pressure (Paint Touches)
  - text: Paint touches correlate rim pressure with offensive efficiency. PPPT measures points generated within 15s of a paint touch.
  - paragraph: TOTAL TOUCHES
  - paragraph: "0"
  - paragraph: PPPT
  - paragraph: "0.00"
  - separator
  - text: "EFFICIENCY MULTIPLIER: 0.00x"
  - paragraph: Process Report (ROI)
  - text: This report compares actual scoring against Expected Points (xPTS) based on shot location and quality.
  - paragraph: ACTUAL PTS
  - paragraph: "2"
  - paragraph: EXPECTED PTS
  - paragraph: "0.8"
  - separator
  - paragraph: +150%
  - heading "SHOT ROI" [level=6]
  - text: Over-performing relative to shot quality.
  - paragraph: Assist Network (Chemistry)
  - table:
    - rowgroup:
      - row "CONNECTION FREQ PTS eFG%":
        - columnheader "CONNECTION"
        - columnheader "FREQ"
        - columnheader "PTS"
        - columnheader "eFG%"
    - rowgroup:
      - row "No assists recorded.":
        - cell "No assists recorded.":
          - paragraph: No assists recorded.
  - paragraph: Opponent Play Types
  - table:
    - rowgroup:
      - row "TYPE PPP eFG%":
        - columnheader "TYPE"
        - columnheader "PPP"
        - columnheader "eFG%"
    - rowgroup:
      - row "No play types recorded.":
        - cell "No play types recorded.":
          - paragraph: No play types recorded.
  - paragraph: Shot Rhythm (Clock)
  - table:
    - rowgroup:
      - row "Phase Freq PTS eFG%":
        - columnheader "Phase"
        - columnheader "Freq"
        - columnheader "PTS"
        - columnheader "eFG%"
    - rowgroup:
      - row "EARLY 0 0 0.0%":
        - cell "EARLY"
        - cell "0"
        - cell "0"
        - cell "0.0%"
      - row "MID 0 0 0.0%":
        - cell "MID"
        - cell "0"
        - cell "0"
        - cell "0.0%"
      - row "LATE 0 0 0.0%":
        - cell "LATE"
        - cell "0"
        - cell "0"
        - cell "0.0%"
  - paragraph: Process Efficiency
  - table:
    - rowgroup:
      - row "Quality Freq PTS eFG%":
        - columnheader "Quality"
        - columnheader "Freq"
        - columnheader "PTS"
        - columnheader "eFG%"
    - rowgroup:
      - row "OPEN 0 0 0.0%":
        - cell "OPEN"
        - cell "0"
        - cell "0"
        - cell "0.0%"
      - row "CONTESTED 0 0 0.0%":
        - cell "CONTESTED"
        - cell "0"
        - cell "0"
        - cell "0.0%"
  - paragraph: Play Efficiency
  - table:
    - rowgroup:
      - row "Play Freq PTS eFG%":
        - columnheader "Play"
        - columnheader "Freq"
        - columnheader "PTS"
        - columnheader "eFG%"
    - rowgroup:
      - row "No play-tagged shots recorded.":
        - cell "No play-tagged shots recorded.":
          - paragraph: No play-tagged shots recorded.
  - paragraph: Defensive Integrity
  - button "View Report"
  - table:
    - rowgroup:
      - row "REASON PTS %":
        - columnheader "REASON"
        - columnheader "PTS"
        - columnheader "%"
    - rowgroup:
      - row "No breakdown data recorded.":
        - cell "No breakdown data recorded.":
          - paragraph: No breakdown data recorded.
  - paragraph: Lineup Efficiency
  - button "Audit Subs"
  - button "Expand section"
  - table:
    - rowgroup:
      - row "Lineup MIN PTS FOR PTS AGN NET/40 +/-":
        - columnheader "Lineup"
        - columnheader "MIN"
        - columnheader "PTS FOR"
        - columnheader "PTS AGN"
        - columnheader "NET/40"
        - columnheader "+/-"
    - rowgroup:
      - row "No data available.":
        - cell "No data available.":
          - paragraph: No data available.
  - paragraph: Specialty Execution
  - table:
    - rowgroup:
      - row "SITUATION PPP Δ SUCCESS % eFG%":
        - columnheader "SITUATION"
        - columnheader "PPP"
        - columnheader "Δ"
        - columnheader "SUCCESS %"
        - columnheader "eFG%"
    - rowgroup:
      - row "No situational plays recorded.":
        - cell "No situational plays recorded.":
          - paragraph: No situational plays recorded.
```

# Test source

```ts
  145 |
  146 |     // Step 2: Appearance
  147 |     await page.getByRole('button', { name: 'Continue' }).click();
  148 |
  149 |     // Step 3: Teams
  150 |     await page.getByLabel('Assign New Smoke Player to Roster Team').check();
  151 |     await page.getByLabel('#').fill('99');
  152 |     await page.getByRole('button', { name: 'Continue' }).click();
  153 |
  154 |     // Step 4: Review
  155 |     await page.getByRole('button', { name: 'Create player' }).click();
  156 |
  157 |     // Verify the player appears in the roster list
  158 |     await expect(page.getByRole('heading', { name: 'New Smoke Player' }).first()).toBeVisible();
  159 |
  160 |     // Journey requirement: Remove the player
  161 |     // In this app, "Remove" might mean Archive
  162 |     await page.getByRole('heading', { name: 'New Smoke Player' }).first().click();
  163 |     // Assuming clicking navigates to player dashboard where we can archive
  164 |     // Or we can just verify it's there and then archive from list if possible
  165 |     // The Player Card has a click handler that goes to /players/:id
  166 |
  167 |     await expect(page).toHaveURL(/\/players\/.*/);
  168 |
  169 |     // Let's look for archive button in PlayerStats page
  170 |     // (I'll assume there is one based on the Roster Management journey description)
  171 |     // Actually, looking at Players.tsx, there's no direct delete, but EntityCard has onFavoriteClick
  172 |     // Roster management journey says "Remove the player"
  173 |     // Let's see if we can delete from DB directly for verification of removal if UI is complex
  174 |   });
  175 |
  176 |   test('Journey 3: Game Summary', async ({ page }) => {
  177 |     const gameId = 'summary-game-id';
  178 |     const teamId = 'summary-team-id';
  179 |
  180 |     // Seed a completed game
  181 |     await page.evaluate(async ({ gameId, teamId }) => {
  182 |       // Wait for DB to be available (max 5s)
  183 |       for (let i = 0; i < 50; i++) {
  184 |         if ((window as any).db) break;
  185 |         await new Promise(r => setTimeout(r, 100));
  186 |       }
  187 |
  188 |       const db = (window as any).db;
  189 |       if (!db) return;
  190 |
  191 |       await db.teams.add({
  192 |         id: teamId,
  193 |         name: 'Summary Team',
  194 |         periodType: 'QUARTERS',
  195 |         synced: 1
  196 |       });
  197 |
  198 |       await db.games.add({
  199 |         id: gameId,
  200 |         teamId,
  201 |         opponent: 'Weak Opponent',
  202 |         date: new Date().toISOString(),
  203 |         location: 'Away',
  204 |         completed: 1,
  205 |         teamScore: 10,
  206 |         oppScore: 5,
  207 |         synced: 1
  208 |       });
  209 |
  210 |       await db.players.add({
  211 |         id: 'p1',
  212 |         name: 'Scoring Star',
  213 |         synced: 1
  214 |       });
  215 |
  216 |       await db.teamPlayers.add({
  217 |         id: 'tp-summary',
  218 |         teamId,
  219 |         playerId: 'p1',
  220 |         name: 'Scoring Star',
  221 |         jerseyNumber: '23',
  222 |         synced: 1
  223 |       });
  224 |
  225 |       await db.stats.add({
  226 |         id: 's1',
  227 |         gameId,
  228 |         playerId: 'p1',
  229 |         type: 'MAKE',
  230 |         points: 2,
  231 |         period: 1,
  232 |         timestamp: new Date().toISOString(),
  233 |         synced: 1
  234 |       });
  235 |     }, { gameId, teamId });
  236 |
  237 |     await page.goto(`/game/${gameId}`);
  238 |
  239 |     // Verify per-player stat totals are displayed
  240 |     await expect(page.getByText('Scoring Star')).toBeVisible();
  241 |     // Verify player score (2 pts) in box score
  242 |     await expect(page.getByRole('cell', { name: '2' }).first()).toBeVisible();
  243 |
  244 |     // Verify the final score is correct
> 245 |     await expect(page.getByText('10 - 5')).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
  246 |   });
  247 | });
  248 |
```