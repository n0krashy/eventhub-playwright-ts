import type { Locator, Page } from '@playwright/test';
import type { Customer } from '../../data/builders';

/** The "Book Tickets" card on the event page. */
export class BookingForm {
  readonly ticketCount: Locator;
  readonly plusButton: Locator;
  readonly minusButton: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly confirmButton: Locator;
  readonly totalRow: Locator;

  constructor(page: Page) {
    this.ticketCount = page.locator('#ticket-count');
    this.plusButton = page.getByRole('button', { name: '+', exact: true });
    this.minusButton = page.getByRole('button', { name: '−', exact: true });
    this.nameInput = page.locator('#customerName');
    this.emailInput = page.locator('#customer-email');
    this.phoneInput = page.locator('#phone');
    this.confirmButton = page.locator('#confirm-booking');
    this.totalRow = page.getByText('Total', { exact: true }).locator('..');
  }

  // The form starts at 1 ticket
  async selectTickets(count: number): Promise<void> {
    for (let i = 1; i < count; i++) {
      await this.plusButton.click();
    }
  }

  async fillCustomerDetails(customer: Customer): Promise<void> {
    await this.nameInput.fill(customer.name);
    await this.emailInput.fill(customer.email);
    await this.phoneInput.fill(customer.phone);
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
