import type { APIRequestContext } from '@playwright/test';
import type { BookingData, BookingListResponse, BookingResponse } from '../models/booking';
import type { MessageResponse } from '../models/common';
import { toApiResponse } from '../response';

const PAGE_SIZE = 10;
const MAX_PAGES = 50;

export class BookingsClient {
  constructor(private request: APIRequestContext) {}

  // `payload` is a plain object on purpose, so tests can send invalid data
  async create(payload: object) {
    const res = await this.request.post('bookings', { data: payload });
    return toApiResponse<BookingResponse>(res);
  }

  // One page of my bookings (the API returns 10 per page by default)
  async list(page = 1) {
    const res = await this.request.get('bookings', { params: { page } });
    return toApiResponse<BookingListResponse>(res);
  }

  // All of my bookings: asks for page after page until a page is not full
  async listAll(): Promise<BookingData[]> {
    const allBookings: BookingData[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await this.list(page);
      if (res.status !== 200) {
        throw new Error(`GET /bookings?page=${page} failed: HTTP ${res.status} ${JSON.stringify(res.body)}`);
      }
      allBookings.push(...res.body.data);
      if (res.body.data.length < PAGE_SIZE) break;
    }

    return allBookings;
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
