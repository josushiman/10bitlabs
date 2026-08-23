import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
  The App content model. One markdown file per App, and the filename is the slug:
  adding an App is writing `src/content/apps/<slug>.md` and nothing else.

  `url` and the markdown body are unused by the catalogue and exist for the routes
  that come next — the body becomes the App's detail page, and its absence is what
  stops an empty page ever being published.

  An App needs two long-form bodies and a markdown file has one, so the privacy
  policy is a sibling file: `<slug>.privacy.md` beside `<slug>.md`. Writing that
  file is the whole of what publishes an App's privacy route, and deleting it is
  the whole of what withdraws it.
*/
const apps = defineCollection({
  // The sibling privacy files are their own collection; they are not Apps.
  loader: glob({ pattern: ['**/*.md', '!**/*.privacy.md'], base: './src/content/apps' }),
  schema: z.object({
    name: z.string(),
    /** Two or three characters for the badge tile. */
    initials: z.string(),
    description: z.string(),
    /** Free text, because store wording changes more often than a schema should. */
    platform: z.string(),
    status: z.enum(['live', 'in-development']),
    /** Store listing or the App's own site. Only a `live` App links out. */
    url: z.url().optional(),
    /*
      BCP 47 tag, set only when the name is not English — it is what makes a
      screen reader pronounce "Sıra" with Turkish rules rather than English ones.
    */
    lang: z.string().optional(),
    /*
      Catalogue position, lowest first. Optional so that adding an App stays a
      matter of writing one file: leave it out and the App lands at the end,
      ordered by name against anything else without a position.
    */
    order: z.number().optional()
  })
});

/*
  The long-form privacy policy for one App — the page an app store listing links
  to. Keyed by the App's slug, because `generateId` drops the `.privacy` from the
  filename: an entry here and the App it belongs to share an id.
*/
const appPrivacy = defineCollection({
  loader: glob({
    pattern: '**/*.privacy.md',
    base: './src/content/apps',
    generateId: ({ entry }) => entry.replace(/\.privacy\.md$/, '')
  }),
  schema: z.object({
    /*
      When the policy last changed, shown on the page — a policy a visitor cannot
      date is worth less than one they can. Optional, and deliberately so: a
      required field here would mean writing the body was not sufficient to
      publish the route, which is the one promise these routes are built on.
    */
    updated: z.coerce.date().optional()
  })
});

export const collections = { apps, appPrivacy };
