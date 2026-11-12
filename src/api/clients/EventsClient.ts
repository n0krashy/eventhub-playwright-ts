import type { APIRequestContext } from '@playwright/test';
import type { EventResponse, MessageResponse } from '../models';
import { toApiResponse } from '../response';

export class EventsClient {
  constructor(private request: APIRequestContext) {}

  async create(payload: object) {
    const res = await this.request.post('events', { data: payload });
    return toApiResponse<EventResponse>(res);
  }

  async get(id: number) {
    const res = await this.request.get(`events/${id}`);
    return toApiResponse<EventResponse>(res);
  }

  async delete(id: number) {
    const res = await this.request.delete(`events/${id}`);
    return toApiResponse<MessageResponse>(res);
  }
}
