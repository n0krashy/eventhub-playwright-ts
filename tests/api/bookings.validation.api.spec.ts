import { expect, test } from '../../src/fixtures';
import { fieldsWithErrors } from '../../src/api/response';
import { buildBookingInput } from '../../src/data/builders';

const EVENT_THAT_DOES_NOT_EXIST = 999_999_999;

test.describe('POST /bookings - quantity must be between 1 and 10', () => {
  test('rejects quantity 0', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 0 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });

  test('accepts quantity 1', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 1 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
  });

  test('accepts quantity 10', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 10 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
  });

  test('rejects quantity 11', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 11 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });

  test('rejects a negative quantity', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: -1 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
  });

  test('rejects a fractional quantity', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, customer, { quantity: 1.5 });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('quantity');
  });
});

test.describe('POST /bookings - customer details', () => {
  test('rejects a name shorter than 2 characters', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, name: 'A' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerName');
  });

  test('accepts a name of exactly 2 characters', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, name: 'Al' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
  });

  test('rejects an invalid email address', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, email: 'not-an-email' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerEmail');
  });

  test('rejects a phone number shorter than 10 characters', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, phone: '123456789' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerPhone');
  });

  test('accepts a phone number with +, spaces, dashes and brackets', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, phone: '+91 (98765) 43210' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(201);
  });

  test('rejects a phone number with letters', async ({ firstUser, bookableEvent, customer }) => {
    const input = buildBookingInput(bookableEvent.id, { ...customer, phone: 'abcdefghij' });

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(400);
    expect(fieldsWithErrors(res)).toContain('customerPhone');
  });
});

test.describe('POST /bookings - event', () => {
  test('returns 404 for an event that does not exist', async ({ firstUser, customer }) => {
    const input = buildBookingInput(EVENT_THAT_DOES_NOT_EXIST, customer);

    const res = await firstUser.bookings.create(input);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });
});
