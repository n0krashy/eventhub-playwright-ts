import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';
import { createBooking } from '../../src/fixtures/bookingHelpers';

// Each test checks what the API docs promise. The live API breaks the promise today,
// so the tests are marked test.fail(): they pass while the bug exists, and fail as soon
// as the bug is fixed. That is the signal to turn them into normal tests.
test.describe('Documented behaviour vs live API @known-issue', () => {
  test.fail('booking reference has the documented EVT-XXXXXX format', async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    expect(booking.bookingRef).toMatch(/^EVT-[A-Z0-9]{6}$/);
  });

  test.fail('totalPrice is a number, as in the documented example', async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    expect(typeof booking.totalPrice).toBe('number');
  });

  test.fail('a quantity sent as a string is rejected (documented as integer)', async ({ firstUser, bookableEvent, customer }) => {
    const input = { ...buildBookingInput(bookableEvent.id, customer), quantity: '2' };

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
  });
});
