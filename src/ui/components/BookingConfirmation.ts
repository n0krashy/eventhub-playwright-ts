import type { Locator, Page } from '@playwright/test';

/** The "Booking Confirmed!" card that replaces the form after booking. */
export class BookingConfirmation {
  readonly heading: Locator;
  readonly viewMyBookingsButton: Locator;

  constructor(private page: Page) {
    this.heading = page.getByRole('heading', { name: 'Booking Confirmed' });
    this.viewMyBookingsButton = page.getByRole('button', { name: 'View My Bookings' });
  }

  // The card shows rows like "Tickets  2". This finds the value next to a label.
  // (An XPath, because the card has no ids to use. Replace it if the app gets test ids.)
  valueNextTo(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::*').first();
  }

  get bookingRef(): Locator {
    return this.valueNextTo('Booking Ref');
  }
}
