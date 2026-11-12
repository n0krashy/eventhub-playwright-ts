import { expect, test } from '../../src/fixtures';

test.describe('DELETE /bookings/{id} - cancel a booking', () => {
  test('cancels an existing booking', { tag: '@smoke' }, async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await api.bookings.cancel(booking.id);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('a cancelled booking can no longer be fetched', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    await api.bookings.cancel(booking.id);

    const res = await api.bookings.getById(booking.id);
    expect(res.status).toBe(404);
  });

  test('a cancelled booking disappears from the list of my bookings', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    await api.bookings.cancel(booking.id);

    const list = await api.bookings.list();
    const bookingIds = list.body.data.map((b) => b.id);
    expect(bookingIds).not.toContain(booking.id);
  });

  test('cancelling gives the seats back to the event', async ({ api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 20 });
    const booking = await testData.createBooking(event, { quantity: 5 });
    const eventAfterBooking = await api.events.get(event.id);
    expect(eventAfterBooking.body.data.availableSeats).toBe(15);

    await api.bookings.cancel(booking.id);

    const eventAfterCancel = await api.events.get(event.id);
    expect(eventAfterCancel.body.data.availableSeats).toBe(20);
  });

  test('cancelling the same booking twice returns 404', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);
    await api.bookings.cancel(booking.id);

    const res = await api.bookings.cancel(booking.id);

    expect(res.status).toBe(404);
  });

  test('cancelling a booking that never existed returns 404', async ({ api }) => {
    const res = await api.bookings.cancel(999_999_999);

    expect(res.status).toBe(404);
  });
});
