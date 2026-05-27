import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially to avoid DB lock conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1 worker is safer for SQLite database testing
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  // Spin up Express server automatically before running tests
  webServer: {
    command: 'npm run dev:server',
    url: 'http://localhost:3001/api/auth/me',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
