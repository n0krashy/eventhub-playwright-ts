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

  // Events with fewer than 10 seats show a warning such as "8 seats left!" instead of "157 seats available"
  private almostSoldOutCard(): Locator {
    return this.eventCards.filter({ hasText: 'seats left' }).first();
  }

  async seatsLeftOnAlmostSoldOutEvent(): Promise<number> {
    const warning = await this.almostSoldOutCard().getByText('seats left').innerText(); // "8 seats left!"
    return Number(warning.split(' ')[0]);
  }

  async openAlmostSoldOutEvent(): Promise<void> {
    await this.almostSoldOutCard().getByTestId('book-now-btn').click();
  }
}
