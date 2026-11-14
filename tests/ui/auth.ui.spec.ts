import { expect, test } from '../../src/fixtures';
import { env } from '../../src/config/env';

test.describe('Login', () => {
  test('the saved login state keeps the user logged in', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/events');

    await expect(page.getByText(env.primary.email)).toBeVisible();
  });

  test.describe('login form', () => {
    // start without any saved login
    test.use({ storageState: { cookies: [], origins: [] } });

    test('a user can log in with valid credentials', async ({ page, loginPage }) => {
      await loginPage.goto();
      await loginPage.login(env.primary);

      await expect(page.getByText(env.primary.email)).toBeVisible();
    });
  });
});
