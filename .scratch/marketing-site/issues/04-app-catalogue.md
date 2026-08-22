# 04 — App catalogue

**What to build:** A visitor can reach a page listing the Apps the Studio is building, see what each one is and which platforms it targets, and tell at a glance that none of them has launched yet — without ever being offered a link that goes nowhere.

Introduces the App content model. Each entry carries a name, a slug, badge initials, a short description, a platform label, a status of either live or in-development, an optional external link, an optional long-form body, and an optional privacy policy body. The last three are unused by this ticket and exist for the next one.

Rendering rules this ticket establishes:

- An in-development App renders as an **unlinked** card with an "In development" tag. The source design has no such state; it is added here, and it is the whole reason this ticket exists as its own slice.
- A live App with a link renders as a linked card.
- Platform is shown on the card, so a visitor knows whether it is relevant to their device before clicking.

Three seed entries, all in-development, all placeholder copy pending real details. Mark them clearly as placeholders in the content files:

| Name | Initials | Platform (provisional) | Description |
| --- | --- | --- | --- |
| Plan The Day | PTD | iOS & Web | Wedding and event planning, from first idea to the day itself. |
| Sıra | SR | iOS | Score tallying for Okey and Gonga, without the paper and pen. |
| Fiilo | FI | iOS | Turkish vocabulary and verb conjugation, practised in short sessions. |

The platform labels are the most likely thing in this ticket to be wrong; they are the owner's to confirm.

`Sıra` is marked as Turkish wherever it appears, so assistive technology pronounces it with Turkish rules rather than English ones. Its dotless ı must render from the site's own font rather than a fallback face — this ticket is what proves the font subset chosen in the walking skeleton actually covers the Studio's own product names.

Adding a fourth App later must be a matter of writing one content file, with no layout changes.

**Blocked by:** 02 — Walking skeleton: the hero, live on the internet.

**Status:** ready-for-agent

- [ ] The apps index route responds and lists all three entries
- [ ] Each card shows name, description, platform and badge initials
- [ ] In-development entries render unlinked and carry a visible "In development" tag
- [ ] A live entry with a link renders as a linked card
- [ ] The Turkish app name is marked with the correct language and renders its dotless character from the self-hosted font, not a fallback
- [ ] The page still makes zero third-party network requests
- [ ] Placeholder copy and provisional platform labels are flagged as such in the content files
- [ ] Adding a new App requires only a new content file
