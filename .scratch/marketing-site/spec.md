# Spec: 10 Bit Labs marketing site

Status: ready-for-agent

## Problem Statement

10 Bit Labs Ltd is a registered UK company with no web presence. The domain `10bitlabs.co.uk` is registered at GoDaddy and has a working mailbox (`hello@10bitlabs.co.uk`, iCloud+ custom domain), but nothing is served at the domain itself.

This causes several concrete problems:

- Anyone who hears the company name and looks it up finds nothing, which reads as either defunct or not real.
- The company has three apps in development. When any of them reaches an app store, the store listing will require a working privacy policy URL, and there is nowhere to host one.
- A UK company that trades via a website must publish its registered name, company number and place of registration. There is no surface on which to do that.
- The company's own positioning — a studio that builds and publishes its own products, rather than an agency working for hire — is not stated anywhere a person can read it.

A design exists (produced in Claude Design) but has never been implemented. It is not the "holding page" it was originally described as: it is a six-page marketing site with a navigation menu, a light/dark theme toggle and an app catalogue.

## Solution

Build and ship the designed site as a statically generated Astro project, deployed to Cloudflare Workers static assets at `10bitlabs.co.uk`, at zero hosting cost.

From a visitor's perspective:

- `10bitlabs.co.uk` shows the studio's positioning, what it does, and the apps it is building.
- Every section of the site is a real, linkable, indexable URL — `/apps`, `/about`, `/contact`, `/privacy`, `/legal` — so a privacy policy or company details page can be linked from an app store listing, an email signature, or a Companies House filing.
- The site respects the visitor's operating system light/dark preference on first paint, and remembers an explicit override.
- The site makes **no third-party network requests whatsoever**. No analytics, no tracking, no externally hosted fonts. This makes the claims on the `/privacy` page literally true and removes any need for a cookie banner.
- Navigation between pages animates rather than hard-cutting, preserving the feel of the original design, and collapses to instant cuts for anyone who has asked their OS for reduced motion.

From the owner's perspective, adding a new app — or promoting an app from "in development" to shipped with its own detail page and privacy policy — is a matter of writing one content file, with no plumbing changes.

## User Stories

### Discovering the studio

1. As someone who has just heard the company name, I want `10bitlabs.co.uk` to load a real site, so that I can tell the company exists and is active.
2. As a prospective collaborator, I want to read what the studio actually does on the home page, so that I can tell within seconds whether it is relevant to me.
3. As a prospective collaborator, I want to understand that 10 Bit Labs builds its own products rather than taking contract work, so that I do not waste time sending an enquiry it will decline.
4. As a visitor, I want an "about" page with more depth than the home page summary, so that I can decide whether I trust the studio.
5. As a visitor on a phone, I want the site to be fully legible and usable at a small viewport, so that I do not have to pinch and zoom.
6. As a visitor on a slow connection, I want the page to render quickly and without layout shift, so that reading is not disrupted.

### The app catalogue

7. As a visitor, I want to see the apps the studio is working on, so that I can judge the kind of work it does.
8. As a visitor, I want apps that have not launched to be clearly marked as in development, so that I am not misled into looking for something I cannot download.
9. As a visitor, I want an app that has launched to link straight to where I can get it, so that I do not have to search a store myself.
10. As a visitor, I want to know which platforms an app targets before I click, so that I know whether it is relevant to my device.
11. As a visitor interested in one specific app, I want a page dedicated to that app when one exists, so that I can read more than a card's worth about it.
12. As a visitor, I want the app catalogue to never show me an empty or placeholder detail page, so that the site never feels half-built.
13. As the owner, I want to add a new app to the site by writing a single content file, so that maintaining the catalogue does not require touching layout code.
14. As the owner, I want to promote an app from "in development" to launched by editing one field, so that launch day is not a development task.
15. As the owner, I want an app's detail page to come into existence only when I have actually written its content, so that I cannot accidentally publish an empty page.

### Legal and compliance

