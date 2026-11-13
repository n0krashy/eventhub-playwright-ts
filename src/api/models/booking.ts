import type { ResponseBase } from './common';

export type BookingData = {
  id: number;
  eventId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalPrice: string; // a string such as "600" (the docs say number)
  status: 'confirmed' | 'cancelled';
  bookingRef: string;
};

// What we send to create a booking.
// Limits (checked by the API, and by our validation tests):
// quantity 1-10, name at least 2 characters, phone at least 10 digits, valid email.
export type BookingInput = {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
};

export type BookingResponse = ResponseBase & { data: BookingData };
export type BookingListResponse = ResponseBase & { data: BookingData[] };
