import { expect, test } from '../../src/fixtures';
import { buildBookingInput } from '../../src/data/builders';
import { createBooking } from '../../src/fixtures/bookingHelpers';

test.describe('POST /bookings - create a booking', () => {
  test('creates a confirmed booking and returns a booking reference', { tag: ['@smoke', '@positive'] }, async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 2 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
    const booking = res.body.data;
    expect(booking.status).toBe('confirmed');
    expect(booking.bookingRef).toBeTruthy();
    expect(booking.eventId).toBe(bookableEvent.id);
    expect(booking.quantity).toBe(2);
    expect(booking.customerName).toBe(customer.name);
    expect(booking.customerEmail).toBe(customer.email);
    expect(booking.customerPhone).toBe(customer.phone);
  });

  test('total price is the ticket price multiplied by the quantity', { tag: ['@smoke', '@positive'] }, async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 3 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
    expect(Number(res.body.data.totalPrice)).toBe(Number(bookableEvent.price) * 3);
  });

  test('a single ticket costs exactly the ticket price', { tag: '@positive' }, async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 1 });

    const res = await firstUser.bookings.create(input);

    expect(Number(res.body.data.totalPrice)).toBe(Number(bookableEvent.price));
  });

  test('the booking can be fetched by its id', { tag: '@positive' }, async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await firstUser.bookings.getById(booking.id);

    expect(res.status).toBe(200);
    expect(res.body.data.bookingRef).toBe(booking.bookingRef);
  });

  test('the booking can be fetched by its reference', { tag: '@positive' }, async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const res = await firstUser.bookings.getByRef(booking.bookingRef);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(booking.id);
  });

  test('the booking appears in the list of my bookings', { tag: '@positive' }, async ({ firstUser, bookableEvent, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    const myBookings = await firstUser.bookings.listAll();

    const bookingIds = myBookings.map((b) => b.id);
    expect(bookingIds).toContain(booking.id);
  });
});