16. As a UK company director, I want the registered company name, company number and place of registration published on the site, so that the company meets its disclosure obligations.
17. As a person doing due diligence on the company, I want to find the company number easily, so that I can look the company up on the Companies House register.
18. As an app store reviewer, I want a working, publicly reachable privacy policy URL, so that I can approve the app's listing.
19. As a privacy-conscious visitor, I want the site's privacy statement to be accurate, so that I can trust the company with an email.
20. As a visitor in the EU or UK, I want not to be interrupted by a cookie consent banner, so that I can read the site immediately.
21. As the owner, I want the site to make no third-party requests, so that the privacy page's claims are true by construction rather than by promise.

### Contact

22. As an interested visitor, I want an obvious way to contact the studio, so that I can start a conversation.
23. As a visitor, I want the contact route to be a plain email address rather than a form, so that I keep a copy of what I sent and know where it went.
24. As a visitor on a device with a mail client, I want the email address to open my mail app when tapped, so that contacting the studio takes one action.
25. As the owner, I want mail to `hello@10bitlabs.co.uk` to continue arriving in my existing iCloud+ mailbox after the site goes live, so that launching the site does not cost me an email.

### Theme and visual behaviour

26. As a visitor whose OS is set to light mode, I want the site to appear in its light palette on first paint, so that I am not flashed with a dark screen.
27. As a visitor whose OS is set to dark mode, I want the site to appear in its dark palette by default, so that it matches the rest of my environment.
28. As a visitor who prefers a different theme than my OS setting, I want to toggle it, so that I can read the site how I like.
29. As a visitor who has toggled the theme, I want that choice remembered as I move between pages and when I return, so that I do not have to set it repeatedly.
30. As a privacy-conscious visitor, I want my theme preference stored locally and never transmitted, so that remembering it is not tracking.

### Accessibility

31. As a keyboard user, I want to reach and operate every navigation item without a mouse, so that I can use the site at all.
32. As a keyboard user, I want focus to stay inside the navigation menu while it is open, so that I do not tab into content hidden behind an overlay.
33. As a keyboard user, I want Escape to close the navigation menu, so that I am never trapped in it.
34. As a screen reader user, I want the menu button to announce whether the menu is open or closed, so that I know the state of the interface.
35. As a screen reader user, I want navigation items announced as links, so that I know they will take me somewhere.
36. As a screen reader user, I want decorative comment-style section labels not to be read aloud, so that the page is not cluttered with punctuation noise.
37. As a screen reader user, I want the Turkish app name pronounced with Turkish rules rather than English ones, so that the name is intelligible.
38. As a visitor with a vestibular condition, I want the blinking terminal cursor to stop blinking when I have asked my OS for reduced motion, so that the page does not trigger symptoms.
39. As a visitor who has asked for reduced motion, I want page transitions and hover effects to become instant, so that the whole site respects the setting rather than only part of it.
40. As a visitor with low vision, I want text and interface colours to meet contrast requirements in both palettes, so that I can read the site in either theme.

### Turkish content

41. As a Turkish speaker, I want the app name "Sıra" rendered with a correct dotless ı, so that the studio's own product name is not misspelled.
42. As the owner, I want the self-hosted fonts to cover the full Turkish character set, so that future Turkish copy for Fiilo cannot silently break.

### Navigation and page transitions

43. As a visitor, I want the browser back button to work, so that navigation behaves the way every other site does.
44. As a visitor, I want to be able to bookmark or share a link to a specific page, so that I can point someone at exactly what I mean.
45. As a visitor moving between pages, I want a smooth transition rather than a white flash, so that the site feels considered.
46. As a visitor who mistypes a URL, I want a 404 page in the site's own design with a way back, so that I am not dumped on a bare error.

### Search, sharing and identity

