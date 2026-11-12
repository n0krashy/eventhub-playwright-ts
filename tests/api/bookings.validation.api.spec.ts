import { expect, test } from '../../src/fixtures';
import { fieldsWithErrors } from '../../src/api/response';
import { buildBookingInput } from '../../src/data/builders';

const EVENT_THAT_DOES_NOT_EXIST = 999_999_999;

test.describe('POST /bookings - quantity must be between 1 and 10', () => {
  test('rejects quantity 0', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 0 }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });

  test('accepts quantity 1', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 1 }));

    expect(res.status).toBe(201);
  });

  test('accepts quantity 10', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 10 }));

    expect(res.status).toBe(201);
  });

  test('rejects quantity 11', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 11 }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });

  test('rejects a negative quantity', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: -1 }));

    expect(res.status).toBe(400);
  });

  test('rejects a fractional quantity', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 1.5 }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });
});

test.describe('POST /bookings - customer details', () => {
  test('rejects a name shorter than 2 characters', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerName: 'A' }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerName');
  });

  test('accepts a name of exactly 2 characters', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerName: 'Al' }));

    expect(res.status).toBe(201);
  });

  test('rejects an invalid email address', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerEmail: 'not-an-email' }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerEmail');
  });

  test('rejects a phone number shorter than 10 characters', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerPhone: '123456789' }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerPhone');
  });

  test('accepts a phone number with +, spaces, dashes and brackets', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerPhone: '+91 (98765) 43210' }));

    expect(res.status).toBe(201);
  });

  test('rejects a phone number with letters', async ({ api, testData }) => {
    const event = await testData.createEvent();

    const res = await api.bookings.create(buildBookingInput(event.id, { customerPhone: 'abcdefghij' }));

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerPhone');
  });
});

test.describe('POST /bookings - event and seats', () => {
  test('returns 404 for an event that does not exist', async ({ api }) => {
    const res = await api.bookings.create(buildBookingInput(EVENT_THAT_DOES_NOT_EXIST));

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  test('rejects more tickets than there are seats left', async ({ api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 3 });

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 4 }));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only 3 seat');
  });

  test('allows booking exactly the seats that are left', async ({ api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 3 });

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 3 }));

    expect(res.status).toBe(201);
  });

  test('rejects a booking once the event is sold out', async ({ api, testData }) => {
    const event = await testData.createEvent({ totalSeats: 3 });
    await testData.createBooking(event, { quantity: 3 });

    const res = await api.bookings.create(buildBookingInput(event.id, { quantity: 1 }));

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Only 0 seat');
  });
});
