import { getCollection, type CollectionEntry } from 'astro:content';

export type App = CollectionEntry<'apps'>;
export type AppPrivacy = CollectionEntry<'appPrivacy'>;
export type AppTerms = CollectionEntry<'appTerms'>;
export type AppSupport = CollectionEntry<'appSupport'>;

/*
  Underscore-prefixed entries are test fixtures. They exercise lifecycle and
  legal-document combinations that the real Apps do not yet cover, and are
  admitted only when the test harness asks for them. See playwright.config.ts.
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

/**
 * Whether a content entry has anything written in it.
 *
 * The single test both routes turn on: a page exists if and only if its body
 * does, so an unwritten page cannot be published by accident. An entry whose
 * body is nothing but whitespace counts as unwritten, because that is what it
 * would look like on the page.
 */
function isWritten(entry: { body?: string }): boolean {
  return (entry.body ?? '').trim().length > 0;
}

/**
 * Whether anything has been written about this App.
 *
 * Adding a body to the content file is the whole of what makes its detail page
 * appear — promoting an App to a page of its own is content editing, never
 * plumbing.
 */
export function hasDetail(app: App): boolean {
  return isWritten(app);
}

/** The path of this App's detail page, if it has one. */
export function detailPathOf(app: App): string | undefined {
  return hasDetail(app) ? `/apps/${app.id}/` : undefined;
}

/**
 * Every written privacy policy, by the slug of the App it belongs to.
 *
 * A privacy route exists if and only if this map holds that App, and that is
 * independent of the detail page: an App listed in a store needs somewhere to
 * point its privacy URL long before there is anything else to say about it.
 *
 * A map of the whole collection rather than a lookup per App: a miss is the
 * ordinary case here — no real App has a policy yet — and `getEntry` reports a
 * miss as a build warning, which would make the site's normal state look like a
 * fault.
 */
export async function listPrivacyPolicies(): Promise<Map<string, AppPrivacy>> {
  const policies = await getCollection('appPrivacy');
  // An App and its policy share an id — see the collection's `generateId`.
  return new Map(policies.filter(isWritten).map((policy) => [policy.id, policy]));
}

/** Every written terms document, by the slug of the App it belongs to. */
export async function listTerms(): Promise<Map<string, AppTerms>> {
  const terms = await getCollection('appTerms');
  return new Map(terms.filter(isWritten).map((document) => [document.id, document]));
}

/** Every written support guide, by the slug of the App it belongs to. */
export async function listSupportGuides(): Promise<Map<string, AppSupport>> {
  const guides = await getCollection('appSupport');
  return new Map(guides.filter(isWritten).map((guide) => [guide.id, guide]));
}

/** The public label for a lifecycle state stored in content frontmatter. */
export function statusLabelOf(app: App): string | undefined {
  switch (app.data.status) {
    case 'app-submission':
      return 'App Submission';
    case 'in-development':
      return 'In development';
    case 'live':
      return undefined;
  }
}

/** Where an App's card sends a visitor, and whether that is off the site. */
export interface CardLink {
  href: string;
  external: boolean;
}

/**
 * Where this App's card should link, if anywhere.
 *
 * A detail page wins over a store listing: if the Studio has written about an
 * App, that is the page it wants a visitor on. An App with neither is not a
 * link at all, rather than a link that goes nowhere.
 */
export function linkOf(app: App): CardLink | undefined {
  const detail = detailPathOf(app);
  if (detail) return { href: detail, external: false };
  if (app.data.status === 'live' && app.data.url) return { href: app.data.url, external: true };
  return undefined;
}
