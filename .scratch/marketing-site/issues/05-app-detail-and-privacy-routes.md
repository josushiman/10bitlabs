# 05 — App detail and per-App privacy routes

**What to build:** When an App has something written about it, it gets its own page and its card links there. When it has a privacy policy written, that policy gets its own public URL suitable for pasting into an app store listing. When neither has been written — which is true of all three Apps today — neither route exists, and no visitor is ever shown an empty page.

The conditional behaviour is the point of this ticket, not a detail of it. Routes materialise from content, so an unwritten page cannot be published by accident. This is what makes it safe to add an App to the catalogue months before there is anything to say about it.

Rules:

- A detail route exists if and only if that App's content has a body.
- A card links to its detail page if and only if that route exists.
- A privacy route exists if and only if that App's content has a privacy body.
- Promoting an App from in-development to launched, with a detail page and a privacy policy, is content editing — never plumbing.

Verify by adding a temporary App entry with a body during testing and confirming the route appears, rather than by shipping placeholder content for the three real entries.

**Blocked by:** 04 — App catalogue.

**Status:** ready-for-agent

- [ ] An App with a body has a working detail route
- [ ] An App with no body has no detail route, and requesting one gives the site's own 404 behaviour
- [ ] A card links to its detail page only when that page exists
- [ ] An App with a privacy body has a working, publicly reachable privacy route
- [ ] An App with no privacy body has no privacy route
- [ ] No placeholder or empty detail page ships for any of the three current entries
- [ ] Adding a body to an existing content file is sufficient to make its page appear
