# 07 — Home page completion

**What to build:** A visitor landing on the home page can, in one scroll, understand what the Studio is, see the Apps it is building, follow how it works, and find out how to get in touch.

The walking skeleton delivered the hero. This ticket adds the remaining sections from the design, in order:

- **Featured Apps** — the same App cards as the catalogue, rendered from the same content model rather than duplicated, with a route through to the full catalogue.
- **What we do** — the three numbered steps: idea, build, launch.
- **About teaser** — the short positioning paragraph, with a link through to the full about page. This is where the Studio states it publishes its own products rather than working for hire, which is the single most useful sentence on the site for filtering out enquiries it would decline.
- **Contact call to action** — the closing section with the email address.

Because all three Apps are in development, the featured section shows three unlinked cards. That is the honest picture of a new studio and reads better than an empty page or an omitted section.

Nothing here should re-implement card rendering. If the featured section and the catalogue drift apart visually, the model has been duplicated rather than reused.

## Design fidelity

From `docs/design/10 Bit Labs.dc.html`. Every section below sits in a `max-width:1100px` column with `padding:0 28px 100px`.

- **Featured apps** — `// featured apps` label in JetBrains Mono 13px `var(--accent)`, then an `h2` in Space Grotesk 600 at `clamp(1.5rem, 3vw, 2rem)` with `margin-bottom:40px`. Grid is `repeat(auto-fit, minmax(260px, 1fr))`, `gap:24px` — note 260px here against the catalogue's 280px; that difference is in the design.
- **What we do** — a two-column flex row with `gap:48px`: a `// what we do` label at `flex:1 1 160px`, and content at `flex:3 1 420px`. Intro paragraph 18px / `line-height:1.6` / `max-width:56ch`. The three steps are a wrapping flex row at `gap:32px`, each `flex:1 1 140px`, each opening with its number (`01`, `02`, `03`) in JetBrains Mono 13px `var(--accent)`, then the step name in Space Grotesk 600, then 14px `var(--textDim)` at `line-height:1.5`.
- **About teaser** — same two-column shape as above, with a `// about` label. Paragraph 18px / `line-height:1.6` / `max-width:56ch`, followed by `./more-about-us →` in JetBrains Mono 14px `var(--accent)`, hover `opacity:0.7`.
- **Contact** — full-bleed, top border `1px solid color-mix(in srgb, var(--border) 40%, transparent)`, `padding:90px 28px`, centre-aligned. `h2` in Space Grotesk 600 at `clamp(1.6rem, 3.4vw, 2.4rem)`, `max-width:20ch`. Below it `$ mail hello@10bitlabs.co.uk` in JetBrains Mono 18px `var(--accent)`, carrying the second `▌` blinking cursor on the site.

**Copy correction.** The design's featured heading reads "A few things we've shipped". All three Apps are in development, so that is false. Rewrite it to describe what the Studio is building — the heading's type scale, spacing and position stay exactly as designed. The `./explore-apps →` route through to the catalogue is unaffected.

The design's "what we do" copy mentions "a small, product-minded team". Check that against how the Studio actually wants to describe itself before shipping it verbatim.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet. 04 — App catalogue.

**Status:** ready-for-agent

- [ ] The home page renders hero, featured Apps, what-we-do, about teaser and contact sections in the design's order
- [ ] Each section matches the column widths, padding, flex ratios and type scale recorded above
- [ ] No heading or copy on the page claims the apps have shipped
- [ ] Featured Apps render from the App content model, not from duplicated markup
- [ ] The featured section links through to the full catalogue
- [ ] The about teaser links through to the about page
- [ ] The contact section offers a working email link
- [ ] Adding or changing an App updates both the home page and the catalogue with no separate edit
- [ ] The page is legible and correctly laid out from small mobile through to desktop
- [ ] The page still makes zero third-party network requests
