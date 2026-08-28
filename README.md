# 10 Bit Labs marketing site

The public site for 10BIT LABS LTD, trading publicly as 10 Bit Labs, at [10bitlabs.co.uk](https://10bitlabs.co.uk).
A statically generated [Astro](https://astro.build) project deployed to Cloudflare
Workers static assets.

Vocabulary is in [`CONTEXT.md`](CONTEXT.md); the hosting decision and its rejected
alternatives are in [`docs/adr/0001-cloudflare-workers-static-hosting.md`](docs/adr/0001-cloudflare-workers-static-hosting.md).

## Working on it

```bash
npm install
npm run dev      # Astro dev server, fast feedback
npm run check    # typecheck
npm test         # builds, serves with wrangler, drives a real browser
```

`npm run dev` is for iterating on markup and styles only. It does **not** apply
`_headers`, so the security headers and the CSP are absent there. Anything
touching headers has to be looked at through `npm run build && npm run serve`,
which is what the test suite does.

## How the pieces fit

- **Fonts** are vendored into `public/fonts/` by `scripts/fetch-fonts.mjs`, which
  also generates `src/styles/fonts.css`. The site never talks to Google at
  runtime — that is what makes the privacy claim true by construction.
- **Headers** are generated into `dist/_headers` by `scripts/emit-headers.mjs`
  after every build. It hashes the inline theme script out of the built HTML, so
  the CSP admits that one script by hash and nothing has to be relaxed. It fails
  the build if a second inline script appears.
- **The theme** is resolved by a blocking inline script in `<head>` before first
  paint, which is what stops a light-mode visitor seeing a dark flash. The
  palettes live in `src/styles/global.css`.
- **Design fidelity** is carried by the measurements in each ticket's acceptance
  criteria and by review against `docs/design/`. No test can detect visual drift —
  see the Testing Decisions section of the spec.

## Deploying

Pushing to `main` deploys. A pull request uploads a preview version and comments
its URL. Every hostname that is not the apex serves `X-Robots-Tag: noindex`, so a
preview copy is never indexed as a competing version of the site.

The credentials CI needs are the owner's to create. Run the wizard:

```bash
./scripts/setup-deploy.sh
```

It walks through the Cloudflare account ID, the deploy token, the GitHub
repository secrets, and a first deploy from your own machine. That first deploy is
also the escape hatch if CI is broken:

```bash
npm run build && npx wrangler deploy
```

## The domain, and the mailbox sharing it

`10bitlabs.co.uk` carries `hello@10bitlabs.co.uk`, an iCloud+ custom domain
mailbox that predates this repository. Five DNS records keep it working, and the
site must never be allowed to disturb them —
[`docs/dns/README.md`](docs/dns/README.md) is the record inventory, the reasons
each one matters, and the rollback.

Binding the apex and redirecting `www` are the owner's to drive. Run the wizard:

```bash
./scripts/cutover-domain.sh
```

It expects `./scripts/setup-deploy.sh` to have run first, because it deploys the
Worker before pointing the domain at it.

Whatever can be checked from outside is checked by one command, which asserts the
delegation, all five mail records, the absence of Cloudflare Email Routing, the
apex, the `www` redirect and the preview host's `noindex`:

```bash
./scripts/verify-cutover.sh
```

Neither DNS nor mail is reachable from the Playwright seam, and the spec rules out
pretending otherwise. That script is what stands in place of a test, and the two
mail checks — a message arriving, and a message sent passing DKIM and SPF at the
recipient — have no automated substitute at all.
