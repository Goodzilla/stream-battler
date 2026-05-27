# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: raid.spec.ts >> Stream Raiders Clone - E2E Raid Test Flow >> should allow a streamer to host a lobby and a viewer to join and spectate
- Location: tests\e2e\raid.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2')

```

```yaml
- banner: STREAM BATTLER v1.0.0-Beta
- main:
  - img
  - text: LOBBY SYSTEM IS ONLINE
  - img
  - heading "STREAM BATTLER" [level=1]
  - paragraph: "[ MULTIPLAYER TWITCH IDLE RPG ]"
  - text: "⚠ ERROR: Invalid `prisma.user.findUnique()` invocation in C:\\Users\\Ronan\\.gemini\\antigravity\\scratch\\stream-battler\\server\\src\\routes\\auth.ts:120:34 117 // Auto admin if username contains admin 118 const isAdmin = formattedUsername.includes('admin'); 119 → 120 let user = await prisma.user.findUnique( error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`. --> schema.prisma:3 | 2 | provider = \"postgresql\" 3 | url = env(\"DATABASE_URL\") | Validation Error Count: 1 Simulate Twitch Username"
  - textbox "e.g. streamer_boss or viewer_1": streamer_admin
  - img
  - text: "*Include \"admin\" in the name to grant dev panel control."
  - button "ENTER DEV SIMULATION"
  - text: OR
  - button "Connect Twitch Account":
    - img
    - text: Connect Twitch Account
  - paragraph: Log in with your official Twitch credentials to claim character stats!
- contentinfo: "@Heikob on twitch"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Stream Raiders Clone - E2E Raid Test Flow', () => {
  4  |   test('should allow a streamer to host a lobby and a viewer to join and spectate', async ({ browser }) => {
  5  |     // 1. Setup Streamer Context
  6  |     const streamerContext = await browser.newContext();
  7  |     const streamerPage = await streamerContext.newPage();
  8  |     
  9  |     // Register console listener for debugging
  10 |     streamerPage.on('console', msg => console.log('STREAMER BROWSER:', msg.text()));
  11 |     streamerPage.on('pageerror', err => console.log('STREAMER UNCAUGHT ERROR:', err.message));
  12 | 
  13 |     // Go to landing page
  14 |     await streamerPage.goto('/');
  15 |     await expect(streamerPage.locator('h1')).toContainText('STREAM');
  16 | 
  17 |     // Dev Login as Streamer (with Admin privilege to test admin panel too)
  18 |     await streamerPage.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'streamer_admin');
  19 |     await streamerPage.click('button:has-text("ENTER DEV SIMULATION")');
  20 | 
  21 |     // Wait for header to appear to ensure transitions have occurred
  22 |     const streamerH2 = streamerPage.locator('h2');
> 23 |     await expect(streamerH2).toBeVisible({ timeout: 5000 });
     |                              ^ Error: expect(locator).toBeVisible() failed
  24 |     
  25 |     const streamerH2Text = await streamerH2.textContent();
  26 |     if (streamerH2Text && streamerH2Text.includes('SELECT YOUR CLASS')) {
  27 |       // First select button on screen corresponds to Warrior
  28 |       await streamerPage.locator('button:has-text("Select")').first().click();
  29 |     }
  30 | 
  31 |     // Expect name header on dashboard
  32 |     await expect(streamerPage.locator('h2')).toContainText('STREAMER_ADMIN');
  33 | 
  34 |     // Navigate to Lobbies & Raids Tab
  35 |     await streamerPage.click('button:has-text("Lobbies & Raids")');
  36 | 
  37 |     // Select raid challenge tier and open lobby
  38 |     await streamerPage.selectOption('select', 'tier2');
  39 |     await streamerPage.click('button:has-text("Open Lobby")');
  40 | 
  41 |     // Confirm lobby created on host screen
  42 |     await expect(streamerPage.locator('h3').first()).toContainText('Raid Lobby: #STREAMER_ADMIN');
  43 | 
  44 |     // 2. Setup Viewer Context
  45 |     const viewerContext = await browser.newContext();
  46 |     const viewerPage = await viewerContext.newPage();
  47 |     
  48 |     viewerPage.on('console', msg => console.log('VIEWER BROWSER:', msg.text()));
  49 |     viewerPage.on('pageerror', err => console.log('VIEWER UNCAUGHT ERROR:', err.message));
  50 | 
  51 |     // Go to landing page
  52 |     await viewerPage.goto('/');
  53 |     
  54 |     // Dev Login as Viewer
  55 |     await viewerPage.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'viewer_steve');
  56 |     await viewerPage.click('button:has-text("ENTER DEV SIMULATION")');
  57 | 
  58 |     // Select Ranger class for viewer if class selection is visible
  59 |     const viewerH2 = viewerPage.locator('h2');
  60 |     await expect(viewerH2).toBeVisible({ timeout: 5000 });
  61 |     
  62 |     const viewerH2Text = await viewerH2.textContent();
  63 |     if (viewerH2Text && viewerH2Text.includes('SELECT YOUR CLASS')) {
  64 |       // Find the card containing "Ranger" text and click its Select button
  65 |       await viewerPage.locator('div').filter({ hasText: 'Ranger' }).locator('button:has-text("Select")').click();
  66 |     }
  67 |     
  68 |     await expect(viewerPage.locator('h2')).toContainText('VIEWER_STEVE');
  69 | 
  70 |     // Go to Lobbies tab on viewer screen
  71 |     await viewerPage.click('button:has-text("Lobbies & Raids")');
  72 | 
  73 |     // Wait for the active lobby card to appear and click Join Raid
  74 |     const joinBtn = viewerPage.locator('div.rounded-xl').filter({ has: viewerPage.locator('span', { hasText: 'streamer_admin' }) }).locator('button:has-text("Join Raid")');
  75 |     await expect(joinBtn).toBeVisible({ timeout: 10000 });
  76 |     await joinBtn.click();
  77 | 
  78 |     // Confirm viewer screen joins the wait room
  79 |     await expect(viewerPage.locator('h3').first()).toContainText('Joined Lobby: #STREAMER_ADMIN');
  80 | 
  81 |     // Confirm viewer appears in streamer's lobby participant list
  82 |     await expect(streamerPage.locator('div:has-text("viewer_steve")').first()).toBeVisible({ timeout: 5000 });
  83 | 
  84 |     // 3. Start Raid Fight
  85 |     const startRaidBtn = streamerPage.locator('button:has-text("Start Raid Fight")');
  86 |     await expect(startRaidBtn).toBeEnabled();
  87 |     await startRaidBtn.click();
  88 | 
  89 |     // Both streamer canvas and viewer canvas should appear
  90 |     await expect(streamerPage.locator('canvas')).toBeVisible();
  91 |     await expect(viewerPage.locator('canvas')).toBeVisible();
  92 | 
  93 |     // Clean up contexts
  94 |     await viewerContext.close();
  95 |     await streamerContext.close();
  96 |   });
  97 | });
  98 | 
```