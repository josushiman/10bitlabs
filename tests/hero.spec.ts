import { expect, test, type Page } from '@playwright/test';

/** How far the page spills past the viewport. Anything above zero means pinching. */
const sidewaysOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

test.describe('the hero', () => {
  test('renders and is legible on a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'We build useful apps for interesting problems.' })
    ).toBeVisible();
    await expect(page.getByText('10 Bit Labs designs, builds and publishes its own apps')).toBeVisible();
    await expect(page.getByRole('link', { name: './explore-apps →' })).toBeVisible();
    await expect(page.getByText('10bitlabs — zsh')).toBeVisible();

    // Nothing spills sideways, so nobody has to pinch and zoom.
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('renders on a desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('gives each typeface the role the design gives it', async ({ page }) => {
    await page.goto('/');

    const fontOf = (locator: import('@playwright/test').Locator) =>
      locator.first().evaluate((el) => getComputedStyle(el).fontFamily);

    // Body copy is the system stack. Neither webfont sets it.
    const paragraph = await fontOf(page.getByText('10 Bit Labs designs, builds and publishes its own apps'));
    expect(paragraph).toContain('-apple-system');
    expect(paragraph).not.toContain('Space Grotesk');
    expect(paragraph).not.toContain('JetBrains Mono');

    // Headings are Space Grotesk.
    expect(await fontOf(page.getByRole('heading', { level: 1 }))).toContain('Space Grotesk');

    // Labels, the terminal, the call to action and the footer are JetBrains Mono.
    const monoParts = [
      page.getByText('uk software studio'),
      page.getByText('10bitlabs — zsh'),
      page.getByText('$ whoami'),
      page.getByRole('link', { name: './explore-apps →' }),
      page.locator('footer').getByText('10BIT LABS LTD'),
      page.getByText('10 Bit Labs', { exact: true })
    ];
    for (const part of monoParts) {
      expect(await fontOf(part)).toContain('JetBrains Mono');
    }
  });

  test('renders Turkish characters from the self-hosted subset', async ({ page }) => {
    await page.goto('/');

    // U+0131 (ı) lives in the latin subset and U+0130 (İ) in latin-ext. Both must
    // be covered by the served files or the studio's own product names break.
    const covered = await page.evaluate(async () => {
      const check = async (font: string, text: string) => {
        await document.fonts.load(font, text);
        return document.fonts.check(font, text);
      };
      return {
        dotless: await check("600 15px 'Space Grotesk'", 'S\u0131ra'),
        capitalDotted: await check("600 15px 'JetBrains Mono'", '\u0130stanbul')
      };
    });

    expect(covered.dotless).toBe(true);
    expect(covered.capitalDotted).toBe(true);
  });
});