47. As a search engine, I want each page to be a distinct indexable URL with its own title and description, so that I can surface the right page for a query.
48. As a search engine, I want a sitemap and robots file, so that I can crawl the site correctly.
49. As a search engine, I want preview and staging copies of the site marked as non-indexable, so that I do not index a duplicate.
50. As someone sharing the site in Slack or iMessage, I want a proper preview card with an image, so that the link does not render bare.
51. As a visitor, I want a favicon that matches the studio's mark, so that the tab is identifiable among many.

### Building, deploying and operating

52. As the owner, I want the site to cost nothing to host, so that a pre-revenue company is not paying for a brochure.
53. As the owner, I want a push to the main branch to deploy the site, so that publishing a copy change does not require my laptop.
54. As the owner, I want a pull request to produce a preview URL, so that I can look at a change before it is live.
55. As the owner, I want the deploy to be reproducible without my machine, so that the site is not hostage to one laptop's setup.
56. As the owner, I want the option to deploy from my laptop as an escape hatch, so that I am not blocked if CI is broken.
57. As the owner, I want the site to be able to grow a server-side endpoint later without changing hosts, so that today's choice does not force a migration.
58. As a future maintainer, I want the project's vocabulary written down, so that I do not have to reverse-engineer what "app" or "studio" means here.
59. As a future maintainer, I want the hosting choice and its rejected alternatives recorded, so that I do not re-litigate it or undo it by accident.
60. As a future maintainer or agent, I want the site's chrome defined once, so that changing the footer does not mean editing six files.

## Implementation Decisions

### Design fidelity

The source design is committed at **`docs/design/`** — the site file, the icon file, the canvas runtime, and a README covering the canvas template constructs and the deliberate deviations. It is reference material; nothing there is compiled or served.

**The design is authoritative for how the site looks.** Where the built site and the design disagree on typography, spacing, colour, component structure or hover behaviour, the design wins unless this spec records an explicit deviation. Those deviations are: real routes instead of the SPA, self-hosted instead of Google-hosted fonts, `prefers-color-scheme` instead of a hard Crimson default, the added in-development card state, the reduced-motion gating, real anchors instead of click handlers, and the two copy corrections below.

This matters more than it looks. The chosen test seam asserts what a visitor receives behaviourally — routes, headers, accessibility, zero third-party requests — and deliberately never asserts on markup. **No test in this suite can detect visual drift from the design.** Fidelity is therefore carried by per-ticket acceptance criteria stating concrete measurements, and by review against `docs/design/`. Anyone tempted to relax those criteria should understand they are the only thing holding the look and feel in place.

### Copy corrections to the design

Two pieces of the design's copy are wrong for the site as specified and are corrected rather than shipped verbatim:

- **The design claims the apps have shipped** — the home section heading reads "A few things we've shipped" and the apps page "Things we've built." All three seed apps are `in-development`. The headings are rewritten to describe what the studio is building. The design's typography, spacing and section structure are unchanged; only the words change.
- **The design says app privacy policies live elsewhere** — both the About and Privacy pages state each app's policy is "hosted where the app is listed — App Store, Google Play, or its own website." This site generates per-app privacy routes instead, which is one of the reasons it exists at all. That copy is rewritten to match.

### Framework and output

- The site is built with **Astro**, configured for fully static output. Astro is not built on React or any other UI framework and ships no framework runtime; it compiles to plain HTML, CSS and JS.
- **No UI framework integration is added.** The two pieces of interactivity — the navigation menu and the theme toggle — are vanilla JavaScript, on the order of twenty lines.
- The Astro project lives at the root of this repository. The repository is not a monorepo.
- The original design is a client-side SPA driven by a `page` state variable that swaps conditional blocks. **This structure is deliberately discarded.** Every page becomes a real route with a real URL.

### Routes

Static routes: home (`/`), apps index, about, contact, privacy, legal, and a 404 page.

Conditional routes: an app detail route and an app privacy route, generated per app. These routes **materialise only when the corresponding content exists**. An app whose content file has no body produces no detail page, and its card in the catalogue renders unlinked. This is the mechanism that guarantees no placeholder pages are ever published.

