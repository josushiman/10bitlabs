import { expect, test } from '@playwright/test';

test('the served response carries the security headers', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();

  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['permissions-policy']).toBeTruthy();
});

test('the content security policy is strict and admits the theme script by hash', async ({
  request
}) => {
  const csp = (await request.get('/')).headers()['content-security-policy'];

  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'none'");
  expect(csp).toMatch(/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);

  // The whole point of the hash: nothing here is allowed to relax the policy.
  expect(csp).not.toContain('unsafe-inline');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('*');
});

test('a hostname that is not the apex is non-indexable', async ({ request }) => {
  const preview = await request.get('/', {
    headers: { Host: '10bitlabs-site.preview.workers.dev' }
  });
  expect(preview.headers()['x-robots-tag']).toBe('noindex');
});

test('the apex is indexable', async ({ request }) => {
  const apex = await request.get('/', { headers: { Host: '10bitlabs.co.uk' } });
  expect(apex.headers()['x-robots-tag']).toBeUndefined();
});
