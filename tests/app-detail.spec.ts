import { expect, test } from '@playwright/test';
import { cardFor, expectLegibleAtEitherEnd } from './support';

/*
  Routes materialise from content: an App gets a detail page when, and only when,
  something has been written about it. Sıra now has a public page; fixtures keep
  exercising combinations that no real App has reached yet.
*/

test.describe('the App detail route', () => {
  test('an App with a body has a working detail route', async ({ page }) => {
    const response = await page.goto('/apps/_fixture-detailed-app');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture Detailed App');
    await expect(page.getByText('Fixture body copy, which is what makes this App')).toBeVisible();
  });

  test('Sıra has its dedicated public page and submission state', async ({ page }) => {
    const response = await page.goto('/apps/sira');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sıra');
    await expect(page.getByText('App Submission')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Keep scores clear' })).toBeVisible();
    await expect(page.getByText('LIVE TALLY')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Access and pricing' })).toBeVisible();
    await expect(page.getByText('£2.99 once')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Need help?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      'mailto:sirasupport@10bitlabs.co.uk'
    );
  });

  test('Sıra’s screenshots can be explored as a carousel', async ({ page }) => {
    await page.goto('/apps/sira');

    const gallery = page.locator('[data-app-gallery]');
    await expect(gallery).toBeVisible();
    await expect
      .poll(() =>
        gallery
          .locator('[data-gallery-slide]')
          .first()
          .getByRole('img')
          .evaluate((image) => {
            const screenshot = image as HTMLImageElement;
            return screenshot.complete && screenshot.naturalWidth > 0;
          })
      )
      .toBe(true);
    await expect(gallery.getByRole('status')).toHaveText('1 / 4');

    const previous = gallery.getByRole('button', { name: 'Show previous screen' });
    const next = gallery.getByRole('button', { name: 'Show next screen' });
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();

    await next.click();
    await expect(gallery.getByRole('status')).toHaveText('2 / 4');
    await expect(previous).toBeEnabled();

    await previous.click();
    await expect(gallery.getByRole('status')).toHaveText('1 / 4');
  });

  test('Sıra’s carousel works after navigation and keeps screens inset on a phone', async ({
    page
  }) => {
    await page.goto('/apps/');
    await page.locator('[data-card][href="/apps/sira/"]').click();
    await expect(page).toHaveURL('/apps/sira/');

    const gallery = page.locator('[data-app-gallery]');
    await gallery.getByRole('button', { name: 'Show next screen' }).click();
    await expect(gallery.getByRole('status')).toHaveText('2 / 4');
    await gallery.getByRole('button', { name: 'Show previous screen' }).click();
    await expect(gallery.getByRole('status')).toHaveText('1 / 4');
    await expect
      .poll(() => gallery.locator('[data-gallery-viewport]').evaluate((viewport) => viewport.scrollLeft))
      .toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 320, height: 640 });
    const viewport = await gallery.locator('[data-gallery-viewport]').boundingBox();
    const screen = await gallery.locator('.screen').first().boundingBox();
    expect(viewport).not.toBeNull();
    expect(screen).not.toBeNull();
    expect(screen!.x - viewport!.x).toBeGreaterThanOrEqual(30);
  });

  test('Sıra links to its support process and confirmed legal pages', async ({ page }) => {
    await page.goto('/apps/sira');

    await expect(page.getByRole('link', { name: 'Request a refund' })).toHaveAttribute(
      'href',
      '/apps/sira/support/#refund-and-billing-help'
    );
    await expect(page.getByRole('link', { name: 'Restore a purchase' })).toHaveAttribute(
      'href',
      '/apps/sira/support/#restore-a-purchase'
    );
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/apps/sira/privacy/'
    );
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/apps/sira/terms/'
    );
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveCount(1);
  });

  test('an App with no body has no detail route', async ({ page }) => {
    for (const slug of ['plan-the-day', 'fiilo', 'pick-my-lift']) {
      const response = await page.goto(`/apps/${slug}`);
      expect(response?.status(), `/apps/${slug} should not exist`).toBe(404);
    }
  });

  test('a card links to its detail page only when that page exists', async ({ page }) => {
    await page.goto('/apps');

    const written = cardFor(page, 'Fixture Detailed App').getByRole('link');
    await expect(written).toHaveCount(1);
    await expect(written).toHaveAttribute('href', '/apps/_fixture-detailed-app/');
    // An internal page is not somewhere else's tab.
    await expect(written).not.toHaveAttribute('target', '_blank');

    await expect(cardFor(page, 'Sıra').getByRole('link')).toHaveAttribute('href', '/apps/sira/');

    // Nothing written, so nothing to link to — whatever the App's status.
    for (const name of ['Plan The Day', 'Fiilo', 'Pick My Lift']) {
      await expect(cardFor(page, name).getByRole('link')).toHaveCount(0);
    }
  });

  test('a launched App with a page of its own is linked to the page, not the store', async ({
    page
  }) => {
    await page.goto('/apps');

    // The precedence the rule implies: if the Studio has written about an App,
    // its own page is where a visitor is sent, listing or no listing.
    const link = cardFor(page, 'Fixture Launched App').getByRole('link');
    await expect(link).toHaveAttribute('href', '/apps/_fixture-launched-app/');

    // A launched App with nothing written still goes to its listing, as before.
    await expect(cardFor(page, 'Fixture Live App').getByRole('link')).toHaveAttribute(
      'href',
      'https://example.com/fixture-live-app'
    );
  });

  test("the detail page carries the App's own facts and a way back", async ({ page }) => {
    await page.goto('/apps/_fixture-detailed-app');

    await expect(page.getByText('An App with something written about it')).toBeVisible();
    await expect(page.locator('[data-platform]')).toHaveText('Test');
    await expect(page.getByText('In development')).toBeVisible();

    // A detail page is reached from the catalogue, so it has to lead back to it.
    await expect(page.getByRole('link', { name: 'All apps' })).toHaveAttribute('href', '/apps/');
  });

  test('the detail page leads onward only where there is somewhere to go', async ({ page }) => {
    await page.goto('/apps/_fixture-launched-app');
    await expect(page.getByRole('link', { name: /open Fixture Launched App/ })).toHaveAttribute(
      'href',
      'https://example.com/fixture-launched-app'
    );
    await expect(page.getByRole('link', { name: /privacy policy/ })).toHaveAttribute(
      'href',
      '/apps/_fixture-launched-app/privacy/'
    );
    await expect(page.getByRole('link', { name: /terms of service/ })).toHaveAttribute(
      'href',
      '/apps/_fixture-launched-app/terms/'
    );

    // Neither a listing nor a policy, so neither link.
    await page.goto('/apps/_fixture-detailed-app');
    await expect(page.getByRole('link', { name: /open / })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /privacy policy/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /terms of service/ })).toHaveCount(0);
  });

  test('the detail page is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps/sira');
  });
});
