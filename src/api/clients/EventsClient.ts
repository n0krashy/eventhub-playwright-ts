import type { APIRequestContext } from '@playwright/test';
import type { MessageResponse } from '../models/common';
import type { EventInput, EventListResponse, EventResponse } from '../models/event';
import { toApiResponse } from '../response';

export class EventsClient {
  constructor(private request: APIRequestContext) {}

  async list() {
    const res = await this.request.get('events');
    return toApiResponse<EventListResponse>(res);
  }

  async get(id: number) {
    const res = await this.request.get(`events/${id}`);
    return toApiResponse<EventResponse>(res);
  }

  // create and delete are only used by the seat tests, which need an event of their own
  async create(payload: EventInput) {
    const res = await this.request.post('events', { data: payload });
    return toApiResponse<EventResponse>(res);
  }

  async delete(id: number) {
    const res = await this.request.delete(`events/${id}`);
    return toApiResponse<MessageResponse>(res);
  }
}
