/**
 * The Studio's registered particulars, as they stand on the register.
 *
 * Four places say some of this — the legal page in full, the About page's card,
 * the footer and the menu — and a change of registered address has to reach all
 * of them at once. They are facts about the company rather than copy, so they are
 * stated here once and quoted from there.
 */
export const COMPANY = {
  name: '10BIT LABS LTD',
  registration: 'Registered in England and Wales',
  number: '17378712',
  address: '13 Dunmow Close, Loughton, IG10',
  email: 'hello@10bitlabs.co.uk'
} as const;

/** The address as a `mailto:`, so no caller has to remember the scheme. */
export const MAILTO = `mailto:${COMPANY.email}`;
