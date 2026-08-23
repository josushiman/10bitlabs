import { expect, test, type Page } from '@playwright/test';

/*
  The measurements the ticket records from `docs/design/10 Bit Labs.dc.html`,
  held as numbers rather than as a claim that the page "matches the design".
  Every type scale here is a `clamp()` sitting at its ceiling: at Playwright's
  1280px viewport, 4.5vw is 57.6px and 6vw is 76.8px, so each one resolves to the
  maximum the design names and can be asserted exactly.
*/
/*
  `--accent` is stored as an unresolved `light-dark()` pair, so reading the custom
  property gives the declaration rather than the colour in play. A probe element
  makes the browser resolve it for the palette actually showing.
*/
const RESOLVE_ACCENT = `(() => {
  const probe = document.createElement('div');
  probe.style.color = 'var(--accent)';
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
})()`;

const accentColour = (page: Page) => page.evaluate(RESOLVE_ACCENT) as Promise<string>;

const box = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      maxWidth: style.maxWidth,
      padding: style.padding,
      textAlign: style.textAlign
    };
  });

const type = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight
    };
  });

test.describe('the page set is cut to the design measurements', () => {
  test('About is a 760px column with 18px body copy and a mono company card', async ({ page }) => {
    await page.goto('/about/');

    expect(await box(page, 'main section')).toMatchObject({
      maxWidth: '760px',
      padding: '80px 28px 100px'
    });

    const heading = await type(page, 'h1');
    expect(heading.fontSize).toBe('48px'); // clamp(2rem, 4.5vw, 3rem)
    expect(heading.fontFamily).toContain('Space Grotesk');
    expect(heading.fontWeight).toBe('600');

    const body = await type(page, 'main p');
    expect(body.fontSize).toBe('18px');
    expect(body.lineHeight).toBe('30.6px'); // 18 × 1.7

    const card = await page.locator('main div:has(> div > a[href^="mailto:"])').last().evaluate(
      (element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          borderRadius: style.borderRadius,
          padding: style.padding,
          fontFamily: style.fontFamily
        };
      }
    );
    expect(card).toMatchObject({
      fontSize: '13px',
      lineHeight: '24.7px', // 13 × 1.9
      borderRadius: '12px',
      padding: '24px'
    });
    expect(card.fontFamily).toContain('JetBrains Mono');
  });

  test('Contact is a centred 640px column', async ({ page }) => {
    await page.goto('/contact/');

    expect(await box(page, 'main section')).toMatchObject({
      maxWidth: '640px',
      padding: '120px 28px 140px',
      textAlign: 'center'
    });
    expect((await type(page, 'h1')).fontSize).toBe('41.6px'); // clamp(1.8rem, 4vw, 2.6rem)
  });

  for (const [name, route] of [
    ['Privacy', '/privacy/'],
    ['Legal', '/legal/']
  ]) {
    test(`${name} is a 680px column`, async ({ page }) => {
      await page.goto(route);

      expect(await box(page, 'main section')).toMatchObject({
        maxWidth: '680px',
        padding: '100px 28px 120px'
      });
      expect((await type(page, 'h1')).fontSize).toBe('38.4px'); // clamp(1.8rem, 4vw, 2.4rem)
    });
  }

  test('Privacy sets its body copy at 16px', async ({ page }) => {
    await page.goto('/privacy/');
    expect(await type(page, 'main p')).toMatchObject({
      fontSize: '16px',
      lineHeight: '27.2px' // 16 × 1.7
    });
  });

  test('the Legal details block is mono at 14px on a doubled line', async ({ page }) => {
    await page.goto('/legal/');
    const details = await type(page, 'main section > div:last-of-type');
    expect(details.fontSize).toBe('14px');
    expect(details.lineHeight).toBe('28px'); // 14 × 2
    expect(details.fontFamily).toContain('JetBrains Mono');
  });

  test('every section label is mono at 13px in the accent', async ({ page }) => {
    for (const route of ['/about/', '/contact/', '/privacy/', '/legal/', '/no-such-page']) {
      await page.goto(route);
      const label = await type(page, '[data-section-label]');
      expect(label.fontSize, route).toBe('13px');
      expect(label.fontFamily, route).toContain('JetBrains Mono');

      const colour = await page
        .locator('[data-section-label]')
        .evaluate((element) => getComputedStyle(element).color);
      expect(colour, route).toBe(await accentColour(page));
    }
  });
});

