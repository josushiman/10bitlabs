import { expect, test } from '@playwright/test';
import { cardFor, expectLegibleAtEitherEnd } from './support';

/*
  Routes materialise from content: an App gets a detail page when, and only when,
  something has been written about it. The four real Apps have nothing written,
  so the branches that do exist are proved by fixture Apps admitted into the test
  build alone — see src/lib/apps.ts.
*/

test.describe('the App detail route', () => {
  test('an App with a body has a working detail route', async ({ page }) => {
    const response = await page.goto('/apps/_fixture-detailed-app');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture Detailed App');
    await expect(page.getByText('Fixture body copy, which is what makes this App')).toBeVisible();
  });

  test('an App with no body has no detail route', async ({ page }) => {
    // All four real Apps are in this state, and none of them may have a page.
    for (const slug of ['plan-the-day', 'sira', 'fiilo', 'pick-my-lift']) {
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

    // Nothing written, so nothing to link to — whatever the App's status.
    for (const name of ['Plan The Day', 'Sıra', 'Fiilo', 'Pick My Lift']) {
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

    // Neither a listing nor a policy, so neither link.
    await page.goto('/apps/_fixture-detailed-app');
    await expect(page.getByRole('link', { name: /open / })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /privacy policy/ })).toHaveCount(0);
  });

  test('the detail page is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps/_fixture-detailed-app');
  });
});
