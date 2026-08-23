# 02 — Walking skeleton: the hero, live on the internet

**What to build:** A visitor can load a real URL on the internet and see the home page's hero — the terminal window, the headline, the sub-paragraph — rendered in the studio's own typography, in the palette matching their operating system preference, with a working theme toggle, and with no request leaving the origin.

This is the project's tracer bullet. It is deliberately **narrow in content and complete in depth**: one section of one page, but every layer of the production stack underneath it, each in its thinnest working form.

The layers this ticket pierces:

- A statically generated Astro project at the repo root, shipping no UI framework runtime.
- Base layout with minimal header and footer chrome. The header carries the logo mark and the theme toggle; the menu button is out of scope until the pages exist to navigate to.
- Both palettes defined as CSS custom properties, using the token values recorded in the spec.
- The theme system in full: initial palette follows the visitor's OS preference, an explicit toggle overrides and persists it, and the stored preference is applied by a blocking inline script before first paint. A light-mode visitor must never see a dark flash.
- Both typefaces self-hosted and preloaded, covering the Latin and Latin-Extended ranges. No externally hosted fonts — this is what makes the eventual privacy claim true by construction rather than by promise.
- Security headers and a strict content security policy, admitting the one inline theme script by hash rather than by relaxing the policy.
- The production build served locally by the Cloudflare tooling, not by the framework's own preview server, because the headers file is applied by the hosting layer and testing against the framework preview would silently skip every header assertion.
- Deployment on push to the main branch via CI, using an API token held in repository secrets, with pull requests producing preview URLs.
- Any hostname that is not the eventual apex serves a `noindex` header, so a preview copy is never indexed as a competing version of the site.
- The Playwright test seam, running a real browser against the production build, with its first assertions.

The API token creation and the repository secret are the owner's to perform. Produce a wizard for those steps rather than prose instructions, and do not attempt them.

## Design fidelity

The source design is at `docs/design/10 Bit Labs.dc.html`. It is authoritative for how this looks, and **no test in this project can detect drift from it** — these measurements are the only thing holding it in place. Read `docs/design/README.md` first for the canvas template constructs.

This ticket establishes the type system every later ticket inherits, so getting it wrong here is expensive:

- **Body copy is the system stack**, not Space Grotesk: `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif`. Space Grotesk is headings only. JetBrains Mono is labels, buttons, the terminal, and legal/footer blocks.
- Root is `min-height:100vh`, flex column, `background:var(--bg)`, `color:var(--text)`. Global resets: `body{margin:0}` and `a{color:inherit;text-decoration:none}`.

Header:

- Sticky, `padding:22px 28px`, `background:color-mix(in srgb, var(--bg) 90%, transparent)`, `backdrop-filter:blur(8px)`, bottom border `1px solid color-mix(in srgb, var(--border) 40%, transparent)`.
- Logo mark: 28px square, `border-radius:8px`, `var(--bg2)` fill, 1px border, containing two 6×14px bars with `gap:3px` and `border-radius:1.5px` — the first filled with `var(--accent)`, the second outlined `1.5px`. Same motif as the app icon.
- Wordmark "10 Bit Labs" in JetBrains Mono 600 / 15px / `letter-spacing:0.01em`.
- Theme toggle: 44×24px pill, `border-radius:999px`, `var(--bg2)` on a 1px border, with an 18px round `var(--accent)` knob at `top:2px` moving `left:2px` (dark) → `left:22px` (light) on `transition:left 0.2s ease`.

Hero:

- Section `max-width:1100px`, `padding:100px 28px 90px`.
- `// uk software studio` label in JetBrains Mono 13px `var(--textDim)`, `margin-bottom:18px`.
- Terminal window: 1px `var(--border)`, `border-radius:12px`, `var(--bg2)`. Title bar `padding:12px 16px` with three 10px dots at `gap:8px` in `#ff5f56`, `#ffbd2e`, `#27c93f` — these are hardcoded hex on purpose, imitating macOS, and do not change between palettes — followed by `10bitlabs — zsh` in JetBrains Mono 12px `var(--textDim)`.
- Terminal body `padding:40px 32px 46px`, opening with `$ whoami` plus a `▌` cursor in JetBrains Mono 14px `var(--accent)`, `margin-bottom:24px`.
- `h1` in Space Grotesk 600 at `clamp(2.2rem, 5.6vw, 4rem)`, `line-height:1.08`, `letter-spacing:-0.01em`, `max-width:15ch`.
- Sub-paragraph 18px, `line-height:1.6`, `var(--textDim)`, `max-width:52ch`.
- Call to action `./explore-apps →`: `padding:14px 26px`, `var(--accent)` on `var(--accentText)`, `border-radius:8px`, JetBrains Mono 600 / 15px, hover `filter:brightness(1.08)`.

Footer: top border `1px solid color-mix(in srgb, var(--border) 40%, transparent)`, inner `max-width:1100px`, `padding:32px 28px`, JetBrains Mono 12px `var(--textDim)`, reading `// © {year} 10 Bit Labs Ltd`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human — the code is done and verified locally; the remaining three criteria need the owner's Cloudflare and GitHub credentials, via `./scripts/setup-deploy.sh`.

- [x] The hero renders and is legible from a small mobile viewport up to desktop
- [x] Body copy renders in the system stack; only headings use Space Grotesk and only labels, buttons, the terminal and the footer use JetBrains Mono
- [x] The header, logo mark, theme toggle, terminal window, headline and call to action match the measurements recorded above
- [x] Only the weights the design uses are subset and served — Space Grotesk 500/600/700, JetBrains Mono 400/500/600
- [x] Both typefaces load from the site's own origin
- [x] A visitor whose OS is set to light sees the light palette on first paint, with no dark flash
- [x] A visitor whose OS is set to dark sees the dark palette by default
- [x] Toggling the theme persists the choice across a reload
- [x] The page makes zero third-party network requests
- [x] Security headers and the content security policy are present on the served response
- [x] The inline theme script executes rather than being blocked by the policy
- [ ] Pushing to the main branch deploys the site
- [ ] A pull request produces a preview URL
- [x] The preview hostname serves a `noindex` header
- [ ] The test suite runs a real browser against the production build served by the hosting tooling, and runs in CI
- [x] A wizard exists covering the API token and repository secret steps

## Comments

Implemented. `npm test` builds the site and drives a real browser against
`wrangler dev`; 16 assertions pass, and `npm run check` is clean.

Three criteria are ticked only once the owner has run `./scripts/setup-deploy.sh`,
because they need credentials this work is not allowed to create:

- Pushing to the main branch deploys the site
- A pull request produces a preview URL
- The test suite runs in CI

`.github/workflows/deploy.yml` implements all three and its YAML parses, but none
of it has executed — it needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
in repository secrets first. The wizard's last stage deploys once from the owner's
own machine, so that a later CI failure is unambiguously a CI problem rather than
a credentials problem.

Notes for whoever picks up the next ticket:

- The apex itself is not reachable yet. Until the DNS cutover (ticket 03) the site
  only exists at its `workers.dev` URL, which serves `noindex`.
- `wrangler.jsonc` sets `not_found_handling: "404-page"` in advance of the 404
  page arriving with the page set; until then a missing path returns a plain 404,
  which was checked.
- The design's own hero copy says "software products and apps". `CONTEXT.md` lists
  "Product" as a term to avoid for **App**. The design is authoritative for copy
  the ticket does not correct, so it shipped verbatim — but it is worth a decision
  either way before the same phrasing spreads to the about and apps pages.
- The header carries no menu button yet, per this ticket's scope.
