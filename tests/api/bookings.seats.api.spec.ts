import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';
import { createBooking } from '../../src/fixtures/bookingHelpers';

// These are the only tests that use an event of their own (the `privateEvent` fixture, 10 seats).
// Exact seat counts cannot be checked on the shared events, because other people book them at the same time.
// Booking every seat of a shared event would also break the other tests.
test.describe('Seats - checked on an event created for the test', () => {
  test('booking reduces the available seats by the quantity booked', async ({ firstUser, privateEvent, customer }) => {
    await createBooking(firstUser, privateEvent.id, customer, { quantity: 4 });

    const event = await firstUser.events.get(privateEvent.id);

    expect(event.body.data.availableSeats).toBe(privateEvent.totalSeats - 4);
  });

  test('cancelling a booking gives the seats back to the event', async ({ firstUser, privateEvent, customer }) => {
    const booking = await createBooking(firstUser, privateEvent.id, customer, { quantity: 5 });
    const eventAfterBooking = await firstUser.events.get(privateEvent.id);
    expect(eventAfterBooking.body.data.availableSeats).toBe(privateEvent.totalSeats - 5);

    await firstUser.bookings.cancel(booking.id);

    const eventAfterCancel = await firstUser.events.get(privateEvent.id);
    expect(eventAfterCancel.body.data.availableSeats).toBe(privateEvent.totalSeats);
  });

  test('allows booking exactly the seats that are left', async ({ firstUser, privateEvent, customer }) => {
    const input = buildBookingInput(privateEvent.id, customer, { quantity: privateEvent.totalSeats });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
    const event = await firstUser.events.get(privateEvent.id);
    expect(event.body.data.availableSeats).toBe(0);
  });

  test('rejects a booking once the event is sold out', async ({ firstUser, privateEvent, customer }) => {
    await createBooking(firstUser, privateEvent.id, customer, { quantity: privateEvent.totalSeats });
    const input = buildBookingInput(privateEvent.id, customer, { quantity: 1 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only 0 seat');
  });
});
