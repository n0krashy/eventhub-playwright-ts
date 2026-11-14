import { expect, test } from '../../src/fixtures';
import { formatPrice, parsePrice } from '../../src/data/price';

// These tests book through the website only. They use the first event in the list.

test.describe('Event page - tickets and total price', () => {
  test.beforeEach(async ({ eventsPage }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
  });

  test('one ticket is selected by default and the total is the ticket price', async ({ eventDetailsPage }) => {
    const form = eventDetailsPage.bookingForm;
    const ticketPrice = await form.ticketPrice.innerText();

    await expect(form.ticketCount).toHaveText('1');
    await expect(form.total).toHaveText(ticketPrice);
  });

  test('total goes up when a ticket is added', async ({ eventDetailsPage }) => {
    const form = eventDetailsPage.bookingForm;
    const price = parsePrice(await form.ticketPrice.innerText());

    await form.plusButton.click();

    await expect(form.ticketCount).toHaveText('2');
    await expect(form.total).toHaveText(formatPrice(price * 2));
  });

  test('total goes down when a ticket is removed', async ({ eventDetailsPage }) => {
    const form = eventDetailsPage.bookingForm;
    const price = parsePrice(await form.ticketPrice.innerText());
    await eventDetailsPage.selectTickets(3);
    await expect(form.total).toHaveText(formatPrice(price * 3));

    await form.minusButton.click();

    await expect(form.ticketCount).toHaveText('2');
    await expect(form.total).toHaveText(formatPrice(price * 2));
  });
});

test.describe('Event page - ticket limits', () => {
  test.beforeEach(async ({ eventsPage }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
  });

  test('the minus button is disabled at 1 ticket', async ({ eventDetailsPage }) => {
    await expect(eventDetailsPage.bookingForm.ticketCount).toHaveText('1');
    await expect(eventDetailsPage.bookingForm.minusButton).toBeDisabled();
  });

  test('the plus button is disabled at 10 tickets', async ({ eventDetailsPage }) => {
    await eventDetailsPage.selectTickets(10);

    await expect(eventDetailsPage.bookingForm.ticketCount).toHaveText('10');
    await expect(eventDetailsPage.bookingForm.plusButton).toBeDisabled();
  });
});

// These tests use an event created for the test (through the API), because the seats
// of the shared events change while the tests run. The booking itself is still done on the website.
test.describe('Event page - seats on an event created for the test', () => {
  test('the plus button stops at the number of seats left', async ({ eventsPage, eventDetailsPage, fiveSeatEvent }) => {
    await eventsPage.goto();
    await eventsPage.openEvent(fiveSeatEvent.title);

    await eventDetailsPage.selectTickets(5);

    await expect(eventDetailsPage.bookingForm.ticketCount).toHaveText('5');
    await expect(eventDetailsPage.bookingForm.plusButton).toBeDisabled();
  });

  test('booking tickets lowers the seats left on the event card', async ({ eventsPage, eventDetailsPage, privateEvent, customer }) => {
    await eventsPage.goto();
    await expect(eventsPage.eventCard(privateEvent.title)).toContainText('10 seats left');
    await eventsPage.openEvent(privateEvent.title);

    await eventDetailsPage.bookTickets(2, customer);
    await expect(eventDetailsPage.confirmation.heading).toBeVisible();

    await eventsPage.goto();
    await expect(eventsPage.eventCard(privateEvent.title)).toContainText('8 seats left');
  });
});

test.describe('Event page - form validation', () => {
  test.beforeEach(async ({ eventsPage }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
  });

  test('shows an error for a name shorter than 2 characters', async ({ eventDetailsPage, customer }) => {
    await eventDetailsPage.fillCustomerDetails({ ...customer, name: 'A' });

    await eventDetailsPage.confirm();

    await expect(eventDetailsPage.bookingForm.nameError).toBeVisible();
    await expect(eventDetailsPage.confirmation.heading).toBeHidden();
  });

  test('shows an error for an invalid email', async ({ eventDetailsPage, customer }) => {
    await eventDetailsPage.fillCustomerDetails({ ...customer, email: 'not-an-email' });

    await eventDetailsPage.confirm();

    await expect(eventDetailsPage.bookingForm.emailError).toBeVisible();
    await expect(eventDetailsPage.confirmation.heading).toBeHidden();
  });

  test('shows an error for a phone number that is too short', async ({ eventDetailsPage, customer }) => {
    await eventDetailsPage.fillCustomerDetails({ ...customer, phone: '123' });

    await eventDetailsPage.confirm();

    await expect(eventDetailsPage.bookingForm.phoneError).toBeVisible();
    await expect(eventDetailsPage.confirmation.heading).toBeHidden();
  });

  // Blank fields hit the same validation as invalid ones (same error text), so this
  // only needs to check all three errors together, not one test per empty field.
  test('shows an error for every field when the form is submitted empty', async ({ eventDetailsPage }) => {
    await eventDetailsPage.confirm();

    await expect(eventDetailsPage.bookingForm.nameError).toBeVisible();
    await expect(eventDetailsPage.bookingForm.emailError).toBeVisible();
    await expect(eventDetailsPage.bookingForm.phoneError).toBeVisible();
    await expect(eventDetailsPage.confirmation.heading).toBeHidden();
  });
});

test.describe('Event page - confirm a booking', () => {
  test.beforeEach(async ({ eventsPage }) => {
    await eventsPage.goto();
    await eventsPage.openFirstEvent();
  });

  test('shows a confirmation with a booking reference', { tag: '@smoke' }, async ({ eventDetailsPage, customer }) => {
    await eventDetailsPage.bookTickets(2, customer);

    const confirmation = eventDetailsPage.confirmation;
    await expect(confirmation.heading).toBeVisible();
    await expect(confirmation.bookingRef).not.toBeEmpty();
    await expect(confirmation.customer).toHaveText(customer.name);
    await expect(confirmation.tickets).toHaveText('2');
  });

  test('the confirmation total is the ticket price multiplied by the tickets', async ({ eventDetailsPage, customer }) => {
    const price = parsePrice(await eventDetailsPage.bookingForm.ticketPrice.innerText());

    await eventDetailsPage.bookTickets(3, customer);

    await expect(eventDetailsPage.confirmation.total).toHaveText(formatPrice(price * 3));
  });
});

test.describe('My Bookings', () => {
  test('a new booking appears in My Bookings', { tag: '@smoke' }, async ({ page, eventsPage, eventDetailsPage, myBookingsPage, customer }) => {
    await eventsPage.goto();
    const eventTitle = await eventsPage.firstEventTitle();
    await eventsPage.openFirstEvent();
    const price = parsePrice(await eventDetailsPage.bookingForm.ticketPrice.innerText());
    await eventDetailsPage.bookTickets(2, customer);
    const bookingRef = await eventDetailsPage.confirmation.bookingRef.innerText();

    await eventDetailsPage.confirmation.viewMyBookingsButton.click();

    await expect(page).toHaveURL('/bookings');
    const card = myBookingsPage.card(bookingRef);
    await expect(card).toBeVisible();
    await expect(card).toContainText(eventTitle);
    await expect(card).toContainText('2 tickets');
    await expect(card).toContainText(formatPrice(price * 2));
  });
});
