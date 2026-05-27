import { test, expect } from '@playwright/test';

test.describe('Stream Raiders Clone - E2E Raid Test Flow', () => {
  test('should allow a streamer to host a lobby and a viewer to join and spectate', async ({ browser }) => {
    // 1. Setup Streamer Context
    const streamerContext = await browser.newContext();
    const streamerPage = await streamerContext.newPage();
    
    // Register console listener for debugging
    streamerPage.on('console', msg => console.log('STREAMER BROWSER:', msg.text()));
    streamerPage.on('pageerror', err => console.log('STREAMER UNCAUGHT ERROR:', err.message));

    // Go to landing page
    await streamerPage.goto('/');
    await expect(streamerPage.locator('h1')).toContainText('STREAM');

    // Dev Login as Streamer (with Admin privilege to test admin panel too)
    await streamerPage.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'streamer_admin');
    await streamerPage.click('button:has-text("ENTER DEV SIMULATION")');

    // Wait for header to appear to ensure transitions have occurred
    const streamerH2 = streamerPage.locator('h2');
    await expect(streamerH2).toBeVisible({ timeout: 5000 });
    
    const streamerH2Text = await streamerH2.textContent();
    if (streamerH2Text && streamerH2Text.includes('SELECT YOUR CLASS')) {
      // First select button on screen corresponds to Warrior
      await streamerPage.locator('button:has-text("Select")').first().click();
    }

    // Expect name header on dashboard
    await expect(streamerPage.locator('h2')).toContainText('STREAMER_ADMIN');

    // Navigate to Lobbies & Raids Tab
    await streamerPage.click('button:has-text("Lobbies & Raids")');

    // Select raid challenge tier and open lobby
    await streamerPage.selectOption('select', 'tier2');
    await streamerPage.click('button:has-text("Open Lobby")');

    // Confirm lobby created on host screen
    await expect(streamerPage.locator('h3').first()).toContainText('Raid Lobby: #STREAMER_ADMIN');

    // 2. Setup Viewer Context
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    
    viewerPage.on('console', msg => console.log('VIEWER BROWSER:', msg.text()));
    viewerPage.on('pageerror', err => console.log('VIEWER UNCAUGHT ERROR:', err.message));

    // Go to landing page
    await viewerPage.goto('/');
    
    // Dev Login as Viewer
    await viewerPage.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'viewer_steve');
    await viewerPage.click('button:has-text("ENTER DEV SIMULATION")');

    // Select Ranger class for viewer if class selection is visible
    const viewerH2 = viewerPage.locator('h2');
    await expect(viewerH2).toBeVisible({ timeout: 5000 });
    
    const viewerH2Text = await viewerH2.textContent();
    if (viewerH2Text && viewerH2Text.includes('SELECT YOUR CLASS')) {
      // Find the card containing "Ranger" text and click its Select button
      await viewerPage.locator('div').filter({ hasText: 'Ranger' }).locator('button:has-text("Select")').click();
    }
    
    await expect(viewerPage.locator('h2')).toContainText('VIEWER_STEVE');

    // Go to Lobbies tab on viewer screen
    await viewerPage.click('button:has-text("Lobbies & Raids")');

    // Wait for the active lobby card to appear and click Join Raid
    const joinBtn = viewerPage.locator('button:has-text("Join Raid")');
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await joinBtn.click();

    // Confirm viewer screen joins the wait room
    await expect(viewerPage.locator('h3').first()).toContainText('Joined Lobby: #STREAMER_ADMIN');

    // Confirm viewer appears in streamer's lobby participant list
    await expect(streamerPage.locator('div:has-text("viewer_steve")').first()).toBeVisible({ timeout: 5000 });

    // 3. Start Raid Fight
    const startRaidBtn = streamerPage.locator('button:has-text("Start Raid Fight")');
    await expect(startRaidBtn).toBeEnabled();
    await startRaidBtn.click();

    // Both streamer canvas and viewer canvas should appear
    await expect(streamerPage.locator('canvas')).toBeVisible();
    await expect(viewerPage.locator('canvas')).toBeVisible();

    // Clean up contexts
    await viewerContext.close();
    await streamerContext.close();
  });
});
