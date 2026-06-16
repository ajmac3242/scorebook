import { test, expect } from '@playwright/test';

test.describe('CourtSight Smoke Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Inject a bypass for Cognito authentication and seed database
    await page.addInitScript(() => {
      localStorage.setItem('isAuthenticated', 'true');
      // We will seed the database using window.db which is exposed in DEV mode
    });
    await page.goto('/');
  });

  test('Journey 1: Record a Stat', async ({ page }) => {
    // Seed data
    await page.evaluate(async () => {
      // Wait for DB to be available (max 5s)
      for (let i = 0; i < 50; i++) {
        if ((window as any).db) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const db = (window as any).db;
      if (!db) return;

      const teamId = 'test-team-id';
      const playerId = 'test-player-id';
      const gameId = 'test-game-id';

      await db.teams.add({ id: teamId, name: 'Test Team', periodType: 'QUARTERS', isFavorite: 1, synced: 1 });
      await db.players.add({ id: playerId, name: 'John Doe', avatarColor: '#1976d2', synced: 1 });
      await db.teamPlayers.add({ id: 'tp1', teamId, playerId, name: 'John Doe', jerseyNumber: '10', synced: 1 });
      await db.games.add({
        id: gameId, teamId, opponent: 'Opponent High', date: new Date().toISOString(),
        location: 'Home', completed: 0, currentPeriod: 1, clockTime: 600,
        periodLength: 10, periodType: 'QUARTERS', synced: 1
      });
      // Set the player on court
      await db.stats.add({ id: 'sub-in-1', gameId, playerId, type: 'SUB_IN', period: 1, clockTime: 600, timestamp: new Date().toISOString(), synced: 1 });
    });

    await page.reload();

    // Navigate to game mode
    await page.goto('/game?gameId=test-game-id&teamId=test-team-id');

    // Verify scoreboard initial state
    await expect(page.locator('text=Test Team').first()).toBeVisible();
    await expect(page.locator('text=0', { hasText: /^0$/ }).first()).toBeVisible();

    // Click on the court to record a stat (simulating a shot)
    const court = page.getByTestId('basketball-court');
    await court.click({ position: { x: 250, y: 100 } });

    // Stat Entry Dialog should open
    await expect(page.locator('text=Record Action')).toBeVisible();

    // Select 'Make'
    await page.getByLabel('Record Make (M)').click();

    // Select player (John Doe should be there, jersey #10)
    await page.getByRole('button', { name: '10' }).click();

    // Save stat
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Verify the stat appears in the recent actions
    await expect(page.locator('tbody').getByText('John Doe').first()).toBeVisible();

    // Verify the score updates correctly (should be 2)
    await expect(page.getByLabel('Test Team score: 2')).toBeVisible();
  });

  test('Journey 2: Roster Management', async ({ page }) => {
    // Seed a team
    await page.evaluate(async () => {
      // Wait for DB to be available (max 5s)
      for (let i = 0; i < 50; i++) {
        if ((window as any).db) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const db = (window as any).db;
      if (!db) return;

      await db.teams.add({ id: 'team-roster-id', name: 'Roster Team', periodType: 'QUARTERS', isFavorite: 1, synced: 1 });
    });

    await page.goto('/players');

    // Click 'Add player'
    await page.getByRole('button', { name: 'Add player' }).click();

    // Step 1: Identity
    await page.getByLabel('Player name').fill('New Smoke Player');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Appearance
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Teams
    await page.getByLabel('Assign New Smoke Player to Roster Team').check();
    await page.getByLabel('#').fill('99');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Review
    await page.getByRole('button', { name: 'Create player' }).click();

    // Verify the player appears in the roster list
    await expect(page.getByRole('heading', { name: 'New Smoke Player' }).first()).toBeVisible();

    // Click the player card to navigate to player dashboard
    await page.getByRole('heading', { name: 'New Smoke Player' }).first().click();

    // Verify navigation to the player's detail page
    await expect(page).toHaveURL(/\/players\/.+/);
  });

  test('Journey 3: Game Summary', async ({ page }) => {
    const gameId = 'summary-game-id';
    const teamId = 'summary-team-id';

    // Seed a completed game
    await page.evaluate(async ({ gameId, teamId }) => {
      // Wait for DB to be available (max 5s)
      for (let i = 0; i < 50; i++) {
        if ((window as any).db) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const db = (window as any).db;
      if (!db) return;

      await db.teams.add({
        id: teamId,
        name: 'Summary Team',
        periodType: 'QUARTERS',
        synced: 1
      });

      await db.games.add({
        id: gameId,
        teamId,
        opponent: 'Weak Opponent',
        date: new Date().toISOString(),
        location: 'Away',
        completed: 1,
        teamScore: 10,
        oppScore: 5,
        synced: 1
      });

      await db.players.add({
        id: 'p1',
        name: 'Scoring Star',
        synced: 1
      });

      await db.teamPlayers.add({
        id: 'tp-summary',
        teamId,
        playerId: 'p1',
        name: 'Scoring Star',
        jerseyNumber: '23',
        synced: 1
      });

      // To make the Box Score show 10 and 5, we actually need to seed the stats
      // because teamData/oppData in GameStats are calculated from stats,
      // not just reading teamScore/oppScore from the game record.
      await db.stats.bulkAdd([
        { id: 's1', gameId, playerId: 'p1', type: 'MAKE', points: 3, period: 1, timestamp: new Date(Date.now()-5000).toISOString(), synced: 1 },
        { id: 's2', gameId, playerId: 'p1', type: 'MAKE', points: 3, period: 1, timestamp: new Date(Date.now()-4000).toISOString(), synced: 1 },
        { id: 's3', gameId, playerId: 'p1', type: 'MAKE', points: 2, period: 1, timestamp: new Date(Date.now()-3000).toISOString(), synced: 1 },
        { id: 's4', gameId, playerId: 'p1', type: 'MAKE', points: 2, period: 1, timestamp: new Date(Date.now()-2000).toISOString(), synced: 1 },
        { id: 'opp1', gameId, playerId: 'OPPONENT', type: 'MAKE', points: 3, period: 1, timestamp: new Date(Date.now()-1000).toISOString(), synced: 1 },
        { id: 'opp2', gameId, playerId: 'OPPONENT', type: 'MAKE', points: 2, period: 1, timestamp: new Date(Date.now()).toISOString(), synced: 1 },
      ]);
    }, { gameId, teamId });

    await page.goto(`/game/${gameId}`);

    // Verify per-player stat totals are displayed in the box score
    await expect(page.locator('tbody').getByText('Scoring Star').first()).toBeVisible({ timeout: 10000 });

    // Verify player score (10 pts) in box score
    await expect(page.getByRole('cell', { name: /^10$/ }).first()).toBeVisible();

    // Verify total points in Box Score table footer
    // In BoxScoreSection, "TEAM TOTALS (PPP: ...)" cell is followed by a "-" MIN cell and then the points cell.
    // However, in our tests, teamData.points=10 and oppData.points=5
    await expect(page.getByRole('cell', { name: 'TEAM TOTALS' }).locator('xpath=following-sibling::td[2]')).toHaveText('10');
    await expect(page.getByRole('cell', { name: 'OPPONENT' }).locator('xpath=following-sibling::td[2]')).toHaveText('5');
  });
});
