import type { BookingInput } from '../api/models/booking';
import type { EventInput } from '../api/models/event';

// Keeps names and emails unique, so runs (and parallel workers) never collide.
const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
let counter = 0;

function nextId(): string {
  counter += 1;
  return `${runId}-${counter}`;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export type Customer = { name: string; email: string; phone: string };

// Every test gets its own customer. The unique email is how cleanup finds the test's bookings afterwards.
export function buildCustomer(): Customer {
  return {
    name: 'QA Tester',
    email: `customer.${nextId()}@example.com`,
    phone: '+971501234567',
  };
}

export function buildBookingInput(
  eventId: number,
  customer: Customer,
  overrides: Partial<BookingInput> = {},
): BookingInput {
  return {
    eventId,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    quantity: 1,
    ...overrides,
  };
}

// Event in the future, 100 seats at $100. Only the seat tests create events.
export function buildEventInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    title: `QA Event ${nextId()}`,
    description: 'Created by the automated tests. Safe to delete.',
    category: 'Conference',
    venue: 'QA Test Hall',
    city: 'Dubai',
    eventDate: daysFromNow(90),
    price: 100,
    totalSeats: 100,
    ...overrides,
  };
}
