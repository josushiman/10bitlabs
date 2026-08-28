import { expect, test, type APIRequestContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { sitemapUrls } from './support';
import { CARD, darkPalette, drawCard } from '../scripts/render-og.mjs';

/*
  The crawler-facing surface: the two text files a search engine asks for, the
  meta tags a chat client reads, and the card image both of those point at.

  None of it is reachable from the site's own navigation, so nothing else here
  would notice if it broke — a wrong sitemap or a 404 card image is invisible
  until someone shares a link or checks Search Console.
*/

const APEX = 'https://10bitlabs.co.uk';

/** The routes in the sitemap, as paths on the canonical origin. */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text();
  return sitemapUrls(xml).map((url) => {
    expect(url.origin, 'every entry names the canonical origin').toBe(APEX);
    return url.pathname;
  });
}

test.describe('the sitemap', () => {
  test('is served as XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
  });

  test('lists every published page', async ({ request }) => {
    const paths = await sitemapPaths(request);
    expect(paths).toContain('/');
    for (const page of ['/about/', '/apps/', '/contact/', '/privacy/', '/legal/']) {
      expect(paths, `${page} is a published page`).toContain(page);
    }
  });

  test('lists the App routes that exist and no others', async ({ request }) => {
    const paths = await sitemapPaths(request);

    // Sıra has real detail, legal, and support pages; fixtures exercise the
    // remaining route states.
    expect(paths).toContain('/apps/sira/');
    expect(paths).toContain('/apps/sira/privacy/');
    expect(paths).toContain('/apps/sira/support/');
    expect(paths).toContain('/apps/sira/terms/');
    expect(paths).toContain('/apps/_fixture-detailed-app/');
    expect(paths).toContain('/apps/_fixture-live-app/privacy/');
    expect(paths).toContain('/apps/_fixture-launched-app/terms/');

    /*
      The other real Apps have a card on the catalogue and nothing else. Naming
      a route for them would send a crawler at the 404 page, which is exactly the
      failure the conditional routes were built to avoid.
    */
    for (const slug of ['fiilo', 'plan-the-day', 'pick-my-lift']) {
      expect(paths.some((path) => path.startsWith(`/apps/${slug}/`))).toBe(false);
    }
  });

  test('leaves out the 404 page', async ({ request }) => {
    const paths = await sitemapPaths(request);
    expect(paths.some((path) => path.includes('404'))).toBe(false);
  });
});

test.describe('the robots file', () => {
  test('is served as plain text and permits crawling', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    for (const agent of [
      'GPTBot',
      'ClaudeBot',
      'Google-Extended',
      'Applebot-Extended',
      'Amazonbot',
      'CCBot'
    ]) {
      expect(body).toContain(`User-agent: ${agent}\nDisallow: /`);
    }

    // The generic policy serves ordinary search and user-requested retrieval.
    for (const agent of [
      'Googlebot',
      'bingbot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-SearchBot',
      'Claude-User',
      'Applebot',
      'Amzn-SearchBot',
      'Amzn-User',
      'PerplexityBot',
      'Perplexity-User'
    ]) {
      expect(body).not.toContain(`User-agent: ${agent}\nDisallow: /`);
    }
  });

  test('points at the sitemap on the canonical hostname', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain(`Sitemap: ${APEX}/sitemap.xml`);
  });
});

function structuredData(page: import('@playwright/test').Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent ?? ''))
  );
}

