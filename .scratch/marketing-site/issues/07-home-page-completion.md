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

**Status:** done

- [x] The home page renders hero, featured Apps, what-we-do, about teaser and contact sections in the design's order
- [x] Each section matches the column widths, padding, flex ratios and type scale recorded above
- [x] No heading or copy on the page claims the apps have shipped
- [x] Featured Apps render from the App content model, not from duplicated markup
- [x] The featured section links through to the full catalogue
- [x] The about teaser links through to the about page
- [x] The contact section offers a working email link
- [x] Adding or changing an App updates both the home page and the catalogue with no separate edit
- [x] The page is legible and correctly laid out from small mobile through to desktop
- [x] The page still makes zero third-party network requests

## Comments

### Decisions made while implementing

- **The featured section renders `AppGrid`, and so does the catalogue.** The
  catalogue's own `<ul>` of `AppCard`s moved into `src/components/AppGrid.astro`
  and both pages call it against the same `listApps()`. The design gives the two
  grids different `minmax()` floors — 260px here, 280px there — and nothing else,
  so that is the component's only prop besides the heading level. Adding an App
  is still writing one content file, and it now lands on both pages at once.
- **`AppCard` takes a heading level.** The catalogue puts card names under its
  `h1`, so they are `h2`s; the featured section puts them under its own `h2`, so
  they are `h3`s. Ticket 04 anticipated this and left the prop out until it had a
  caller.
- **The featured section carries its own route to the catalogue** — `./all-apps →`,
  in the about teaser's mono accent line rather than a second filled button
  competing with the hero's. The design did not need one: every card there linked
  to a store. No App here links anywhere, so without it the section is a dead end.
  The hero's `./explore-apps →` is untouched, and the two names differ so a screen
  reader is not given the same link name twice on one page.
- **The featured heading is "A few things we're building".** The design's "A few
  things we've shipped" is true of no App the Studio has. The type scale, spacing
  and position are the design's exactly. A test holds the whole page to the same
  no-shipped-claims list the catalogue is held to.
- **The design's "a small, product-minded team" was not shipped.** The Studio has
  nowhere claimed to be a team, and `CONTEXT.md` lists "product" as a term to
  avoid for an App. The sentence was rewritten from the glossary's Studio
  definition to claim only what is true: one thing at a time, end to end. The
  about teaser keeps the design's wording less "products", because the sentence
  that says the Studio does not work for hire is the point of the section.
- **The three steps are an `<ol>`.** Their order is the whole meaning of `01`,
  `02`, `03`, so the list carries it and the numerals are `aria-hidden` — the
  design's picture of the ordering, not a second reading of it.
- **The blinking cursor moved to `global.css`.** Two places now carry one, and the
  keyframes and the `prefers-reduced-motion` guard should not be written twice.

### A bug found on the way: scoped styles never reached `SectionLabel`

Astro scopes a component's styles to that component's own elements. A `class`
passed into a child component is not one of them, so every rule written against
`SectionLabel`'s `class` prop had been matching nothing:

- the hero's label was rendering in `var(--accent)`, not the design's
  `var(--textDim)`;
- the 14px space below the label on the catalogue, the App detail page and the
  App privacy page did nothing at all.

`SectionLabel` now takes `dim` and `spaceBelow` as props and owns both rules, so
there is no outside-in styling left to fail silently. `spaceBelow` is a union of
the three values the design uses rather than a free number, because the CSP
forbids inline styles — each value has to be a rule in the component. A test
asserts the hero's label resolves to the dim token and not the accent.

### From review

Both axes came back clean on the criteria; five judgement calls were taken:

- The `./x →` route line is now `RouteLink.astro`, called by the featured section
  and the about teaser. It was written twice, byte for byte, which is the same
  case that earned `SectionLabel` a component of its own.
- `AppGrid`'s class is `.min-260`, named for the floor it sets, matching
  `SectionLabel`'s `.space-14`. One naming convention for the same mechanism.
- `AppCard`'s heading tag is `HeadingTag`, not `Name` — the line below it binds
  `name` to the App's own name.
- `SplitSection`'s props extend `HTMLAttributes<'section'>`, so the data hooks
  the tests find these sections by travel through a declared channel.
- `tests/home.spec.ts` resolves any colour token through one `resolvedColour`
  helper rather than three copies of the same probe.

Two deviations from the ticket's wording were kept deliberately, both argued
above: the featured grid's floor is `min(260px, 100%)` rather than a bare 260px,
and the featured section's route is `./all-apps →` rather than the hero's
`./explore-apps →`, so that one page does not carry two links of the same name.

### Notes for whoever picks up the next ticket

- **Never put a `var()` inside `repeat(auto-fit, minmax(…))`.** Passing the track
  floor as a custom property made Chrome count the repetition as 1 and collapsed
  both grids to a single column at every width. `AppGrid` writes both floors out
  as rules; `tests/apps.spec.ts` and `tests/home.spec.ts` both count columns, which
  is what caught it.
- The site's CSP is `style-src 'self'` with no `unsafe-inline`, so a `style`
  attribute is not available for a computed value — `tests/theme.spec.ts` fails
  the build if one appears.
- `SplitSection.astro` holds the design's two-column shape for "what we do" and
  "about". It reaches the label through `:global([data-section-label])` under its
  own scoped root, which is the pattern to copy when a parent genuinely owns a
  child's layout.
- The home page is now five sections; `tests/home.spec.ts` asserts their order and
  each one's measurements. Ticket 08's view transitions land on top of this.
- **The featured section shows every App, not a chosen three.** That is the design
  today, because there are three; it will grow with the catalogue. Featuring a
  subset would mean a second decision per App, which is exactly what "adding an
  App updates both with no separate edit" rules out — so if the Studio ever wants
  a chosen few, it belongs in the content model as a field, not in the template.
