# Source design

The original 10 Bit Labs design, exported from the Claude Design project
`d81e618a-3c67-4b28-9004-29e1c69f80a9` on 2026-08-23.

This is a **reference, not a build input.** Nothing here is compiled, imported or
served. It exists because the design predates this repository and may not outlive
it, and because the marketing site's look and feel is meant to be a faithful port
of it rather than a fresh interpretation.

## Files

- **`10 Bit Labs.dc.html`** — the site design. One file: the markup, plus a
  `Component extends DCLogic` class at the bottom holding the palettes, the nav
  items, the placeholder app list and the page-switching state.
- **`10 Bit Labs Icon.dc.html`** — the 1024×1024 icon mark. Two rounded bars in
  the accent colour on the Crimson background, one solid and one outlined: a "1"
  and a "0". Source for the favicon, the Open Graph image and the 28px header logo.
- **`support.js`** — the Claude Design canvas runtime. Generated, React-based
  editor scaffolding; its own first line says not to edit it. **It is not shipped
  and nothing in the site should reference it.** Kept only so the two `.dc.html`
  files still render if opened in a browser.

## Reading the markup

The `.dc.html` files use canvas template constructs that have no equivalent in the
built site:

- `<x-dc>` wraps the design body.
- `{{expr}}` interpolates a value from `renderVals()`.
- `<sc-if value="{{cond}}">` conditionally renders — the design's six pages are six
  sibling `sc-if` blocks, which is the SPA structure the site deliberately discards
  in favour of real routes.
- `<sc-for list="{{xs}}" as="x">` repeats.
- `style-hover="…"` is the canvas's hover-state attribute, not real CSS.
- `<helmet>` is the canvas's document-head slot.

## Where the built site deliberately differs

Read this before treating the design as literal truth:

- **Fonts** are self-hosted, not loaded from Google Fonts as the `<helmet>` does.
- **Routing** is real URLs per page, not `sc-if` blocks on a `page` state variable.
- **Theme** follows `prefers-color-scheme` and persists an override; the design
  hard-defaults to Crimson and persists nothing.
- **The app list is placeholder** — Tally, Driftnote and Fieldkit are not real
  products. The real seed apps are Plan The Day, Sıra, Fiilo and Pick My Lift.
- **Copy claiming the apps have shipped** ("A few things we've shipped", "Things
  we've built.") is false for a studio whose apps are all in development.
- **App privacy policies** live on this site as generated routes, not "hosted where
  the app is listed" as the design's About and Privacy copy says.

## What the design is authoritative for

Typography scale, spacing, colour tokens, component structure, hover behaviour, and
the terminal/`$`/`//` motif. When the built site and this design disagree on how
something *looks*, this design wins unless the difference is listed above.
