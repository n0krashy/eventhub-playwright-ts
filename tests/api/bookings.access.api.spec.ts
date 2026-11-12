import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';

test.describe('Bookings - you must be logged in', () => {
  test('creating a booking without a token returns 401', async ({ anonApi, testData }) => {
    const event = await testData.createEvent();

    const res = await anonApi.bookings.create(buildBookingInput(event.id));

    expect(res.status).toBe(401);
  });

  test('listing bookings without a token returns 401', async ({ anonApi }) => {
    const res = await anonApi.bookings.list();

    expect(res.status).toBe(401);
  });

  test('cancelling without a token returns 401 and keeps the booking', async ({ anonApi, api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await anonApi.bookings.cancel(booking.id);

    expect(res.status).toBe(401);
    const stillThere = await api.bookings.getById(booking.id);
    expect(stillThere.status).toBe(200);
  });
});

test.describe('Bookings - a user only sees and controls their own bookings', () => {
  test('another user cannot read my booking by id', async ({ otherApi, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await otherApi.bookings.getById(booking.id);

    expect(res.status).toBe(403);
  });

  test('another user cannot read my booking by reference', async ({ otherApi, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await otherApi.bookings.getByRef(booking.bookingRef);

    expect(res.status).toBe(403);
  });

  test("my booking is not in another user's list", async ({ otherApi, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await otherApi.bookings.list();

    const bookingIds = res.body.data.map((b) => b.id);
    expect(bookingIds).not.toContain(booking.id);
  });

  test('another user cannot cancel my booking, and it stays intact', async ({ otherApi, api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 20 });
    const booking = await testData.createBooking(event, { quantity: 2 });

    const res = await otherApi.bookings.cancel(booking.id);

    expect(res.status).toBe(404);
    const stillThere = await api.bookings.getById(booking.id);
    expect(stillThere.status).toBe(200);
    const eventNow = await api.events.get(event.id);
    expect(eventNow.body.data.availableSeats).toBe(18);
  });
});
