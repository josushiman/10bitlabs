import { expect, test } from '@playwright/test';

/**
 * Every route the site serves today. Each one has to hold the line on its own.
 *
 * The two content-driven routes are fixture Apps, which is the only place they
 * exist — see src/lib/apps.ts — but they are the same templates a real App would
 * be served from.
 */
const ROUTES = [
  '/',
  '/apps/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/legal/',
  '/no-such-page',
  '/apps/_fixture-detailed-app/',
  '/apps/_fixture-live-app/privacy/'
];

for (const route of ROUTES) {
  test(`${route} makes zero third-party network requests`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith(origin)) return;
      foreign.push(url);
    });

    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');

    expect(foreign).toEqual([]);
  });
}

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
