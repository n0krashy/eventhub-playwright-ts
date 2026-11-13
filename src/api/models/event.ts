import type { ResponseBase } from './common';

export type EventData = {
  id: number;
  title: string;
  price: string; // a string such as "300" (the docs say number)
  eventDate: string;
  totalSeats: number;
  availableSeats: number;
};

// What we send to create an event (only the seat tests do this)
export type EventInput = {
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  price: number;
  totalSeats: number;
};

export type EventResponse = ResponseBase & { data: EventData };
export type EventListResponse = ResponseBase & { data: EventData[] };
