import { expect, test, type Page } from '@playwright/test';

/**
 * Text contrast, measured rather than asserted from the token values.
 *
 * The palettes are written in oklch and composed with `color-mix`, so the colour
 * a visitor actually sees is the browser's business, not the stylesheet's. Every
 * colour here is read back through a canvas, which is the same sRGB conversion
 * the screen gets.
 */
const THEMES = ['dark', 'light'] as const;

const ROUTES = [
  '/',
  '/apps/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/legal/',
  '/no-such-page',
  '/apps/sira/',
  '/apps/sira/support/',
  '/apps/_fixture-launched-app/',
  '/apps/_fixture-live-app/privacy/',
  '/apps/_fixture-launched-app/terms/'
];

interface Failure {
  text: string;
  ratio: number;
  required: number;
  colour: string;
  background: string;
}

async function contrastFailures(page: Page): Promise<Failure[]> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const toRgb = (colour: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255, a / 255];
    };

    const luminance = ([r, g, b]: number[]) => {
      const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const over = (top: number[], bottom: number[]) =>
      top.slice(0, 3).map((c, i) => c * top[3] + bottom[i] * (1 - top[3]));

    /** The background a pixel of this element's text sits on, composited down. */
    const backgroundUnder = (element: Element): number[] => {
      const stack: number[][] = [];
      let node: Element | null = element;
      while (node) {
        const layer = toRgb(getComputedStyle(node).backgroundColor);
        if (layer[3] > 0) stack.push(layer);
        if (layer[3] === 1) break;
        node = node.parentElement;
      }
      // Anything still translucent at the top of the document sits on white.
      return stack.reduceRight((below, layer) => over(layer, below), [1, 1, 1]);
    };

    const failures: Failure[] = [];

    for (const element of document.querySelectorAll('*')) {
      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim().length > 0
      );
      if (!own) continue;
      if (!(element as HTMLElement).checkVisibility()) continue;
      /*
        Visible text counts whether or not a screen reader is told to skip it:
        contrast is what a sighted visitor can make out, so the `$` prompts and
        the `$ mail ` prefixes are held to it even though they are `aria-hidden`.
        The one exemption is the App card's monogram tile — initials set on the
        accent's own wash, which WCAG exempts as a logotype and which say nothing
        the App's name beside them does not.
      */
      if (element.closest('[data-badge]')) continue;

      const style = getComputedStyle(element);
      const colour = toRgb(style.color);
      if (colour[3] === 0) continue;

      const background = backgroundUnder(element);
      const front = over(colour, background);

      const [hi, lo] = [luminance(front), luminance(background)].sort((a, b) => b - a);
      const ratio = (hi + 0.05) / (lo + 0.05);

      const size = parseFloat(style.fontSize);
      const bold = Number(style.fontWeight) >= 700;
      const required = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;

      if (ratio + 0.005 < required) {
        failures.push({
          text: element.textContent!.trim().slice(0, 40),
          ratio: Math.round(ratio * 100) / 100,
          required,
          colour: style.color,
          background: style.backgroundColor
        });
      }
    }

    return failures;
  });
}

for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`${route} meets text contrast in the ${theme} palette`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await page.evaluate(() => document.fonts.ready);

      expect(await contrastFailures(page)).toEqual([]);
    });
  }

  test(`the open menu meets text contrast in the ${theme} palette`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await page.getByRole('button', { name: /menu/i }).click();
    await page.evaluate(() => document.fonts.ready);

    expect(await contrastFailures(page)).toEqual([]);
  });
}
