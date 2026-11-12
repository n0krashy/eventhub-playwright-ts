import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('has title', async ({ page }) => {
  await page.goto('https://eventhub.rahulshettyacademy.com/');
  await page.locator('#email').fill('nokrashy.test.1@gmail.com');
  await page.locator('#password').fill('MyTest1@');
  await page.locator('#login-btn').click();

  await page.locator('#book-now-btn').click();
  let ticketsCount = 1;
  await expect (page.locator('#ticket-count')).toHaveText('1');
  await page.locator('//button[text()="+"]').click();
  await expect (page.locator('#ticket-count')).toHaveText('2');
  const rawText = await page.locator('div', { hasText: 'Book Tickets' }).locator('span').innerText();
  const ticketPrice = rawText.replace('$', '').trim();
  const rawText2 = await page.locator('div', { hasText: 'Total' }).locator('span').last().innerText();
  const total = rawText2.replace('$', '').trim();
  await page.locator('//button[text()="-"]').click();
  await expect (page.locator('#ticket-count')).toHaveText('1');
  ticketsCount = Number (await page.locator('#ticket-count').textContent());
  expect(total).toEqual((parseFloat(ticketPrice) * ticketsCount).toString());
  await page.locator('#customerName').fill('John Doe');
  await page.locator('#customer-email').fill('john.doe@example.com');
  await page.locator('#phone').fill('1234567890');
  await page.locator('#confirm-booking').click();

  await page.locator('#cancel-booking-btn').click();
  await page.locator('//button[text()="Cancel"]').click();
  await page.locator('#cancel-booking-btn').click();
  await page.locator('#confirm-dialog-yes').click();


  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
