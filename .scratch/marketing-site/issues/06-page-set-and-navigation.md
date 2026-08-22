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

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** ready-for-agent

- [ ] About, contact, privacy and legal each respond at their own URL with a distinct title and description
- [ ] An unknown path renders the site's own 404 page with a route back
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
