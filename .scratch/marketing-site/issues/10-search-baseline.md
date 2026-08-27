# 10 — Search baseline

**What to build:** Complete the crawl, machine-readable identity and search-engine
registration baseline appropriate to the Studio before any App has launched. This is
not a ranking, growth or content-marketing programme, and it cannot guarantee that a
provider will crawl, index, rank or cite the site.

Ticket 09 already owns the sitemap, general `robots.txt`, canonical URLs, favicon,
Open Graph metadata and share image. Those changes are present on `origin/main`; a
checkout that does not contain them must first fast-forward to `origin/main` rather
than reimplementing them here.

**Blocked by:** 09 — Discoverability assets.

**Status:** ready-for-agent

## Structured identity

Add JSON-LD using only facts already visible on the site.

The canonical home page carries a graph containing:

- `WebSite`: `10 Bit Labs` and `https://10bitlabs.co.uk/`.
- `Organization`: the public name, legal name `10 Bit Labs Ltd`, canonical URL,
  the Studio's existing crawlable logo asset, and `hello@10bitlabs.co.uk`.
- Stable `@id` values link the website to its publisher rather than describing two
  unrelated entities.

Do not repeat the registered address or company number in JSON-LD. They remain
visible on the About and Legal pages, but add no value to this basic baseline.

Every App detail route that actually materialises carries `SoftwareApplication`
JSON-LD with only the facts visible on that page:

- name;
- description;
- the existing platform label as `operatingSystem`;
- the canonical App detail URL;
- the Studio as publisher;
- the external listing as `sameAs` when one exists.

Do not add schema-only price, offers, ratings, category or other guessed fields. The
conditional route remains the publication boundary: an App with no written detail
page produces neither a URL nor structured data.

JSON-LD uses `<script type="application/ld+json">`, but it is data rather than
executable JavaScript. Sharpen the CSP build invariant from "one inline script" to
"one executable inline script": `scripts/emit-headers.mjs` ignores JSON-LD data
blocks while continuing to find, hash and require exactly the blocking theme script.
The CSP must not gain `unsafe-inline` or any new source.

## Crawler policy

Keep the generated catch-all policy and canonical sitemap declaration:

```text
User-agent: *
Allow: /

Sitemap: https://10bitlabs.co.uk/sitemap.xml
```

Add explicit `Disallow: /` groups for these bulk-training or reusable-corpus
controls:

- `GPTBot`
- `ClaudeBot`
- `Google-Extended`
- `Applebot-Extended`
- `Amazonbot`
- `CCBot`

Do not block search or user-requested retrieval agents, including `Googlebot`,
`bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`,
`Applebot`, `Amzn-SearchBot`, `Amzn-User`, `PerplexityBot` or `Perplexity-User`.
The generic allow rule covers them; duplicated provider-specific allow groups are
unnecessary.

This policy has two accepted limitations:

- Blocking `Google-Extended` also opts the site out of grounding in Gemini Apps and
  Vertex AI. It does not affect Google Search, AI Overviews or AI Mode.
- Bing and Brave do not provide a clean way to preserve search/Copilot discovery
  while independently opting out of downstream training use. Keep them searchable;
  the policy therefore cannot promise zero downstream training by every provider.

The provider controls are time-sensitive. Keep the rationale and sources beside the
generated policy or in its tests so a future maintainer can review the tokens rather
than treating the list as permanent:

- [OpenAI crawlers](https://developers.openai.com/api/docs/bots)
- [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Google crawler controls](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Google generative-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Bing crawler controls](https://www.bing.com/webmasters/help/robots-meta-tags-and-attributes-that-bing-supports-5198d240)
- [Applebot controls](https://support.apple.com/en-gb/119829)
- [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Amazonbot controls](https://developer.amazon.com/en/amazonbot)
- [Common Crawl CCBot](https://commoncrawl.org/ccbot)
- [Brave Search crawler](https://safe.search.brave.com/help/brave-search-crawler)

## Acceptance criteria

- [ ] The production home page contains valid `WebSite` and `Organization`
      JSON-LD with canonical absolute URLs and no invented company facts.
- [ ] A published App detail page contains valid `SoftwareApplication` JSON-LD
      made only from facts visible on that page.
- [ ] An App without a detail route emits no App URL or structured data in the
      production build.
- [ ] Structured entities use stable IDs so the website, Studio and App publisher
      relationships are unambiguous.
- [ ] JSON-LD does not weaken the CSP: the theme script remains the only executable
      inline script and is admitted by one hash; `unsafe-inline` and `unsafe-eval`
      remain absent.
- [ ] Generated `robots.txt` permits ordinary crawling, names the canonical
      sitemap, and blocks the six agreed training/corpus tokens.
- [ ] Search and user-retrieval crawlers are not blocked by a provider-specific or
      catch-all rule.
- [ ] Preview hostnames continue to serve `X-Robots-Tag: noindex`, including for
      `robots.txt` and `sitemap.xml`; the canonical apex remains indexable.
- [ ] Production-build tests prove that fixture Apps and fixture structured data
      do not leak into public output.
- [ ] The site still makes zero third-party requests.
- [ ] `npm run check`, `npm run build` and the complete test suite pass.

## Owner launch checklist

These are account-level actions, not work for the implementation agent:

1. Add `10bitlabs.co.uk` to Google Search Console as a domain property and verify
   it through DNS.
2. Submit `https://10bitlabs.co.uk/sitemap.xml` and inspect representative live
   URLs, including the home page and Apps catalogue.
3. Import the verified property into Bing Webmaster Tools and submit the same
   sitemap.
4. Confirm from production that the apex responses carry no `noindex`, preview
   responses still do, and both webmaster tools can fetch the sitemap.

Keep verification tokens out of page templates unless DNS verification is genuinely
unavailable. Do not add client-side analytics: webmaster-platform reporting preserves
the site's zero-third-party-request privacy property.

## Deliberately excluded

- `llms.txt` — not required by the providers reviewed and ignored by Google Search.
- IndexNow — unnecessary for this small, rarely changing static site with an
  automatically generated sitemap.
- Analytics, referral tracking or cookie-consent work.
- Thin App pages created merely to increase URL count.
- Speculative schema fields or content written only for machines.
- Ranking targets, keyword work, backlinks or an ongoing SEO programme.

No ADR is needed: the crawler list and structured-data choices are conventional,
explicitly tested and inexpensive to revise.
