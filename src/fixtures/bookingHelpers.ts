import type { ApiClients } from '../api/clients';
import type { BookingData, BookingInput } from '../api/models/booking';
import { buildBookingInput, type Customer } from '../data/builders';

// Creates a booking as part of a test's setup.
// Stops the test with a clear message if the booking could not be made.
export async function createBooking(
  api: ApiClients,
  eventId: number,
  customer: Customer,
  overrides: Partial<BookingInput> = {},
): Promise<BookingData> {
  const res = await api.bookings.create(buildBookingInput(eventId, customer, overrides));
  if (res.status !== 201) {
    throw new Error(`Could not create the booking: HTTP ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

// Cancels every booking made with this customer's email, so a test leaves nothing behind.
// Cleanup never fails a test, but it prints a warning when something could not be cleaned up.
export async function cancelBookingsOf(api: ApiClients, customer: Customer): Promise<void> {
  try {
    const allBookings = await api.bookings.listAll();
    const customerBookings = allBookings.filter((booking) => booking.customerEmail === customer.email);

    await Promise.all(
      customerBookings.map(async (booking) => {
        const res = await api.bookings.cancel(booking.id);
        if (res.status !== 200) {
          console.warn(`Cleanup: could not cancel booking ${booking.id} (HTTP ${res.status})`);
        }
      }),
    );
  } catch (error) {
    console.warn(`Cleanup: could not clean up the bookings of ${customer.email}: ${error}`);
  }
}
