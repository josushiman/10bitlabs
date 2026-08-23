import { defineConfig, devices } from '@playwright/test';

/*
  One seam: a real browser against `wrangler dev` serving the production build.
  Not Astro's preview server — `_headers` is applied by the Workers static assets
  layer, so testing against Astro's preview would silently skip every header
  assertion.
*/
const PORT = 8787;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build once per test session, then serve that build for every test.
    command: `npm run build && npx wrangler dev --port ${PORT} --log-level warn`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
