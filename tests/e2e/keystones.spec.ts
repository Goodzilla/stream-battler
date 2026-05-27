import { test, expect } from '@playwright/test';

test.describe('Stream Raiders Clone - E2E Keystone Redesign Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('STREAM');

    // Dev Login with an admin username to bypass normal user constraints
    await page.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'admin_keystones_test');
    await page.click('button:has-text("ENTER DEV SIMULATION")');

    // Wait for character dashboard or class selection
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible({ timeout: 5000 });

    const h2Text = await h2.textContent();
    if (h2Text && h2Text.includes('SELECT YOUR CLASS')) {
      await page.locator('button:has-text("Select")').first().click();
    }

    // Expect name header on dashboard
    await expect(page.locator('h2')).toContainText('ADMIN_KEYSTONES_TEST');

    // Navigate to Admin Panel and trigger level 100 via "Unlock All Classes"
    await page.click('button:has-text("Admin Panel")');
    await page.click('button:has-text("Unlock All Classes")');
    
    // Reload page to make sure state is cleanly synced
    await page.reload();
    await expect(page.locator('h2')).toContainText('ADMIN_KEYSTONES_TEST');
  });

  test('should verify Vampiric Zeal alone gives 25% lifesteal and 0% reflect', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Allocate only Vampiric Zeal path
    const path = [
      'start', 'r1_2', 'r2_2_b', 'r3_2_b', 'r3_2_junc', 'r4_2', 
      'r5_2_b', 'r6_2_b', 'r7_2_b', 'r7_2_junc', 'r8_2', 'r9_2_b', 
      'r9_2_junc', 'r10_32'
    ];

    await page.evaluate(async (passivesToAllocate) => {
      const res = await fetch('/api/character/allocate-passives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passives: passivesToAllocate })
      });
      if (!res.ok) throw new Error('Failed to allocate passives');
    }, path);

    // Reload and check stats
    await page.reload();
    
    // Find Lifesteal and Reflect in the Combat Stats HUD
    const lifestealText = page.locator('div:has-text("Lifesteal:")').first();
    const reflectText = page.locator('div:has-text("Reflect Armor:")').first();

    await expect(lifestealText).toContainText('25%');
    await expect(reflectText).toContainText('0%');
  });

  test('should verify allocating both Vampiric Zeal and Ghost Reaver triggers double penalty (0% lifesteal and reduced HP benefits)', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Allocate both Vampiric Zeal (r10_32) and Ghost Reaver (r10_37)
    const path = [
      'start', 'r1_2', 'r2_2_b', 'r3_2_b', 'r3_2_junc', 'r4_2', 
      'r5_2_b', 'r6_2_b', 'r7_2_b', 'r7_2_junc', 'r8_2', 'r9_2_b', 
      'r9_2_junc', 'r10_32', 'r10_37'
    ];

    await page.evaluate(async (passivesToAllocate) => {
      const res = await fetch('/api/character/allocate-passives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passives: passivesToAllocate })
      });
      if (!res.ok) throw new Error('Failed to allocate passives');
    }, path);

    // Reload and check stats
    await page.reload();
    
    // Lifesteal override from Ghost Reaver sets it to 0%
    const lifestealText = page.locator('div:has-text("Lifesteal:")').first();
    const reflectText = page.locator('div:has-text("Reflect Armor:")').first();

    await expect(lifestealText).toContainText('0%');
    await expect(reflectText).toContainText('20%'); // +20% Reflect from Ghost Reaver
  });

  test('should verify allocating both Unwavering Stance and Juggernaut Bulwark triggers override (0% reflect)', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Allocate both Unwavering Stance (r10_21) and Juggernaut Bulwark (r10_26) in Bulwark sector (s=1)
    const path = [
      'start', 'r1_1', 'r2_1_b', 'r3_1_b', 'r3_1_junc', 'r4_1', 
      'r5_1_b', 'r6_1_b', 'r7_1_b', 'r7_1_junc', 'r8_1', 'r9_1_b', 
      'r9_1_junc', 'r10_21', 'r10_26'
    ];

    await page.evaluate(async (passivesToAllocate) => {
      const res = await fetch('/api/character/allocate-passives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passives: passivesToAllocate })
      });
      if (!res.ok) throw new Error('Failed to allocate passives');
    }, path);

    // Reload and check stats
    await page.reload();
    
    // Reflect override from Unwavering Stance sets reflect to 0%, negating Juggernaut's 35% Reflect
    const reflectText = page.locator('div:has-text("Reflect Armor:")').first();
    await expect(reflectText).toContainText('0%');
  });

  test('should verify allocating both Celestial Keystones Soul Feast and Colossus triggers override (0% lifesteal)', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Allocate both Soul Feast (r14_2_key1) and Colossus (r14_2_key2) in Vigor sector (s=2)
    const path = [
      'start', 'r1_2', 'r2_2_b', 'r3_2_b', 'r3_2_junc', 'r4_2', 
      'r5_2_b', 'r6_2_b', 'r7_2_b', 'r7_2_junc', 'r8_2', 'r9_2_b', 
      'r9_2_junc', 'r11_2', 'r12_2_b', 'r13_2_b', 'r13_2_junc',
      'r14_2_key1', 'r14_2_key2'
    ];

    await page.evaluate(async (passivesToAllocate) => {
      const res = await fetch('/api/character/allocate-passives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passives: passivesToAllocate })
      });
      if (!res.ok) throw new Error('Failed to allocate passives');
    }, path);

    // Reload and check stats
    await page.reload();
    
    // Lifesteal override from Colossus sets it to 0%
    const lifestealText = page.locator('div:has-text("Lifesteal:")').first();
    await expect(lifestealText).toContainText('0%');
  });

  test('should verify allocating both Void Keystones Lethal Precision and Slayer Focus triggers double penalty (10% crit chance and 1.1x crit mult)', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Allocate both Lethal Precision (r18_4_key1) and Slayer Focus (r18_4_key2) in Precision sector (s=4)
    const path = [
      'start', 'r1_4', 'r2_4_b', 'r3_4_b', 'r3_4_junc', 'r4_4', 
      'r5_4_b', 'r6_4_b', 'r7_4_b', 'r7_4_junc', 'r8_4', 'r9_4_b', 
      'r9_4_junc', 'r11_4', 'r12_4_b', 'r13_4_b', 'r13_4_junc',
      'r15_4', 'r16_4_b', 'r17_4_b', 'r17_4_junc', 'r18_4_key1', 'r18_4_key2'
    ];

    await page.evaluate(async (passivesToAllocate) => {
      const res = await fetch('/api/character/allocate-passives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passives: passivesToAllocate })
      });
      if (!res.ok) throw new Error('Failed to allocate passives');
    }, path);

    // Reload and check stats
    await page.reload();
    
    // Overrides force Crit Chance to 10% and Crit Multiplier to 1.1x
    const critText = page.locator('div:has-text("Crit Chance / Mult:")').first();
    await expect(critText).toContainText('10% / 1.1x');
  });

  test('should verify passive point unlock scaling and 50 point limit', async ({ page }) => {
    // Navigate to Skill Tree tab
    await page.click('button:has-text("Skill Tree")');

    // Click Reset Tree to clean up previous test allocations
    await page.click('button:has-text("Reset Tree")');

    // Click Confirm button on custom ConfirmModal
    await page.click('button:has-text("Confirm")');

    // Currently character level is 100
    // Points Spent: 0 / 50 should be shown in HUD (because only "start" is allocated)
    const pointsSpentHUD = page.locator('div:has-text("Points Spent:")').first();
    await expect(pointsSpentHUD).toContainText('0 / 50');

    const availableHUD = page.locator('div:has-text("Available:")').first();
    await expect(availableHUD).toContainText('50');

    // Verify max level indicators are displayed in the header banner
    await expect(page.locator('text=LEVEL 100 (MAX)')).toBeVisible();
    await expect(page.locator('text=MAX LEVEL REACHED')).toBeVisible();
  });
});
