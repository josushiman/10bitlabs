import { expect, test } from '@playwright/test';

/** The menu's own items, in the order the design lists them. */
const ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Apps', href: '/apps/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' }
];

const menuButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /menu/i });

test.describe('the navigation menu', () => {
  test('reaches every destination as a real, bookmarkable link', async ({ page }) => {
    for (const { label, href } of ITEMS) {
      await page.goto('/');
      await menuButton(page).click();

      const link = page.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', href);

      await link.click();
      await expect(page).toHaveURL(href);
    }
  });

  test('leaves the browser back button working', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about/');

    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('marks the current page for sighted and assistive visitors alike', async ({ page }) => {
    await page.goto('/about/');
    await menuButton(page).click();

    const current = page.getByRole('link', { name: 'About', exact: true });
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('link', { name: 'Apps', exact: true })).not.toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('reports whether it is open or closed', async ({ page }) => {
    await page.goto('/');
    const button = menuButton(page);

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: /close/i }).click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens and closes by keyboard alone', async ({ page }) => {
    await page.goto('/');
    const button = menuButton(page);

    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  test('keeps focus inside itself while open', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();

    const insideMenu = () =>
      page.evaluate(() => !!document.activeElement?.closest('[data-menu]'));

    // Round the whole cycle twice over: a trap that only holds for one lap is
    // not a trap.
    for (let press = 0; press < (ITEMS.length + 2) * 2; press += 1) {
      await page.keyboard.press('Tab');
      expect(await insideMenu(), `focus escaped after ${press + 1} tabs`).toBe(true);
    }

    for (let press = 0; press < ITEMS.length + 2; press += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await insideMenu(), 'focus escaped tabbing backwards').toBe(true);
    }
  });

  test('holds the keyboard even after a click lands on its background', async ({ page }) => {
    /*
      Clicking the overlay's own chrome rather than a control leaves focus on
      <body>. A trap listening on the overlay stops hearing anything at that
      point, and the visitor tabs straight into the page behind the blur.
    */
    await page.goto('/');
    await menuButton(page).click();
    await page.locator('[data-menu]').click({ position: { x: 100, y: 30 } });

    const insideMenu = () =>
      page.evaluate(() => !!document.activeElement?.closest('[data-menu]'));
    expect(await insideMenu()).toBe(false);

    await page.keyboard.press('Tab');
    expect(await insideMenu(), 'focus escaped after a background click').toBe(true);

    await page.locator('[data-menu]').click({ position: { x: 100, y: 30 } });
    await page.keyboard.press('Escape');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('is not reachable by keyboard while closed', async ({ page }) => {
    await page.goto('/');
    const hidden = await page
      .locator('[data-menu] a')
      .first()
      .evaluate((node) => node.getBoundingClientRect().width === 0 || !node.checkVisibility());
    expect(hidden).toBe(true);
  });

});

test('the footer reaches privacy and company details', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');

  await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
  await expect(footer.getByRole('link', { name: 'Company details' })).toHaveAttribute(
    'href',
    '/legal/'
  );
});

test('no internal link costs a redirect', async ({ page, request }) => {
  /*
    The assets layer answers `/about` with a 307 to `/about/`. A link written
    without the slash still works, so nothing here would ever fail visibly — it
    would just cost every visitor a round trip, and hand out a second address for
    a page that already has a canonical one.
  */
  await page.goto('/');
  await page.getByRole('button', { name: /menu/i }).click();

  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')!)
  );
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of new Set(hrefs)) {
    const response = await request.get(href, { maxRedirects: 0 });
    expect(response.status(), `${href} redirects to ${response.headers()['location']}`).toBe(200);
  }
});
