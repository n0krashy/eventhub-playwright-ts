import { expect, test } from '../../src/fixtures';
import { env } from '../../src/config/env';

// The login form itself is exercised once per run by tests/global.setup.ts,
// so tests here only rely on the saved login state and never log in themselves.
test.describe('Login', () => {
  test('the saved login state keeps the user logged in', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/events');

    await expect(page.getByText(env.primary.email)).toBeVisible();
  });
});
