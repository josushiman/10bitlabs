# 05 — App detail and per-App privacy routes

**What to build:** When an App has something written about it, it gets its own page and its card links there. When it has a privacy policy written, that policy gets its own public URL suitable for pasting into an app store listing. When neither has been written — which is true of all three Apps today — neither route exists, and no visitor is ever shown an empty page.

The conditional behaviour is the point of this ticket, not a detail of it. Routes materialise from content, so an unwritten page cannot be published by accident. This is what makes it safe to add an App to the catalogue months before there is anything to say about it.

Rules:

- A detail route exists if and only if that App's content has a body.
- A card links to its detail page if and only if that route exists.
- A privacy route exists if and only if that App's content has a privacy body.
- Promoting an App from in-development to launched, with a detail page and a privacy policy, is content editing — never plumbing.

Verify by adding a temporary App entry with a body during testing and confirming the route appears, rather than by shipping placeholder content for the three real entries.

**Blocked by:** 04 — App catalogue.

**Status:** done

- [x] An App with a body has a working detail route
- [x] An App with no body has no detail route, and requesting one gives the site's own 404 behaviour
- [x] A card links to its detail page only when that page exists
- [x] An App with a privacy body has a working, publicly reachable privacy route
- [x] An App with no privacy body has no privacy route
- [x] No placeholder or empty detail page ships for any of the three current entries
- [x] Adding a body to an existing content file is sufficient to make its page appear

## Comments

Implemented. `/apps/<slug>` and `/apps/<slug>/privacy` both materialise from
content and neither exists for any of the three real Apps. The suite is 43
assertions and passes, `npm run check` is clean.

**Where the second body lives.** Ticket 04 left this open, and it is a sibling
file: `src/content/apps/<slug>.privacy.md` beside `<slug>.md`, loaded as its own
`appPrivacy` collection. The apps collection excludes `*.privacy.md`, and the
privacy collection's `generateId` strips the suffix, so an App and its policy
share an id and the join is the slug rather than a lookup table. The alternatives
all cost more: a second collection under its own directory splits one App across
two trees, and a frontmatter string makes a privacy policy something you write
with `\n` escapes.

Both routes turn on one predicate — `isWritten` in `src/lib/apps.ts` — and a
whitespace-only body counts as unwritten, because that is what it would look like
on the page.

**The fixtures now cover the whole grid**, because with two routes and a store
listing the interesting cases are combinations, and no real App is any of them:

| Fixture | Body | Policy | Live + url | What it proves |
| --- | --- | --- | --- | --- |
| `_fixture-detailed-app` | yes | no | no | detail route; card links inward; no privacy route |
| `_fixture-live-app` | no | yes | yes | privacy route with no detail page; card still links to the store |
| `_fixture-launched-app` | yes | yes | yes | a written page beats a store listing; both onward links appear |

`_fixture-launched-app` is the shape every real App should end up in, and it is
here so that what happens on the day one launches is decided by a test rather
than found out then.

**The card's link precedence is new, and it is a change to ticket 04's rule.**
`linkOf` now returns a detail path in preference to a store URL, and only marks
the external one `target="_blank"`. The ticket asks for "a card links to its
detail page if and only if that route exists", which for a launched App with a
page written about it can only mean the page wins. A test pins it.

**The guard that matters is `tests/production-build.spec.ts`.** Every other test
runs against the build the fixtures are admitted into, which is the only build
where a written App exists at all; this one runs a second `astro build` without
the flag and asserts that nothing lives under `/apps/` but the catalogue, and
that no built page says "Fixture". Ticket 04's notes claimed this was checked
against the built HTML; it was not, and now it is. Confirmed to bite: a fixture
build does emit `/apps/_fixture-detailed-app`.

### Three additions the ticket did not ask for

Recorded so they can be struck rather than discovered.

1. **The detail page links its App's store listing** (`$ open <name>`), under the
   same live-and-has-a-url rule the card follows. Without it, a launched App's
   card sends a visitor to a page that is a dead end.
2. **The detail page links its own privacy policy** when one is published. This
   is what makes "publicly reachable" true of a visitor rather than only of a
   store reviewer with the URL in hand.
3. **A policy carries an optional `updated` date.** Optional deliberately: a
   required field would mean writing the body was not sufficient to publish the
   route, which is the one promise these routes are built on. It is formatted in
   UTC — formatted locally, a build west of UTC prints the day before and
   disagrees with its own `datetime` attribute. Verified by building under
   `TZ=America/Los_Angeles`, where the test fails without the fix.

### Deferred, and to whom

- **The 404.** "The site's own 404 behaviour" today is a bare 404 status from the
  assets layer; the test asserts the status, not a design. Ticket 06 owns the
  designed 404 page and its checkbox says so. When it lands, these tests still
  hold.
- **A policy file with frontmatter and an empty body publishes nothing, silently.**
  Correct by the rule, but the author gets no signal. If that bites, the place to
  fix it is `listPrivacyPolicies`.
- **Two stylesheets ship unreferenced.** `Prose.css` and the privacy page's CSS
  are emitted into the production build even though it generates no paths that
  use them — a few hundred bytes, no fixture content. They start being referenced
  the moment anything is written.

### Notes for whoever picks up the next ticket

- The card's accent wash, edge and label type moved from `AppCard.astro` to
  `global.css` as `--accent-wash`, `--accent-edge`, `--label-size` and
  `--label-tracking`. Ticket 04 named them once on the card precisely so they
  could not drift; the detail page is the second consumer, so "once" moved up.
  Ticket 06's invented 404 and 07's featured section should use them too.
- `tests/support.ts` holds `cardFor` and `expectLegibleAtEitherEnd`, both of which
  were duplicated across spec files. Playwright collects `*.spec.ts` only, so it
  is imported and never run.
- The privacy page is cut to ticket 06's recorded privacy/legal measurements
  (`max-width:680px`, `padding:100px 28px 120px`, `clamp(1.8rem, 4vw, 2.4rem)`),
  and the detail page to its About measurements. When 06 builds those pages, the
  two should agree — and the shared column primitive ticket 04 predicted is now
  written five times, not three.
- `CONTEXT.md` gains **App detail page** and **App privacy policy** as terms; the
  latter is explicitly not the site's own privacy page, which 06 builds.