test.describe('structured identity', () => {
  test('the canonical home page connects the Website and Studio', async ({ page }) => {
    await page.goto('/');
    const [graph] = await structuredData(page);

    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph']).toEqual(
      expect.arrayContaining([
        {
          '@type': 'WebSite',
          '@id': `${APEX}/#website`,
          name: '10 Bit Labs',
          url: `${APEX}/`,
          publisher: { '@id': `${APEX}/#organization` }
        },
        {
          '@type': 'Organization',
          '@id': `${APEX}/#organization`,
          name: '10 Bit Labs',
          legalName: '10BIT LABS LTD',
          url: `${APEX}/`,
          logo: `${APEX}/favicon.svg`,
          email: 'hello@10bitlabs.co.uk'
        }
      ])
    );
    expect(JSON.stringify(graph)).not.toContain('17378712');
    expect(JSON.stringify(graph)).not.toContain('Dunmow Close');
  });

  test('each materialised App page describes only its visible facts', async ({ page }) => {
    await page.goto('/apps/_fixture-detailed-app/');
    const [app] = await structuredData(page);

    expect(app).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${APEX}/apps/_fixture-detailed-app/#softwareapplication`,
      name: 'Fixture Detailed App',
      description: 'An App with something written about it, so the detail route has something to be.',
      operatingSystem: 'Test',
      url: `${APEX}/apps/_fixture-detailed-app/`,
      publisher: { '@id': `${APEX}/#organization` }
    });
  });

  test('a listed App is named as the external listing only when one is visible', async ({ page }) => {
    await page.goto('/apps/_fixture-launched-app/');
    const [app] = await structuredData(page);

    expect(app.sameAs).toBe('https://example.com/fixture-launched-app');
  });

  test('an App without a materialised route has no structured data', async ({ page }) => {
    const response = await page.goto('/apps/plan-the-day/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});

/*
  robots.txt is the one file a crawler fetches before anything else, so if the
  preview copy's noindex did not reach it the preview would still be crawled.
*/
test('a preview hostname serves the crawler files noindex', async ({ request }) => {
  for (const file of ['/robots.txt', '/sitemap.xml']) {
    const preview = await request.get(file, {
      headers: { Host: '10bitlabs-site.preview.workers.dev' }
    });
    expect(preview.headers()['x-robots-tag'], file).toBe('noindex');
  }
});

test.describe('the share card', () => {
  const PAGES = [
    { route: '/', title: '10 Bit Labs — UK software studio' },
    { route: '/about/', title: 'About — 10 Bit Labs' },
    { route: '/apps/_fixture-detailed-app/', title: null }
  ];

  for (const { route, title } of PAGES) {
    test(`${route} carries a title, a description and an image`, async ({ page }) => {
      await page.goto(route);

      const meta = (property: string) =>
        page.locator(`meta[property="${property}"]`).getAttribute('content');

      if (title) expect(await meta('og:title')).toBe(title);
      else expect(await meta('og:title')).toBe(await page.title());

      expect(await meta('og:description')).toBe(
        await page.locator('meta[name="description"]').getAttribute('content')
      );
      expect(await meta('og:type')).toBe('website');
      expect(await meta('og:site_name')).toBe('10 Bit Labs');
      expect(await meta('og:url')).toBe(`${APEX}${route}`);

      // Slack and iMessage size the card from these; without them it renders small.
      expect(await meta('og:image:width')).toBe('1200');
      expect(await meta('og:image:height')).toBe('630');
      expect(await meta('og:image:alt')).toBeTruthy();

      // The card is our own file, which is the whole of why the site makes no
      // third-party request even when it is being shared.
      expect(await meta('og:image')).toBe(`${APEX}/og.png`);

      expect(
        await page.locator('meta[name="twitter:card"]').getAttribute('content')
      ).toBe('summary_large_image');
    });
  }

  test('the image is served from this origin at the size it claims', async ({ request }) => {
    const response = await request.get('/og.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');

    // The IHDR chunk sits at a fixed offset in every PNG: 8 bytes of signature,
    // 8 of chunk header, then width and height as big-endian 32-bit integers.
    const png = await response.body();
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});

/*
  The card is generated rather than drawn, so the thing worth testing is that it
  reads the palette rather than a copy of it. These are the same two colours the
  favicon states as hex — if they ever disagree, the tab and the share card are
  showing two different brands.
*/
test('the card takes its colours from the site stylesheet', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const palette = darkPalette(css);

  const favicon = await readFile('public/favicon.svg', 'utf8');
  expect(favicon).toContain(palette.bg);
  expect(favicon).toContain(palette.accent);
});

/*
  The card is the icon mark at another size, and the one way it can stop being
  that is silently: a mark drawn with the wrong proportions still renders, still
  passes every other assertion here, and only looks wrong beside the favicon.

  So this reads the pixels back. A scanline through the middle of the mark cuts
  the filled bar once and the outlined bar twice — its two strokes — and the
  three runs of accent it finds are the proportions the design states.
*/
test('the mark on the card is the icon mark proportions', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  const palette = darkPalette(css);
  const pixels = drawCard(palette);

  // The icon's own numbers, from docs/design/10 Bit Labs Icon.dc.html.
  const unit = CARD.barHeight / 520;
  const barWidth = 220 * unit;
  const gap = 110 * unit;
  const border = 56 * unit;

  const accent = [
    Number.parseInt(palette.accent.slice(1, 3), 16),
    Number.parseInt(palette.accent.slice(3, 5), 16),
    Number.parseInt(palette.accent.slice(5, 7), 16)
  ];

  // A row through the middle of the bars, clear of every rounded corner.
  const y = Math.round(CARD.centreY);
  const runs: Array<{ start: number; end: number }> = [];
  for (let x = 0; x < CARD.width; x++) {
    const offset = (y * CARD.width + x) * 3;
    const isAccent =
      Math.abs(pixels[offset] - accent[0]) < 12 &&
      Math.abs(pixels[offset + 1] - accent[1]) < 12 &&
      Math.abs(pixels[offset + 2] - accent[2]) < 12;

    if (isAccent && runs.at(-1)?.end === x) runs.at(-1)!.end = x + 1;
    else if (isAccent) runs.push({ start: x, end: x + 1 });
  }

  // One for the filled bar, two for the outlined bar's left and right strokes.
  expect(runs).toHaveLength(3);
  const [one, zeroLeft, zeroRight] = runs;
  const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(2);

  near(one.end - one.start, barWidth);
  // The whole point: the zero is the same outer width as the one, because its
  // border is drawn inside its box rather than straddling the edge.
  near(zeroRight.end - zeroLeft.start, barWidth);
  near(zeroLeft.end - zeroLeft.start, border);
  near(zeroRight.end - zeroRight.start, border);
  near(zeroLeft.start - one.end, gap);

  // And the mark as a whole is centred on the card.
  near((one.start + zeroRight.end) / 2, CARD.centreX);
});
