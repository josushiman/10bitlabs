# 01 — Domain glossary and hosting ADR

**What to build:** A future maintainer opening this repository can learn what the project's core terms mean, and why the site is hosted where it is, without reverse-engineering either from the code.

Two documents. First, the repo-root domain glossary, seeded with three terms:

- **Studio** — 10BIT LABS LTD. Designs, builds and publishes its own products. Explicitly not an agency and not available for hire; the About copy says so directly, and the distinction is load-bearing for how the site is written.
- **App** — a published or in-development product with its own audience, its own store listing, and its own privacy policy. The core entity of the site.
- **Marketing site** — this repository's site. The term deliberately replaces "holding page", which understates a six-page site with a catalogue, and which materially misled early planning toward a single-file build with no real URLs.

The glossary is a glossary. No implementation detail, no roadmap, no scratch notes.

Second, an architecture decision record for the hosting choice: Cloudflare Workers with static assets, with GitHub Pages and Netlify recorded as the considered and rejected alternatives. The reasoning to capture is that this site is a seed rather than a terminal state — a server-side endpoint can later be added as a route instead of forcing a migration — and that static asset requests carry no Worker invocation cost at this scale. This decision is expensive to unwind once DNS, mail and CI all point at it, which is what earns it an ADR.

**Blocked by:** None — can start immediately. Runs in parallel with any other ticket.

**Status:** done

- [x] Glossary exists at the repo root with the three terms defined
- [x] Glossary contains no implementation detail, file paths or task lists
- [x] ADR-0001 records the Cloudflare Workers static assets decision
- [x] ADR-0001 names GitHub Pages and Netlify as rejected alternatives, with the reason each was rejected
- [x] ADR-0001 states the "seed, not terminal state" reasoning that decided it
- [x] Both files follow the formats described in the repo's agent documentation

## Comments

Implemented: `CONTEXT.md` at the repo root and `docs/adr/0001-cloudflare-workers-static-hosting.md`. All six acceptance criteria met.

Two things carried into the ADR beyond the ticket's literal wording, both from the parent spec's "DNS and mail" section, because the ADR is the durable record a maintainer reads before touching the zone: registration stays at GoDaddy (only nameservers move), and Cloudflare Email Routing must never be enabled or it takes mail delivery away from iCloud.
