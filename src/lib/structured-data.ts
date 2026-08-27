import type { App } from './apps';
import { COMPANY } from './company';

const organizationId = (site: URL) => new URL('/#organization', site).href;

/** The Studio's identity graph, which belongs only on its canonical home page. */
export function homeStructuredData(site: URL) {
  const url = new URL('/', site).href;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': new URL('/#website', site).href,
        name: '10 Bit Labs',
        url,
        publisher: { '@id': organizationId(site) }
      },
      {
        '@type': 'Organization',
        '@id': organizationId(site),
        name: '10 Bit Labs',
        legalName: COMPANY.name,
        url,
        logo: new URL('/favicon.svg', site).href,
        email: COMPANY.email
      }
    ]
  };
}

/** Facts an App detail page already visibly states, in Schema.org's vocabulary. */
export function appStructuredData(app: App, canonical: URL, site: URL) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': new URL('#softwareapplication', canonical).href,
    name: app.data.name,
    description: app.data.description,
    operatingSystem: app.data.platform,
    url: canonical.href,
    publisher: { '@id': organizationId(site) }
  };

  // A listing is only visible on this page once the App is live, so it is only
  // then a fact this data block may repeat.
  return app.data.status === 'live' && app.data.url
    ? { ...schema, sameAs: app.data.url }
    : schema;
}

/** JSON embedded in HTML needs the one character sequence that closes a tag escaped. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
