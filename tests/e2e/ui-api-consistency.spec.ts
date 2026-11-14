import { expect, test } from '../../src/fixtures';
import { parsePrice } from '../../src/data/price';
import { createBooking } from '../../src/fixtures/bookingHelpers';

test.describe('The website and the API show the same bookings', () => {
  test('a booking made on the website is the same booking in the API', { tag: ['@smoke', '@positive'] }, async ({ firstUser, eventsPage, eventDetailsPage, customer }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
    const price = parsePrice(await eventDetailsPage.bookingForm.ticketPrice.innerText());
    await eventDetailsPage.bookTickets(3, customer);
    const bookingRef = await eventDetailsPage.confirmation.bookingRef.innerText();

    const res = await firstUser.bookings.getByRef(bookingRef);

    expect(res.status).toBe(200);
    const booking = res.body.data;
    expect(booking.quantity).toBe(3);
    expect(Number(booking.totalPrice)).toBe(price * 3);
    expect(booking.customerName).toBe(customer.name);
    expect(booking.customerEmail).toBe(customer.email);
    expect(booking.customerPhone).toBe(customer.phone);
    expect(booking.status).toBe('confirmed');
  });

  test('a booking made through the API is listed in My Bookings', { tag: '@positive' }, async ({ firstUser, bookableEvent, myBookingsPage, customer }) => {
    const booking = await createBooking(firstUser, bookableEvent.id, customer);

    await myBookingsPage.goto();

    await expect(myBookingsPage.card(booking.bookingRef)).toBeVisible();
    await expect(myBookingsPage.bookingId(booking.bookingRef)).toHaveText(`#${booking.id}`);
  });
});
