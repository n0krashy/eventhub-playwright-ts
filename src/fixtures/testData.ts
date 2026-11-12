import type { TestInfo } from '@playwright/test';
import type { ApiClients } from '../api/clients';
import type { BookingData, BookingInput, EventData, EventInput } from '../api/models';
import { buildBookingInput, buildEventInput } from '../data/builders';

/**
 * Creates events and bookings for a test through the API, and removes them when the test ends.
 * Each test gets its own event, so prices and seat counts are known and tests never affect each other.
 */
export class TestData {
  private createdEventIds: number[] = [];

  constructor(private api: ApiClients) {}

  async createEvent(overrides: Partial<EventInput> = {}): Promise<EventData> {
    const res = await this.api.events.create(buildEventInput(overrides));
    if (res.status !== 201) {
      throw new Error(`Could not create the test event: HTTP ${res.status} ${JSON.stringify(res.body)}`);
    }
    this.createdEventIds.push(res.body.data.id);
    return res.body.data;
  }

  async createBooking(event: EventData, overrides: Partial<BookingInput> = {}): Promise<BookingData> {
    const res = await this.api.bookings.create(buildBookingInput(event.id, overrides));
    if (res.status !== 201) {
      throw new Error(`Could not create the test booking: HTTP ${res.status} ${JSON.stringify(res.body)}`);
    }
    return res.body.data;
  }

  // Runs after every test, even a failed one: cancel the bookings on our events, then delete the events.
  async cleanUp(testInfo: TestInfo): Promise<void> {
    if (this.createdEventIds.length === 0) return;
    const problems: string[] = [];

    const myBookings = (await this.api.bookings.list()).body.data ?? [];
    for (const booking of myBookings) {
      if (!this.createdEventIds.includes(booking.eventId)) continue;
      const res = await this.api.bookings.cancel(booking.id);
      if (res.status !== 200) problems.push(`cancel booking ${booking.id}: HTTP ${res.status}`);
    }

    for (const eventId of this.createdEventIds) {
      const res = await this.api.events.delete(eventId);
      if (res.status !== 200) problems.push(`delete event ${eventId}: HTTP ${res.status}`);
    }

    if (problems.length > 0) {
      console.warn(`Cleanup problems after "${testInfo.title}": ${problems.join(', ')}`);
    }
  }
}
