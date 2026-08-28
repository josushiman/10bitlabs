import { expect, test } from '@playwright/test';
import { cardFor, expectLegibleAtEitherEnd } from './support';

/** The four seed entries, in the order the content files ask for. */
const SEED = [
  {
    name: 'Plan The Day',
    initials: 'PTD',
    platform: 'iOS & Web',
    description: 'Wedding and event planning, from first idea to the day itself.'
  },
  {
    name: 'Sıra',
    initials: 'SR',
    platform: 'iOS',
    description: 'Score tallying for Okey and Gonga, without the paper and pen.'
  },
  {
    name: 'Fiilo',
    initials: 'FI',
    platform: 'iOS',
    description: 'Turkish vocabulary and verb conjugation, practised in short sessions.'
  },
  {
    name: 'Pick My Lift',
    initials: 'PML',
    platform: 'iOS',
    description: 'A curated exercise picker, matched to the equipment you have available.'
  }
];

test.describe('the app catalogue', () => {
  test('lists every seed entry with its name, description, platform and visual mark', async ({
    page
  }) => {
    const response = await page.goto('/apps');
    expect(response?.status()).toBe(200);

    for (const app of SEED) {
      const card = cardFor(page, app.name);
      await expect(card).toHaveCount(1);
      await expect(card.getByText(app.description)).toBeVisible();
      await expect(card.getByText(app.platform, { exact: true })).toBeVisible();

      if (app.name === 'Sıra') {
        const icon = card.locator('[data-badge] img');
        await expect(icon).toBeVisible();
        await expect(icon).toHaveAttribute('src', /\.svg$/);
        await expect(card.getByText(app.initials, { exact: true })).toHaveCount(0);
      } else {
        await expect(card.getByText(app.initials, { exact: true })).toBeVisible();
      }
    }
  });

  test('shows the entries in the order the content asks for', async ({ page }) => {
    await page.goto('/apps');

    const headings = await page.getByRole('listitem').getByRole('heading').allTextContents();
    for (const app of SEED) expect(headings).toContain(app.name);
    expect(headings.indexOf('Plan The Day')).toBeLessThan(headings.indexOf('Sıra'));
    expect(headings.indexOf('Sıra')).toBeLessThan(headings.indexOf('Fiilo'));
    expect(headings.indexOf('Fiilo')).toBeLessThan(headings.indexOf('Pick My Lift'));
  });

  test('renders each unreleased lifecycle state and links only written Apps', async ({ page }) => {
    await page.goto('/apps');

    for (const name of ['Plan The Day', 'Fiilo', 'Pick My Lift']) {
      const card = cardFor(page, name);
      await expect(card.getByText('In development')).toBeVisible();
      await expect(card.getByRole('link')).toHaveCount(0);
    }

    const sira = cardFor(page, 'Sıra');
    await expect(sira.getByText('App Submission')).toBeVisible();
    await expect(sira.getByRole('link')).toHaveAttribute('href', '/apps/sira/');
  });

  test('renders a live entry that has a link as a linked card', async ({ page }) => {
    await page.goto('/apps');

    // Ships only into the test build — see src/lib/apps.ts.
    const card = cardFor(page, 'Fixture Live App');
    const link = card.getByRole('link');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://example.com/fixture-live-app');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(card.getByText('In development')).toHaveCount(0);
  });

  test('makes no release claim for an unreleased App', async ({ page }) => {
    await page.goto('/apps');
    const copy = (await page.locator('main').innerText()).toLowerCase();

    for (const claim of [
      "we've built",
      'we have built',
      "we've shipped",
      'we shipped',
      'have shipped',
      'out now',
      'available now'
    ]) {
      expect(copy).not.toContain(claim);
    }

    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Things we're building.");
  });

  test('keeps the platform labels aligned across cards of differing length', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/apps');

    const tops = await page
      .getByRole('listitem')
      .evaluateAll((items) =>
        items.map((item) => item.querySelector('[data-platform]')!.getBoundingClientRect().top)
      );

    // Only the first grid row: the fixture card wraps below it, and a different
    // row is meant to sit at a different height.
    const firstRow = tops.slice(0, 3);
    expect(firstRow).toHaveLength(3);

    // Every card in the row pins its platform to the same baseline, whatever the
    // description length above it.
    expect(Math.max(...firstRow) - Math.min(...firstRow)).toBeLessThanOrEqual(1);
  });

  test('matches the measurements the design records', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/apps');

    const card = cardFor(page, 'Plan The Day');
    const styles = await card
      .locator('[data-card]')
      .evaluate((el) => {
        const box = getComputedStyle(el);
        const badge = getComputedStyle(el.querySelector('[data-badge]')!);
        const name = getComputedStyle(el.querySelector('h2')!);
        const platform = getComputedStyle(el.querySelector('[data-platform]')!);
        return {
          padding: box.padding,
          radius: box.borderRadius,
          display: box.display,
          direction: box.flexDirection,
          gap: box.gap,
          badgeSize: `${badge.width} x ${badge.height}`,
          badgeRadius: badge.borderRadius,
          badgeFont: `${badge.fontWeight} ${badge.fontSize}`,
          nameFont: `${name.fontWeight} ${name.fontSize}`,
          descFont: getComputedStyle(el.querySelector('[data-description]')!).fontSize,
          platformFont: `${platform.fontSize} ${platform.letterSpacing}`,
          platformOffset: platform.marginTop
        };
      });

    expect(styles).toMatchObject({
      padding: '26px',
      radius: '16px',
      display: 'flex',
      direction: 'column',
      gap: '16px',
      badgeSize: '56px x 56px',
      badgeRadius: '14px',
      badgeFont: '600 15px',
      nameFont: '600 17px',
      descFont: '14px',
      platformFont: '11px 0.44px'
    });

    const grid = await page
      .locator('[data-app-grid]')
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return { gap: style.gap, columns: style.gridTemplateColumns.split(' ').length };
      });
    expect(grid.gap).toBe('24px');
    // 1100px of column, less 28px of padding either side, at minmax(280px, 1fr).
    expect(grid.columns).toBe(3);
  });

  test('builds the lifecycle tag from the vocabulary already on the card', async ({
    page
  }) => {
    await page.goto('/apps');

    const card = cardFor(page, 'Plan The Day');
    const [tag, badge, platform] = await Promise.all([
      card.getByText('In development').evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          color: style.color,
          background: style.backgroundColor,
          border: style.borderColor
        };
      }),
      card.locator('[data-badge]').evaluate((el) => {
        const style = getComputedStyle(el);
        return { color: style.color, background: style.backgroundColor, border: style.borderColor };
      }),
      card.locator('[data-platform]').evaluate((el) => getComputedStyle(el).fontSize)
    ]);

    expect(tag.fontFamily).toContain('JetBrains Mono');
    // The label size already on the card, not a new one.
    expect(tag.fontSize).toBe(platform);
    // The badge tile's wash and edge, not a second accent wash of its own.
    expect(tag.background).toBe(badge.background);
    expect(tag.border).toBe(badge.border);
    /*
      Where the tag parts company with the badge: the badge's initials are
      decoration and keep the accent, while the tag is text a visitor has to read
      and takes the readable colour. Accent on the accent's own wash measures
      3.9:1 in Paper — see tests/contrast.spec.ts, which is what holds this.
    */
    expect(tag.color).not.toBe(badge.color);
  });

  test('marks the Turkish name as Turkish and renders its dotless i from the site font', async ({
    page
  }) => {
    await page.goto('/apps');

    const name = cardFor(page, 'Sıra').getByRole('heading');
    await expect(name).toHaveAttribute('lang', 'tr');
    await expect(name).toHaveText('Sıra');

    // Space Grotesk sets the name, and the served subset covers U+0131 — so the
    // glyph comes from the site's own font rather than a fallback face.
    expect(await name.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Space Grotesk');
    expect(
      await page.evaluate(async () => {
        await document.fonts.load("600 17px 'Space Grotesk'", 'Sıra');
        return document.fonts.check("600 17px 'Space Grotesk'", 'Sıra');
      })
    ).toBe(true);
  });

  test('is legible on a small phone and on a desktop', async ({ page }) => {
    await expectLegibleAtEitherEnd(page, '/apps');
  });
});
