import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverAlt: z.string().optional(),
    source: z
      .object({
        platform: z.literal('dev.to'),
        id: z.number(),
        url: z.string().url(),
        hash: z.string(),
        synced_at: z.coerce.date(),
        translated_by: z.string(),
      })
      .optional(),
    canonical_url: z.string().url().optional(),
    manual_override: z.boolean().default(false),
  }),
});

export const collections = { posts };
