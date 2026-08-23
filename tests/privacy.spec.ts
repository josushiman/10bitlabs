import { expect, test } from '@playwright/test';

test('the page makes zero third-party network requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith(origin)) return;
    foreign.push(url);
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  expect(foreign).toEqual([]);
});

test('both typefaces load from the site own origin', async ({ page, baseURL }) => {
  const fontRequests: string[] = [];
  page.on('response', (response) => {
    if (response.url().endsWith('.woff2')) fontRequests.push(response.url());
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) {
    expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
  }
});
