import { expect, test } from '@playwright/test';

// The icons are generated files (scripts/render-favicons.mjs) that nothing else
// on the site imports, so a broken path would otherwise only show up as a blank
// tab in someone's browser.
test('every page offers the icon, and it is served', async ({ page, request }) => {
  for (const path of ['/', '/apps']) {
    await page.goto(path);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
      'href',
      '/favicon.svg'
    );
  }

  for (const [file, type] of [
    ['/favicon.svg', 'image/svg+xml'],
    ['/favicon.ico', 'image/'],
    ['/apple-touch-icon.png', 'image/png']
  ]) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()['content-type'], file).toContain(type);
  }
});
