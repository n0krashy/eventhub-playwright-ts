import type { EventData } from '../api/models/event';
import { buildCustomer, buildEventInput, type Customer } from '../data/builders';
import { test as apiTest } from './apiFixtures';
import { cancelBookingsOf } from './bookingHelpers';

type DataFixtures = {
  customer: Customer;
  bookableEvent: EventData;
  almostSoldOutEvent: EventData;
  privateEvent: EventData;
};

export const test = apiTest.extend<DataFixtures>({
  // A new customer for every test. After the test, every booking made with the customer's email is cancelled.
  customer: async ({ firstUser }, use) => {
    const customer = buildCustomer();
    await use(customer);
    await cancelBookingsOf(firstUser, customer);
  },

  // An existing event with plenty of seats, so tests can book it without running it out
  bookableEvent: async ({ firstUser }, use) => {
    const events = (await firstUser.events.list()).body.data;
    const event = events.find((e) => e.availableSeats >= 10);
    if (!event) {
      throw new Error('No existing event has 10 or more seats left.');
    }
    await use(event);
  },

  // An existing event with fewer than 10 seats left (the events page shows "8 seats left!")
  almostSoldOutEvent: async ({ firstUser }, use) => {
    const events = (await firstUser.events.list()).body.data;
    const event = events.find((e) => e.availableSeats < 10);
    if (!event) {
      throw new Error('No existing event has fewer than 10 seats left, so this test cannot run.');
    }
    await use(event);
  },

  // An event created just for one test, so its seat counts are exact. Only the seat tests use it.
  // It has 10 seats, because 10 is the most tickets one booking can have.
  privateEvent: async ({ firstUser, customer }, use) => {
    const res = await firstUser.events.create(buildEventInput({ totalSeats: 10 }));
    if (res.status !== 201) {
      throw new Error(`Could not create the event: HTTP ${res.status} ${JSON.stringify(res.body)}`);
    }
    const event = res.body.data;

    await use(event);

    // The bookings have to go before the event can be deleted
    await cancelBookingsOf(firstUser, customer);
    const deleted = await firstUser.events.delete(event.id);
    if (deleted.status !== 200) {
      console.warn(`Cleanup: could not delete event ${event.id} (HTTP ${deleted.status})`);
    }
  },
});
