import { expect, test } from '../../src/fixtures';
import { buildCustomer } from '../../src/data/builders';
import { EventDetailsPage } from '../../src/ui/pages/EventDetailsPage';

test.describe('A booking made in the UI is the same booking the API returns', () => {
  test('reference, quantity, total and customer details match', { tag: '@smoke' }, async ({ page, api, testData }) => {
    const event = await testData.createEvent({ price: 250, totalSeats: 50 });
    const customer = buildCustomer();
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);
    await eventPage.bookingForm.selectTickets(3);
    await eventPage.bookingForm.fillCustomerDetails(customer);
    await eventPage.bookingForm.confirm();
    await expect(eventPage.confirmation.heading).toBeVisible();
    const bookingRef = await eventPage.confirmation.bookingRef.innerText();

    const res = await api.bookings.getByRef(bookingRef);

    const booking = res.body.data;
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(3);
    expect(Number(booking.totalPrice)).toBe(750);
    expect(booking.customerName).toBe(customer.name);
    expect(booking.customerEmail).toBe(customer.email);
    expect(booking.status).toBe('confirmed');

    const eventNow = await api.events.get(event.id);
    expect(eventNow.body.data.availableSeats).toBe(47);
  });
});