`www` 301-redirects to the apex domain. The apex is canonical.

### The App content model

Apps are a content collection. Each app entry carries: a name, a slug, badge initials, a short description, a platform label, a status of either `live` or `in-development`, an optional external URL (store or own site), an optional long-form body, and an optional privacy policy body.

Rendering rules driven by this model:

- `status: live` with a URL renders a linked card.
- `status: in-development` renders an unlinked card carrying an "In development" tag. The design has no such state; it is added.
- A body present generates a detail page and makes the card link to it.
- A privacy body present generates a privacy route for that app.

The three seed entries are all `in-development` with placeholder copy, marked with a TODO in the content files:

| Name | Initials | Platform (provisional) | Description |
| --- | --- | --- | --- |
| Plan The Day | PTD | iOS & Web | Wedding and event planning, from first idea to the day itself. |
| Sıra | SR | iOS | Score tallying for Okey and Gonga, without the paper and pen. |
| Fiilo | FI | iOS | Turkish vocabulary and verb conjugation, practised in short sessions. |

The home page's featured section shows all three. `Sıra` is marked `lang="tr"` wherever it appears.

### Theme

Two palettes carried over from the design, expressed as CSS custom properties. Recording the token values here because the source design may not outlive this repository:

| Token | Crimson (dark) | Paper (light) |
| --- | --- | --- |
| `bg` | `oklch(0.15 0.012 25)` | `oklch(0.97 0.006 95)` |
| `bg2` | `oklch(0.195 0.014 25)` | `oklch(0.94 0.008 95)` |
| `border` | `oklch(0.32 0.02 25)` | `oklch(0.75 0.01 95)` |
| `text` | `oklch(0.93 0.006 25)` | `oklch(0.22 0.01 95)` |
| `textDim` | `oklch(0.63 0.015 25)` | `oklch(0.45 0.015 95)` |
| `accent` | `oklch(0.68 0.18 25)` | `oklch(0.5 0.15 145)` |
| `accentText` | `oklch(0.14 0.01 25)` | `oklch(0.98 0.005 95)` |

Behaviour, which differs from the design (the design defaults to Crimson always and persists nothing):

- Initial theme follows `prefers-color-scheme`.
- An explicit toggle overrides it and persists to `localStorage`. First-party, non-transmitted, and therefore consistent with the privacy page.
- The stored preference is applied by a small **blocking inline script in the document head**, before first paint. Without this, a light-mode visitor gets a dark flash on every navigation. This is the specific cost of moving from an SPA to a multi-page site and is paid deliberately.
- That inline script is the only inline script on the site, and the CSP allows it by hash rather than by opening up `unsafe-inline`.

### Fonts

Space Grotesk and JetBrains Mono are **self-hosted**, not loaded from Google Fonts. Loading them from Google's CDN transmits every visitor's IP address to a third party and directly contradicts the privacy page's claim of no tracking.

**Neither family sets body copy.** This is easy to get wrong and was stated ambiguously in an earlier draft of this spec. The design's roles are:

| Role | Face |
| --- | --- |
| Body copy, paragraphs, card descriptions | The system stack — `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif` |
| Headings, nav items, app names | Space Grotesk |
| Labels, buttons, nav `$` prefixes, `//` section labels, the terminal, legal and footer blocks | JetBrains Mono |

Only the weights the design uses are subset: **Space Grotesk 500, 600, 700** and **JetBrains Mono 400, 500, 600**.

Both families are subset to **`latin` plus `latin-ext`**. `latin` alone omits U+0130 (İ) and would risk broken glyphs in the studio's own Turkish product names. Served as `woff2` with `font-display: swap`, with the above-the-fold faces preloaded.

Both are SIL Open Font Licence; the licence files ship with the fonts.

### Motion and accessibility

Carried over from the design unchanged where sound, and corrected where not:

