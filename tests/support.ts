import { expect, type Page } from '@playwright/test';

/*
  Shared expectations. Not a spec file — Playwright only collects `*.spec.ts`,
  so this is imported, never run.
*/

/** The card in the catalogue whose heading is this App's name. */
export const cardFor = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) });

/**
 * A page holds together on the narrowest phone and on a desktop.
 *
 * Sideways overflow above zero means the visitor has to pinch, which no page on
 * this site may ask of them.
 */
export async function expectLegibleAtEitherEnd(page: Page, route: string) {
  for (const size of [
    { width: 320, height: 640 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(size);
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `${route} spills sideways at ${size.width}px`).toBeLessThanOrEqual(0);
  }
}

/**
 * Every URL a sitemap names.
 *
 * Two specs read the sitemap — one against the served fixture build, one against
 * a production build of its own — and they should not each keep their own idea
 * of what the file looks like.
 */
export function sitemapUrls(xml: string): URL[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc));
}
