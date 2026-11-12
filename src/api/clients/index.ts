import type { APIRequestContext } from '@playwright/test';
import { BookingsClient } from './BookingsClient';
import { EventsClient } from './EventsClient';

export type ApiClients = { events: EventsClient; bookings: BookingsClient };

export function createApiClients(request: APIRequestContext): ApiClients {
  return { events: new EventsClient(request), bookings: new BookingsClient(request) };
}
