# 04 — App catalogue

**What to build:** A visitor can reach a page listing the Apps the Studio is building, see what each one is and which platforms it targets, and tell at a glance that none of them has launched yet — without ever being offered a link that goes nowhere.

Introduces the App content model. Each entry carries a name, a slug, badge initials, a short description, a platform label, a status of either live or in-development, an optional external link, an optional long-form body, and an optional privacy policy body. The last three are unused by this ticket and exist for the next one.

Rendering rules this ticket establishes:

- An in-development App renders as an **unlinked** card with an "In development" tag. The source design has no such state; it is added here, and it is the whole reason this ticket exists as its own slice.
- A live App with a link renders as a linked card.
- Platform is shown on the card, so a visitor knows whether it is relevant to their device before clicking.

Three seed entries, all in-development, all placeholder copy pending real details. Mark them clearly as placeholders in the content files:

| Name | Initials | Platform (provisional) | Description |
| --- | --- | --- | --- |
| Plan The Day | PTD | iOS & Web | Wedding and event planning, from first idea to the day itself. |
| Sıra | SR | iOS | Score tallying for Okey and Gonga, without the paper and pen. |
| Fiilo | FI | iOS | Turkish vocabulary and verb conjugation, practised in short sessions. |

The platform labels are the most likely thing in this ticket to be wrong; they are the owner's to confirm.

`Sıra` is marked as Turkish wherever it appears, so assistive technology pronounces it with Turkish rules rather than English ones. Its dotless ı must render from the site's own font rather than a fallback face — this ticket is what proves the font subset chosen in the walking skeleton actually covers the Studio's own product names.

Adding a fourth App later must be a matter of writing one content file, with no layout changes.

## Design fidelity

From `docs/design/10 Bit Labs.dc.html`. The App card is the most reused component on the site — ticket 07 renders the same one on the home page — so it is worth building once, precisely:

