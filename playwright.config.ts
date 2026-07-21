import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for smoke + accessibility E2E (spec §32.3/§32.4).
 *
 * The dev server is started with placeholder Supabase env — the smoke tests
 * cover flows that do NOT require a live backend (redirects, public pages,
 * keyboard access, 404). Backend-dependent flows (login, onboarding) run in CI
 * against a seeded local Supabase; see docs/testing-implementation.md.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    // In environments with a pre-installed Chromium (no `playwright install`),
    // point at it via PLAYWRIGHT_CHROMIUM_EXECUTABLE. CI installs its own and
    // leaves this unset.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    // Build (env is baked at build time) then preview the production bundle.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      VITE_APP_ENV: 'test',
      VITE_LOG_LEVEL: 'error',
    },
  },
});
