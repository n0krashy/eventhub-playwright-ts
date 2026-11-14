import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';
import { createBooking } from '../../src/fixtures/bookingHelpers';

// These tests use an event of their own (the `privateEvent` fixture with 10 seats, or `fiveSeatEvent`).
// Exact seat counts cannot be checked on the shared events, because other people book them at the same time.
// Booking every seat of a shared event would also break the other tests.
test.describe('Seats - checked on an event created for the test', () => {
  // 6 tickets is within the 10-ticket limit, so only the 5 seats left can make the API refuse it
  test('rejects more tickets than there are seats left', { tag: '@negative' }, async ({ firstUser, fiveSeatEvent, customer }) => {
    const input = buildBookingInput(fiveSeatEvent.id, customer, { quantity: 6 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only 5 seat');
  });

  test('booking reduces the available seats by the quantity booked', { tag: '@positive' }, async ({ firstUser, privateEvent, customer }) => {
    await createBooking(firstUser, privateEvent.id, customer, { quantity: 4 });

    const event = await firstUser.events.get(privateEvent.id);

    expect(event.body.data.availableSeats).toBe(privateEvent.totalSeats - 4);
  });

  test('cancelling a booking gives the seats back to the event', { tag: '@positive' }, async ({ firstUser, privateEvent, customer }) => {
    const booking = await createBooking(firstUser, privateEvent.id, customer, { quantity: 5 });
    const eventAfterBooking = await firstUser.events.get(privateEvent.id);
    expect(eventAfterBooking.body.data.availableSeats).toBe(privateEvent.totalSeats - 5);

    await firstUser.bookings.cancel(booking.id);

    const eventAfterCancel = await firstUser.events.get(privateEvent.id);
    expect(eventAfterCancel.body.data.availableSeats).toBe(privateEvent.totalSeats);
  });

  test('allows booking exactly the seats that are left', { tag: '@positive' }, async ({ firstUser, privateEvent, customer }) => {
    const input = buildBookingInput(privateEvent.id, customer, { quantity: privateEvent.totalSeats });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
    const event = await firstUser.events.get(privateEvent.id);
    expect(event.body.data.availableSeats).toBe(0);
  });

  test('rejects a booking once the event is sold out', { tag: '@negative' }, async ({ firstUser, privateEvent, customer }) => {
    await createBooking(firstUser, privateEvent.id, customer, { quantity: privateEvent.totalSeats });
    const input = buildBookingInput(privateEvent.id, customer, { quantity: 1 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only 0 seat');
  });
});
