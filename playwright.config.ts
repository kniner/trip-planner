import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for end-to-end click-through QA. Runs the Vite dev server
 * (base '/') and drives Chromium against it.
 *
 * Browsers: run `npx playwright install --with-deps chromium` once. In some
 * sandboxes the Playwright CDN is blocked; CI installs them with open network
 * (see .github/workflows/e2e.yml), or set PLAYWRIGHT_CHROMIUM_PATH to a local
 * Chrome/Chromium binary.
 */
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
