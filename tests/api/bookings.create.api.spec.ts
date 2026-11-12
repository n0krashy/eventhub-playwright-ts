import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';

test.describe('POST /bookings - create a booking', () => {
  test('creates a confirmed booking and returns a booking reference', { tag: '@smoke' }, async ({ api, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const input = buildBookingInput(event.id, { quantity: 2 });

    const res = await api.bookings.create(input);

    expect(res.status).toBe(201);
    const booking = res.body.data;
    expect(booking.status).toBe('confirmed');
    expect(booking.bookingRef).toBeTruthy();
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(2);
    expect(booking.customerName).toBe(input.customerName);
    expect(booking.customerEmail).toBe(input.customerEmail);
    expect(booking.customerPhone).toBe(input.customerPhone);
  });

  test('total price is the ticket price multiplied by the quantity', { tag: '@smoke' }, async ({ api, testData }) => {
    const event = await testData.createEvent({ price: 250 });

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 3 }));

    expect(res.status).toBe(201);
    expect(Number(res.body.data.totalPrice)).toBe(750);
  });

  test('a single ticket costs exactly the ticket price', async ({ api, testData }) => {
    const event = await testData.createEvent({ price: 120 });

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 1 }));

    expect(Number(res.body.data.totalPrice)).toBe(120);
  });

  test('booking reduces the available seats by the quantity booked', async ({ api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 20 });

    await testData.createBooking(event, { quantity: 4 });

    const updatedEvent = await api.events.get(event.id);
    expect(updatedEvent.body.data.availableSeats).toBe(16);
  });

  test('the booking can be fetched by its id', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await api.bookings.getById(booking.id);

    expect(res.status).toBe(200);
    expect(res.body.data.bookingRef).toBe(booking.bookingRef);
  });

  test('the booking can be fetched by its reference', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await api.bookings.getByRef(booking.bookingRef);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(booking.id);
  });

  test('the booking appears in the list of my bookings', async ({ api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);

    const res = await api.bookings.list();

    expect(res.status).toBe(200);
    const bookingIds = res.body.data.map((b) => b.id);
    expect(bookingIds).toContain(booking.id);
  });
});
