---
name: tangle-blog-proof
description: "Validate Tangle blog MDX before publishing. Use to check frontmatter, answer quality, internal/external links, proof, decisions, image references, AEO/SEO gates, and repeated AI-writing patterns."
---

# Tangle Blog Proof

Use this skill before claiming a Tangle blog post is publication-ready, or when auditing an existing post for SEO/AEO quality.

The goal is to fail noisy. A post that lacks proof, useful links, a practical decision, or query fit should be marked incomplete rather than polished around the gap.

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

The script catches structure, not judgment. Score judgment with the [judge rubric](https://github.com/tangle-network/gtm/blob/master/research/technical-blogs/rubric.json) and its blind protocol; report the per-dimension scores.

A post from the factory [technical-post graph](https://github.com/tangle-network/factory/blob/main/graphs/technical-post.graph.yaml) merges only on its gate's ship decision (voice, blind ranking, no blocking fact-check finding, the reader exam), and a rewrite must also beat the live post's text in a blind head-to-head.
After the deploy, open the served URL at 1440 and 390 px wide: it answers 200 with the new title, has no horizontal overflow, no figure wider than the page and no broken image; until then the post is not live.

## Output

Report:

1. `PASS` or `NEEDS WORK`.
2. Blocking issues first.
3. Suggested fixes keyed to headings or line numbers.
4. Whether `pnpm build` passed.
