import { expect, test, type Page } from '@playwright/test';

const PAPER_BG = 'oklch(0.97 0.006 95)';
const CRIMSON_BG = 'oklch(0.15 0.012 25)';

/** Resolves a colour the way the browser will, so assertions compare like with like. */
function resolve(page: Page, colour: string) {
  return page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.color = value;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, colour);
}

/**
 * Records when the palette was decided, so it can be compared against when the
 * visitor first saw anything. A dark flash is precisely the palette being decided
 * after first contentful paint; comparing the two timestamps says so directly,
 * rather than sampling frames and hoping to catch one.
 */
async function watchPaletteTiming(page: Page) {
  await page.addInitScript(() => {
    (window as any).__paletteDecidedAt = new Promise<number>((settle) => {
      const observe = () => {
        if (document.documentElement.dataset.theme) return settle(performance.now());
        new MutationObserver((_, self) => {
          if (document.documentElement.dataset.theme) {
            self.disconnect();
            settle(performance.now());
          }
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      };
      if (document.documentElement) observe();
      else document.addEventListener('readystatechange', observe, { once: true });
    });
  });
}

/**
 * Holds external scripts back, standing in for a visitor on a slow connection.
 * Without this the whole page — bundled scripts included — completes in a few
 * milliseconds on a local server, and no flash is distinguishable from no flash.
 * It is the slow connection that turns "resolved late" into a visible flash.
 */
async function onASlowConnection(page: Page) {
  await page.route('**/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.continue();
  });
}

async function firstContentfulPaint(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((settle) => {
        new PerformanceObserver((list, self) => {
          const entry = list.getEntries().find((e) => e.name === 'first-contentful-paint');
          if (entry) {
            self.disconnect();
            settle(entry.startTime);
          }
        }).observe({ type: 'paint', buffered: true });
      })
  );
}

async function expectNoFlash(page: Page) {
  const [decidedAt, paintedAt] = await Promise.all([
    page.evaluate(() => (window as any).__paletteDecidedAt as Promise<number>),
    firstContentfulPaint(page)
  ]);
  expect(decidedAt).toBeLessThan(paintedAt);
}

test.describe('a visitor whose OS is set to light', () => {
  test.use({ colorScheme: 'light' });

  test('sees the light palette, decided before anything is painted', async ({ page }) => {
    await watchPaletteTiming(page);
    await onASlowConnection(page);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor))
      .toBe(await resolve(page, PAPER_BG));
    await expectNoFlash(page);
  });
});

test.describe('a visitor whose OS is set to dark', () => {
  test.use({ colorScheme: 'dark' });

  test('sees the dark palette by default', async ({ page }) => {
    await watchPaletteTiming(page);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor))
      .toBe(await resolve(page, CRIMSON_BG));
    await expectNoFlash(page);
  });

  test('can toggle to light, and the choice survives a reload without a dark flash', async ({
    page
  }) => {
    await watchPaletteTiming(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Toggle dark/light mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Reloading is where an override against the OS preference would flash.
    await onASlowConnection(page);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor))
      .toBe(await resolve(page, PAPER_BG));
    await expectNoFlash(page);
  });
});

test('the toggle shows which palette is in play', async ({ page }) => {
  await page.goto('/');

  /** Where the knob is sitting, as a fraction across the pill. */
  const knobPosition = () =>
    page.evaluate(() => {
      const knob = document.querySelector('#theme-toggle span')!.getBoundingClientRect();
      const pill = document.querySelector('#theme-toggle')!.getBoundingClientRect();
      return (knob.left + knob.width / 2 - pill.left) / pill.width;
    });

  const toggle = page.getByRole('button', { name: 'Toggle dark/light mode' });
  const seen = new Map<string, number>();

  for (const _ of [0, 1]) {
    const theme = (await page.locator('html').getAttribute('data-theme'))!;
    // The knob settles at one end or the other; wait out the 0.2s slide.
    await expect
      .poll(knobPosition)
      .toBeCloseTo(theme === 'light' ? 0.75 : 0.25, 1);
    seen.set(theme, await knobPosition());
    await toggle.click();
  }

  // Both palettes park it somewhere different, so the control reads at a glance.
  expect([...seen.keys()].sort()).toEqual(['dark', 'light']);
  expect(seen.get('dark')!).toBeLessThan(seen.get('light')!);
});

test('the theme preference is stored locally and never transmitted', async ({ page }) => {
  const bodies: string[] = [];
  page.on('request', (request) => bodies.push(request.postData() ?? ''));

  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle dark/light mode' }).click();

  expect(await page.evaluate(() => localStorage.getItem('theme'))).toMatch(/^(light|dark)$/);
  expect(bodies.join('')).not.toContain('theme');
});

test('the inline theme script runs rather than being blocked by the policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });

  // Holding the bundled scripts back leaves only the inline one able to stamp it.
  await onASlowConnection(page);
  await page.goto('/');

  // If the CSP had rejected the script by hash, nothing would have stamped this.
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
  expect(violations).toEqual([]);
});
