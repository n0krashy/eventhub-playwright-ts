import { test as base } from '@playwright/test';
import { EventDetailsPage } from '../ui/pages/EventDetailsPage';
import { EventsPage } from '../ui/pages/EventsPage';
import { LoginPage } from '../ui/pages/LoginPage';
import { MyBookingsPage } from '../ui/pages/MyBookingsPage';

type PageFixtures = {
  loginPage: LoginPage;
  eventsPage: EventsPage;
  eventDetailsPage: EventDetailsPage;
  myBookingsPage: MyBookingsPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },

  eventDetailsPage: async ({ page }, use) => {
    await use(new EventDetailsPage(page));
  },

  myBookingsPage: async ({ page }, use) => {
    await use(new MyBookingsPage(page));
  },
});
