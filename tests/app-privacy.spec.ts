import { expect, test } from '@playwright/test';
import { expectLegibleAtEitherEnd } from './support';

/*
  A privacy route is what an app store listing links to, so it has to be a plain
  public URL. Like the detail route it materialises from content, and for the
  same reason: a policy nobody has written must not be published as an empty
  page. Proved by fixtures — see src/lib/apps.ts.
*/

test.describe('the per-App privacy route', () => {
  test('an App with a privacy body has a working, publicly reachable privacy route', async ({
    page
  }) => {
    const response = await page.goto('/apps/_fixture-live-app/privacy');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Fixture Live App');
    await expect(page.getByText('Fixture privacy copy')).toBeVisible();

    // Nothing about it is gated: no redirect away, and nothing to accept first.
    expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe('/apps/_fixture-live-app/privacy');
  });

  test('Sıra publishes its confirmed Privacy Policy', async ({ page }) => {
    const response = await page.goto('/apps/sira/privacy');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sıra');
    await expect(page.locator('main')).toContainText('provided by 10BIT LABS LTD');
    await expect(page.getByRole('heading', { name: 'Information stored on your device' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'sirasupport@10bitlabs.co.uk' })).toHaveAttribute(
      'href',
      'mailto:sirasupport@10bitlabs.co.uk'
    );
  });

  test('an App with no privacy body has no privacy route', async ({ page }) => {
    // Other real Apps, and a fixture that has a detail page but no policy — the
    // routes are written separately and appear separately.
    for (const slug of [
      'plan-the-day',
      'fiilo',
      'pick-my-lift',
      '_fixture-detailed-app'
    ]) {
      const response = await page.goto(`/apps/${slug}/privacy`);
      expect(response?.status(), `/apps/${slug}/privacy should not exist`).toBe(404);
    }
  });

  test('a policy is dated in UTC, whatever zone the site was built in', async ({ page }) => {
    await page.goto('/apps/_fixture-live-app/privacy');

    const date = page.locator('time');
    await expect(date).toHaveAttribute('datetime', '2026-08-23');
    // The same day the attribute names — not the one before it, which is what a
    // builder west of UTC would print if the date were formatted locally.
    await expect(date).toHaveText('23 August 2026');
  });

  test('the privacy page is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps/_fixture-live-app/privacy');
  });
});