- Navigation items become real anchors, not click-handled divs.
- The menu button gains `aria-expanded` and `aria-controls`.
- The open menu gains a focus trap and Escape-to-close.
- Decorative `//`-prefixed section labels are hidden from assistive technology.
- The infinitely blinking terminal cursor is wrapped in `prefers-reduced-motion: no-preference`. An unbounded blink is a WCAG 2.2.2 problem; the effect is kept for everyone who has not asked for less motion.
- Card hover transitions and page transitions are gated the same way.

### Page transitions

Astro's `ClientRouter` is enabled, with a cross-fade and one shared-element transition between an app card and its detail page. Because navigation no longer reloads the document, the menu and theme-toggle listeners must be bound on Astro's page-load lifecycle event rather than assuming a single load. Reduced motion collapses transitions to instant cuts.

### Hosting and deployment

- **Cloudflare Workers with static assets.** Static asset requests are served without Worker invocation cost, so the site is free at this scale, and a server-side endpoint can be added later as a route rather than as a migration. Recorded as an ADR — see below.
- A **Custom Domain** binding puts the site on the apex. The always-on `*.workers.dev` subdomain remains enabled and is used only for pull request previews. Any hostname that is not the apex serves a `noindex` header so a preview copy is never indexed.
- Deployment is a GitHub Actions workflow on push to the main branch, invoking Wrangler with a Cloudflare API token held in repository secrets. Deploying from a developer machine with Wrangler remains available as an escape hatch and is how the first deploy is proved end to end.
- Security headers ship as a `_headers` file applied by Workers static assets: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors, and a strict CSP made possible by there being no third-party origins to allow.
- A sitemap, a robots file, and a build-time generated Open Graph image derived from the studio's icon mark and palette.

### DNS and mail — sequencing matters

The zone must be on Cloudflare nameservers for a Worker Custom Domain; there is no CNAME-only route. Registration stays at GoDaddy and only nameservers move.

`hello@10bitlabs.co.uk` is an existing **iCloud+ custom domain mailbox**. That is five DNS records, not one: two Apple MX records, an SPF TXT record, two DKIM CNAME records, and an Apple domain-verification TXT record. Required order:

1. Export the complete current record set from GoDaddy.
2. Create the Cloudflare zone and recreate **all** existing records, mail records included.
3. Only then change nameservers at GoDaddy.
4. Verify mail in both directions before considering the cutover done.

**Cloudflare Email Routing must not be enabled at any point.** It installs its own MX records and would take delivery away from iCloud. An earlier draft of this plan recommended Email Routing on the assumption no mailbox existed; that recommendation is withdrawn and is recorded here so it is not reintroduced.

### Documentation deliverables

- `CONTEXT.md` at the repo root, seeded with: **Studio** (10 Bit Labs Ltd — designs, builds and publishes its own products; explicitly not an agency and not available for hire), **App** (a published or in-development product with its own audience, store listing and privacy policy; the site's core entity), and **Marketing site** (this repository's site — the term replaces "holding page", which understates a six-page site with a catalogue and materially misled early planning). Glossary only, no implementation detail.
- `docs/adr/0001-cloudflare-workers-static-hosting.md`, recording the hosting decision, with GitHub Pages and Netlify as the considered and rejected alternatives, and the "this is a seed, not a terminal state" reasoning that decided it.

## Testing Decisions

### What makes a good test here

Tests assert what a visitor actually receives, never how it was produced. A test that asserts a component emits a particular element, or that a build artefact contains a particular class name, is testing implementation detail; it breaks on every refactor and catches nothing a user would notice. Every assertion in this suite should be phrasable as a sentence about a person using the site.

### The seam

**One seam: a real browser, driven by Playwright, against `wrangler dev` serving the production build.**

This is the highest available seam and it is deliberately the only one:

- It exercises exactly what a visitor receives — built HTML, real headers, real font files, real Worker asset routing.
- `wrangler dev` rather than Astro's own preview server, because `_headers` is applied by Workers static assets and not by Astro. Testing against Astro's preview would silently skip every header assertion.
- The most important assertion in the suite — that the site makes **zero third-party network requests** — is a network interception in a browser. It cannot be made credibly against files on disk.

