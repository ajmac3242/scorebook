# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> CourtSight Smoke Journeys >> Journey 2: Roster Management
- Location: e2e/smoke.spec.ts:113:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Add player' })

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - img [ref=e7]
  - heading "Sign In" [level=1] [ref=e9]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - text: Username
        - generic [ref=e13]: "*"
      - generic [ref=e14]:
        - textbox "Username" [active] [ref=e15]
        - group:
          - generic: Username *
    - generic [ref=e16]:
      - generic:
        - text: Password
        - generic: "*"
      - generic [ref=e17]:
        - textbox "Password" [ref=e18]
        - group:
          - generic: Password *
    - button "Sign In" [ref=e19] [cursor=pointer]
```

# Test source

```ts
  31  |       });
  32  |
  33  |       await db.players.add({
  34  |         id: playerId,
  35  |         name: 'John Doe',
  36  |         avatarColor: '#1976d2',
  37  |         synced: 1
  38  |       });
  39  |
  40  |       await db.teamPlayers.add({
  41  |         id: 'tp1',
  42  |         teamId,
  43  |         playerId,
  44  |         name: 'John Doe',
  45  |         jerseyNumber: '10',
  46  |         synced: 1
  47  |       });
  48  |
  49  |       await db.games.add({
  50  |         id: gameId,
  51  |         teamId,
  52  |         opponent: 'Opponent High',
  53  |         date: new Date().toISOString(),
  54  |         location: 'Home',
  55  |         completed: 0,
  56  |         currentPeriod: 1,
  57  |         clockTime: 600,
  58  |         periodLength: 10,
  59  |         periodType: 'QUARTERS',
  60  |         synced: 1
  61  |       });
  62  |
  63  |       // Set the player on court
  64  |       await db.stats.add({
  65  |         id: 'sub-in-1',
  66  |         gameId,
  67  |         playerId,
  68  |         type: 'SUB_IN',
  69  |         period: 1,
  70  |         clockTime: 600,
  71  |         timestamp: new Date().toISOString(),
  72  |         synced: 1
  73  |       });
  74  |     });
  75  |
  76  |     await page.reload();
  77  |
  78  |     // Navigate to game mode
  79  |     await page.goto('/game?gameId=test-game-id&teamId=test-team-id');
  80  |
  81  |     // Verify scoreboard initial state
  82  |     await expect(page.locator('text=Test Team')).toBeVisible();
  83  |     await expect(page.locator('text=0', { hasText: /^0$/ }).first()).toBeVisible();
  84  |
  85  |     // Click on the court to record a stat (simulating a shot)
  86  |     // We need to find the court SVG and click it
  87  |     const court = page.locator('svg').filter({ hasText: /Restricted Area/ }).first();
  88  |     await court.click({ position: { x: 250, y: 100 } });
  89  |
  90  |     // Stat Entry Dialog should open
  91  |     await expect(page.locator('text=Record Action')).toBeVisible();
  92  |
  93  |     // Select '2PT'
  94  |     await page.getByRole('button', { name: '2PT', exact: true }).click();
  95  |
  96  |     // Select 'Make'
  97  |     await page.getByRole('button', { name: 'MAKE', exact: true }).click();
  98  |
  99  |     // Select player (John Doe should be there)
  100 |     await page.getByText('John Doe').click();
  101 |
  102 |     // Save stat
  103 |     await page.getByRole('button', { name: 'Save Stat' }).click();
  104 |
  105 |     // Verify the stat appears in the game feed
  106 |     await expect(page.locator('text=John Doe made 2pt shot')).toBeVisible();
  107 |
  108 |     // Verify the score updates correctly (should be 2)
  109 |     // Scoreboard shows team score
  110 |     await expect(page.locator('text=2', { hasText: /^2$/ })).toBeVisible();
  111 |   });
  112 |
  113 |   test('Journey 2: Roster Management', async ({ page }) => {
  114 |     // Seed a team
  115 |     await page.evaluate(async () => {
  116 |       const db = (window as any).db;
  117 |       if (!db) return;
  118 |       await db.teams.add({
  119 |         id: 'team-roster-id',
  120 |         name: 'Roster Team',
  121 |         periodType: 'QUARTERS',
  122 |         isFavorite: 1,
  123 |         synced: 1
  124 |       });
  125 |     });
  126 |
  127 |     await page.goto('/players');
  128 |
  129 |     // Click 'Add player'
  130 |     // Since we are not mobile, the primary button in toolbar should work
> 131 |     await page.getByRole('button', { name: 'Add player' }).click();
      |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  132 |
  133 |     // Step 1: Identity
  134 |     await page.getByLabel('Player name').fill('New Smoke Player');
  135 |     await page.getByRole('button', { name: 'Next' }).click();
  136 |
  137 |     // Step 2: Appearance
  138 |     await page.getByRole('button', { name: 'Next' }).click();
  139 |
  140 |     // Step 3: Teams
  141 |     await page.getByLabel('Assign New Smoke Player to Roster Team').check();
  142 |     await page.getByLabel('#').fill('99');
  143 |     await page.getByRole('button', { name: 'Next' }).click();
  144 |
  145 |     // Step 4: Review
  146 |     await page.getByRole('button', { name: 'Create player' }).click();
  147 |
  148 |     // Verify the player appears in the roster list
  149 |     await expect(page.getByText('New Smoke Player')).toBeVisible();
  150 |
  151 |     // Journey requirement: Remove the player
  152 |     // In this app, "Remove" might mean Archive
  153 |     await page.getByText('New Smoke Player').click();
  154 |     // Assuming clicking navigates to player dashboard where we can archive
  155 |     // Or we can just verify it's there and then archive from list if possible
  156 |     // The Player Card has a click handler that goes to /players/:id
  157 |
  158 |     await expect(page).toHaveURL(/\/players\/.*/);
  159 |
  160 |     // Let's look for archive button in PlayerStats page
  161 |     // (I'll assume there is one based on the Roster Management journey description)
  162 |     // Actually, looking at Players.tsx, there's no direct delete, but EntityCard has onFavoriteClick
  163 |     // Roster management journey says "Remove the player"
  164 |     // Let's see if we can delete from DB directly for verification of removal if UI is complex
  165 |   });
  166 |
  167 |   test('Journey 3: Game Summary', async ({ page }) => {
  168 |     const gameId = 'summary-game-id';
  169 |     const teamId = 'summary-team-id';
  170 |
  171 |     // Seed a completed game
  172 |     await page.evaluate(async ({ gameId, teamId }) => {
  173 |       const db = (window as any).db;
  174 |       if (!db) return;
  175 |
  176 |       await db.teams.add({
  177 |         id: teamId,
  178 |         name: 'Summary Team',
  179 |         periodType: 'QUARTERS',
  180 |         synced: 1
  181 |       });
  182 |
  183 |       await db.games.add({
  184 |         id: gameId,
  185 |         teamId,
  186 |         opponent: 'Weak Opponent',
  187 |         date: new Date().toISOString(),
  188 |         location: 'Away',
  189 |         completed: 1,
  190 |         teamScore: 10,
  191 |         oppScore: 5,
  192 |         synced: 1
  193 |       });
  194 |
  195 |       await db.players.add({
  196 |         id: 'p1',
  197 |         name: 'Scoring Star',
  198 |         synced: 1
  199 |       });
  200 |
  201 |       await db.stats.add({
  202 |         id: 's1',
  203 |         gameId,
  204 |         playerId: 'p1',
  205 |         type: 'PTS',
  206 |         points: 2,
  207 |         period: 1,
  208 |         timestamp: new Date().toISOString(),
  209 |         synced: 1
  210 |       });
  211 |     }, { gameId, teamId });
  212 |
  213 |     await page.goto(`/game/${gameId}`);
  214 |
  215 |     // Verify per-player stat totals are displayed
  216 |     await expect(page.getByText('Scoring Star')).toBeVisible();
  217 |     // Verify player score (2 pts)
  218 |     await expect(page.locator('text=2')).toBeVisible();
  219 |
  220 |     // Verify the final score is correct
  221 |     await expect(page.getByText('10 - 5')).toBeVisible();
  222 |   });
  223 | });
  224 |
```