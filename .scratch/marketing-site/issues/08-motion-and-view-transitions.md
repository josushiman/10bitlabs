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

**Status:** done

- [x] Navigating between pages animates rather than flashing white
- [x] An App card transitions into its detail page where such a page exists
- [x] The theme toggle still works after navigating between pages
- [x] The menu still opens, traps focus and closes on Escape after navigating between pages
- [x] The theme preference survives navigation without a flash of the wrong palette
- [x] Under reduced-motion preference, the terminal cursor does not blink
- [x] Under reduced-motion preference, page transitions and hover effects are instant
- [x] The browser back button still works throughout
- [x] Every page still makes zero third-party network requests

## Comments

### Decisions made while implementing

- **Astro's `ClientRouter`, wrapped in `src/components/PageTransitions.astro`.**
  The router itself is a few lines; everything around it is the footgun this
  ticket named. The component holds the router and the two things a swap would
  otherwise lose, so there is one file to read when navigation misbehaves.
- **No `transition:*` directives anywhere.** Astro implements them by pushing a
  raw `<style>` element into the head, and this site's policy is `style-src
  'self'` with no `'unsafe-inline'` — every one of those would be refused, and
  the site would silently lose its shared element. The name is a plain rule in
  `global.css` against a `data-shared-title` attribute instead, and JavaScript
  decides which single element wears it.
- **The shared element is the App's name, not the whole card.** A card is a
  bordered tile on a wash; the detail page has no counterpart to morph it into.
  The name is the one thing genuinely present on both sides, and watching it
  travel from the card up to the page heading is what makes arriving continuous
  with leaving. Both sides are found by `data-app-title="<slug>"`.
- **Both sides get named, or neither.** A view transition name with nothing to
  pair against still animates — as a second fade competing with the page's — so
  the pairing is only set up once both documents are in hand and both actually
  carry the heading. That is why the work hangs off the router's loader rather
  than off `astro:before-preparation` directly: the loader is the one moment
  where the incoming document exists and the outgoing page has not yet been
  photographed. It is also what makes the back button animate the detail page's
  heading back down into its card, with no extra code for the reverse.
- **The palette is carried across at `astro:before-swap`.** The swap replaces
  every attribute on `<html>` with the incoming document's, and that document
  has never had the blocking theme script run against it — so without this the
  palette snaps back to the OS preference on the first navigation. Reading it at
  swap time rather than when the fetch finished also means a visitor who hits the
  toggle while the next page is still loading keeps their choice.
- **Every control is bound on `astro:page-load`, and immediately as well.** The
  bundled scripts are not re-run after a swap, but the button they were listening
  to has been replaced. Binding on both, deduplicated through a `WeakSet` of the
  elements themselves, means the controls also survive the router failing to load
  at all. The menu's keyboard trap is the exception: it listens on the document,
  which a swap leaves alone, and looks its elements up when it needs them.
- **Prefetch stays on.** It was going to be turned off on the assumption that
  `<link rel="prefetch">` is refused under `default-src 'none'`. Measured against
  a real build, Chromium raises no violation and the fetch goes through — so the
  assumption was wrong and the restriction was dropped. A test now walks a
  navigation watching the console, because a refused prefetch would otherwise be
  invisible.
- **Reduced motion was already half-built.** Tickets 06 and 07 had gated the
  cursor blink and the card hover behind `prefers-reduced-motion`. This ticket
  adds the page transitions, and puts numbers on the existing two: the cursor's
  1s step-end square wave, and the card's 0s transition and absent lift under a
  reduced-motion preference, are now asserted rather than assumed.

### Notes for whoever picks up the next ticket

- Navigation no longer reloads the document. Anything new that binds a listener
  to an element inside `<body>` has to bind on `astro:page-load`, or it will work
  on first load and silently stop working after the first navigation. Both
  `Header.astro` and `MenuOverlay.astro` show the shape.
- A new route needs nothing done to it to take part in the cross-fade. A new
  shared element does: give the two elements a matching `data-` hook, and teach
  `PageTransitions.astro` which pair of URLs it sits between.
- `tests/motion.spec.ts` measures the transition by wrapping
  `document.startViewTransition` and timing its `finished` promise, which is the
  only way to tell a cross-fade from an instant cut from outside the browser.
  Note that `addInitScript` runs in a fresh context per document, so a counter
  written there cannot detect a reload — the spec leaves a marker on `window`
  after `goto` instead.
