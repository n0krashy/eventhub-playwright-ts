import { expect, test } from '../../src/fixtures';
import { createBooking } from '../../src/fixtures/bookingHelpers';

// A booking id that cannot exist on the shared environment
const BOOKING_THAT_DOES_NOT_EXIST = 999_999_999;

test.describe('DELETE /bookings/{id} - cancel a booking', () => {
  test('cancels an existing booking', { tag: '@smoke' }, async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await firstUser.bookings.cancel(booking.id);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('a cancelled booking can no longer be fetched', async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    await firstUser.bookings.cancel(booking.id);

    const res = await firstUser.bookings.getById(booking.id);
    expect(res.status).toBe(404);
  });

  test('a cancelled booking disappears from the list of my bookings', async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    await firstUser.bookings.cancel(booking.id);

    const myBookings = await firstUser.bookings.listAll();
    const bookingIds = myBookings.map((b) => b.id);
    expect(bookingIds).not.toContain(booking.id);
  });

  test('cancelling the same booking twice returns 404', async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);
    await firstUser.bookings.cancel(booking.id);

    const res = await firstUser.bookings.cancel(booking.id);

    expect(res.status).toBe(404);
  });

  test('cancelling a booking that never existed returns 404', async ({ firstUser }) => {
    const res = await firstUser.bookings.cancel(BOOKING_THAT_DOES_NOT_EXIST);

    expect(res.status).toBe(404);
  });
});