- Grid: `repeat(auto-fit, minmax(280px, 1fr))` with `gap:24px` on the catalogue. (The home page's featured grid uses `minmax(260px, 1fr)`; that 20px difference is in the design and is intentional.)
- Card: `padding:26px`, `border-radius:16px`, `var(--bg2)`, border `1px solid color-mix(in srgb, var(--border) 40%, transparent)`, flex column with `gap:16px`.
- Badge tile: 56px square, `border-radius:14px`, background `color-mix(in srgb, var(--accent) 14%, transparent)`, border `1px solid color-mix(in srgb, var(--accent) 30%, transparent)`, initials centred in JetBrains Mono 600 / 15px / `var(--accent)`.
- Name: Space Grotesk 600 / 17px, `margin-bottom:6px`. Description: 14px / `line-height:1.5` / `var(--textDim)`.
- Platform label: JetBrains Mono 11px, `letter-spacing:0.04em`, `var(--textDim)`, pinned to the card's foot with `margin-top:auto` so cards of differing description length still align.
- Hover (linked cards only): `transform:translateY(-2px)` and border to `color-mix(in srgb, var(--accent) 60%, transparent)`, both on `transition:… 0.15s ease`.

Page header: `// apps` label in JetBrains Mono 13px `var(--accent)`, `h1` in Space Grotesk 600 at `clamp(2rem, 4.5vw, 3rem)`, intro paragraph 17px / `line-height:1.6` / `var(--textDim)` / `max-width:56ch`.

**Copy correction.** The design's catalogue heading reads "Things we've built." and its intro "A short, growing list of apps we design, build and maintain ourselves." Both imply shipped products; all three seed Apps are in development. Rewrite to describe what the Studio is building. Change the words only — the type scale, spacing and structure above stay exactly as designed.

The "In development" tag has no design precedent, so it is being invented. Build it from the vocabulary already on the card rather than introducing a new one: JetBrains Mono at label size, `var(--accent)` on a `color-mix` accent wash, matching the badge tile's treatment.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** done — with one field deferred to ticket 05; see the comments.

- [x] The apps index route responds and lists all three entries
- [x] Each card shows name, description, platform and badge initials
- [x] The card matches the measurements recorded above, and platform labels stay aligned across cards of differing description length
- [x] The "In development" tag reuses the card's existing type and colour vocabulary rather than introducing a new one
- [x] No heading or copy on the page claims the apps have shipped
- [x] In-development entries render unlinked and carry a visible "In development" tag
- [x] A live entry with a link renders as a linked card
- [x] The Turkish app name is marked with the correct language and renders its dotless character from the self-hosted font, not a fallback
- [x] The page still makes zero third-party network requests
- [x] Placeholder copy and provisional platform labels are flagged as such in the content files
- [x] Adding a new App requires only a new content file

## Comments

Implemented. `/apps` renders the three seed Apps from a content collection; the
full suite is 27 assertions and passes, and `npm run check` is clean.

**The App content model.** One markdown file per App at
`src/content/apps/<slug>.md`, the filename being the slug — adding a fourth App
is writing that file and nothing else. `order` is optional: leave it out and the
App lands at the end of the catalogue, so the "one content file" promise does not
quietly become "one content file and a correct number".

**The privacy body is not modelled yet, deliberately.** A markdown file has one
body and an App needs two long-form ones — the detail page and the privacy
policy. Every plausible shape for the second (a sibling `<slug>.privacy.md`, a
second collection, a frontmatter string) prejudges plumbing that ticket 05 owns,
and an empty collection warns on every build for no gain today. The other two
fields the ticket asked to exist do: `url` is in the schema, and the markdown
body is the App's long-form body. Ticket 05 should pick the shape when it builds
the route that actually serves it.

**The linked-card branch is proved against a real build, by a fixture.** All three
real Apps are in development, so nothing real exercises the linked card. Rather
than ship a fake App or leave the branch untested, `_fixture-live-app.md` is
admitted only when `INCLUDE_APP_FIXTURES=1`, which `playwright.config.ts` sets
for the test build. Underscore-prefixed entries never reach production — checked
against the built HTML, not assumed. This is the same technique ticket 05 asks
for; it is here early because ticket 04 is where the live/in-development split is
decided.

**One recorded deviation from the design.** The grid is
`minmax(min(280px, 100%), 1fr)`, not `minmax(280px, 1fr)`. A 280px track does not
fit a 320px viewport once the 28px gutters are taken, and the design's literal
value pushes the whole page sideways on the narrowest phones. `min()` leaves the
desktop layout exactly as designed and only bites below ~336px. Ticket 07's
260px featured grid should take the same treatment.

Everything else in the fidelity list matches literally: 26px/16px card, 56px/14px
badge with 600/15px initials, 17px name with 6px below, 14px/1.5 description,
11px/0.04em platform pinned with `margin-top:auto`, hover pair on `0.15s ease`,
and the 13px label / `clamp(2rem, 4.5vw, 3rem)` / 17px-1.6-56ch page header. The
platform label moved into a `.foot` wrapper it shares with the tag; the wrapper
carries the `margin-top:auto`, so the alignment behaviour is unchanged and is
asserted across a row.

**The invented "In development" tag** takes the platform label's type and the
badge tile's exact wash and edge — both named once on the card as custom
properties so they cannot drift — and the badge's 14px radius, so the card
carries two corner radii rather than three.

Notes for whoever picks up the next ticket:

- Copy was taken from `CONTEXT.md` rather than the design, as ticket 02 set out.
  The heading is "Things we're building." and the intro says every App is still
  in development; a test asserts no shipped claim creeps back in.
- `listApps()` in `src/lib/apps.ts` is the single source for the catalogue and for
  ticket 07's featured section. Render the same `AppCard`; do not restate it.
- `AppCard` renders its name as an `h2`, which is right under the catalogue's
  `h1`. Ticket 07's featured section sits under an `h2`, so it will need a
  heading-level prop — left out here rather than shipped unused.
- The `max-width:1100px; margin:0 auto; padding:… 28px` column is now written
  three times (hero, catalogue intro, catalogue). Ticket 06 or 07 adds enough
  sections to make a shared column primitive worth extracting.
- The platform labels are still the owner's to confirm, and all three content
  files carry a TODO saying so.
