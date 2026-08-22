# 07 — Home page completion

**What to build:** A visitor landing on the home page can, in one scroll, understand what the Studio is, see the Apps it is building, follow how it works, and find out how to get in touch.

The walking skeleton delivered the hero. This ticket adds the remaining sections from the design, in order:

- **Featured Apps** — the same App cards as the catalogue, rendered from the same content model rather than duplicated, with a route through to the full catalogue.
- **What we do** — the three numbered steps: idea, build, launch.
- **About teaser** — the short positioning paragraph, with a link through to the full about page. This is where the Studio states it publishes its own products rather than working for hire, which is the single most useful sentence on the site for filtering out enquiries it would decline.
- **Contact call to action** — the closing section with the email address.

Because all three Apps are in development, the featured section shows three unlinked cards. That is the honest picture of a new studio and reads better than an empty page or an omitted section.

Nothing here should re-implement card rendering. If the featured section and the catalogue drift apart visually, the model has been duplicated rather than reused.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet. 04 — App catalogue.

**Status:** ready-for-agent

- [ ] The home page renders hero, featured Apps, what-we-do, about teaser and contact sections in the design's order
- [ ] Featured Apps render from the App content model, not from duplicated markup
- [ ] The featured section links through to the full catalogue
- [ ] The about teaser links through to the about page
- [ ] The contact section offers a working email link
- [ ] Adding or changing an App updates both the home page and the catalogue with no separate edit
- [ ] The page is legible and correctly laid out from small mobile through to desktop
- [ ] The page still makes zero third-party network requests
