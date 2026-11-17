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
    // Hero art under the title, drawn by @tangle-network/charts renderHero from the post's own numbers; it checks the fields.
    hero: z.object({ motif: z.enum(['floor', 'lanes', 'sandbox', 'trace']), alt: z.string() }).passthrough().optional(),
  }),
});

export const collections = { blog };
