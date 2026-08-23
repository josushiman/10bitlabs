# 08 — Motion and view transitions

**What to build:** Moving between pages feels continuous rather than a hard cut with a white flash — and for anyone who has asked their operating system for reduced motion, every animation on the site becomes an instant cut instead.

The source design was a single-page application, so navigation cost nothing visually. Moving to real URLs bought bookmarkable, indexable, shareable pages and gave up that seamlessness. This ticket buys it back: same-origin navigation is intercepted and animated, with a cross-fade between pages and one shared-element transition where an App card becomes its detail page's header.

The known footgun, which is the main risk in this ticket: because navigation no longer reloads the document, the theme toggle and menu behaviour must be re-bound on the router's page-load lifecycle rather than assuming a single page load. Forgetting this leaves a site whose controls work on first load and silently stop working after the first navigation.

The reduced-motion pass covers the whole site, not just the new transitions:

- The terminal cursor blinks indefinitely in the source design, in two places. An unbounded blink is an accessibility problem for some vestibular and attention conditions. Keep the effect for everyone who has not asked for less motion, and render a solid block for those who have.
- Card hover transforms and transitions are gated the same way.
- Page transitions collapse to instant cuts.

## Design fidelity

The motion values in `docs/design/10 Bit Labs.dc.html`, all of which this ticket must preserve for visitors who have not asked for reduced motion:

- Cursor blink: `@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}` at `1s step-end infinite` — a hard on/off square wave, not a fade. It appears twice: after `$ whoami` in the hero and after the contact section's mail address.
- Card hover: `transform:translateY(-2px)` plus a border-colour shift, on `transition: transform 0.15s ease, border-color 0.15s ease`.
- Theme toggle knob: `transition:left 0.2s ease`.
- Nav item hover: `opacity:0.65`. Text-link hover: `opacity:0.7`. Primary button hover: `filter:brightness(1.08)`. Footer link hover: colour to `var(--text)`.

The cross-fade and the shared-element card-to-detail transition have no design precedent — the design is an SPA that swaps blocks with no animation at all. Keep them subdued enough to sit alongside the 0.15s/0.2s vocabulary above rather than introducing a slower, showier one.

**Blocked by:** 06 — The rest of the page set, reachable via the menu. 07 — Home page completion.

**Status:** ready-for-agent

- [ ] Navigating between pages animates rather than flashing white
- [ ] An App card transitions into its detail page where such a page exists
- [ ] The theme toggle still works after navigating between pages
- [ ] The menu still opens, traps focus and closes on Escape after navigating between pages
- [ ] The theme preference survives navigation without a flash of the wrong palette
- [ ] Under reduced-motion preference, the terminal cursor does not blink
- [ ] Under reduced-motion preference, page transitions and hover effects are instant
- [ ] The browser back button still works throughout
- [ ] Every page still makes zero third-party network requests
