import { expect, test } from '../../src/fixtures';
import { MyBookingsPage } from '../../src/ui/pages/MyBookingsPage';

test.describe('My Bookings - cancel a booking', () => {
  test('asks for confirmation and names the booking and the seats released', async ({ page, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event, { quantity: 2 });
    const myBookings = new MyBookingsPage(page);
    await myBookings.goto();

    await myBookings.clickCancelBooking(booking.bookingRef);

    await expect(myBookings.cancelDialog.message).toContainText(booking.bookingRef);
    await expect(myBookings.cancelDialog.message).toContainText('release 2 seat(s)');
  });

  test('closing the dialog keeps the booking', async ({ page, api, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);
    const myBookings = new MyBookingsPage(page);
    await myBookings.goto();
    await myBookings.clickCancelBooking(booking.bookingRef);

    await myBookings.cancelDialog.noButton.click();

    await expect(myBookings.cancelDialog.message).toBeHidden();
    await expect(myBookings.card(booking.bookingRef)).toBeVisible();
    const stillThere = await api.bookings.getById(booking.id);
    expect(stillThere.status).toBe(200);
  });

  test('confirming removes the booking and gives the seats back', { tag: '@smoke' }, async ({ page, api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 20 });
    const booking = await testData.createBooking(event, { quantity: 2 });
    const myBookings = new MyBookingsPage(page);
    await myBookings.goto();
    await myBookings.clickCancelBooking(booking.bookingRef);

    await myBookings.cancelDialog.yesButton.click();

    await expect(myBookings.card(booking.bookingRef)).toHaveCount(0);
    const cancelled = await api.bookings.getById(booking.id);
    expect(cancelled.status).toBe(404);
    const eventNow = await api.events.get(event.id);
    expect(eventNow.body.data.availableSeats).toBe(20);
  });
});
