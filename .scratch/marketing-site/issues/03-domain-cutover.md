# 03 — Domain cutover: the site serves on its own domain

**What to build:** The company's domain serves the site at its apex, `www` redirects there, and the owner's existing mailbox keeps receiving and sending mail throughout.

Deliberately sequenced early. The instinct is to protect the domain until the site is finished, but that is backwards: if the cutover disturbs mail, it should be discovered while the site is a single page and rolling the nameservers back costs nothing — not on the day everything else is ready. The public downside is thin, because the domain currently serves nothing at all, so one honest page is an improvement.

The zone must sit on the hosting provider's nameservers for a custom domain binding; there is no shortcut that leaves DNS where it is. Registration stays with the current registrar and only nameservers move.

The mailbox is an iCloud+ custom domain mailbox. That is **five** DNS records, not one: two mail exchanger records, a sender policy record, two signing records, and a provider verification record. All five must exist on the new nameservers **before** the switch, not after.

Required order, and the order is the ticket:

1. Export the complete current record set from the registrar.
2. Create the zone at the hosting provider and recreate every existing record, mail included.
3. Only then change nameservers at the registrar.
4. Verify mail in both directions before calling the cutover done.

**The provider's own email routing feature must not be enabled at any point.** It installs its own mail exchanger records and would take delivery away from iCloud. An earlier draft of this plan recommended it, on the mistaken assumption that no mailbox existed. That recommendation is withdrawn and recorded here so it is not reintroduced.

The nameserver change at the registrar and any mail re-verification are the owner's to perform. Produce a wizard; do not attempt them.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** ready-for-agent

- [ ] The complete pre-existing record set is exported and stored before anything changes
- [ ] All five mail records exist at the new provider before nameservers are switched
- [ ] The apex domain serves the site
- [ ] `www` returns a permanent redirect to the apex
- [ ] The apex is the canonical hostname; preview hostnames still serve `noindex`
- [ ] A test message sent to the mailbox arrives after cutover
- [ ] A test message sent from the mailbox is delivered and passes sender authentication after cutover
- [ ] The provider's email routing feature is confirmed disabled
- [ ] A wizard exists covering the registrar and re-verification steps
- [ ] A rollback note records how to revert nameservers if mail breaks
