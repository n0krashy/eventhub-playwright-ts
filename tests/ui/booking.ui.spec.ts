import { expect, test } from '../../src/fixtures';
import { buildCustomer } from '../../src/data/builders';
import { EventDetailsPage } from '../../src/ui/pages/EventDetailsPage';
import { MyBookingsPage } from '../../src/ui/pages/MyBookingsPage';

test.describe('Event page - tickets and total price', () => {
  test('one ticket is selected by default and the total is the ticket price', async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const eventPage = new EventDetailsPage(page);

    await eventPage.goto(event.id);

    await expect(eventPage.bookingForm.ticketCount).toHaveText('1');
    await expect(eventPage.bookingForm.totalRow).toContainText('$250');
  });

  test('total goes up when a ticket is added', async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);

    await eventPage.bookingForm.plusButton.click();

    await expect(eventPage.bookingForm.ticketCount).toHaveText('2');
    await expect(eventPage.bookingForm.totalRow).toContainText('$500');
  });

  test('total goes down when a ticket is removed', async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);
    await eventPage.bookingForm.selectTickets(3);
    await expect(eventPage.bookingForm.totalRow).toContainText('$750');

    await eventPage.bookingForm.minusButton.click();

    await expect(eventPage.bookingForm.ticketCount).toHaveText('2');
    await expect(eventPage.bookingForm.totalRow).toContainText('$500');
  });
});

test.describe('Event page - confirm a booking', () => {
  test('shows a confirmation with a booking reference', { tag: '@smoke' }, async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const customer = buildCustomer();
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);
    await eventPage.bookingForm.selectTickets(2);
    await eventPage.bookingForm.fillCustomerDetails(customer);

    await eventPage.bookingForm.confirm();

    await expect(eventPage.confirmation.heading).toBeVisible();
    await expect(eventPage.confirmation.bookingRef).not.toBeEmpty();
    await expect(eventPage.confirmation.valueNextTo('Customer')).toHaveText(customer.name);
    await expect(eventPage.confirmation.valueNextTo('Tickets')).toHaveText('2');
  });

  test('the confirmation total is the ticket price multiplied by the tickets', async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);
    await eventPage.bookingForm.selectTickets(3);
    await eventPage.bookingForm.fillCustomerDetails(buildCustomer());

    await eventPage.bookingForm.confirm();

    await expect(eventPage.confirmation.valueNextTo('Total')).toHaveText('$750');
  });
});

test.describe('My Bookings', () => {
  test('a new booking appears in My Bookings', { tag: '@smoke' }, async ({ page, testData }) => {
    const event = await testData.createEvent({ price: 250 });
    const eventPage = new EventDetailsPage(page);
    await eventPage.goto(event.id);
    await eventPage.bookingForm.selectTickets(2);
    await eventPage.bookingForm.fillCustomerDetails(buildCustomer());
    await eventPage.bookingForm.confirm();
    await expect(eventPage.confirmation.heading).toBeVisible();
    const bookingRef = await eventPage.confirmation.bookingRef.innerText();

    await eventPage.confirmation.viewMyBookingsButton.click();

    const myBookings = new MyBookingsPage(page);
    await expect(page).toHaveURL('/bookings');
    await expect(myBookings.card(bookingRef)).toBeVisible();
    await expect(myBookings.card(bookingRef)).toContainText(event.title);
    await expect(myBookings.card(bookingRef)).toContainText('$500');
    await expect(myBookings.card(bookingRef)).toContainText('2 tickets');
  });

  test('a booking made through the API is listed in My Bookings', async ({ page, testData }) => {
    const event = await testData.createEvent();
    const booking = await testData.createBooking(event);
    const myBookings = new MyBookingsPage(page);

    await myBookings.goto();

    await expect(myBookings.card(booking.bookingRef)).toBeVisible();
    await expect(myBookings.bookingId(booking.bookingRef)).toHaveText(`#${booking.id}`);
  });
});
