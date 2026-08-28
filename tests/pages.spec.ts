import { expect, test, type Page } from '@playwright/test';
import { expectLegibleAtEitherEnd } from './support';

/**
 * The text a screen reader would read out of an element: its own text with every
 * `aria-hidden` descendant removed. The site's section labels are written as
 * `// about`, where the slashes are decoration and are hidden; this is what says
 * so from the outside rather than by inspecting the markup.
 */
function announcedText(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const source = document.querySelector(sel);
    if (!source) throw new Error(`No element matched ${sel}`);
    const clone = source.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
    return clone.textContent ?? '';
  }, selector);
}

const PAGES = [
  { route: '/about/', title: 'About', heading: 'A small studio, not an agency.' },
  { route: '/contact/', title: 'Contact', heading: 'Get in touch.' },
  { route: '/privacy/', title: 'Privacy', heading: 'Privacy.' },
  { route: '/legal/', title: 'Company details', heading: 'Company details.' }
];

for (const { route, title, heading } of PAGES) {
  test(`${route} responds with its own title, description and heading`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(new RegExp(`^${title} — 10 Bit Labs$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toBeTruthy();
  });

  test(`${route} holds together on a phone and a desktop`, async ({ page }) => {
    await expectLegibleAtEitherEnd(page, route);
  });

  test(`${route} does not read its decorative section label as punctuation`, async ({ page }) => {
    await page.goto(route);
    expect(await announcedText(page, '[data-section-label]')).not.toContain('/');
  });
}

test('every page description is distinct', async ({ page }) => {
  const descriptions = new Set<string>();
  for (const { route } of PAGES) {
    await page.goto(route);
    descriptions.add(
      (await page.locator('meta[name="description"]').getAttribute('content')) ?? ''
    );
  }
  expect(descriptions.size).toBe(PAGES.length);
});

test('the legal page carries the registered company disclosure', async ({ page }) => {
  await page.goto('/legal/');
  const details = page.getByRole('main');

  await expect(details).toContainText('10BIT LABS LTD');
  await expect(details).toContainText('Registered in England and Wales');
  await expect(details).toContainText('17378712');
  await expect(details).toContainText('13 Dunmow Close, Loughton, IG10');
});

test('the contact page offers an email link and no form', async ({ page }) => {
  await page.goto('/contact/');

  await expect(
    page.getByRole('main').getByRole('link', { name: /hello@10bitlabs\.co\.uk/ })
  ).toHaveAttribute('href', 'mailto:hello@10bitlabs.co.uk');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.getByRole('main')).toContainText('no contact form');
});

test('neither About nor Privacy claims app policies are hosted elsewhere', async ({ page }) => {
  for (const route of ['/about/', '/privacy/']) {
    await page.goto(route);
    const copy = await page.getByRole('main').innerText();

    expect(copy, `${route} still points app policies off-site`).not.toMatch(
      /App Store, Google Play, or its own website/i
    );
    expect(copy, `${route} still says policies are hosted where the app is listed`).not.toMatch(
      /hosted where (the app is listed|it lives)/i
    );
  }
});

test('the privacy page states the site has no analytics, tracking or form', async ({ page }) => {
  await page.goto('/privacy/');
  const copy = await page.getByRole('main').innerText();

  expect(copy).toMatch(/analytics/i);
  expect(copy).toMatch(/tracking/i);
  expect(copy).toMatch(/contact form/i);
});

test.describe('an unknown path', () => {
  test('renders the site own 404 page with a route home', async ({ page }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/404/);

    // The site's own chrome, not the platform's default error body.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    const home = page.getByRole('main').getByRole('link', { name: /home/i });
    await expect(home).toHaveAttribute('href', '/');
    await home.click();
    await expect(page).toHaveURL('/');
  });
})
