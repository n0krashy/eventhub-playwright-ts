export type Credentials = { email: string; password: string };

// ---- data returned by the API ----

export type EventData = {
  id: number;
  title: string;
  price: string; // money comes back as a string, e.g. "300"
  totalSeats: number;
  availableSeats: number;
};

export type BookingData = {
  id: number;
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalPrice: string; // a string too, although the docs show a number
  status: string;
  bookingRef: string;
};

// ---- data we send ----

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

export type BookingInput = {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
};

// ---- full response bodies ----
// Every body can carry `error` / `details` when the call fails.

export type FieldError = { field: string; message: string };
type Failure = { success: boolean; error?: string; details?: FieldError[] };

export type LoginResponse = Failure & { token: string; user: { id: number; email: string } };
export type EventResponse = Failure & { data: EventData };
export type BookingResponse = Failure & { data: BookingData };
export type BookingListResponse = Failure & { data: BookingData[] };
export type MessageResponse = Failure & { message?: string };
