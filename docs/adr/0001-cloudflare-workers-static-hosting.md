---
status: accepted
---

# Cloudflare Workers static assets for hosting

The marketing site needs free hosting on the apex domain `10bitlabs.co.uk`, serving static output with custom security headers. We chose **Cloudflare Workers with static assets**: static asset requests are served without Worker invocation cost, so the site is free at this scale, and the site is treated as a seed rather than a terminal state — when it later needs a server-side endpoint, that arrives as a route on the existing Worker rather than as a migration to a new host.

## Rejected alternatives

- **GitHub Pages** — free and simple, but serves no custom headers, so the site's CSP could not ship, and it has no path to server-side code without moving hosts.
- **Netlify** — supports custom headers and functions, but its free tier is a commercial allowance that can change under a project with no revenue, and it puts a second vendor between the domain and the site.

## Consequences

The zone must sit on Cloudflare nameservers for a Worker Custom Domain binding — there is no CNAME-only route. Registration stays at GoDaddy; only the nameservers move. That brings the existing iCloud+ mailbox's DNS records onto Cloudflare too, and so: **Cloudflare Email Routing must never be enabled on this zone** — it installs its own MX records and would take mail delivery away from iCloud.

Once DNS, mail and CI all point at this choice, unwinding it is expensive, which is what earns it an ADR.
