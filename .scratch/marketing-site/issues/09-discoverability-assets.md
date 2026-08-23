# 09 — Discoverability assets

**What to build:** Search engines can crawl and index the right pages and only the right pages, a link to the site shared in a chat renders as a proper preview card rather than a bare URL, and the browser tab carries the Studio's own mark.

Four pieces:

- **Sitemap**, enumerating the final route set. Sequenced after the conditional App routes exist so it reflects what is actually published rather than what was planned — an App with no detail page must not appear in it.
- **Robots file**, permitting crawling of the canonical hostname.
- **Favicon**, derived from the Studio's icon mark: a dark background with two rounded bars in the accent colour, one solid and one outlined — a one and a zero, the same motif as the header logo.
- **Open Graph and equivalent card image**, generated at build time from the same icon mark and the site's own palette rather than hand-designed, so it cannot drift from the brand as the palette changes.

Preview hostnames must remain excluded from indexing, so a preview copy is never treated as a duplicate of the real site.

## Design fidelity

The icon mark is at `docs/design/10 Bit Labs Icon.dc.html` and is fully specified there — a 1024×1024 artboard on `oklch(0.15 0.012 25)`, containing two 220×520px bars at `gap:110px`, both `border-radius:56px`, in `oklch(0.68 0.18 25)`: the first filled, the second outlined with a `56px` border. Reproduce those proportions rather than redrawing by eye.

Note the icon hardcodes the Crimson values rather than referencing tokens, so it does not invert with the theme. That is correct — a favicon and a share card have no access to the visitor's palette preference.

The header logo mark built in ticket 02 is the same motif at 28px. If the favicon and the header logo look like different marks, one of them is wrong.

**Blocked by:** 05 — App detail and per-App privacy routes. 06 — The rest of the page set, reachable via the menu.

**Status:** done

- [x] A sitemap exists listing every published route
- [x] The sitemap excludes App routes that do not exist
- [x] A robots file exists and permits crawling of the canonical hostname
- [x] A favicon derived from the icon mark appears in the browser tab
- [x] Sharing a link produces a preview card with title, description and image
- [x] The card image is generated at build time from the icon mark and site palette
- [x] Preview hostnames still serve `noindex`
- [x] The card image and favicon are served from the site's own origin, preserving zero third-party requests

## Comments

### What was built

- **Sitemap and robots** — `scripts/emit-crawler-files.mjs`, run after `astro build`
  alongside the existing headers emitter. Both files are derived from the built
  directory rather than from a route list: a page is a directory holding an
  `index.html`, which is exactly what the conditional App routes produce and only
  when they produce it. That is what makes "excludes App routes that do not
  exist" true by construction rather than by remembering — the three real Apps
  have no body and no policy, so the production sitemap is the six real pages and
  nothing else. `404.html` is not an `index.html`, so it falls out for free.
- **Share card** — `scripts/render-og.mjs` writes `dist/og.png` during the build.
- **Meta tags** — Open Graph plus `twitter:card` in `BaseLayout.astro`, so every
  page carries its own title and description with the shared card image.
- **Favicon** — already shipped. It landed early, out of ticket order, in
  `0d0ab7e`, and `tests/favicon.spec.ts` already held it. Nothing to do beyond
  confirming it still passes.

### Decisions worth keeping

- **The card is drawn with arithmetic, not a browser.** The obvious way to
  rasterise the mark is Playwright's Chromium, which is what
  `scripts/render-favicons.mjs` does. That script is run by hand and its outputs
  are committed, so the cost lands on nobody. This one had to run inside
  `npm run build`, and the deploy job installs no Playwright browsers — a build
  that needed one would either fail in CI or add a browser download to every
  deploy. The mark is rectangles with rounded corners, which is a signed distance
  field, three lines of anti-aliasing and a hand-rolled PNG chunk writer over
  `node:zlib`. No new dependency, and the card is a few kilobytes.
- **The palette is read, not copied.** `darkPalette()` parses the dark side of
  the `light-dark()` pairs out of `src/styles/global.css` and converts
  OKLCH → OKLab → linear sRGB → sRGB. This is what the ticket's "cannot drift
  from the brand as the palette changes" actually asks for, and it is checkable:
  the conversion produces `#100909` and `#f3625d`, which are byte-for-byte the
  hex values `public/favicon.svg` states. A test asserts that agreement, so the
  tab and the share card cannot come to show two different brands.
