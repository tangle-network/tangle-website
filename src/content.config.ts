import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    date: z.string(),
    updated: z.string().optional(),
    author: z.string(),
    tags: z.array(z.string()),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    draft: z.boolean().optional().default(false),
    // `network` marks a post about the Tangle Network protocol, a separate project from the agent infrastructure.
    // Such a post carries a banner and noindex, leaves /blog, the sitemap and the series rails, and is listed on /blog/network/.
    section: z.literal('network').optional(),
  }),
});

export const collections = { blog };
