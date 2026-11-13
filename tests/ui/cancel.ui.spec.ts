import { expect, test } from '../../src/fixtures';

test.describe('My Bookings - cancel a booking', () => {
  let bookingRef: string;

  // Every test starts with a booking of 2 tickets made on the website, and the My Bookings page open
  test.beforeEach(async ({ eventsPage, eventDetailsPage, myBookingsPage, customer }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
    await eventDetailsPage.bookTickets(2, customer);
    bookingRef = await eventDetailsPage.confirmation.bookingRef.innerText();
    await myBookingsPage.goto();
  });

  test('asks for confirmation and names the booking and the seats released', async ({ myBookingsPage }) => {
    await myBookingsPage.clickCancelBooking(bookingRef);

    await expect(myBookingsPage.cancelDialog.message).toContainText(bookingRef);
    await expect(myBookingsPage.cancelDialog.message).toContainText('release 2 seat(s)');
  });

  test('closing the dialog keeps the booking', async ({ myBookingsPage }) => {
    await myBookingsPage.clickCancelBooking(bookingRef);

    await myBookingsPage.cancelDialog.noButton.click();

    await expect(myBookingsPage.cancelDialog.message).toBeHidden();
    await expect(myBookingsPage.card(bookingRef)).toBeVisible();
  });

  test('confirming removes the booking from My Bookings', { tag: '@smoke' }, async ({ myBookingsPage }) => {
    await myBookingsPage.clickCancelBooking(bookingRef);

    await myBookingsPage.cancelDialog.yesButton.click();

    await expect(myBookingsPage.card(bookingRef)).toHaveCount(0);
    await myBookingsPage.goto(); // reload, to be sure the booking is really gone
    await expect(myBookingsPage.card(bookingRef)).toHaveCount(0);
  });
});
