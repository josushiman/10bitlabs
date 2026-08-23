import { getCollection, type CollectionEntry } from 'astro:content';

export type App = CollectionEntry<'apps'>;

/*
  Underscore-prefixed entries are test fixtures. All three real Apps are in
  development, so the linked-card branch has nothing real to render; rather than
  leave it untested or ship a fake App, the fixture is admitted only when the
  test harness asks for it. See playwright.config.ts.
*/
const includeFixtures = process.env.INCLUDE_APP_FIXTURES === '1';

/**
 * Every App the site should show, in the studio's own running order.
 *
 * The single source for both the catalogue and the home page's featured
 * section: they render the same cards because they read the same list.
 */
export async function listApps(): Promise<App[]> {
  const apps = await getCollection('apps', ({ id }) => includeFixtures || !id.startsWith('_'));
  return apps.sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
      a.data.name.localeCompare(b.data.name)
  );
}

/** Where this App's card should link, if anywhere. */
export function linkOf(app: App): string | undefined {
  return app.data.status === 'live' ? app.data.url : undefined;
}
