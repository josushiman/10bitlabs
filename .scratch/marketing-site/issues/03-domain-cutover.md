# 03 — Domain cutover: the site serves on its own domain

**What to build:** The company's domain serves the site at its apex, `www` redirects there, and the owner's existing mailbox keeps receiving and sending mail throughout.

Deliberately sequenced early. The instinct is to protect the domain until the site is finished, but that is backwards: if the cutover disturbs mail, it should be discovered while the site is a single page and rolling the nameservers back costs nothing — not on the day everything else is ready. The public downside is thin, because the domain currently serves nothing at all, so one honest page is an improvement.

The zone must sit on the hosting provider's nameservers for a custom domain binding; there is no shortcut that leaves DNS where it is. Registration stays with the current registrar and only nameservers move.

The mailbox is an iCloud+ custom domain mailbox. That is **five** DNS records, not one: two mail exchanger records, a sender policy record, **one** signing record, and a provider verification record. All five must exist on the new nameservers **before** the switch, not after.

~~two signing records~~ — corrected during implementation. This ticket said two, which does not add up to the five it also claims, and Apple publishes a single key. The spec was corrected in 2048268; this line had been left behind.

Required order, and the order is the ticket:

1. Export the complete current record set from the registrar.
2. Create the zone at the hosting provider and recreate every existing record, mail included.
3. Only then change nameservers at the registrar.
4. Verify mail in both directions before calling the cutover done.

**The provider's own email routing feature must not be enabled at any point.** It installs its own mail exchanger records and would take delivery away from iCloud. An earlier draft of this plan recommended it, on the mistaken assumption that no mailbox existed. That recommendation is withdrawn and recorded here so it is not reintroduced.

The nameserver change at the registrar and any mail re-verification are the owner's to perform. Produce a wizard; do not attempt them.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** done

- [~] The complete pre-existing record set is exported and stored before anything changes — not satisfiable as written; see Comments
- [x] All five mail records exist at the new provider before nameservers are switched
- [x] The apex domain serves the site
- [x] `www` returns a permanent redirect to the apex
- [x] The apex is the canonical hostname; preview hostnames still serve `noindex`
- [x] A test message sent to the mailbox arrives after cutover
- [x] A test message sent from the mailbox is delivered and passes sender authentication after cutover
- [x] The provider's email routing feature is confirmed disabled
- [x] A wizard exists covering the registrar and re-verification steps
- [x] A rollback note records how to revert nameservers if mail breaks

## Comments

Everything not needing the owner's dashboards is built and committed. The two
live steps and both mail tests are stages in `./scripts/cutover-domain.sh`.

The zone was **already on Cloudflare** when this ticket was picked up, with all
five iCloud records in place and the delegation active. Cloudflare's own record
of what it replaced names `ns21`/`ns22.domaincontrol.com`, so the nameserver
move — step 3 of the required order — has happened. The ticket was written
expecting to perform it; what was left was everything either side of it.

What is verifiably true right now, asserted by `./scripts/verify-cutover.sh`
rather than by eye:

- The delegation is Cloudflare's.
- Both Apple mail exchangers, the SPF record, the `apple-domain` verification
  record and the `sig1._domainkey` CNAME are present, and the DKIM name answers
  with a CNAME rather than addresses — it is DNS only, not proxied.
- No `mx.cloudflare.net` exchanger exists, which is how Email Routing would
  announce itself if it were ever enabled. The script fails if one appears.

What is not done, and why each is left:

- ~~**The apex serves nothing.**~~ Done. The binding was refused until the old
  `A`/`AAAA` records at the apex were deleted — Cloudflare will not manage a
  hostname that already carries records it did not create. The wizard now walks
  that deletion, and is explicit that it does not touch the mailbox.
- ~~**`www` does not redirect.**~~ Done, via an `AAAA www 100::` record and a
  zone redirect rule. It had been a proxied `CNAME` to the apex, which cannot
  work now the apex is a Worker Custom Domain: that hands `www` an origin which
  is Cloudflare, and the request loops rather than redirecting. Worth recording
  that `dig` reported `A` and `AAAA` answers for that name throughout — proxied
  records answer with Cloudflare's addresses rather than their contents, so the
  BIND export, not `dig`, is what establishes a record's type. The export is now
  kept at `docs/dns/export-2026-08-23-cloudflare.txt` for that purpose.
- ~~**The outbound mail test.**~~ Done. A message from `hello@10bitlabs.co.uk`
  to Gmail, 2026-08-23 13:51, delivered in 15 seconds, reporting `SPF: PASS`,
  `DKIM: PASS with domain 10bitlabs.co.uk` and `DMARC: PASS`. The DKIM pass is
  the one that mattered: it is the property a proxied signing record would have
  broken silently, visible to the recipient and to nobody else. `DMARC: PASS` is
  incidental but welcome — it says the GoDaddy-inherited `p=quarantine` policy is
  not quietly costing the mailbox anything.
