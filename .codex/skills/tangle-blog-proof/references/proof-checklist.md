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

## Judgment Gates

- Opening starts from a concrete reader problem.
- Tangle's mechanism is specific and appears before the halfway point.
- Limitations are explicit.
- Competitor comparisons are fair and current.
- The ending gives a decision, not a summary.

## Common Fixes

- Add a one-paragraph answer capsule after frontmatter.
- Convert vague claims into proof blocks.
- Add a comparison table for "vs" or "alternative" posts.
- Move Tangle-specific proof above generic background.
- Add FAQ questions that match search intent.
- Replace "What This Gets You" with a concrete CTA.
