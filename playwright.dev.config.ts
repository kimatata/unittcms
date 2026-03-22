import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright config for non-Docker E2E tests.
 *
 * Before running, ensure:
 *   - npm install is run in the root, backend, and frontend directories
 *   - playwright is installed: npx playwright install --with-deps
 *
 * Then run: npm run e2e:dev
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/first-user-signup.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/first-user-signup.spec.ts',
    },
  ],

  /* Start backend and frontend servers before running tests */
  webServer: [
    {
      command: 'cd backend && npm run build && npm run migrate && npm run start',
      env: {
        DATABASE_PATH: path.resolve(__dirname, 'backend/database/database.sqlite'),
      },
      url: 'http://localhost:8001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd frontend && npm run build && npm run start',
      env: {
        NEXT_PUBLIC_BACKEND_ORIGIN: 'http://localhost:8001',
      },
      url: 'http://localhost:8000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
