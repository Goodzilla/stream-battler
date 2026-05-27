# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: keystones.spec.ts >> Stream Raiders Clone - E2E Keystone Redesign Tests >> should verify passive point unlock scaling and 50 point limit
- Location: tests\e2e\keystones.spec.ts:182:7

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
  - textbox "e.g. streamer_boss or viewer_1": admin_keystones_test
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Stream Raiders Clone - E2E Keystone Redesign Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Go to landing page
  6   |     await page.goto('/');
  7   |     await expect(page.locator('h1')).toContainText('STREAM');
  8   | 
  9   |     // Dev Login with an admin username to bypass normal user constraints
  10  |     await page.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'admin_keystones_test');
  11  |     await page.click('button:has-text("ENTER DEV SIMULATION")');
  12  | 
  13  |     // Wait for character dashboard or class selection
  14  |     const h2 = page.locator('h2');
> 15  |     await expect(h2).toBeVisible({ timeout: 5000 });
      |                      ^ Error: expect(locator).toBeVisible() failed
  16  | 
  17  |     const h2Text = await h2.textContent();
  18  |     if (h2Text && h2Text.includes('SELECT YOUR CLASS')) {
  19  |       await page.locator('button:has-text("Select")').first().click();
  20  |     }
  21  | 
  22  |     // Expect name header on dashboard
  23  |     await expect(page.locator('h2')).toContainText('ADMIN_KEYSTONES_TEST');
  24  | 
  25  |     // Navigate to Admin Panel and trigger level 100 via "Unlock All Classes"
  26  |     await page.click('button:has-text("Admin Panel")');
  27  |     await page.click('button:has-text("Unlock All Classes")');
  28  |     
  29  |     // Reload page to make sure state is cleanly synced
  30  |     await page.reload();
  31  |     await expect(page.locator('h2')).toContainText('ADMIN_KEYSTONES_TEST');
  32  |   });
  33  | 
  34  |   test('should verify Vampiric Zeal alone gives 25% lifesteal and 0% reflect', async ({ page }) => {
  35  |     // Navigate to Skill Tree tab
  36  |     await page.click('button:has-text("Skill Tree")');
  37  | 
  38  |     // Allocate only Vampiric Zeal path
  39  |     const path = [
  40  |       'start', 'r1_2', 'r2_2_b', 'r3_2_b', 'r3_2_junc', 'r4_2', 
  41  |       'r5_2_b', 'r6_2_b', 'r7_2_b', 'r7_2_junc', 'r8_2', 'r9_2_b', 
  42  |       'r9_2_junc', 'r10_32'
  43  |     ];
  44  | 
  45  |     await page.evaluate(async (passivesToAllocate) => {
  46  |       const res = await fetch('/api/character/allocate-passives', {
  47  |         method: 'POST',
  48  |         headers: { 'Content-Type': 'application/json' },
  49  |         body: JSON.stringify({ passives: passivesToAllocate })
  50  |       });
  51  |       if (!res.ok) throw new Error('Failed to allocate passives');
  52  |     }, path);
  53  | 
  54  |     // Reload and check stats
  55  |     await page.reload();
  56  |     
  57  |     // Find Lifesteal and Reflect in the Combat Stats HUD
  58  |     const lifestealText = page.locator('div:has-text("Lifesteal:")').first();
  59  |     const reflectText = page.locator('div:has-text("Reflect Armor:")').first();
  60  | 
  61  |     await expect(lifestealText).toContainText('25%');
  62  |     await expect(reflectText).toContainText('0%');
  63  |   });
  64  | 
  65  |   test('should verify allocating both Vampiric Zeal and Ghost Reaver triggers double penalty (0% lifesteal and reduced HP benefits)', async ({ page }) => {
  66  |     // Navigate to Skill Tree tab
  67  |     await page.click('button:has-text("Skill Tree")');
  68  | 
  69  |     // Allocate both Vampiric Zeal (r10_32) and Ghost Reaver (r10_37)
  70  |     const path = [
  71  |       'start', 'r1_2', 'r2_2_b', 'r3_2_b', 'r3_2_junc', 'r4_2', 
  72  |       'r5_2_b', 'r6_2_b', 'r7_2_b', 'r7_2_junc', 'r8_2', 'r9_2_b', 
  73  |       'r9_2_junc', 'r10_32', 'r10_37'
  74  |     ];
  75  | 
  76  |     await page.evaluate(async (passivesToAllocate) => {
  77  |       const res = await fetch('/api/character/allocate-passives', {
  78  |         method: 'POST',
  79  |         headers: { 'Content-Type': 'application/json' },
  80  |         body: JSON.stringify({ passives: passivesToAllocate })
  81  |       });
  82  |       if (!res.ok) throw new Error('Failed to allocate passives');
  83  |     }, path);
  84  | 
  85  |     // Reload and check stats
  86  |     await page.reload();
  87  |     
  88  |     // Lifesteal override from Ghost Reaver sets it to 0%
  89  |     const lifestealText = page.locator('div:has-text("Lifesteal:")').first();
  90  |     const reflectText = page.locator('div:has-text("Reflect Armor:")').first();
  91  | 
  92  |     await expect(lifestealText).toContainText('0%');
  93  |     await expect(reflectText).toContainText('20%'); // +20% Reflect from Ghost Reaver
  94  |   });
  95  | 
  96  |   test('should verify allocating both Unwavering Stance and Juggernaut Bulwark triggers override (0% reflect)', async ({ page }) => {
  97  |     // Navigate to Skill Tree tab
  98  |     await page.click('button:has-text("Skill Tree")');
  99  | 
  100 |     // Allocate both Unwavering Stance (r10_21) and Juggernaut Bulwark (r10_26) in Bulwark sector (s=1)
  101 |     const path = [
  102 |       'start', 'r1_1', 'r2_1_b', 'r3_1_b', 'r3_1_junc', 'r4_1', 
  103 |       'r5_1_b', 'r6_1_b', 'r7_1_b', 'r7_1_junc', 'r8_1', 'r9_1_b', 
  104 |       'r9_1_junc', 'r10_21', 'r10_26'
  105 |     ];
  106 | 
  107 |     await page.evaluate(async (passivesToAllocate) => {
  108 |       const res = await fetch('/api/character/allocate-passives', {
  109 |         method: 'POST',
  110 |         headers: { 'Content-Type': 'application/json' },
  111 |         body: JSON.stringify({ passives: passivesToAllocate })
  112 |       });
  113 |       if (!res.ok) throw new Error('Failed to allocate passives');
  114 |     }, path);
  115 | 
```