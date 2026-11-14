import type { Locator, Page } from '@playwright/test';

export class EventsPage {
  readonly eventCards: Locator;

  constructor(private page: Page) {
    this.eventCards = page.getByTestId('event-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/events');
  }

  // The tests do not care which event they book, so they use the first one in the list
  async openFirstEvent(): Promise<void> {
    await this.eventCards.first().getByTestId('book-now-btn').click();
  }

  async firstEventTitle(): Promise<string> {
    return this.eventCards.first().getByRole('heading').innerText();
  }

  // One event card, found by the event's exact title.
  // The card shows "8 seats left!" when 10 or fewer seats are left, otherwise "157 seats available".
  eventCard(title: string): Locator {
    return this.eventCards.filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async openEvent(title: string): Promise<void> {
    await this.eventCard(title).getByTestId('book-now-btn').click();
  }
}
