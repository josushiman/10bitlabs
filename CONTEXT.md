# 10 Bit Labs

The marketing site for 10BIT LABS LTD — the studio's public face, and the place its apps' legal and privacy pages are served from.

## Language

**Studio**:
10BIT LABS LTD — the incorporated legal entity that designs, builds and publishes its own apps. Not an agency, and not available for hire.
_Avoid_: Agency, consultancy, shop

**Public brand**:
10 Bit Labs — the name used in the site's wordmark and marketing copy. Legal disclosures and agreements name the Studio as 10BIT LABS LTD instead.
_Avoid_: 10 Bit Labs Ltd, 10Bit Labs, 10Bit Labs LTD

**App**:
A published or unreleased app of the studio, with its own audience, store listing and legal documents. The core entity of the site.
_Avoid_: Product, project, title

**App submission**:
The stage where an App is being prepared for or reviewed through an app store's submission process. It is unreleased, but further along than active development.
_Avoid_: Live, launched, in development

**App privacy policy**:
The policy for one App, written as `src/content/apps/<slug>.privacy.md` and published at `/apps/<slug>/privacy` — the URL that goes into that App's store listing. Separate from the site's own privacy page, which covers this site. Writing the file is what publishes the route; there is none until then.
_Avoid_: Privacy page (that is the site's own), legal page

**App terms of service**:
The terms for one App, published at `/apps/<slug>/terms` and separate from the studio's company details. An App has no terms route until its terms have been written.
_Avoid_: Legal page, company terms

**App detail page**:
The page about one App, at `/apps/<slug>`, which exists only once that App's content file has a body. An App with nothing written about it has no detail page, and its card is not a link.
_Avoid_: App page, product page, landing page

**App support**:
The public help offered for one App, covering technical problems, purchase restoration and the boundary between studio support and app-store billing support.
_Avoid_: Customer service portal, helpdesk

**Unlock**:
Sıra's one-time App Store purchase, which removes the three-free-game limit without creating a subscription or changing access to existing matches.
_Avoid_: Premium, subscription, paid tier

**Free game**:
One of the three matches a Sıra user may start before the Unlock is required. It is consumed when the match's first round is scored.
_Avoid_: Trial game, demo game

**Marketing site**:
This repository's site — a six-page site with a navigation menu, an app catalogue, and a real URL per page. The term replaces "holding page", which understated the site and misled early planning away from the real URLs an app store listing needs.
_Avoid_: Holding page, landing page, brochure site
