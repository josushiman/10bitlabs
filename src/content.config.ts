import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
  The App content model. One markdown file per App, and the filename is the slug:
  adding an App is writing `src/content/apps/<slug>.md` and nothing else.

  `url` and the markdown body are unused by the catalogue and exist for the routes
  that come next — the body becomes the App's detail page, and its absence is what
  stops an empty page ever being published.

  An App can have several long-form bodies and a markdown file has one, so its
  privacy policy, terms of service and support guide are sibling files beside
  `<slug>.md`. Writing one of those files is the whole of what publishes its
  route, and deleting it is the whole of what withdraws it.
*/
const apps = defineCollection({
  // The sibling legal files are their own collections; they are not Apps.
  loader: glob({
    pattern: ['**/*.md', '!**/*.privacy.md', '!**/*.terms.md', '!**/*.support.md'],
    base: './src/content/apps'
  }),
  schema: ({ image }) => z.object({
    name: z.string(),
    /** A sourced image or a named HTML icon, shown in place of initials. */
    icon: z.union([image(), z.literal('sira')]).optional(),
    /** Two or three characters for the badge tile when no icon is available. */
    initials: z.string(),
    description: z.string(),
    /** Free text, because store wording changes more often than a schema should. */
    platform: z.string(),
    status: z.enum(['live', 'app-submission', 'in-development']),
    features: z
      .object({
        intro: z.string(),
        items: z
          .array(
            z.object({
              title: z.string(),
              label: z.string(),
              description: z.string()
            })
          )
          .min(3)
          .max(6)
      })
      .optional(),
    purchase: z
      .object({
        intro: z.string(),
        freeLabel: z.string(),
        freeValue: z.string(),
        freeDescription: z.string(),
        paidLabel: z.string(),
        paidValue: z.string(),
        paidDescription: z.string(),
        note: z.string(),
        restore: z.string()
      })
      .optional(),
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

/*
  The terms of service for one App. It follows the privacy policy's publication
  rule exactly: a non-empty `<slug>.terms.md` creates `/apps/<slug>/terms/`, and
  an App without that file has no empty legal page for a visitor to find.
*/
const appTerms = defineCollection({
  loader: glob({
    pattern: '**/*.terms.md',
    base: './src/content/apps',
    generateId: ({ entry }) => entry.replace(/\.terms\.md$/, '')
  }),
  schema: z.object({ updated: z.coerce.date().optional() })
});

/* A written support guide publishes one App's stable public support route. */
const appSupport = defineCollection({
  loader: glob({
    pattern: '**/*.support.md',
    base: './src/content/apps',
    generateId: ({ entry }) => entry.replace(/\.support\.md$/, '')
  }),
  schema: z.object({
    email: z.email(),
    responseTime: z.string(),
    summary: z.string()
  })
});

export const collections = { apps, appPrivacy, appTerms, appSupport };
