import type { Locator, Page } from '@playwright/test';
import type { Customer } from '../../data/builders';

export class EventDetailsPage {
  // The "Book Tickets" card
  readonly bookingForm: {
    ticketPrice: Locator;
    ticketCount: Locator;
    plusButton: Locator;
    minusButton: Locator;
    nameInput: Locator;
    emailInput: Locator;
    phoneInput: Locator;
    total: Locator;
    confirmButton: Locator;
    nameError: Locator;
    emailError: Locator;
    phoneError: Locator;
  };

  // The "Booking Confirmed!" card that replaces the form after a booking
  readonly confirmation: {
    heading: Locator;
    bookingRef: Locator;
    customer: Locator;
    tickets: Locator;
    total: Locator;
    viewMyBookingsButton: Locator;
  };

  constructor(page: Page) {
    // The card header is the heading "Book Tickets" with the price of one ticket next to it
    const cardHeader = page.getByRole('heading', { name: 'Book Tickets', exact: true }).locator('..');

    this.bookingForm = {
      ticketPrice: cardHeader.locator('span'),
      ticketCount: page.locator('#ticket-count'),
      plusButton: page.getByRole('button', { name: '+', exact: true }),
      // This is the minus sign "−" (U+2212), not the hyphen "-" on the keyboard
      minusButton: page.getByRole('button', { name: '−', exact: true }),
      nameInput: page.locator('#customerName'),
      emailInput: page.locator('#customer-email'),
      phoneInput: page.locator('#phone'),
      // Same "Total" row as confirmation.total: the form and the confirmation card show it in the same place
      total: this.confirmationValue(page, 'Total'),
      confirmButton: page.locator('#confirm-booking'),
      nameError: page.getByText('Name must be at least 2 chars'),
      emailError: page.getByText('Enter a valid email'),
      phoneError: page.getByText('Enter a valid 10-digit phone'),
    };

    this.confirmation = {
      heading: page.getByRole('heading', { name: 'Booking Confirmed' }),
      bookingRef: page.locator('.booking-ref'),
      customer: this.confirmationValue(page, 'Customer'),
      tickets: this.confirmationValue(page, 'Tickets'),
      total: this.confirmationValue(page, 'Total'),
      viewMyBookingsButton: page.getByRole('button', { name: 'View My Bookings' }),
    };
  }

  // Both the "Book Tickets" form and the "Booking Confirmed!" card show rows
  // such as "Total   $1,500". This returns the value part of the row with the given label.
  private confirmationValue(page: Page, label: string): Locator {
    const row = page.getByText(label, { exact: true }).locator('..');
    return row.locator('span').last();
  }

  // The form starts with 1 ticket, so we click plus until we reach the wanted number
  async selectTickets(count: number): Promise<void> {
    for (let ticket = 1; ticket < count; ticket++) {
      await this.bookingForm.plusButton.click();
    }
  }

  async fillCustomerDetails(customer: Customer): Promise<void> {
    await this.bookingForm.nameInput.fill(customer.name);
    await this.bookingForm.emailInput.fill(customer.email);
    await this.bookingForm.phoneInput.fill(customer.phone);
  }

  async confirm(): Promise<void> {
    await this.bookingForm.confirmButton.click();
  }

  // Selects the tickets, fills in the customer's details and confirms the booking
  async bookTickets(tickets: number, customer: Customer): Promise<void> {
    await this.selectTickets(tickets);
    await this.fillCustomerDetails(customer);
    await this.confirm();
  }
}
