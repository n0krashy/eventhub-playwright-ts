import type { Locator, Page } from '@playwright/test';

/** The "Cancel this booking?" pop-up on My Bookings. */
export class CancelDialog {
  readonly message: Locator;
  readonly yesButton: Locator;
  readonly noButton: Locator;

  constructor(page: Page) {
    this.message = page.getByText('This will cancel');
    this.yesButton = page.locator('#confirm-dialog-yes');
    this.noButton = page.getByRole('button', { name: 'Cancel', exact: true });
  }
}
