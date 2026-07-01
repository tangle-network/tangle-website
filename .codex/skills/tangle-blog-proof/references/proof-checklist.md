# Tangle Blog Proof Checklist

## Blocking Gates

- Valid frontmatter for `src/content.config.ts`.
- Primary query is visible in title, summary, first 150 words, headings, or FAQ.
- Answer capsule appears in the first 150 words for SEO/AEO posts.
- At least one exact install, curl, CLI, API, manifest, config, or code block for agent-intent/operator posts.
- At least two internal Tangle links for new posts.
- At least three primary external links when referencing standards or competitors.
- `## FAQ` section uses `###` question headings so `src/pages/blog/[...slug].astro` can extract FAQ JSON-LD.
- Direct CTA exists.
- Referenced images exist.
- No obvious AI-cadence banned phrases.
- Blog and research pages do not show vanity inventory counts such as "80 posts published".
- Blog index gives reader paths through series, topics, dates, or arguments.

## Judgment Gates

- Opening starts from a concrete reader problem.
- Tangle's mechanism is specific and appears before the halfway point.
- Limitations are explicit.
- Competitor comparisons are fair and current.
- The ending gives a decision, not a summary.
- Research pages include only work with a claim, model, method, trace/evidence path, or falsifiable argument.
- Blog posts are allowed to be essays, launch notes, field reports, comparisons, or implementation notes; they should not all be forced into one technical deep-dive template.

## Common Fixes

- Add a one-paragraph answer capsule after frontmatter.
- Convert vague claims into proof blocks.
- Add a comparison table for "vs" or "alternative" posts.
- Move Tangle-specific proof above generic background.
- Add FAQ questions that match search intent.
- Replace "What This Gets You" with a concrete CTA.
- Replace raw archive totals with series cards, topic filters, or a date-sorted archive.
- Replace markdown-only stretches with a diagram, table, screenshot, trace, terminal output, or designed cover.
