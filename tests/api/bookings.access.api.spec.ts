import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';
import { createBooking } from '../../src/fixtures/bookingHelpers';

test.describe('Bookings - you must be logged in', () => {
  test('creating a booking without a token returns 401', async ({ noUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer);

    const res = await noUser.bookings.create(input);

    expect(res.status).toBe(401);
  });

  test('listing bookings without a token returns 401', async ({ noUser }) => {
    const res = await noUser.bookings.list();

    expect(res.status).toBe(401);
  });

  test('cancelling without a token returns 401 and keeps the booking', async ({ noUser, firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await noUser.bookings.cancel(booking.id);

    expect(res.status).toBe(401);
    const stillThere = await firstUser.bookings.getById(booking.id);
    expect(stillThere.status).toBe(200);
  });
});

test.describe('Bookings - a user only sees and controls their own bookings', () => {
  test('another user cannot read my booking by id', async ({ firstUser, secondUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await secondUser.bookings.getById(booking.id);

    expect(res.status).toBe(403);
  });

  test('another user cannot read my booking by reference', async ({ firstUser, secondUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await secondUser.bookings.getByRef(booking.bookingRef);

    expect(res.status).toBe(403);
  });

  test("my booking is not in another user's list", async ({ firstUser, secondUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const otherUsersBookings = await secondUser.bookings.listAll();

    const bookingIds = otherUsersBookings.map((b) => b.id);
    expect(bookingIds).not.toContain(booking.id);
  });

  test('another user cannot cancel my booking, and it stays intact', async ({ firstUser, secondUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await secondUser.bookings.cancel(booking.id);

    expect(res.status).toBe(404);
    const stillThere = await firstUser.bookings.getById(booking.id);
    expect(stillThere.status).toBe(200);
  });
});
