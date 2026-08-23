# 10 Bit Labs

The marketing site for 10 Bit Labs Ltd — the studio's public face, and the place its apps' legal and privacy pages are served from.

## Language

**Studio**:
10 Bit Labs Ltd — a company that designs, builds and publishes its own apps. Not an agency, and not available for hire.
_Avoid_: Agency, consultancy, shop

**App**:
A published or in-development app of the studio, with its own audience, store listing and privacy policy. The core entity of the site.
_Avoid_: Product, project, title

**App privacy policy**:
The policy for one App, written as `src/content/apps/<slug>.privacy.md` and published at `/apps/<slug>/privacy` — the URL that goes into that App's store listing. Separate from the site's own privacy page, which covers this site. Writing the file is what publishes the route; there is none until then.
_Avoid_: Privacy page (that is the site's own), legal page

**App detail page**:
The page about one App, at `/apps/<slug>`, which exists only once that App's content file has a body. An App with nothing written about it has no detail page, and its card is not a link.
_Avoid_: App page, product page, landing page

**Marketing site**:
This repository's site — a six-page site with a navigation menu, an app catalogue, and a real URL per page. The term replaces "holding page", which understated the site and misled early planning away from the real URLs an app store listing needs.
_Avoid_: Holding page, landing page, brochure site
