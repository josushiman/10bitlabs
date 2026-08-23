# DNS, and the mailbox that shares the zone

`10bitlabs.co.uk` is registered at GoDaddy and its zone is hosted at Cloudflare.
Registration did not move; only the nameservers did.

The zone carries two things that have nothing to do with each other: the site,
and `hello@10bitlabs.co.uk` — an **iCloud+ custom domain mailbox** that was
working before this repository existed. The mailbox is the reason every change
here is made carefully. A site that is briefly wrong is embarrassing; mail that
is quietly wrong loses messages the sender believes were delivered.

## The mail records — five, and all five matter

| Name | Type | Value | Proxy |
| --- | --- | --- | --- |
| `10bitlabs.co.uk` | MX 10 | `mx01.mail.icloud.com` | n/a |
| `10bitlabs.co.uk` | MX 10 | `mx02.mail.icloud.com` | n/a |
| `10bitlabs.co.uk` | TXT | `v=spf1 include:icloud.com ~all` | n/a |
| `10bitlabs.co.uk` | TXT | `apple-domain=…` | n/a |
| `sig1._domainkey` | CNAME | `sig1.dkim.10bitlabs.co.uk.at.icloudmailadmin.com` | **DNS only** |

Two facts about that table are worth stating plainly, because both have already
misled a draft of the plan:

- **There is one DKIM record, not two.** Apple publishes a single key, `sig1`.
  There is no `sig2._domainkey`; anyone verifying the cutover against a
  two-DKIM-record checklist goes looking for a record that does not exist and
  concludes something is broken when nothing is.
- **The DKIM CNAME must never be proxied.** Proxied, Cloudflare answers that
  name with its own addresses instead of following the CNAME, and the DKIM
  lookup gets an address where it needed a key. Mail still flows, SPF still
  passes, and nothing looks wrong until a recipient checks the signature.
  `scripts/verify-cutover.sh` asserts the answer is a CNAME for this reason.

A sixth record, `_dmarc`, is inherited from GoDaddy and reports to
`dmarc_rua@onsecureserver.net`, which is GoDaddy's reporting address rather than
anywhere the owner reads. It is left exactly as it was: it is not part of the
cutover, and changing a DMARC policy in the same window as a nameserver move
would make any resulting mail problem impossible to attribute.

## Cloudflare Email Routing must stay off

Enabling it installs Cloudflare's own MX records and takes delivery away from
iCloud. An earlier draft of the plan recommended it, on the mistaken assumption
that no mailbox existed. That recommendation is **withdrawn**, and is recorded
here — and in the spec — so that it is not reintroduced by someone reading the
Cloudflare dashboard's own suggestion of it.

`scripts/verify-cutover.sh` fails if a `mx.cloudflare.net` exchanger ever
appears, which is how the mistake would announce itself.

## The site records

The apex is a Worker **Custom Domain**, bound once against the zone by
`scripts/cutover-domain.sh`. Cloudflare writes the apex record when it creates
the binding; it does not touch the mail records.

Binding is refused while the apex still carries records from the old provider —
"already has externally managed DNS records (A, CNAME, etc)". The `A` and `AAAA`
records at the apex have to be deleted first. Nothing else at that name should
be: `MX` and the two `TXT` records share the name but not the type, mail does
not consult an `A` record when `MX` records exist, and `sig1._domainkey` and
`www` are different names altogether.

Delete those two record types with care all the same, because they are proxied
and therefore the one thing no snapshot in this directory can reproduce — see
Snapshots below. Take the export first.

It is deliberately **not** declared in `wrangler.jsonc` as a route, and that is
worth knowing before you "fix" it. Declaring it there —

```jsonc
"routes": [{ "pattern": "10bitlabs.co.uk", "custom_domain": true }]
```

