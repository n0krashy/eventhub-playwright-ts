import { test as base, expect } from '@playwright/test';
import { createApiClients, type ApiClients } from '../api/clients';
import { newApiContext } from '../api/context';
import { loadSessions, type Sessions } from '../auth/session';
import { TestData } from './testData';

type TestFixtures = {
  api: ApiClients; // logged in as the primary test user
  otherApi: ApiClients; // logged in as the second test user
  anonApi: ApiClients; // no login at all
  testData: TestData;
};

type WorkerFixtures = {
  sessions: Sessions;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  sessions: [
    async ({}, use) => {
      await use(loadSessions());
    },
    { scope: 'worker' },
  ],

  api: async ({ sessions }, use) => {
    const context = await newApiContext(sessions.primary.token);
    await use(createApiClients(context));
    await context.dispose();
  },

  otherApi: async ({ sessions }, use) => {
    const context = await newApiContext(sessions.secondary.token);
    await use(createApiClients(context));
    await context.dispose();
  },

  anonApi: async ({}, use) => {
    const context = await newApiContext();
    await use(createApiClients(context));
    await context.dispose();
  },

  testData: async ({ api }, use, testInfo) => {
    const testData = new TestData(api);
    await use(testData);
    await testData.cleanUp(testInfo);
  },
});

export { expect };