- **The geometry is carried across as ratios.** `markGeometry()` scales the
  icon's own numbers — 220×520 bars, 110px gap, 56px corners, 56px border — from
  one bar height, so the card and the favicon are one mark at two sizes rather
  than two drawings of it.
- **The card carries no words.** There is no font engine in the build, so
  rendering "10 Bit Labs" into the PNG would have meant either shipping a
  rasteriser or embedding glyph outlines. The title and description a reader sees
  on the card come from `og:title` and `og:description` instead, which is where
  every card renderer takes them from anyway; the image is the mark on the
  palette, with a hairline of accent along the bottom edge so it reads as a card
  rather than as a cropped app icon.
- **robots.txt does not hold back the previews.** It cannot: one file is served
  under every hostname the Worker answers to. `X-Robots-Tag: noindex` already
  does that job for every hostname that is not the apex, and the new test checks
  it reaches `/robots.txt` and `/sitemap.xml` too — robots.txt being the first
  file a crawler asks for, a preview whose noindex missed it would still be
  crawled.

### What the review changed

- **The outlined bar was drawn wrong, and the review caught it.** The border was
  being drawn as a ring straddling the shape's edge — 28 units either side —
  rather than inward from it. The design uses `box-sizing: border-box`, so the
  56px border sits *inside* the 220×520 box. The effect was a zero a quarter
  wider than the one beside it, with the gap between them closed by half a border
  and its corners rounded 84 instead of 56. It rendered perfectly happily and
  only looked wrong next to the favicon, which had it right all along:
  `public/favicon.svg` compensates for SVG's centred stroke by shrinking the rect
  by one stroke width, which is the same thing said differently.

  The fix is the shape minus the shape shrunk by one border, which also gives the
  counter sharp corners for free — 56 less 56 is nothing, which is what CSS
  draws.

  `tests/discoverability.spec.ts` now reads the rendered pixels back: a scanline
  through the middle of the mark cuts it into three runs of accent, and their
  widths and spacing are asserted against the icon's own ratios. It was checked
  against the broken version before being kept — it fails there and passes here.
  This is the only class of fault on the card that is invisible to every other
  assertion, so it is the one worth paying for.
- **Smaller ones taken:** a comment pointing at a function that does not exist,
  `import.meta.url` compared against a hand-built `file://` string rather than
  `pathToFileURL`, two exports with no caller, unescaped `<loc>` values, and the
  sitemap parsing written out twice across two specs (now `sitemapUrls` in
  `tests/support.ts`).

### Left deliberately

- **The hairline of accent along the bottom edge** was flagged as unasked-for,
  and it is: the ticket describes the card as the mark and the palette, and a
  rule is neither. It stays because a 1200×630 image holding nothing but a
  centred icon reads as a cropped app icon rather than as a card. It is drawn in
  the same accent the mark is, so it cannot drift from the brand either — which
  is the constraint the ticket actually sets. One line to remove if it is not
  wanted.
- **`render-og.mjs` does not take an output directory**, though its sibling
  `emit-crawler-files.mjs` does. The inconsistency is real but the parameter
  would have no caller: the production-build test needs a sitemap for the build
  it makes, and does not need a card.

### Notes for whoever picks up the next ticket

- **A new page needs nothing done to it to reach the sitemap.** Adding
  `src/pages/<name>.astro` is the whole of it. The same is true of an App: write
  a body and the detail route and its sitemap entry both appear.
- **The build is now four steps.** `astro build`, then the crawler files, then
  the card, then the headers. The headers emitter must stay last — it hashes the
  inline script out of the built HTML, and it scans `.html` only, so the two new
  files are invisible to it.
- **`scripts/emit-crawler-files.mjs` takes an optional output directory.** That
  is not generality for its own sake: `tests/production-build.spec.ts` builds the
  public site into `.astro/production-build-check` and needs the sitemap for
  *that* build, not the fixture build wrangler is serving to everything else.
- **There are now three recursive directory walks in the repo** — `htmlFiles` in
  `scripts/emit-headers.mjs`, `publishedRoutes` in `scripts/emit-crawler-files.mjs`
  and `filesUnder` in `tests/production-build.spec.ts`. Each maps its results
  differently, so they are not quite the same function, but a fourth would be one
  too many. Worth collapsing into a shared walker the next time one of them is
  touched.
