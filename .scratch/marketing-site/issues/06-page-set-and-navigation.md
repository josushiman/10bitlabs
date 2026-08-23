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

The design already carries the real company details — 10 Bit Labs Ltd, registered in England and Wales, company number 17378712, registered address 13 Dunmow Close, Loughton, IG10. Use them; they are not placeholders.

There is **no 404 page in the design**, so it is being invented. Build it from the vocabulary already established: a `//` section label, a Space Grotesk heading, and a JetBrains Mono link home in the `$`/`./` command style used elsewhere.

**Copy correction.** The design's About and Privacy pages both state that each app's privacy policy is "hosted where the app is listed — App Store, Google Play, or its own website." This site generates per-app privacy routes instead (ticket 05), which is one of the reasons it exists. Rewrite both passages so they describe policies published here.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** ready-for-agent

- [ ] About, contact, privacy and legal each respond at their own URL with a distinct title and description
- [ ] Each page matches the width, padding and type scale recorded above
- [ ] The menu overlay matches the design, including the two-bar menu button and the `$`-prefixed items
- [ ] Neither the About nor the Privacy page says app privacy policies are hosted elsewhere
- [ ] An unknown path renders the site's own 404 page with a route back, built from the site's existing visual vocabulary
- [ ] The legal page carries company name, company number, place of registration and registered address
- [ ] The contact page offers a working email link and no form
- [ ] Every navigation item is a real link and works with the browser's back button
- [ ] The menu opens and closes by keyboard alone
- [ ] The menu button reports its open or closed state to assistive technology
- [ ] Focus is trapped within the open menu
- [ ] Escape closes the menu and returns focus sensibly
- [ ] Decorative section labels are not announced by screen readers
- [ ] Contrast requirements are met in both palettes
- [ ] Every page still makes zero third-party network requests
