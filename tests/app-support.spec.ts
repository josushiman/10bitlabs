import { expect, test } from '@playwright/test';
import { expectLegibleAtEitherEnd } from './support';

test.describe('the per-App support route', () => {
  test('Sıra publishes its support process at a stable public route', async ({ page }) => {
    const response = await page.goto('/apps/sira/support');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sıra support');
    await expect(page.getByRole('heading', { name: 'Restore a purchase' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Refund and billing help' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Report a problem' })).toBeVisible();
  });

  test('offers direct routes to each kind of help', async ({ page }) => {
    await page.goto('/apps/sira/support');

    await expect(page.getByRole('link', { name: 'Request a refund' })).toHaveAttribute(
      'href',
      '#refund-and-billing-help'
    );
    await expect(page.getByRole('link', { name: 'Restore a purchase' })).toHaveAttribute(
      'href',
      '#restore-a-purchase'
    );
    await expect(page.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '#report-a-problem'
    );
    await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      'mailto:sirasupport@10bitlabs.co.uk'
    );
  });

  test('states the billing boundary and privacy-safe reporting process', async ({ page }) => {
    await page.goto('/apps/sira/support');

    await expect(page.getByText('Sıra cannot approve, decline or process a refund.')).toBeVisible();
    await expect(page.getByText(/Do not send passwords/)).toBeVisible();
    await expect(page.locator('main')).toContainText('do not receive reference numbers');
  });

  test('is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps/sira/support');
  });
});
