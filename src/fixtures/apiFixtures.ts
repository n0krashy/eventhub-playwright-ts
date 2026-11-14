import { test as base } from '@playwright/test';
import { createApiClients, type ApiClients } from '../api/clients';
import { newApiContext } from '../api/context';
import { loadSessions } from '../auth/session';

// API clients. Tests never handle tokens: the login is done once, in tests/global.setup.ts,
// and the saved tokens are read only here, never in tests.
// They are worker-scoped: one context per worker is reused by every test that worker runs,
// since the clients are stateless wrappers around the token-authenticated request context.
type WorkerFixtures = {
  firstUser: ApiClients; // logged in as the primary test user
  secondUser: ApiClients; // logged in as the second test user
  noUser: ApiClients; // not logged in
};

export const test = base.extend<{}, WorkerFixtures>({
  firstUser: [
    async ({}, use) => {
      const context = await newApiContext(loadSessions().primary.token);
      await use(createApiClients(context));
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  secondUser: [
    async ({}, use) => {
      const context = await newApiContext(loadSessions().secondary.token);
      await use(createApiClients(context));
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  noUser: [
    async ({}, use) => {
      const context = await newApiContext();
      await use(createApiClients(context));
      await context.dispose();
    },
    { scope: 'worker' },
  ],
});
