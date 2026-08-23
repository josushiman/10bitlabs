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

**Status:** ready-for-agent

- [ ] The apps index route responds and lists all three entries
- [ ] Each card shows name, description, platform and badge initials
- [ ] The card matches the measurements recorded above, and platform labels stay aligned across cards of differing description length
- [ ] The "In development" tag reuses the card's existing type and colour vocabulary rather than introducing a new one
- [ ] No heading or copy on the page claims the apps have shipped
- [ ] In-development entries render unlinked and carry a visible "In development" tag
- [ ] A live entry with a link renders as a linked card
- [ ] The Turkish app name is marked with the correct language and renders its dotless character from the self-hosted font, not a fallback
- [ ] The page still makes zero third-party network requests
- [ ] Placeholder copy and provisional platform labels are flagged as such in the content files
- [ ] Adding a new App requires only a new content file
