import type { Locator, Page } from '@playwright/test';
import { CancelDialog } from '../components/CancelDialog';

export class MyBookingsPage {
  readonly cancelDialog: CancelDialog;

  constructor(private page: Page) {
    this.cancelDialog = new CancelDialog(page);
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
