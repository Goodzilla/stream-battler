# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: talents.spec.ts >> Stream Raiders Clone - E2E Class Talents Tab Test >> should allow a player to click the Class Talents tab and view/select talents
- Location: tests\e2e\talents.spec.ts:4:7

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
  - textbox "e.g. streamer_boss or viewer_1": test_talents_user
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
  3  | test.describe('Stream Raiders Clone - E2E Class Talents Tab Test', () => {
  4  |   test('should allow a player to click the Class Talents tab and view/select talents', async ({ page }) => {
  5  |     // Go to landing page
  6  |     await page.goto('/');
  7  |     await expect(page.locator('h1')).toContainText('STREAM');
  8  | 
  9  |     // Dev Login
  10 |     await page.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'test_talents_user');
  11 |     await page.click('button:has-text("ENTER DEV SIMULATION")');
  12 | 
  13 |     // Wait for character dashboard or class selection
  14 |     const h2 = page.locator('h2');
> 15 |     await expect(h2).toBeVisible({ timeout: 5000 });
     |                      ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     const h2Text = await h2.textContent();
  18 |     if (h2Text && h2Text.includes('SELECT YOUR CLASS')) {
  19 |       await page.locator('button:has-text("Select")').first().click();
  20 |     }
  21 | 
  22 |     // Expect name header on dashboard
  23 |     await expect(page.locator('h2')).toContainText('TEST_TALENTS_USER');
  24 | 
  25 |     // Click on Class Talents tab
  26 |     await page.click('button:has-text("Class Talents")');
  27 | 
  28 |     // Verify Class Talents section is visible
  29 |     await expect(page.locator('h3:has-text("Class Talents")')).toBeVisible({ timeout: 5000 });
  30 | 
  31 |     // Verify that at least Tier 1 Unlock is visible
  32 |     await expect(page.locator('span:has-text("Tier 1 Unlock")')).toBeVisible();
  33 |   });
  34 | });
  35 | 
```