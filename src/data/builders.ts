import type { BookingInput, EventInput } from '../api/models';

// Keeps names and emails unique, so runs (and parallel workers) never collide.
const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
let counter = 0;

function nextId(): string {
  counter += 1;
  return `${runId}-${counter}`;
}

export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// Event in the future, 100 seats at $100. Keep prices under 1000, so the UI shows no thousands separator.
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

export type Customer = { name: string; email: string; phone: string };

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    name: 'QA Tester',
    email: `customer.${nextId()}@example.com`,
    phone: '+971501234567',
    ...overrides,
  };
}

export function buildBookingInput(eventId: number, overrides: Partial<BookingInput> = {}): BookingInput {
  const customer = buildCustomer();
  return {
    eventId,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    quantity: 1,
    ...overrides,
  };
}
