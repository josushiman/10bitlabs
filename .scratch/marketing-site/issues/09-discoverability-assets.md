# 09 — Discoverability assets

**What to build:** Search engines can crawl and index the right pages and only the right pages, a link to the site shared in a chat renders as a proper preview card rather than a bare URL, and the browser tab carries the Studio's own mark.

Four pieces:

- **Sitemap**, enumerating the final route set. Sequenced after the conditional App routes exist so it reflects what is actually published rather than what was planned — an App with no detail page must not appear in it.
- **Robots file**, permitting crawling of the canonical hostname.
- **Favicon**, derived from the Studio's icon mark: a dark background with two rounded bars in the accent colour, one solid and one outlined — a one and a zero, the same motif as the header logo.
- **Open Graph and equivalent card image**, generated at build time from the same icon mark and the site's own palette rather than hand-designed, so it cannot drift from the brand as the palette changes.

Preview hostnames must remain excluded from indexing, so a preview copy is never treated as a duplicate of the real site.

**Blocked by:** 05 — App detail and per-App privacy routes. 06 — The rest of the page set, reachable via the menu.

**Status:** ready-for-agent

- [ ] A sitemap exists listing every published route
- [ ] The sitemap excludes App routes that do not exist
- [ ] A robots file exists and permits crawling of the canonical hostname
- [ ] A favicon derived from the icon mark appears in the browser tab
- [ ] Sharing a link produces a preview card with title, description and image
- [ ] The card image is generated at build time from the icon mark and site palette
- [ ] Preview hostnames still serve `noindex`
- [ ] The card image and favicon are served from the site's own origin, preserving zero third-party requests