- ~~**The inbound mail test.**~~ Confirmed by the owner: a message sent to the
  mailbox arrives.
- ~~**Email routing confirmed disabled.**~~ Confirmed by the owner in the
  dashboard, which is the only place the switch is visible. The verify script
  independently proves no Cloudflare mail exchanger is published, and will fail
  if one ever appears.
- **Email routing confirmed disabled.** The verify script proves no Cloudflare
  mail exchanger is published, which is what actually decides delivery — but the
  feature can be enabled and unconfigured and still leave the Apple records
  standing, and only the dashboard shows that. Inferring the switch from the
  records would be claiming a confirmation the method cannot give, so the
  criterion stays open and the dashboard check is part of stage 4.
- **The complete export — the one criterion this ticket cannot satisfy.** `docs/dns/snapshot-2026-08-23.txt` is committed, but
  it is a witness rather than an export: `dig` can only ask about names it
  already knows, and a proxied record answers with Cloudflare's addresses
  instead of its own content. The authoritative BIND file is a download, and it
  is stage 1. Ticking this criterion off a `dig` sweep would be claiming a
  completeness the method cannot deliver. Worse for this particular criterion:
  the snapshot was taken after the delegation had already moved, so it witnesses
  the Cloudflare zone rather than the GoDaddy one it was copied from. The real
  "before anything changes" state survives only in GoDaddy's retained zone, and
  exporting it is the first thing stage 1 does.

Two corrections worth carrying forward:

- This ticket said the mailbox needs **two** signing records. It does not — Apple
  publishes `sig1` only, and there is no `sig2._domainkey` to find. The count
  also contradicted the ticket's own "five". The spec had already been fixed in
  2048268; this file had not. Corrected above and asserted in the verify script,
  which checks `sig1` and never looks for a second.
- The apex Custom Domain is deliberately **not** declared in `wrangler.jsonc`.
  Declaring it as `"routes": [{ "pattern": "10bitlabs.co.uk", "custom_domain":
  true }]` is the obvious move and it was tried; it makes `wrangler dev` serve
  every local request as though it arrived at the apex. Since the apex is the
  one hostname exempted from `X-Robots-Tag`, the exemption then covers
  everything locally, and `tests/headers.spec.ts` stops describing production —
  it failed on the preview-host assertion, which is how this was found. The
  binding is made once against the zone instead, and the trap is recorded in
  `wrangler.jsonc` so the next person does not re-introduce it.

The wizard's stages follow this ticket's mandated order, including the part of
it that is easy to lose: mail verification is stage 4, directly after the
nameserver switch, ahead of binding the apex and adding the `www` redirect. An
earlier draft had it last, which reads as tidier — site first, then check the
mail — but it puts two apex-record rewrites between the risky step and the check
that would catch it. The whole reason this ticket was sequenced early was to make
mail breakage cheap to find.

The DMARC record is untouched. It is a sixth record inherited from GoDaddy,
reporting to `dmarc_rua@onsecureserver.net` — GoDaddy's address, not anywhere the
owner reads. Changing a DMARC policy in the same window as a nameserver move
would make any resulting mail problem impossible to attribute, so it was left
exactly as found and noted in `docs/dns/README.md` instead.

Unrelated but visible from here: the `workers.dev` preview host currently fails
its TLS handshake, which is consistent with a certificate still being issued for
a subdomain first used earlier today. The verify script reports it as a warning
rather than a failure for that reason. If it is still failing in a day it is
ticket 02's problem, not this one's.

## Closing note

Closed with nine of ten criteria met and the tenth marked `[~]` rather than
ticked, because it cannot be met and never will be: "the complete pre-existing
record set is exported and stored **before anything changes**" needed doing
before the delegation moved, and the delegation had already moved before this
ticket was picked up. `docs/dns/export-2026-08-23-cloudflare.txt` is the complete
record set, but it witnesses the Cloudflare zone rather than the GoDaddy one it
was copied from, so it is not the thing this criterion asked for.

The practical consequence is small and worth stating so nobody goes looking for
it later. GoDaddy's retained zone still holds the pre-cutover state — delegating
away does not delete it — so the rollback in `docs/dns/README.md` works
regardless, and rollback was the reason the criterion existed. What is genuinely
lost is the contents of the apex `A`/`AAAA` records that were deleted to make
room for the Custom Domain, since they were proxied and no snapshot could see
through that. They pointed at a dead origin and nobody will ever want them back.

The criterion is left visible rather than deleted. A cutover checklist that
quietly drops the step it failed to take is worse than one that admits it.

What this ticket leaves behind for the rest of the work:

- The site is live at `10bitlabs.co.uk`, `www` 301s to it, and the apex is the
  canonical, indexable hostname. Every other hostname still serves `noindex`.
- The mailbox is intact in both directions, with DKIM and DMARC passing.
- `./scripts/verify-cutover.sh` re-checks all of that in one command. It is worth
  running after anything that touches DNS, and it is the only guard the site has
  against a change that breaks mail — no test in the suite can see any of it.
