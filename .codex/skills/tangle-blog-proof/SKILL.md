---
name: tangle-blog-proof
description: "Validate Tangle blog MDX before publishing. Use to check frontmatter, FAQ extraction, answer capsule, internal/external links, proof commands, CTAs, image references, AEO/SEO gates, and repeated AI-writing patterns."
---

# Tangle Blog Proof

Use this skill before claiming a Tangle blog post is publication-ready, or when auditing an existing post for SEO/AEO quality.

The goal is to fail noisy. A post that lacks proof, FAQ, links, CTA, or query fit should be marked incomplete rather than polished around the gap.

## Required References

Read `references/proof-checklist.md` before evaluating.

When checking an edited/new post, run:

```bash
node .codex/skills/tangle-blog-proof/scripts/check-post.mjs src/content/blog/<slug>.mdx
```

When checking the full blog surface, run:

```bash
pnpm check:blog
```

Then run the repo's normal validation when the change is substantive:

```bash
pnpm build
```

## Manual Review

The script catches structure, not judgment. Also check:

- The primary query is obvious from title, summary, intro, headings, and FAQ.
- The opening has a concrete reader problem, not a generic explainer setup.
- Technical claims have proof or source links.
- Tangle's distinction appears before the halfway point.
- Competitor comparisons are fair and based on current primary sources.
- The CTA is specific enough for a builder or agent to act on.
- The post does not end with a summary that merely restates the thesis.
- Blog and research pages do not market raw post counts or other inventory totals.
- Blog index navigation works by series, topic, date, or argument.
- Long posts are not only markdown scaffolding; they carry at least one artifact such as a cover, diagram, table, screenshot, trace, code block, or terminal proof.

## Output

Report:

1. `PASS` or `NEEDS WORK`.
2. Blocking issues first.
3. Suggested fixes keyed to headings or line numbers.
4. Whether `pnpm build` passed.
