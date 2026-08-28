# 06 — The rest of the page set, reachable via the menu

**What to build:** A visitor can reach every part of the site from the navigation menu, using a mouse, a keyboard or a screen reader, and every destination is a real URL they can bookmark, share or link to from elsewhere.

Pages and the navigation that reaches them are one path through the site, not two separate layers, which is why they are one ticket.

The pages: about, contact, privacy, legal, and a 404 rendered in the site's own design with a way back. The legal page carries the registered company name, company number, place of registration and registered address — after this ticket the Studio meets its disclosure obligation. The contact page is a plain email link and says in as many words that there is no form. The privacy page states that the site uses no analytics or tracking and has no contact form, which by this point is true by construction.

The navigation is the design's full-screen slide-over menu. The source design builds it from click-handled elements with placeholder hyperlink targets; that is replaced with real anchors, which is both an accessibility fix and what makes the browser's back button and link sharing work.

Accessibility work belongs in this ticket rather than a later sweep:

- Navigation items are real links, announced as links.
- The menu button reports whether the menu is open or closed.
- Focus stays inside the open menu, so a keyboard user cannot tab into content hidden behind the overlay.
- Escape closes the menu, and focus returns somewhere sensible.
- Decorative comment-style section labels are hidden from assistive technology rather than read aloud as punctuation.
- Text and interface colours meet contrast requirements in both palettes.

## Design fidelity

From `docs/design/10 Bit Labs.dc.html`.

Menu overlay:

- `position:fixed; inset:0`, `background:color-mix(in srgb, var(--bg) 98%, transparent)`, `backdrop-filter:blur(6px)`, flex column.
- Close control is a `×` in JetBrains Mono at 30px, in a row with `padding:20px 26px` justified to the end.
- Nav list is vertically centred, `padding:0 40px 80px`. Each item is a `$` prefix in JetBrains Mono 20px `var(--accent)`, then the label in Space Grotesk 600 at `clamp(28px, 6vw, 44px)`, `gap:16px`, baseline-aligned, with `padding:16px 0` and a bottom rule of `1px solid color-mix(in srgb, var(--border) 30%, transparent)`. Hover is `opacity:0.65`.
- The current page's label is `var(--accent)`; the others are `var(--text)`.
- Footer of the overlay: `$ mail hello@10bitlabs.co.uk` in JetBrains Mono 13px `var(--textDim)`, `padding:24px 40px 40px`.
- The header's menu button is **two** 22×2px bars at `gap:5px`, not three.

Note the design's menu carries only Home, Apps, About and Contact. Privacy and Company details are reached from the footer. Keep that split unless there is a reason to change it.

Page measurements: About is `max-width:760px` / `padding:80px 28px 100px`; Contact is `max-width:640px` / `padding:120px 28px 140px`, centre-aligned; Privacy and Legal are `max-width:680px` / `padding:100px 28px 120px`. Each opens with its `//` label in JetBrains Mono 13px `var(--accent)` and an `h1` in Space Grotesk 600 — `clamp(2rem, 4.5vw, 3rem)` on About, `clamp(1.8rem, 4vw, 2.6rem)` on Contact, `clamp(1.8rem, 4vw, 2.4rem)` on Privacy and Legal. About's body paragraphs are 18px / `line-height:1.7`; Privacy's are 16px / `line-height:1.7`. The Legal page's details block is JetBrains Mono 14px at `line-height:2`; About's company card repeats it at 13px / `line-height:1.9` inside a `border-radius:12px` box with `padding:24px`.

The design already carries the real company details — 10BIT LABS LTD, registered in England and Wales, company number 17378712, registered address 13 Dunmow Close, Loughton, IG10. Use them; they are not placeholders.

There is **no 404 page in the design**, so it is being invented. Build it from the vocabulary already established: a `//` section label, a Space Grotesk heading, and a JetBrains Mono link home in the `$`/`./` command style used elsewhere.

**Copy correction.** The design's About and Privacy pages both state that each app's privacy policy is "hosted where the app is listed — App Store, Google Play, or its own website." This site generates per-app privacy routes instead (ticket 05), which is one of the reasons it exists. Rewrite both passages so they describe policies published here.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** done

- [x] About, contact, privacy and legal each respond at their own URL with a distinct title and description
- [x] Each page matches the width, padding and type scale recorded above
- [x] The menu overlay matches the design, including the two-bar menu button and the `$`-prefixed items
- [x] Neither the About nor the Privacy page says app privacy policies are hosted elsewhere
- [x] An unknown path renders the site's own 404 page with a route back, built from the site's existing visual vocabulary
- [x] The legal page carries company name, company number, place of registration and registered address
- [x] The contact page offers a working email link and no form
- [x] Every navigation item is a real link and works with the browser's back button
- [x] The menu opens and closes by keyboard alone
- [x] The menu button reports its open or closed state to assistive technology
- [x] Focus is trapped within the open menu
- [x] Escape closes the menu and returns focus sensibly
- [x] Decorative section labels are not announced by screen readers
- [x] Contrast requirements are met in both palettes
- [x] Every page still makes zero third-party network requests

