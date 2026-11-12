import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE_PATH } from './src/auth/session';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Health check, API sessions for both users, and one real UI login saved as browser state.
    { name: 'setup', testMatch: 'global.setup.ts' },
    { name: 'api', testMatch: 'api/**/*.spec.ts', dependencies: ['setup'] },
    {
      name: 'ui',
      testMatch: '{ui,e2e}/**/*.spec.ts',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE_PATH },
    },
  ],
});
