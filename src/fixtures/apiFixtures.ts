import { test as base } from '@playwright/test';
import { createApiClients, type ApiClients } from '../api/clients';
import { newApiContext } from '../api/context';
import { loadSessions, type Sessions } from '../auth/session';

// API clients. Tests never handle tokens: the login is done once, in tests/global.setup.ts
type ApiFixtures = {
  firstUser: ApiClients; // logged in as the primary test user
  secondUser: ApiClients; // logged in as the second test user
  noUser: ApiClients; // not logged in
};

type WorkerFixtures = {
  sessions: Sessions;
};

export const test = base.extend<ApiFixtures, WorkerFixtures>({
  sessions: [
    async ({}, use) => {
      await use(loadSessions());
    },
    { scope: 'worker' },
  ],

  firstUser: async ({ sessions }, use) => {
    const context = await newApiContext(sessions.primary.token);
    await use(createApiClients(context));
    await context.dispose();
  },

  secondUser: async ({ sessions }, use) => {
    const context = await newApiContext(sessions.secondary.token);
    await use(createApiClients(context));
    await context.dispose();
  },

  noUser: async ({}, use) => {
    const context = await newApiContext();
    await use(createApiClients(context));
    await context.dispose();
  },
});