## Comments

### Decisions made while implementing

- **Every internal link now carries its trailing slash.** The assets layer answers
  `/about` with a 307 to `/about/`, which is also the address `<link rel=canonical>`
  names, so a slashless href cost a round trip and handed out a second address for
  a page that already had a canonical one. This was true site-wide before this
  ticket — the hero CTA, the app cards, the detail page's back link and the App
  privacy policy URL that goes into a store listing all had it. All of them are
  fixed, and `tests/navigation.spec.ts` walks every internal href with
  `maxRedirects: 0` so a slashless link cannot come back.

- **The in-development tag's label is `var(--text)`, not `var(--accent)`.** Ticket
  04 built the tag as "the badge tile's exact accent treatment"; measured, accent
  type on the accent's own 14% wash is 3.9:1 in Paper, under 4.5:1. Reducing the
  wash does not rescue it — even at 6% the Crimson palette only just clears — so
  the label takes the readable colour and the wash and edge keep carrying the
  accent. The badge tile's initials keep the accent type because they are
  `aria-hidden` decoration; the tag is text a visitor has to read.

- **`.column` in `global.css`.** Ticket 05 left a note that the shared page column
  was "written five times, not three"; this ticket would have made it nine. The
  centring and the 28px gutter — the parts that must agree page to page — are now
  written once; each page still declares its own max-width and vertical rhythm,
  because the design genuinely records different ones.

- **`SectionLabel.astro`.** The `// something` label opened five sections by hand,
  each repeating the decision to hide the slashes from assistive technology. It is
  one component now, and `tests/pages.spec.ts` asserts the announced text of the
  label carries no `/` at all.

### From the code review

Two axes, Standards and Spec, run against the finished change.

- **The focus trap had a hole, and it was the important finding.** The keydown
  listener was bound to the overlay, so it only heard anything while focus was
  inside the overlay. Click the overlay's own chrome rather than a control and
  focus lands on `<body>`; from there Tab walked into the page behind the blur and
  Escape did nothing. It is bound to the document now, guarded on `menu.hidden`,
  and tabbing from outside the menu comes back in at whichever end the visitor was
  heading for. `tests/navigation.spec.ts` covers it, and the test was confirmed to
  fail against the old binding before the fix landed.

- **`tests/contrast.spec.ts` was exempting visible text.** It skipped anything
  inside `[aria-hidden="true"]`, which quietly excused the `$` prompts and the
  `$ mail ` prefixes — visible type that a sighted visitor has to read. It now
  measures every visible run of text regardless, with one named exemption: the App
  card's monogram tile, which WCAG exempts as a logotype and which says nothing
  the App's name beside it does not. Everything still passes.

- **The fidelity checkboxes were ticked on assertion, not evidence.**
  `tests/design-fidelity.spec.ts` is new and holds the ticket's recorded numbers
  as numbers: each page's max-width, padding and resolved type scale, and the
  overlay's blur, wash, row padding, `$` prompt, 44px label, 16px gap, nav padding,
  mailbox foot and two-bar button.

- **"Product" had drifted into visitor-facing copy.** `CONTEXT.md` rules it out as
  a synonym for **App**; the About and Privacy pages both used it. Rewritten.

- **The registered particulars were written out in four places.** They are
  `src/lib/company.ts` now — facts about the company rather than copy, so a change
  of registered address is one edit.

Two findings were declined. The 404 and Contact pages share a near-identical
centred-column style block, which is real duplication, but the two pages take
their measurements from the design independently and should be free to diverge —
extracting them would couple an invented page to a designed one. And
`SectionLabel`'s `--label-colour` hook was called speculative; it has a caller
(the hero's dim label), which is the whole reason it exists.

### Notes for whoever picks up the next ticket

- `tests/contrast.spec.ts` measures every visible run of text on every route in
  both palettes, reading colours back through a canvas rather than trusting the
  token values — `color-mix` and `oklch` mean the stylesheet does not know what
  the screen gets. Ticket 07's featured section and 08's motion work will be held
  to it automatically; a new route only needs adding to its `ROUTES`.
- The menu is JavaScript-driven, as the design has it. A visitor with JavaScript
  off cannot open it, which is why Privacy and Company details are reached from
  the footer's own `<nav>` rather than only from the overlay.
- `MenuOverlay.astro` finds the button that opens it by `data-menu-button`, which
  lives in `Header.astro`. The overlay is rendered as the header's sibling on
  purpose: the header is a sticky, z-indexed stacking context, and an overlay
  nested inside it could never reliably sit above the page.
