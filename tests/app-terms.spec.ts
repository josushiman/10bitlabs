import { expect, test } from '@playwright/test';
import { expectLegibleAtEitherEnd } from './support';

test.describe('the per-App terms route', () => {
  test('written terms have a public, dated route', async ({ page }) => {
    const response = await page.goto('/apps/_fixture-launched-app/terms');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Fixture Launched App terms of service'
    );
    await expect(page.getByText('Fixture terms copy')).toBeVisible();
    await expect(page.locator('time')).toHaveAttribute('datetime', '2026-08-24');
    await expect(page.locator('time')).toHaveText('24 August 2026');
  });

  test('Sıra publishes its confirmed Terms of Service', async ({ page }) => {
    const response = await page.goto('/apps/sira/terms');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sıra');
    await expect(page.locator('main')).toContainText('provided by 10BIT LABS LTD');
    await expect(page.getByRole('heading', { name: '5. Free Matches and the Unlock' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sıra Privacy Policy' })).toHaveAttribute(
      'href',
      '/apps/sira/privacy/'
    );
  });

  test('an App without terms has no terms route', async ({ page }) => {
    for (const slug of ['fiilo', 'plan-the-day', 'pick-my-lift']) {
      const response = await page.goto(`/apps/${slug}/terms`);
      expect(response?.status(), `/apps/${slug}/terms should not exist`).toBe(404);
    }
  });

  test('the terms page is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps/_fixture-launched-app/terms');
  });
});
