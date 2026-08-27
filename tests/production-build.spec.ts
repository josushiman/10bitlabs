import { execFileSync } from 'node:child_process';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';
import { sitemapUrls } from './support';

/*
  Every other test in this suite runs against the build the fixtures are admitted
  into, because that is the only build in which a written App exists at all. This
  one runs against the build the public gets: no fixtures, and nothing written
  about any of the four real Apps.

  It is the guard on the promise the routes are built around — that a page cannot
  be published by accident. A filter that stopped filtering, or a placeholder body
  added to a real content file to "see the page", would both show up here.
*/

const OUT = '.astro/production-build-check';

async function filesUnder(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await filesUnder(path)));
    else found.push(path);
  }
  return found;
}

// One build, shared by both assertions — so they cannot race each other into
// the same output directory.
test.describe.configure({ mode: 'serial' });

test.describe('the build the public gets', () => {
  test.beforeAll(async () => {
    await rm(OUT, { recursive: true, force: true });
    // Deliberately not `npm run build`: this build must not overwrite the one
    // wrangler is serving to the rest of the suite.
    execFileSync('npx', ['astro', 'build', '--outDir', OUT], {
      stdio: 'pipe',
      env: { ...process.env, INCLUDE_APP_FIXTURES: '' }
    });
    // The sitemap is derived from the build, so the public one has to be derived
    // from this build rather than read off the fixture build wrangler is serving.
    execFileSync('node', ['scripts/emit-crawler-files.mjs', OUT], { stdio: 'pipe' });
  });
  test.slow();

  test('publishes no detail or privacy page for any App', async () => {
    const routes = (await filesUnder(OUT))
      .filter((file) => file.endsWith('.html'))
      .map((file) => `/${relative(OUT, file).replace(/(index)?\.html$/, '').replace(/\/$/, '')}`);

    // The catalogue is a page; nothing below it is, because nothing is written.
    expect(routes).toContain('/apps');
    expect(routes.filter((route) => route.startsWith('/apps/'))).toEqual([]);
  });

  test('ships no trace of the test fixtures', async () => {
    for (const file of await filesUnder(OUT)) {
      if (!file.endsWith('.html')) continue;
      expect(await readFile(file, 'utf8'), `${file} mentions a fixture`).not.toContain('Fixture');
    }
  });

  test('ships no App structured data without an App detail page', async () => {
    for (const file of await filesUnder(OUT)) {
      if (!file.endsWith('.html')) continue;
      expect(await readFile(file, 'utf8'), `${file} describes an unpublished App`).not.toContain(
        'SoftwareApplication'
      );
    }
  });

  /*
    The sitemap is the one published file that names routes rather than rendering
    them, so a fixture could reach a crawler through it without appearing on any
    page — and a sitemap entry pointing at a route this build did not publish is
    a 404 reported to Search Console.
  */
  test('names only the routes it published in the sitemap', async () => {
    const sitemap = await readFile(join(OUT, 'sitemap.xml'), 'utf8');
    const paths = sitemapUrls(sitemap).map((url) => url.pathname);

    expect(paths).toContain('/apps/');
    expect(paths.filter((path) => path !== '/apps/' && path.startsWith('/apps/'))).toEqual([]);
    expect(sitemap).not.toContain('fixture');
  });
});
