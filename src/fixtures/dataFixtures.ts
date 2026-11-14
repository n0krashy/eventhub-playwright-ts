import type { ApiClients } from '../api/clients';
import type { EventData } from '../api/models/event';
import { buildCustomer, buildEventInput, type Customer } from '../data/builders';
import { test as apiTest } from './apiFixtures';
import { cancelBookingsOf } from './bookingHelpers';

type DataFixtures = {
  customer: Customer;
  bookableEvent: EventData;
  privateEvent: EventData;
  fiveSeatEvent: EventData;
};

// Creates an event that only this test books, so its seat counts are exact.
async function createOwnEvent(api: ApiClients, totalSeats: number): Promise<EventData> {
  const res = await api.events.create(buildEventInput({ totalSeats }));
  if (res.status !== 201) {
    throw new Error(`Could not create the event: HTTP ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

// The bookings have to go before the event can be deleted.
// Like all cleanup, this only warns when something could not be removed.
async function deleteOwnEvent(api: ApiClients, event: EventData, customer: Customer): Promise<void> {
  await cancelBookingsOf(api, customer);
  const deleted = await api.events.delete(event.id);
  if (deleted.status !== 200) {
    console.warn(`Cleanup: could not delete event ${event.id} (HTTP ${deleted.status})`);
  }
}

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

  // An event with 10 seats, created for one test. 10 is the most tickets one booking can have.
  privateEvent: async ({ firstUser, customer }, use) => {
    const event = await createOwnEvent(firstUser, 10);
    await use(event);
    await deleteOwnEvent(firstUser, event, customer);
  },

  // An event with 5 seats, created for one test. With fewer seats than the 10-ticket limit,
  // the seats left are what stops a bigger booking, not the limit.
  fiveSeatEvent: async ({ firstUser, customer }, use) => {
    const event = await createOwnEvent(firstUser, 5);
    await use(event);
    await deleteOwnEvent(firstUser, event, customer);
  },
});
