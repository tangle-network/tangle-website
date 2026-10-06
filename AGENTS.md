# Repository Agent Notes

## Delivery

Choose checks for the changed page or behavior; instruction-only changes need diff and link checks.
Reuse valid results and finish authorized delivery once the relevant checks pass.
Honor explicit CI waivers while preserving hooks and enforced protections.
Track unrelated failures separately from the product change.
Verify the requested served page before claiming it is live.
Styling changes run `pnpm check:drift`; when counts fall, commit, then lower `drift-baseline.json` with `pnpm exec tangle-drift check --surface website --repo-dir . --baseline drift-baseline.json --update-baseline`.

## Tangle Blog Skills

Before auditing, rewriting, or creating blog posts in `src/content/blog`, load the relevant repo-local skill:

- Existing post audit or rewrite: `.codex/skills/tangle-blog-editor/SKILL.md`
- New agent-intent/SEO/AEO post: `.codex/skills/tangle-agent-intent-series/SKILL.md`
- Pre-publish proof check: `.codex/skills/tangle-blog-proof/SKILL.md`

The proof skill includes an executable checker:

```bash
node .codex/skills/tangle-blog-proof/scripts/check-post.mjs src/content/blog/<slug>.mdx
```

Substantive blog changes should also run:

```bash
pnpm build
```