— makes `wrangler dev` serve every local request as though it arrived at the
apex. The apex is the one hostname exempted from `X-Robots-Tag`, so locally the
exemption covers everything, and `tests/headers.spec.ts` stops describing
production. This was measured rather than guessed: the change was made, the
preview-host assertion failed, and it was reverted. The trap is recorded in
`wrangler.jsonc` too, because that is where someone would go to spring it.

`www` is not a Worker route. Bound as one it would *serve* the site, giving the
site two hostnames that both look canonical. Instead it is a proxied record with
a zone redirect rule that 301s it to the apex — set up in
`scripts/cutover-domain.sh`, asserted by `scripts/verify-cutover.sh`.

The record is `AAAA www 100::`, proxied. A redirect rule runs at Cloudflare's
edge before any origin is contacted, so the address exists only to make the
hostname proxiable; `100::` is the IPv6 discard prefix, chosen so that a request
which somehow gets past the rule fails outright rather than reaching something
half-alive. It must **not** be a CNAME to the apex: the apex is a Worker Custom
Domain resolving to Cloudflare's own addresses, so that would give `www` an
origin that is Cloudflare, and it loops instead of redirecting.

The apex is the canonical hostname and is the one hostname that does **not**
serve `X-Robots-Tag: noindex`; every other hostname, including the `workers.dev`
preview, does. That rule lives in `scripts/emit-headers.mjs`.

## Snapshots

`export-2026-08-23-cloudflare.txt` is a BIND export of the Cloudflare zone, taken
the day of the apex binding. It is the record set in its own words rather than
the proxy's, and it is the file to read when you need to know what a record
actually *is* — `www` reads as `A`/`AAAA` to `dig` and is really a proxied
`CNAME`, which is a mistake worth only making once. It is not the pre-cutover
state: the delegation had already moved when it was taken, so GoDaddy's retained
zone remains the only witness to what existed before.


`scripts/dns-snapshot.sh` records what the zone's own nameservers answer, so
that "did anything change?" is a diff and not a memory:

```bash
./scripts/dns-snapshot.sh > docs/dns/snapshot-$(date +%F).txt
```

It is a witness, not an export. `dig` can only ask about names it already knows,
and a proxied record answers with Cloudflare's addresses rather than its own
content, so the snapshot cannot see either an unguessed label or the true origin
behind a proxied one. The authoritative export is the BIND file downloaded from
the DNS provider — the wizard's first stage — kept alongside the snapshots.

One limit of the earliest snapshot in this directory is worth stating, because
it cannot be fixed retrospectively: it was taken **after** the delegation had
already moved to Cloudflare, so it records the Cloudflare zone rather than the
GoDaddy zone it was copied from. The genuine before state is recoverable only
from GoDaddy's own retained copy, which still exists — delegating away does not
delete it — and which stage 1 of the wizard exports. If the two ever disagree,
GoDaddy's copy is the older witness and Cloudflare's is what the world resolves.

## Rollback

The cutover's one irreversible-looking step is the nameserver change, and it is
reversible. GoDaddy's original nameservers for this domain, captured from
Cloudflare's own record of what it replaced, were:

```
ns21.domaincontrol.com
ns22.domaincontrol.com
```

If mail breaks and the cause is not obvious within the time you are willing to
lose messages:

1. At GoDaddy — Domain → Nameservers → change to "Default" (or enter the two
   names above). GoDaddy's own zone is still there; it is not deleted by
   delegating away.
2. Wait for propagation. The delegation's TTL at the registry governs this, not
   the record TTLs inside the zone: expect it in minutes, allow up to 24 hours.
3. Mail resumes on GoDaddy's copy of the zone, which still holds the same five
   iCloud records.
4. The site goes back to being unreachable at the apex. It remains reachable at
   its `workers.dev` URL, which is the state ticket 02 shipped in, and nothing
   about it needs undoing.

Rolling back costs the site and saves the mailbox, which is the right trade in
that direction. It is also why this cutover was sequenced early — one page is a
cheap thing to take offline again.
