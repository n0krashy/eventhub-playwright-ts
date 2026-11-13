import type { Locator, Page } from '@playwright/test';

export class MyBookingsPage {
  // The "Cancel this booking?" pop-up
  readonly cancelDialog: {
    message: Locator;
    yesButton: Locator;
    noButton: Locator; // labelled "Cancel", but it only closes the pop-up and keeps the booking
  };

  constructor(private page: Page) {
    this.cancelDialog = {
      message: page.getByText('This will cancel'),
      yesButton: page.locator('#confirm-dialog-yes'),
      noButton: page.getByRole('button', { name: 'Cancel', exact: true }),
    };
  }

  async goto(): Promise<void> {
    await this.page.goto('/bookings');
  }

  // One booking card, found by its booking reference
  card(bookingRef: string): Locator {
    return this.page.getByTestId('booking-card').filter({ hasText: bookingRef });
  }

  bookingId(bookingRef: string): Locator {
    return this.card(bookingRef).getByTestId('booking-id');
  }

  async clickCancelBooking(bookingRef: string): Promise<void> {
    await this.card(bookingRef).getByTestId('cancel-booking-btn').click();
  }
}
