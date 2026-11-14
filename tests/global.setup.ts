import { expect, test as setup } from '@playwright/test';
import { AuthClient } from '../src/api/clients/AuthClient';
import { newApiContext } from '../src/api/context';
import type { Credentials } from '../src/api/models/auth';
import { saveSessions, STORAGE_STATE_PATH, type Session } from '../src/auth/session';
import { env } from '../src/config/env';
import { LoginPage } from '../src/ui/pages/LoginPage';

// These steps run in order, before any API or UI test.
setup.describe.configure({ mode: 'serial' });

// Logs the user in. If that fails, the account probably does not exist yet, so register it.
async function getSession(credentials: Credentials): Promise<Session> {
  const context = await newApiContext();
  const auth = new AuthClient(context);

  let res = await auth.login(credentials);
  const loginStatus = res.status;
  if (res.status !== 200) {
    res = await auth.register(credentials);
  }
  await context.dispose();

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `Could not log in or register ${credentials.email} (login: HTTP ${loginStatus}, register: HTTP ${res.status}). ` +
        'Check the credentials in .env.',
    );
  }
  return { email: res.body.user.email, token: res.body.token };
}

setup('the API is reachable', async () => {
  const context = await newApiContext();
  const res = await context.get('health');
  expect(res.status()).toBe(200);
  await context.dispose();
});

setup('log in both test users through the API', async () => {
  const [primary, secondary] = await Promise.all([getSession(env.primary), getSession(env.secondary)]);
  saveSessions({ primary, secondary });
});

setup('log in through the UI and save the browser state', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(env.primary);

  // the app has finished logging in once it has stored its token
  await page.waitForFunction((key) => !!window.localStorage.getItem(key), env.tokenStorageKey);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