test.describe('the menu overlay is cut to the design measurements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /menu/i }).click();
  });

  test('covers the viewport with the design blur and wash', async ({ page }) => {
    const overlay = await page.locator('[data-menu]').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        position: style.position,
        inset: [style.top, style.right, style.bottom, style.left],
        backdropFilter: style.backdropFilter,
        flexDirection: style.flexDirection
      };
    });

    expect(overlay.position).toBe('fixed');
    expect(overlay.inset).toEqual(['0px', '0px', '0px', '0px']);
    expect(overlay.backdropFilter).toBe('blur(6px)');
    expect(overlay.flexDirection).toBe('column');
  });

  test('closes with a 30px mono cross in a row padded 20px by 26px', async ({ page }) => {
    const close = page.getByRole('button', { name: /close/i });
    const style = await close.evaluate((element) => {
      const own = getComputedStyle(element);
      const row = getComputedStyle(element.parentElement!);
      return {
        fontSize: own.fontSize,
        fontFamily: own.fontFamily,
        rowPadding: row.padding,
        justify: row.justifyContent
      };
    });

    expect(style.fontSize).toBe('30px');
    expect(style.fontFamily).toContain('JetBrains Mono');
    expect(style.rowPadding).toBe('20px 26px');
    expect(style.justify).toBe('flex-end');
  });

  test('prefixes each item with a 20px accent $ beside a 44px label', async ({ page }) => {
    const item = page.getByRole('link', { name: 'Apps', exact: true });
    const measured = await item.evaluate((element) => {
      const link = getComputedStyle(element);
      const prompt = getComputedStyle(element.firstElementChild!);
      const label = getComputedStyle(element.lastElementChild!);
      return {
        gap: link.gap,
        padding: link.padding,
        borderBottomWidth: link.borderBottomWidth,
        alignItems: link.alignItems,
        promptText: element.firstElementChild!.textContent,
        promptSize: prompt.fontSize,
        promptColour: prompt.color,
        promptFamily: prompt.fontFamily,
        labelSize: label.fontSize,
        labelWeight: label.fontWeight,
        labelFamily: label.fontFamily
      };
    });

    expect(measured.promptText).toBe('$');
    expect(measured.promptSize).toBe('20px');
    expect(measured.promptColour).toBe(await accentColour(page));
    expect(measured.promptFamily).toContain('JetBrains Mono');
    expect(measured.labelSize).toBe('44px'); // clamp(28px, 6vw, 44px)
    expect(measured.labelWeight).toBe('600');
    expect(measured.labelFamily).toContain('Space Grotesk');
    expect(measured.gap).toBe('16px');
    expect(measured.padding).toBe('16px 0px');
    expect(measured.borderBottomWidth).toBe('1px');
    expect(measured.alignItems).toBe('baseline');
  });

  test('centres the list and foots it with the mailbox', async ({ page }) => {
    const nav = await page.locator('[data-menu] nav').evaluate((element) => {
      const style = getComputedStyle(element);
      return { padding: style.padding, justifyContent: style.justifyContent };
    });
    expect(nav).toMatchObject({ padding: '0px 40px 80px', justifyContent: 'center' });

    const foot = await page
      .locator('[data-menu] a[href^="mailto:"]')
      .evaluate((element) => {
        const box = getComputedStyle(element.parentElement!);
        return {
          text: element.textContent,
          padding: box.padding,
          fontSize: box.fontSize,
          fontFamily: box.fontFamily
        };
      });
    expect(foot.text).toBe('$ mail hello@10bitlabs.co.uk');
    expect(foot.padding).toBe('24px 40px 40px');
    expect(foot.fontSize).toBe('13px');
    expect(foot.fontFamily).toContain('JetBrains Mono');
  });

  test('is opened by two bars, not three', async ({ page }) => {
    // Hidden from the reading order too: they are the button's picture, not its name.
    const bars = page.locator('[data-menu-button] span[aria-hidden="true"]');
    await expect(bars).toHaveCount(2);
    await expect(page.locator('[data-menu-button] span')).toHaveCount(2);

    const measured = await page.locator('[data-menu-button]').evaluate((element) => {
      const button = getComputedStyle(element);
      const bar = getComputedStyle(element.firstElementChild!);
      return { gap: button.gap, width: bar.width, height: bar.height };
    });
    expect(measured).toEqual({ gap: '5px', width: '22px', height: '2px' });
  });
});