No second seam. Asserting on build output separately would duplicate a subset of browser coverage. Component-level tests via Astro's container API would test implementation detail.

The accepted cost: the suite requires a production build before it runs, so it is seconds rather than milliseconds. Build once per test session and run the whole suite against that build.

### What is covered

- Every route responds, and each has a distinct title and meta description.
- An app with no body has no detail route and an unlinked card; an app with a body has both. This is the guarantee against publishing placeholder pages and is the highest-value test in the suite.
- In-development apps display their status and do not link out.
- Zero third-party network requests on every page.
- Company name, number and place of registration are present on the legal page.
- Security headers and CSP are present and correct; the inline theme script executes under the CSP rather than being blocked by it.
- Light OS preference produces the light palette on first paint with no dark flash; an explicit toggle persists across navigation and reload.
- Keyboard: menu opens, traps focus, closes on Escape, and returns focus sensibly.
- `aria-expanded` reflects menu state.
- Under emulated `prefers-reduced-motion: reduce`, the cursor does not blink and transitions are instant.
- The 404 page renders in the site's design for an unknown path.
- Non-apex hostnames serve `noindex`.
- Turkish characters render from the self-hosted subset rather than a fallback face.

### Prior art

None — this is the repository's first code and first test suite. This spec is therefore also the prior art for whatever is tested here next, and the single-seam decision should be held to unless there is a concrete reason to break it.

## Out of Scope

- **Any backend.** No contact form, no API, no database. The contact route is a `mailto:` link, and the design says so in as many words.
- **Analytics.** Explicitly excluded; it is what keeps the privacy page true and the cookie banner absent. Cloudflare Web Analytics is cookieless and could be added later without changing that, but is not part of this work.
- **A CMS.** Content is markdown in the repository.
- **Per-app marketing sites.** Plan The Day may graduate to its own domain later; nothing here should obstruct that, but nothing here builds it.
- **Real app content.** The three entries ship as placeholders pending real copy, real platforms and real store links.
- **Changing the registered office address.** Considered and deliberately declined; the residential registered address stays published as designed.
- **Anything requiring the owner's credentials**: the GoDaddy nameserver change, iCloud+ re-verification, creating the Cloudflare API token, and adding it to GitHub secrets. These are walked through, not performed.
- **A test for the DNS, mail or CI configuration.** Not reachable from the chosen seam or any other. Covered by a manual verification checklist instead. Inventing a test that appears to cover this would be worse than admitting it does not.
- **An automated visual fidelity check.** Screenshot baselines were considered and declined: they would need regenerating on every intentional visual change and are environment-sensitive. Fidelity to `docs/design/` is carried by the concrete measurements in each ticket's acceptance criteria and by review against the design, not by a test. This is a known, accepted gap — every other item in this suite can fail loudly, and this one cannot.

## Further Notes

- The source design lives in a Claude Design project and is readable via the design tooling. It contains the site file, an icon file, and a runtime support file. **The runtime support file is the design canvas's own React-based harness and is not shipped** — it is editor scaffolding. The site's actual logic is the small inline component class in the design file.
- The icon mark is a 1024×1024 artboard: the dark Crimson background with two rounded bars in the accent colour, one solid and one outlined — a "1" and a "0". It is the source for both the favicon and the Open Graph image, and is the same motif as the 28px header logo.
- The original brief described this as a "holding page". It is not, and the mismatch had consequences: it pointed toward a single HTML file and away from the real URLs that an app store privacy policy link requires. The glossary entry for **Marketing site** exists to stop that recurring.
- The DNS cutover is the only step in this work that can break something already in use. It deserves a generated wizard rather than prose instructions, and mail should be verified in both directions before the cutover is called done.
- The platform labels for all three apps are guesses and are the most likely thing in this spec to be wrong.
