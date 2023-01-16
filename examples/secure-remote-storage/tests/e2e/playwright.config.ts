import { PlaywrightTestConfig, devices } from '@playwright/test';

/* See https://playwright.dev/docs/test-configuration. */
const config: PlaywrightTestConfig = {
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI and Local env for now (due to test failures with multiple workers - PLAT-1774  */
  workers: 1,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  // globalSetup: require.resolve('./global-setup'),
  use: {
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
    // storageState: './tests/e2e/storageState.json',
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    // actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:65432/secure-remote-storage',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    browserName: "chromium",
    headless: Boolean(process.env.CI),
    launchOptions: {
      slowMo: 50,
    }
  },
  expect: {
  /**
   * Maximum time expect() should wait for the condition to be met.
   * For example in `await expect(locator).toHaveText();`
   */
    timeout: 5000
  },
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'line' : 'html',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
};

export default config;
