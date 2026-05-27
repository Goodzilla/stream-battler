import { test, expect } from '@playwright/test';

test.describe('Stream Raiders Clone - E2E Merchant Shop Test', () => {
  test('should allow a player to view merchant shop, check stocks, and view mystery artifacts', async ({ page }) => {
    // Go to landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('STREAM');

    // Dev Login
    await page.fill('input[placeholder="e.g. streamer_boss or viewer_1"]', 'test_merchant_buyer');
    await page.click('button:has-text("ENTER DEV SIMULATION")');

    // Wait for character dashboard or class selection
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible({ timeout: 5000 });

    const h2Text = await h2.textContent();
    if (h2Text && h2Text.includes('SELECT YOUR CLASS')) {
      await page.locator('button:has-text("Select")').first().click();
    }

    // Expect name header on dashboard
    await expect(page.locator('h2')).toContainText('TEST_MERCHANT_BUYER');

    // Navigate to Merchant Shop Tab
    await page.click('button:has-text("Merchant Shop")');

    // Verify the Merchant panels load properly
    await expect(page.locator('h3:has-text("Merchant Gear Purchase")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("Gheed\'s Mystery Artifacts")')).toBeVisible({ timeout: 5000 });

    // Verify that the manual refresh button is visible
    await expect(page.locator('button:has-text("Refresh Stock (10g)")')).toBeVisible();

    // Verify that the mystery artifacts buttons are rendered
    await expect(page.locator('button:has-text("WEAPON")')).toBeVisible();
    await expect(page.locator('button:has-text("ARMOR")')).toBeVisible();
    await expect(page.locator('button:has-text("ACCESSORY")')).toBeVisible();
  });
});
