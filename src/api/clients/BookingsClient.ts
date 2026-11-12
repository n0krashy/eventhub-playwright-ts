import type { APIRequestContext } from '@playwright/test';
import type { BookingListResponse, BookingResponse, MessageResponse } from '../models';
import { toApiResponse } from '../response';

export class BookingsClient {
  constructor(private request: APIRequestContext) {}

  // `payload` is a plain object on purpose, so tests can send invalid data
  async create(payload: object) {
    const res = await this.request.post('bookings', { data: payload });
    return toApiResponse<BookingResponse>(res);
  }

  async list() {
    const res = await this.request.get('bookings');
    return toApiResponse<BookingListResponse>(res);
  }

  async getById(id: number) {
    const res = await this.request.get(`bookings/${id}`);
    return toApiResponse<BookingResponse>(res);
  }

  async getByRef(bookingRef: string) {
    const res = await this.request.get(`bookings/ref/${bookingRef}`);
    return toApiResponse<BookingResponse>(res);
  }

  async cancel(id: number) {
    const res = await this.request.delete(`bookings/${id}`);
    return toApiResponse<MessageResponse>(res);
  }
}
