import type { Page } from '@playwright/test';
import { BookingConfirmation } from '../components/BookingConfirmation';
import { BookingForm } from '../components/BookingForm';

export class EventDetailsPage {
  readonly bookingForm: BookingForm;
  readonly confirmation: BookingConfirmation;

  constructor(private page: Page) {
    this.bookingForm = new BookingForm(page);
    this.confirmation = new BookingConfirmation(page);
  }

  async goto(eventId: number): Promise<void> {
    await this.page.goto(`/events/${eventId}`);
  }
}
