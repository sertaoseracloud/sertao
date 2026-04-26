/**
 * Node.js-compatible re-export of the Zod schema from content.config.ts.
 * Used by scripts/__tests__/pr-builder.test.ts to validate PRBuilder frontmatter
 * output without importing astro:content (an Astro virtual module unavailable in Node.js).
 *
 * This file MUST be kept in sync with src/content.config.ts schema definition.
 * If you update the Zod schema in content.config.ts, update this file too.
 */
import { z } from 'astro/zod';

const postsSchema = z
  .object({
    title: z.string().max(80),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverImageUrl: z.string().url().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (data.coverImageUrl && !data.coverAlt) {
      ctx.addIssue({
        code: 'custom',
        message: 'coverAlt é obrigatório quando coverImageUrl está presente.',
        path: ['coverAlt'],
      });
    }
  });

export const collections = {
  posts: {
    schema: postsSchema,
  },
};
