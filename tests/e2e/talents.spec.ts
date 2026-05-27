import { test, expect } from '@playwright/test';

test.describe('Stream Raiders Clone - E2E Class Talents Tab Test', () => {
  test('should allow a player to click the Class Talents tab and view/select talents', async ({ page }) => {
    // Go to landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('STREAM');

    // Dev Login
    await page.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'test_talents_user');
    await page.click('button:has-text("ENTER DEV SIMULATION")');

    // Wait for character dashboard or class selection
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible({ timeout: 5000 });

    const h2Text = await h2.textContent();
    if (h2Text && h2Text.includes('SELECT YOUR CLASS')) {
      await page.locator('button:has-text("Select")').first().click();
    }

    // Expect name header on dashboard
    await expect(page.locator('h2')).toContainText('TEST_TALENTS_USER');

    // Click on Class Talents tab
    await page.click('button:has-text("Class Talents")');

    // Verify Class Talents section is visible
    await expect(page.locator('h3:has-text("Class Talents")')).toBeVisible({ timeout: 5000 });

    // Verify that at least Tier 1 Unlock is visible
    await expect(page.locator('span:has-text("Tier 1 Unlock")')).toBeVisible();
  });
});
