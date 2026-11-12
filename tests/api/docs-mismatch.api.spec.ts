import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';

// Each test checks what the API docs promise. The live API breaks the promise today,
// so the tests are marked test.fail(): they pass while the bug exists, and fail as soon
// as the bug is fixed. That is the signal to turn them into normal tests.
test.describe('Documented behaviour vs live API @known-issue', () => {
  test.fail('booking reference has the documented EVT-XXXXXX format', async ({ testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    expect(booking.bookingRef).toMatch(/^EVT-[A-Z0-9]{6}$/);
  });

  test.fail('totalPrice is a number, as in the documented example', async ({ testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    expect(typeof booking.totalPrice).toBe('number');
  });

  test.fail('a quantity sent as a string is rejected (documented as integer)', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create({ ...buildBookingInput(event.id), quantity: '2' });

    expect(res.status).toBe(400);
  });
});
