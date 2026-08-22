# 02 — Walking skeleton: the hero, live on the internet

**What to build:** A visitor can load a real URL on the internet and see the home page's hero — the terminal window, the headline, the sub-paragraph — rendered in the studio's own typography, in the palette matching their operating system preference, with a working theme toggle, and with no request leaving the origin.

This is the project's tracer bullet. It is deliberately **narrow in content and complete in depth**: one section of one page, but every layer of the production stack underneath it, each in its thinnest working form.

The layers this ticket pierces:

- A statically generated Astro project at the repo root, shipping no UI framework runtime.
- Base layout with minimal header and footer chrome. The header carries the logo mark and the theme toggle; the menu button is out of scope until the pages exist to navigate to.
- Both palettes defined as CSS custom properties, using the token values recorded in the spec.
- The theme system in full: initial palette follows the visitor's OS preference, an explicit toggle overrides and persists it, and the stored preference is applied by a blocking inline script before first paint. A light-mode visitor must never see a dark flash.
- Both typefaces self-hosted and preloaded, covering the Latin and Latin-Extended ranges. No externally hosted fonts — this is what makes the eventual privacy claim true by construction rather than by promise.
- Security headers and a strict content security policy, admitting the one inline theme script by hash rather than by relaxing the policy.
- The production build served locally by the Cloudflare tooling, not by the framework's own preview server, because the headers file is applied by the hosting layer and testing against the framework preview would silently skip every header assertion.
- Deployment on push to the main branch via CI, using an API token held in repository secrets, with pull requests producing preview URLs.
- Any hostname that is not the eventual apex serves a `noindex` header, so a preview copy is never indexed as a competing version of the site.
- The Playwright test seam, running a real browser against the production build, with its first assertions.

The API token creation and the repository secret are the owner's to perform. Produce a wizard for those steps rather than prose instructions, and do not attempt them.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The hero renders and is legible from a small mobile viewport up to desktop
- [ ] Both typefaces load from the site's own origin
- [ ] A visitor whose OS is set to light sees the light palette on first paint, with no dark flash
- [ ] A visitor whose OS is set to dark sees the dark palette by default
- [ ] Toggling the theme persists the choice across a reload
- [ ] The page makes zero third-party network requests
- [ ] Security headers and the content security policy are present on the served response
- [ ] The inline theme script executes rather than being blocked by the policy
- [ ] Pushing to the main branch deploys the site
- [ ] A pull request produces a preview URL
- [ ] The preview hostname serves a `noindex` header
- [ ] The test suite runs a real browser against the production build served by the hosting tooling, and runs in CI
- [ ] A wizard exists covering the API token and repository secret steps
